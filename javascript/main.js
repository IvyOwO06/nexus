let allItems = [];
let favourites = JSON.parse(localStorage.getItem("favourites")) || [];

$(document).ready(function () {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
});

// Cache duration: 24 hours in milliseconds
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Check if cached data exists
function loadCachedData() {
    const cachedData = localStorage.getItem("cardCache");
    const cacheTime = localStorage.getItem("cardCacheTime");

    if (!cachedData || !cacheTime) {
        return false;
    }

    // Check if the cache is still valid
    const currentTime = Date.now();
    const cacheAge = currentTime - Number(cacheTime);

    if (cacheAge >= CACHE_DURATION) {
        return false;
    }

    try {
        allItems = JSON.parse(cachedData);

        console.log("Loaded cards from cache!");

        $("#status").remove();
        updateResults();

        return true;
    } catch (error) {
        console.log("Invalid cache:", error);
        return false;
    }
}

// Fetch fresh data from n8n
function fetchCardData() {
    console.log("Fetching fresh card data from n8n...");

    $.when(
        $.ajax({
            url: "http://localhost:5678/webhook/reality-fracture",
            method: "GET",
        }),
        $.ajax({
            url: "http://localhost:5678/webhook/hobbit",
            method: "GET",
        }),
    )
        .done(function (realityData, hobbitData) {
            $("#status").remove();

            allItems = [
                ...realityData[0].map((item) => ({
                    ...item,
                    set: "fra",
                })),
                ...hobbitData[0].map((item) => ({
                    ...item,
                    set: "hob",
                })),
            ];

            // Save the new data in localStorage
            try {
                localStorage.setItem("cardCache", JSON.stringify(allItems));
                localStorage.setItem("cardCacheTime", Date.now().toString());

                console.log("Card cache updated!");
            } catch (error) {
                console.log("Could not save cache:", error);
            }

            updateResults();
        })
        .fail(function (xhr, status, error) {
            console.log("xhr:", xhr);
            console.log("status:", status);
            console.log("error:", error);

            $("#status").text("Something went wrong: " + JSON.stringify(xhr));
        });
}

// Load cached data or fetch fresh data
if (!loadCachedData()) {
    fetchCardData();
}

function updateResults() {
    let items = [...allItems];

    const query = $("#search").val().toLowerCase();

    items = items.filter(function (item) {
        return item.name.toLowerCase().includes(query);
    });

    const selectedSet = $("#sort-set").val();

    if (selectedSet !== "all") {
        items = items.filter(function (item) {
            return item.set === selectedSet;
        });
    }

    const selectedCreature = $("#sort-creature").val();

    if (selectedCreature === "creature") {
        items = items.filter(function (item) {
            return item.type.toLowerCase().includes("creature");
        });
    }

    const favouriteFilter = $("#favourite-filter").val();

    if (favouriteFilter === "favourites") {
        items = items.filter(function (item) {
            return favourites.includes(item.id);
        });
    }

    const sortRarity = $("#sort-rarity").val();

    const rarityOrder = {
        mythic: 4,
        rare: 3,
        uncommon: 2,
        common: 1,
    };

    items.sort((a, b) => {
        if (sortRarity === "mythic") {
            return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        } else {
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
    });

    displayResults(items);
}

function displayResults(items) {
    $("#magic-cards").empty();

    $.each(items, function (index, item) {
        const isFavorite = favourites.includes(item.id);

        $("#magic-cards").append(`
        <div class="magic-card">
            <h2>${item.name}</h2>

            <button
                class="favourite-button"
                data-id="${item.id}"
                aria-label="${isFavorite ? "Remove from favorites" : "Add to favorites"}"
            >
                ${isFavorite ? "★" : "☆"}
            </button>

            <p>Rarity: ${item.rarity}</p>

            <img src="${item.image}" alt="${item.name}">

            <p>Price: ${item.price_eur} euro</p>
        </div>
    `);
    });
}

function darkMode() {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
    } else {
        document.body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
    }
}

$("#search").on("input", updateResults);

$("#sort-set").on("change", updateResults);

$("#sort-rarity").on("change", updateResults);

$("#sort-creature").on("change", updateResults);

$("#favourite-filter").on("change", updateResults);

$("#darkmode").on("click", darkMode);

$("#resetFilter").on("click", function () {
    $("#sort-set").val("all");
    $("#sort-rarity").val("mythic");
    $("#sort-creature").val("all");
    $("#favourite-filter").val("all");

    $("#search").val("");

    updateResults();
});

$("#magic-cards").on("click", ".favourite-button", function () {
    console.log("Favourite button clicked!");

    const cardId = String($(this).attr("data-id"));

    console.log("Card ID:", cardId);
    console.log("Current favourites:", favourites);

    if (favourites.includes(cardId)) {
        favourites = favourites.filter(function (id) {
            return id !== cardId;
        });
    } else {
        favourites.push(cardId);
    }

    localStorage.setItem("favourites", JSON.stringify(favourites));

    console.log("Updated favourites:", favourites);

    updateResults();
});

$("#magic-cards").on("click", ".magic-card", function (event) {
    // Don't open the card page when clicking the favourite button
    if ($(event.target).closest(".favourite-button").length > 0) {
        return;
    }

    const cardId = $(this).find(".favourite-button").attr("data-id");

    window.location.href = `card.html?cardId=${cardId}`;
});
