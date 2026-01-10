// public/scripts/admin.js

document.addEventListener('DOMContentLoaded', () => {
    init();
});

let professionalsList = [];

// Função principal que inicia tudo
async function init() {
    await loadProfessionals(); // 1. Carrega a lista de boosters
    loadOrders();             // 2. Carrega os pedidos

    // Atualiza a tabela a cada 30 segundos automaticamente
    setInterval(loadOrders, 30000);
}

// Busca a lista de usuários com role='professional'
async function loadProfessionals() {
    try {
        const response = await fetch('/api/professionals');
        professionalsList = await response.json();
    } catch (error) {
        console.error("Erro ao carregar lista de profissionais:", error);
    }
}

// Busca todos os pedidos e monta a tabela
async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();

        const tbody = document.querySelector('#ordersTable tbody');
        const loading = document.getElementById('loading');

        // Limpa a tabela antes de recriar
        tbody.innerHTML = '';
        loading.style.display = 'none';

        if (orders.length === 0) {
            loading.textContent = "Nenhum pedido encontrado.";
            loading.style.display = 'block';
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            const date = new Date(order.date).toLocaleString('pt-BR');

            // --- CRIA O SELECT DE PROFISSIONAIS ---
            let options = `<option value="">-- Aguardando Booster --</option>`;

            professionalsList.forEach(pro => {
                // Se o ID do pro for igual ao salvo no pedido, marca como selected
                const isSelected = (order.professional_id === pro.id) ? 'selected' : '';
                options += `<option value="${pro.id}" ${isSelected}>${pro.name}</option>`;
            });

            const selectHtml = `
                <select onchange="assignProfessional(${order.id}, this.value)"
                        style="padding: 5px; border-radius: 5px; background: #121216; color: white; border: 1px solid #555;">
                    ${options}
                </select>
            `;

            // Monta a linha da tabela
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${selectHtml}</td>
                <td>${order.service.toUpperCase()}</td>
                <td>${order.rank} ➔ ${order.desired_rank}</td>
                <td>${order.name}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${date}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
        if(document.getElementById('loading')) {
            document.getElementById('loading').textContent = "Erro ao carregar pedidos.";
        }
    }
}

// Função que envia a alteração de profissional para o servidor
async function assignProfessional(orderId, professionalId) {
    try {
        const response = await fetch('/api/assign-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, professionalId })
        });

        if (response.ok) {
            console.log(`Pedido #${orderId} atualizado com sucesso!`);
            // Feedback visual opcional: Piscar a borda ou mostrar um toast
        } else {
            alert("Erro ao atribuir profissional.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

// Gera as badges coloridas de status
function getStatusBadge(status) {
    let color = '#856404'; // Amarelo (Pendente)
    let label = status || 'Pendente';

    if(label === 'Concluído') color = 'green';
    if(label === 'Em Andamento') color = '#007bff'; // Azul
    if(label === 'Cancelado') color = 'red';

    return `<span style="background-color:${color}; color:white; padding:3px 8px; border-radius:10px; font-size:0.8em;">${label}</span>`;
}

// Importante: Tornar a função acessível globalmente porque o HTML usa onchange="assignProfessional(...)"
window.assignProfessional = assignProfessional;
