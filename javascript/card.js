const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get("cardId");

// Check saved theme
$(document).ready(function () {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
});

// Dark mode
function darkMode() {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
    } else {
        document.body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
    }
}

// Back button
$("#back-button").on("click", function () {
    window.location.href = "index.html";
});

// Dark mode button
$("#darkmode").on("click", darkMode);

// Retrieve individual card
if (cardId) {
    $.ajax({
        url: "http://localhost:5678/webhook/individual-card",
        method: "GET",
        data: {
            cardId: cardId,
        },
    })
        .done(function (cardData) {
            console.log("Received data:", cardData);

            const card = Array.isArray(cardData) ? cardData[0] : cardData;

            if (!card) {
                $("#card-details").text("Card not found.");
                return;
            }

            console.log("Card data:", card);

            $("#card-name").text(card.name);

            $("#card-details").html(`
                <img src="${card.image}" alt="${card.name}">

                <p>Rarity: ${card.rarity}</p>
                <p>Set: ${card.set}</p>
                <p>Price: ${card.euro_price} euro</p>
                <p>Type: ${card.type}</p>
                <p>${card.oracle_text}</p>
            `);
        })
        .fail(function (xhr, status, error) {
            console.log("Request failed:", error);
            $("#card-details").text("Could not retrieve the card.");
        });
} else {
    window.location.href = "index.html";
}
