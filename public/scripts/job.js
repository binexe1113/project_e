document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o preço ao carregar a página
    updatePrice();

    // Adiciona os eventos para recalcular
    const inputs = ['service', 'current_rank', 'desired_rank'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', (e) => {
                // CORREÇÃO: Validamos os ranks sempre, não importa qual select mudou.
                // Isso impede que o usuário selecione um destino menor que a origem.
                validateRanks();
                updatePrice();
            });
        }
    });
});

// Array ordenado para sabermos qual elo é maior que o outro
const rankOrder = ['ferro', 'bronze', 'prata', 'ouro', 'platina', 'esmeralda', 'diamante', 'mestre'];

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

// Função que impede o Elo Desejado de ser menor que o Atual
function validateRanks() {
    const currentEl = document.getElementById('current_rank');
    const desiredEl = document.getElementById('desired_rank');
    const service = document.getElementById('service').value;

    // Essa validação só faz sentido para Elo Job e Duo Job
    if (service !== 'elojob' && service !== 'duojob') return;

    const currentIdx = rankOrder.indexOf(currentEl.value);
    const desiredIdx = rankOrder.indexOf(desiredEl.value);

    // Se o Elo Desejado for menor ou igual ao Atual
    if (desiredIdx <= currentIdx) {
        // Pega o próximo elo da lista (ex: Se tá Prata, joga para Ouro)
        const nextRankIdx = currentIdx + 1;

        // Verifica se existe um próximo elo (se não for o último da lista)
        if (nextRankIdx < rankOrder.length) {
            desiredEl.value = rankOrder[nextRankIdx];
        } else {
            // Se o usuário selecionou o último elo (Mestre) como ATUAL,
            // tecnicamente ele não pode contratar EloJob.
            // Mantemos o desired igual ao current, e o updatePrice vai dar erro ou zerar.
            desiredEl.value = currentEl.value;
        }
    }
}

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

    let serviceLabel = service.toUpperCase();
    if (service === 'elojob') serviceLabel = 'Elo Job';
    if (service === 'duojob') serviceLabel = 'Duo Job';
    document.getElementById('show-service').innerText = serviceLabel;

    let price = 0;

    if (service === 'elojob' || service === 'duojob') {

        // Verifica se é o último elo possível (Mestre)
        if (current === 'mestre') {
             // Caso especial: não dá pra subir mais
             price = 0;
             // Opcional: Mostrar aviso na tela
        } else {
            let valCurrent = rankValues[current] || 0;
            let valDesired = rankValues[desired] || 0;

            // Cálculo simples: Destino - Origem
            if (valDesired > valCurrent) {
                price = valDesired - valCurrent;
            } else {
                price = 0;
            }
        }

        // Se for Duo Job, aumenta 40%
        if (service === 'duojob') price *= 1.4;

    } else if (service === 'coach') {
        price = 50;
    }

    // Formatação
    const formattedPrice = price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    if (priceDisplay) priceDisplay.innerText = formattedPrice;
    if (hiddenPriceInput) hiddenPriceInput.value = formattedPrice;
}

// Função auxiliar para deixar a primeira letra maiúscula (ex: ferro -> Ferro)
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
