document.addEventListener('DOMContentLoaded', () => {
    updateMD5Price();

    const eloSelect = document.getElementById('lastElo');
    if (eloSelect) {
        eloSelect.addEventListener('change', updateMD5Price);
    }
});

const md5Prices = {
    unranked: 40,
    prata: 50,
    ouro: 60,
    platina: 80,
    esmeralda: 120,
    diamante: 180,
    mestre: 300
};

function updateMD5Price() {
    const eloSelect = document.getElementById('lastElo');
    const priceDisplay = document.getElementById('price-display');
    const hiddenPriceInput = document.getElementById('hiddenPrice'); // Input oculto
    const showElo = document.getElementById('show-elo');

    if (!eloSelect || !priceDisplay) return;

    const selectedValue = eloSelect.value;
    const selectedText = eloSelect.options[eloSelect.selectedIndex].text;

    // Atualiza visualmente
    showElo.innerText = selectedText.split('/')[0];

    const price = md5Prices[selectedValue] || 0;

    // Formata string para exibição (R$ 40,00)
    const formattedPrice = price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    // 1. Atualiza o texto na tela
    priceDisplay.innerText = formattedPrice;

    // 2. Atualiza o input oculto para o backend receber o valor correto
    // O server.js tem um tratador que remove 'R$', então podemos enviar formatado
    if (hiddenPriceInput) {
        hiddenPriceInput.value = formattedPrice;
    }
}
