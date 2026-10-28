// ====== Login check ======
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch (error) {
    return null;
  }
}

const currentUser = getCurrentUser();
if (!currentUser) {
  window.location.href = "login.html";
}

// ====== Settings ======
const API_KEY = "ac721a50";
const BASE_URL = "https://www.omdbapi.com/";
const FAV_KEY = "favorites_" + (currentUser ? currentUser.email : "guest");

// Placeholder image for movies that have no poster
const NO_POSTER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">' +
      '<rect width="100%" height="100%" fill="#334155"/>' +
      '<text x="50%" y="50%" fill="#94a3b8" font-size="24" text-anchor="middle">No Poster</text>' +
      "</svg>"
  );

// ====== Page elements ======
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const message = document.getElementById("message");
const resultsDiv = document.getElementById("results");
const favoritesDiv = document.getElementById("favorites");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");
const userName = document.getElementById("user-name");
const logoutBtn = document.getElementById("logout-btn");

// ====== User bar ======
if (currentUser) {
  userName.textContent = `👤 Hi, ${currentUser.name}`;
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

// ====== Data ======
let lastResults = [];
let favorites = loadFavorites();

// ====== Favorites (saved in the browser, per user) ======
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}

function isFavorite(id) {
  return favorites.some((movie) => movie.imdbID === id);
}

function toggleFavorite(movie) {
  if (isFavorite(movie.imdbID)) {
    favorites = favorites.filter((m) => m.imdbID !== movie.imdbID);
  } else {
    favorites.push({
      imdbID: movie.imdbID,
      Title: movie.Title,
      Year: movie.Year,
      Poster: movie.Poster,
    });
  }
  saveFavorites();
  renderResults();
  renderFavorites();
}

// ====== Building movie cards ======
function createCard(movie) {
  const card = document.createElement("div");
  card.className = "movie-card";

  const img = document.createElement("img");
  img.src = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : NO_POSTER;
  img.alt = movie.Title;
  img.onerror = () => {
    img.src = NO_POSTER;
  };
  img.addEventListener("click", () => showDetails(movie.imdbID));

  const info = document.createElement("div");
  info.className = "movie-info";

  const title = document.createElement("h3");
  title.textContent = movie.Title;

  const year = document.createElement("p");
  year.textContent = movie.Year;

  const favBtn = document.createElement("button");
  favBtn.className = "fav-btn";
  favBtn.textContent = isFavorite(movie.imdbID)
    ? "💔 Remove Favorite"
    : "❤️ Add to Favorites";
  favBtn.addEventListener("click", () => toggleFavorite(movie));

  info.append(title, year, favBtn);
  card.append(img, info);
  return card;
}

function renderMovies(list, container, emptyText) {
  container.innerHTML = "";
  if (list.length === 0) {
    const note = document.createElement("p");
    note.className = "empty-note";
    note.textContent = emptyText;
    container.appendChild(note);
    return;
  }
  list.forEach((movie) => container.appendChild(createCard(movie)));
}

function renderResults() {
  renderMovies(lastResults, resultsDiv, "Search for a movie to see results here.");
}

function renderFavorites() {
  renderMovies(favorites, favoritesDiv, "No favorites yet. Add some movies!");
}

// ====== Searching ======
async function searchMovies(query) {
  message.textContent = "Loading...";
  resultsDiv.innerHTML = "";

  try {
    const url = `${BASE_URL}?s=${encodeURIComponent(query)}&type=movie&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === "True") {
      lastResults = data.Search;
      message.textContent = `Found ${data.totalResults} movies for "${query}" (showing the first ${data.Search.length})`;
    } else {
      lastResults = [];
      message.textContent =
        data.Error === "Movie not found!"
          ? `No movies found for "${query}". Try another name.`
          : `Error: ${data.Error}`;
    }
    renderResults();
  } catch (error) {
    lastResults = [];
    renderResults();
    message.textContent =
      "Something went wrong. Check your internet connection and try again.";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (query) searchMovies(query);
});

// ====== Movie details popup ======
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function showDetails(id) {
  modal.classList.remove("hidden");
  modalBody.innerHTML = "<p>Loading details...</p>";

  try {
    const response = await fetch(`${BASE_URL}?i=${id}&plot=full&apikey=${API_KEY}`);
    const m = await response.json();

    if (m.Response !== "True") {
      modalBody.innerHTML = `<p>Could not load details.</p>`;
      return;
    }

    const poster = m.Poster && m.Poster !== "N/A" ? m.Poster : NO_POSTER;
    const trailerUrl =
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(m.Title + " " + m.Year + " official trailer");

    modalBody.innerHTML = `
      <div class="modal-details">
        <img src="${escapeHTML(poster)}" alt="${escapeHTML(m.Title)}" />
        <div class="modal-text">
          <h2>${escapeHTML(m.Title)} (${escapeHTML(m.Year)})</h2>
          <p><strong>⭐ IMDb Rating:</strong> ${escapeHTML(m.imdbRating)}</p>
          <p><strong>Genre:</strong> ${escapeHTML(m.Genre)}</p>
          <p><strong>Runtime:</strong> ${escapeHTML(m.Runtime)}</p>
          <p><strong>Language:</strong> ${escapeHTML(m.Language)}</p>
          <p><strong>Country:</strong> ${escapeHTML(m.Country)}</p>
          <p><strong>Director:</strong> ${escapeHTML(m.Director)}</p>
          <p><strong>Actors:</strong> ${escapeHTML(m.Actors)}</p>
          <p><strong>Plot:</strong> ${escapeHTML(m.Plot)}</p>
          <p>
            <a class="trailer-link" href="${escapeHTML(trailerUrl)}" target="_blank" rel="noopener">▶ Watch Trailer on YouTube</a>
          </p>
        </div>
      </div>
    `;
  } catch (error) {
    modalBody.innerHTML = "<p>Something went wrong loading the details.</p>";
  }
}

function closeModal() {
  modal.classList.add("hidden");
}

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal(); // click outside the box
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

// ====== Start ======
renderResults();
renderFavorites();