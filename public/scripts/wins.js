document.addEventListener('DOMContentLoaded', () => {
    updateWinsPrice();
});

// PREÇO POR VITÓRIA (Configure aqui)
const pricePerWin = {
    ferro: 8,
    bronze: 10,
    prata: 15,
    ouro: 20,
    platina: 30,
    esmeralda: 45,
    diamante: 70,
    mestre: 120
};

function updateWinsPrice() {
    const rankSelect = document.getElementById('currentRank');
    const quantityInput = document.getElementById('winQuantity');

    // Elementos de exibição
    const priceDisplay = document.getElementById('price-display');
    const showElo = document.getElementById('show-elo');
    const showQtd = document.getElementById('show-qtd');

    // Inputs Ocultos para o Backend
    const hiddenPrice = document.getElementById('hiddenPrice');
    const finalComments = document.getElementById('finalComments');
    const userObs = document.getElementById('userComments').value;

    if (!rankSelect || !quantityInput) return;

    // 1. Captura valores
    const rank = rankSelect.value;
    let quantity = parseInt(quantityInput.value);

    // Validação simples (mínimo 1 vitória)
    if (quantity < 1 || isNaN(quantity)) {
        quantity = 1;
        // Não forçamos o input visualmente para não travar a digitação,
        // mas o calculo usa 1 no mínimo.
    }

    // 2. Calcula Preço
    const unitPrice = pricePerWin[rank] || 0;
    const total = unitPrice * quantity;

    // 3. Atualiza Interface (Resumo)
    showElo.innerText = rank.charAt(0).toUpperCase() + rank.slice(1);
    showQtd.innerText = `${quantity} Vitória${quantity > 1 ? 's' : ''}`;

    const formattedPrice = total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    priceDisplay.innerText = formattedPrice;

    // 4. Atualiza Inputs Ocultos (Para o Banco de Dados)
    if (hiddenPrice) hiddenPrice.value = formattedPrice;

    // Concatena a quantidade dentro das observações para o Admin/Booster ver
    if (finalComments) {
        finalComments.value = `[PACOTE: ${quantity} VITÓRIAS] - ${userObs}`;
    }
}
