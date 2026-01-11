document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o preço ao carregar a página
    updatePrice();

    // Adiciona os eventos para recalcular sempre que algo mudar
    const inputs = ['service', 'current_rank', 'desired_rank'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updatePrice);
        }
    });
});

// Tabela base de preços (valor acumulado)
const rankValues = {
    'ferro': 0,
    'bronze': 40,
    'prata': 80,
    'ouro': 140,
    'platina': 220,
    'esmeralda': 350,
    'diamante': 550,
    'mestre': 900
};

function updatePrice() {
    const serviceEl = document.getElementById('service');
    const currentEl = document.getElementById('current_rank');
    const desiredEl = document.getElementById('desired_rank');
    const hiddenPriceInput = document.getElementById('hiddenPrice');
    const priceDisplay = document.getElementById('price-display');

    // Segurança caso algum elemento não exista
    if (!serviceEl || !currentEl || !desiredEl) return;

    const service = serviceEl.value;
    const current = currentEl.value;
    const desired = desiredEl.value;

    // Atualiza textos do resumo visual
    document.getElementById('show-current').innerText = capitalize(current);
    document.getElementById('show-desired').innerText = capitalize(desired);

    // Formata o nome do serviço para exibição
    let serviceLabel = service.toUpperCase();
    if (service === 'elojob') serviceLabel = 'Elo Job';
    if (service === 'duojob') serviceLabel = 'Duo Job';
    document.getElementById('show-service').innerText = serviceLabel;

    let price = 0;

    if (service === 'elojob' || service === 'duojob') {
        let valCurrent = rankValues[current] || 0;
        let valDesired = rankValues[desired] || 0;

        if (valDesired > valCurrent) {
            price = valDesired - valCurrent;
        } else {
            price = 0;
        }

        // Se for Duo Job, aumenta 40%
        if (service === 'duojob') price *= 1.4;

    } else if (service === 'coach') {
        price = 50; // Preço fixo por hora/sessão
    }

    // Formatação para Moeda Brasileira
    const formattedPrice = price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    // 1. Mostra na tela
    if (priceDisplay) {
        priceDisplay.innerText = formattedPrice;
    }

    // 2. Salva no input oculto para enviar ao servidor
    if (hiddenPriceInput) {
        hiddenPriceInput.value = formattedPrice;
    }
}

// Função auxiliar para deixar a primeira letra maiúscula (ex: ferro -> Ferro)
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
