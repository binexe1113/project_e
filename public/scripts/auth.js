document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Busca dados do usuário
        const response = await fetch('/api/user_data');
        const data = await response.json();

        // 2. Seleciona elementos
        const loginBtn = document.getElementById('login-container');
        const userArea = document.getElementById('user-container');
        const userNameDisplay = document.getElementById('user-name');

        // Segurança: se não achar os elementos, para o script
        if (!loginBtn || !userArea) return;

        if (data.is_logged_in) {
            // --- LOGADO ---
            loginBtn.style.display = 'none';
            userArea.style.display = 'inline-block';

            const firstName = data.name.split(' ')[0];

            if (userNameDisplay) {
                // Limpa o texto "Olá!" que estava fixo no HTML
                userNameDisplay.innerHTML = '';

                // Cria o elemento de LINK <a>
                const link = document.createElement('a');

                // Estiliza o link para ficar bonito (sem sublinhado azul padrão)
                link.style.color = '#E44F25';
                link.style.fontWeight = 'bold';
                link.style.textDecoration = 'none';
                link.style.cursor = 'pointer';

                // --- LÓGICA DE DESTINO E EMOJIS ---
                if (data.role === 'admin') {
                    link.href = '/admin.html';
                    link.innerHTML = `Olá, ${firstName} 🛡️ ADMIN`; // Emoji de escudo
                } else if (data.role === 'professional') {
                    link.href = '/professional.html';
                    link.innerHTML = `Olá, ${firstName} ⚔️ acesse seus trabalhos aqui`; // Emoji de espadas
                } else {
                    // Cliente normal
                    link.href = '/paginas/profile.html';
                    link.innerHTML = `Olá, ${firstName} acesse seus pedidos aqui` ;
                }

                // Insere o link criado dentro do span user-name
                userNameDisplay.appendChild(link);
            }

        } else {
            // --- DESLOGADO ---
            loginBtn.style.display = 'inline-block';
            userArea.style.display = 'none';
        }

    } catch (error) {
        console.error("Erro ao carregar auth:", error);
    }
});
