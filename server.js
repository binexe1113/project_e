require('dotenv').config();

const express = require('express')
const mysql = require('mysql2')
const path = require('path')
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express()
const PORT = 3000

//CONFIGURACAO GOOGLE oauth20
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

//SETUP MYSQL CONNECTION
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 1000

});

// 1. Configurar Sessão (Obrigatório para Login)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// 2. Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// 3. Configurar a Estratégia do Google
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // Essa função roda quando o Google devolve o usuário
    const googleId = profile.id;
    const name = profile.displayName;
    const email = profile.emails[0].value;

    // Verificar se usuário já existe no banco
    pool.query('SELECT * FROM users WHERE google_id = ?', [googleId], (err, results) => {
        if (err) return done(err);

        if (results.length > 0) {
            // Usuário já existe, loga ele
            return done(null, results[0]);
        } else {
            // Usuário novo, cria no banco
            pool.query('INSERT INTO users (google_id, name, email) VALUES (?, ?, ?)',
            [googleId, name, email], (err, resInsert) => {
                if (err) return done(err);

                const newUser = { id: resInsert.insertId, google_id: googleId, name: name, email: email, role: 'client' };
                return done(null, newUser);
            });
        }
    });
  }
));

// Serialização (Como o passport guarda o user na sessão)
passport.serializeUser((user, done) => {
    done(null, user.id); // Guarda só o ID na sessão para ficar leve
});

passport.deserializeUser((id, done) => {
    pool.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        done(err, results[0]); // Recupera o user completo pelo ID
    });
});

//Check connection error
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to MySQL", err.code);//help debug
    console.error("Make sure Maria is running and creds are right ")//help debug
  }
  else {
    console.log("Connect to MariaDB suscefully");
    connection.release();
  }

});

//Create TABLE
// --- VERIFICAÇÃO DE TABELAS (Certifique-se que este bloco existe) ---
const initDb = () => {
    // 1. Cria USUÁRIOS primeiro (pois Orders depende dela)
    const tableUsers = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            google_id VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(100),
            email VARCHAR(100),
            role VARCHAR(20) DEFAULT 'client', -- 'client', 'admin' ou 'booster'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // 2. Cria ORDERS com as referências (Foreign Keys)
    const tableOrders = `
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,          -- ID do Cliente (Link com users)
            professional_id INT,  -- ID do Booster (Link com users)
            service VARCHAR(50),
            rank VARCHAR(50),
            desired_rank VARCHAR(50),
            name VARCHAR(100),
            email VARCHAR(100),
            phone VARCHAR(20),
            comments TEXT,
            price DECIMAL(10,2),
            status VARCHAR(20) DEFAULT 'Pendente', -- Novo campo útil
            date DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (professional_id) REFERENCES users(id)
        )
    `;

    pool.query(tableUsers, (err) => {
        if (err) console.error("Erro ao criar tabela users:", err);
        else console.log("Tabela 'users' verificada/criada.");
    });

    pool.query(tableOrders, (err) => {
        if (err) console.error("Erro ao criar tabela orders:", err);
        else console.log("Tabela 'orders' verificada/criada.");
    });

};

// Chama a função ao iniciar
initDb();


  //Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.status(403).send("Acesso Negado. Apenas admins.");
}


//Routes
// // Rota que inicia o login
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Rota de retorno do Google
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Sucesso! Redireciona para onde você quiser.
    // Se for admin, manda pro painel, se não, manda pra home
        res.redirect('/index.html');

    }
);

