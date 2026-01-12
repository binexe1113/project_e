// scripts/guard.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form'); // Seleciona o formulário da página

    if (form) {
        form.addEventListener('submit', async function(event) {
            // 1. Impede o envio imediato
            event.preventDefault();

            // 2. Muda o texto do botão para dar feedback (opcional)
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn ? btn.innerText : 'Confirmar';
            if(btn) btn.innerText = "Verificando login...";

            try {
                // 3. Pergunta ao servidor se está logado
                const response = await fetch('/api/user_data');
                const data = await response.json();

                if (data.is_logged_in) {
                    // 4. Se estiver logado, libera o envio do formulário manualmente
                    // Precisamos usar o método nativo submit() do elemento HTMLFormElement
                    // para ignorar o listener que acabamos de criar e não entrar em loop,
                    // mas como estamos num contexto async, o form.submit() direto funciona bem.
                    form.submit();
                } else {
                    // 5. Se NÃO estiver logado
                    if(btn) btn.innerText = originalText; // Restaura botão

                    // Salva onde o usuário estava para (futuramente) tentar voltar
                    sessionStorage.setItem('return_to', window.location.href);

                    alert("Você precisa fazer login para finalizar o pedido.");
                    window.location.href = '/paginas/login.html';
                }
            } catch (error) {
                console.error("Erro na verificação:", error);
                if(btn) btn.innerText = originalText;
                alert("Ocorreu um erro de conexão. Tente novamente.");
            }
        });
    }
});
