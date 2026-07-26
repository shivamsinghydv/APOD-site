const API_KEY = import.meta.env.VITE_NASA_API_KEY;
const app = document.querySelector("#app");

const SEARCH_ENGINES = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q="
};

const SELECTED_DATE_KEY = "apod-selected-date";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BASE_URL = "https://api.nasa.gov/planetary/apod";

app.innerHTML = `
  <div id="bg"></div>
  <div id="overlay"></div>

  <main class="center-stage">
    <h1 class="title" id="apod-title"></h1>
    <form id="search-form" class="search-bar">
      <select id="engine-select">
        <option value="google">Google</option>
        <option value="duckduckgo">DuckDuckGo</option>
      </select>
      <input type="text" id="search-input" placeholder="Search the web" autocomplete="off" />
      <button type="submit">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </form>
    <div class="shortcuts" id="shortcuts"></div>
  </main>

  <div class="date-corner">
    <input type="date" id="datepicker" />
  </div>
`;

function getSavedDate() {
  const raw = localStorage.getItem(SELECTED_DATE_KEY);
  if (!raw) return null;

  try {
    const { date, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(SELECTED_DATE_KEY);
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

function saveSelectedDate(date) {
  localStorage.setItem(
    SELECTED_DATE_KEY,
    JSON.stringify({ date, expiresAt: Date.now() + ONE_DAY_MS })
  );
}

const bg = document.querySelector("#bg");
const titleEl = document.querySelector("#apod-title");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const engineSelect = document.querySelector("#engine-select");
const datePicker = document.querySelector("#datepicker");
const savedDate = getSavedDate();

const APOD_START_DATE = "1995-06-16";
const todayStr = new Date().toISOString().split("T")[0];
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split("T")[0];
datePicker.min = APOD_START_DATE;
datePicker.max = todayStr;
datePicker.value = savedDate || yesterdayStr;

async function fetchAPOD(selectedDate = "") {
  titleEl.textContent = "Loading...";
  document.body.classList.add("bg-loading");

  const dateParam = selectedDate ? `&date=${selectedDate}` : "";
  const url = `${BASE_URL}?api_key=${API_KEY}&thumbs=true${dateParam}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || `Request failed with status ${response.status}`);
    }

    renderAPOD(data);
  } catch (error) {
    titleEl.textContent = "Couldn't load image";
    document.body.classList.remove("bg-loading");
  }
}

function renderAPOD(data) {
  const imageUrl =
    data.media_type === "image"
      ? data.url
      : data.thumbnail_url || "";

  titleEl.textContent = data.title;

  if (!imageUrl) {
    bg.style.backgroundImage = "none";
    document.body.classList.remove("bg-loading");
    return;
  }

  const preload = new Image();
  preload.onload = () => {
    bg.style.backgroundImage = `url(${imageUrl})`;
    document.body.classList.remove("bg-loading");
  };
  preload.onerror = () => {
    document.body.classList.remove("bg-loading");
  };
  preload.src = imageUrl;
}

fetchAPOD(savedDate || yesterdayStr);

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  const engine = engineSelect.value;
  const url = SEARCH_ENGINES[engine] + encodeURIComponent(query);
  window.open(url, "_blank");
});

datePicker.addEventListener("change", () => {
  saveSelectedDate(datePicker.value);
  fetchAPOD(datePicker.value);
});

const shortcutsEl = document.querySelector("#shortcuts");
const DEFAULT_SHORTCUTS = [
  { name: "Gmail", url: "https://mail.google.com" },
  { name: "YouTube", url: "https://youtube.com" },
  { name: "GitHub", url: "https://github.com" },
  { name: "Twitter", url: "https://x.com" }
];

function loadShortcuts() {
  const saved = localStorage.getItem("apod-shortcuts");
  return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
}

function saveShortcuts(shortcuts) {
  localStorage.setItem("apod-shortcuts", JSON.stringify(shortcuts));
}

function faviconFor(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  } catch {
    return "";
  }
}

function renderShortcuts() {
  const shortcuts = loadShortcuts();

  shortcutsEl.innerHTML = shortcuts
    .map(
      (s, i) => `
      <div class="shortcut" data-index="${i}">
        <a href="${s.url}" target="_blank" rel="noopener">
          <div class="shortcut-icon">
            <img src="${faviconFor(s.url)}" alt="" />
          </div>
          <span>${s.name}</span>
        </a>
        <button class="remove-shortcut" data-index="${i}" title="Remove">x</button>
      </div>
      `
    )
    .join("");

  shortcutsEl.innerHTML += `
    <div class="shortcut add-shortcut" id="add-shortcut">
      <div class="shortcut-icon">+</div>
      <span>Add</span>
    </div>
  `;

  document.querySelectorAll(".remove-shortcut").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const shortcuts = loadShortcuts();
      shortcuts.splice(Number(btn.dataset.index), 1);
      saveShortcuts(shortcuts);
      renderShortcuts();
    });
  });

  document.querySelector("#add-shortcut").addEventListener("click", () => {
    const name = prompt("Shortcut name:");
    if (!name) return;
    let url = prompt("URL:");
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    const shortcuts = loadShortcuts();
    shortcuts.push({ name, url });
    saveShortcuts(shortcuts);
    renderShortcuts();
  });
}

renderShortcuts();