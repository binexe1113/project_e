const express = require('express')
const mysql = require('mysql2')
const path = require('path')
const app = express()
const PORT = 3000

//SETUP MYSQL CONNECTION
const pool = mysql.createPool({
  host: "localhost",
  user: "elo_admin",
  password: "elo123",
  database: "elofacil",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 1000

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
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service VARCHAR(50),
          rank VARCHAR(50),
          price FLOAT UNSIGNED,
          name VARCHAR(100),
          email VARCHAR(100),
          phone VARCHAR(20),
          comments TEXT,
          date DATETIME
      )
  `;

  pool.query(createTableQuery, (err) => {
      if (err) console.error("Error creating table:", err);
  });

  //Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));


//Routes

app.post('/submit-order', (req, res) => {
    const { service, rank, price, name, email, phone, comments } = req.body;
    const date = new Date();

    const sql = `INSERT INTO orders (service, rank, price, name, email, phone, comments, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [service, rank, price, name, email, phone, comments, date];

    pool.query(sql, params, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send("Erro ao salvar pedido. Tente novamente.");
        }

        console.log(`New order ID: ${results.insertId} - Client: ${name}`);
        res.redirect('/index.html');
    });
});

//Rota API para pegar todas os pedidos
app.get('/api/orders', (req, res) => {
    const sql = "SELECT * FROM orders ORDER BY date DESC";

    pool.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching orders:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