// Rota de Logout
app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// Rota para o Front-end saber quem está logado (opcional, para mostrar o nome no header)
app.get('/api/user_data', (req, res) => {
    if (req.isAuthenticated() && req.user) {
        res.json({
            is_logged_in: true,
            name: req.user.name,
            role: req.user.role // <--- Isso é obrigatório para o script funcionar
        });
    } else {
        res.json({ is_logged_in: false });
    }
});
// Rota para pegar dados do perfil e histórico
// Rota Inteligente de Perfil (Client vs Admin vs Professional)
app.get('/api/profile', (req, res) => {
    // 1. Segurança: Verifica se está logado
    if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Usuário não logado" });
    }

    const role = req.user.role; // 'client', 'admin' ou 'professional'
    const userId = req.user.id;
    const userEmail = req.user.email;

    let sql = "";
    let params = [];

    // --- LÓGICA DE DECISÃO ---

    if (role === 'admin') {
        // ADMIN: Vê TUDO.
        // Fazemos JOIN com users para pegar o nome do cliente original (client_name)
        sql = `
            SELECT orders.*, users.name as client_name
            FROM orders
            LEFT JOIN users ON orders.user_id = users.id
            ORDER BY date DESC
        `;
        params = [];

    } else if (role === 'professional') {
        // PROFESSIONAL: Vê apenas pedidos atribuídos a ele (professional_id)
        sql = `
            SELECT orders.*, users.name as client_name
            FROM orders
            LEFT JOIN users ON orders.user_id = users.id
            WHERE professional_id = ?
            ORDER BY date DESC
        `;
        params = [userId];

    } else {
        // CLIENT (Padrão): Vê apenas os seus pedidos (por ID ou Email)
        // CLIENT (Padrão):
        // Agora fazemos JOIN com a tabela users (apelidada de 'pro') para pegar o nome do booster
        sql = `
          SELECT orders.*, pro.name AS professional_name
          FROM orders
          LEFT JOIN users AS pro ON orders.professional_id = pro.id
          WHERE orders.user_id = ? OR orders.email = ?
          ORDER BY orders.date DESC
          `;
        params = [userId, userEmail];    }

    // Executa a query decidida acima
    pool.query(sql, params, (err, results) => {
        if (err) {
            console.error("Erro ao buscar pedidos:", err);
            return res.status(500).json({ error: "Erro no banco de dados" });
        }

        res.json({
            user: req.user,
            orders: results
        });
    });
});
app.post('/submit-order', (req, res) => {
    const { service, rank, desired_rank, name, email, phone, comments, price } = req.body;
    const date = new Date();

    // Tratamento do preço
    let finalPrice = 0;
    if (price) finalPrice = parseFloat(price.replace('R$', '').replace('.', '').replace(',', '.').trim());

    // --- LÓGICA DO USER ID ---
    // Se o usuário estiver logado (req.user existe), pegamos o ID dele.
    // Se não estiver logado (Guest), salvamos NULL.
    const userId = (req.isAuthenticated() && req.user) ? req.user.id : null;

    const sql = `
        INSERT INTO orders
        (user_id, service, rank, desired_rank, name, email, phone, comments, price, status, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        userId,       // <--- Novo campo
        service,
        rank,
        desired_rank,
        name,
        email,
        phone,
        comments,
        finalPrice,
        'Pendente',   // <--- Status inicial padrão
        date
    ];

    pool.query(sql, params, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send("Erro ao salvar pedido.");
        }
        res.redirect('/index.html');
    });
});

//Rota API para pegar todas os pedidos
app.get('/api/orders', isAdmin, (req, res) => {
    const sql = "SELECT * FROM orders ORDER BY date DESC";

    pool.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching orders:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// 1. Rota para buscar apenas os usuários que são 'professional'
app.get('/api/professionals', isAdmin, (req, res) => {
    const sql = "SELECT id, name FROM users WHERE role = 'professional'";

    pool.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar profissionais:", err);
            return res.status(500).json({ error: "Erro no banco de dados" });
        }
        res.json(results);
    });
});

// 2. Rota para atribuir (ou trocar) o profissional de um pedido
app.post('/api/assign-order', isAdmin, (req, res) => {
    const { orderId, professionalId } = req.body;

    // Se professionalId for vazio (ex: selecionou "Nenhum"), salva NULL no banco
    const proId = professionalId ? professionalId : null;

    const sql = "UPDATE orders SET professional_id = ? WHERE id = ?";

    pool.query(sql, [proId, orderId], (err, result) => {
        if (err) {
            console.error("Erro ao atribuir pedido:", err);
            return res.status(500).json({ error: "Erro ao atualizar pedido" });
        }
        res.json({ success: true });
    });
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Proteja o arquivo HTML do admin (Truque: interceptar a rota estática)
app.get('/admin.html', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
