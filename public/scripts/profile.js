document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});

async function loadProfile() {
    try {
        const response = await fetch('/api/profile');

        if (response.status === 401) {
            window.location.href = '../index.html';
            return;
        }

        const data = await response.json();
        const user = data.user;
        const orders = data.orders;

        // 1. PREENCHER DADOS DO HEADER
        document.getElementById('user-name').innerText = user.name || 'Usuário';
        document.getElementById('user-email').innerText = user.email || '';
        document.getElementById('order-count').innerText = orders.length;

        // Se for Admin ou Pro, adiciona badge ao lado do nome
        if (user.role === 'admin') document.getElementById('user-name').innerHTML += ' <span style="font-size:0.5em; background: red; padding:3px 8px; border-radius:10px;">ADMIN</span>';
        if (user.role === 'professional') document.getElementById('user-name').innerHTML += ' <span style="font-size:0.5em; background: purple; padding:3px 8px; border-radius:10px;">PRO</span>';

        if (user.created_at) {
            const memberDate = new Date(user.created_at).getFullYear();
            document.getElementById('member-since').innerText = memberDate;
        }

        // --- 2. ADAPTAR A TABELA (ADMIN/PRO VÊ COLUNA CLIENTE) ---
        const tableHeadRow = document.querySelector('#history-table thead tr');
        const isAdminOrPro = (user.role === 'admin' || user.role === 'professional');

        // Se for admin/pro, INJETA a coluna "Cliente" no cabeçalho
        if (isAdminOrPro) {
            tableHeadRow.innerHTML = `
                <th>ID</th>
                <th style="color: #E44F25;">CLIENTE</th> <th>Serviço</th>
                <th>Detalhes</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Status</th>
            `;
        }

        // --- 3. PREENCHER LINHAS ---
        const tbody = document.querySelector('#history-table tbody');
        const noOrdersDiv = document.getElementById('no-orders');
        const historyTable = document.getElementById('history-table');

        if (orders.length === 0) {
            historyTable.style.display = 'none';
            noOrdersDiv.style.display = 'block';

            // Mensagem diferente para admin/pro sem serviço
            if(isAdminOrPro) noOrdersDiv.innerHTML = "Nenhum pedido encontrado no sistema para sua visualização.";
        } else {
            historyTable.style.display = 'table';
            noOrdersDiv.style.display = 'none';

            tbody.innerHTML = ''; // Limpa antes de preencher

            orders.forEach(order => {
                const tr = document.createElement('tr');

                const date = new Date(order.date).toLocaleDateString('pt-BR');
                const priceValue = order.price ? parseFloat(order.price) : 0;
                const price = priceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const rankFrom = formatRank(order.rank);
                const rankTo = formatRank(order.desired_rank);

                let details = `${rankFrom} ➔ ${rankTo}`;
                if (order.service === 'md5' || order.service === 'coach') details = rankFrom;

                // Define o nome do cliente (se veio do banco ou usa o nome do pedido guest)
                let clientDisplay = '';
                if (isAdminOrPro) {
                    // Se tem client_name (veio do JOIN), usa ele. Se não, usa o nome do form (Guest)
                    const cName = order.client_name || order.name || 'Desconhecido';
                    clientDisplay = `<td style="font-weight:bold; color:#ddd;">${cName}</td>`;
                }
                const boosterName = order.professional_name ? order.professional_name : '<span style="color:#888; font-style:italic;">Aguardando...</span>';

                tr.innerHTML = `
                    <td>#${order.id}</td>
                    ${clientDisplay} <td class="service-name">${(order.service || '').toUpperCase()}</td>
                    <td>${details}</td>

                    <td>${boosterName}</td>

                    <td>${date}</td>
                    <td class="price-col">${price}</td>
                    <td>${getStatusBadge(order.status)}</td>
                `;                tbody.appendChild(tr);
            });
        }

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }
}

function formatRank(rank) {
    if (!rank) return '-';
    return rank.charAt(0).toUpperCase() + rank.slice(1);
}

function getStatusBadge(status) {
    let statusClass = 'badge-pending';
    let label = status || 'Pendente';
    if (label === 'Concluído') statusClass = 'badge-success';
    if (label === 'Cancelado') statusClass = 'badge-danger';
    if (label === 'Em Andamento') statusClass = 'badge-info';
    return `<span class="${statusClass}">${label}</span>`;
}
