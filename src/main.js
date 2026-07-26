const API_KEY = import.meta.env.VITE_NASA_API_KEY;
const app = document.querySelector("#app");

const SEARCH_ENGINES = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  yahoo: "https://search.yahoo.com/search?p="
};

app.innerHTML = `
  <div id="bg"></div>
  <div id="overlay"></div>

  <main class="center-stage">
    <h1 class="title" id="apod-title"></h1>

    <form id="search-form" class="search-bar">
      <select id="engine-select">
        <option value="google">Google</option>
        <option value="duckduckgo">DuckDuckGo</option>
        <option value="yahoo">Yahoo</option>
      </select>
      <input type="text" id="search-input" placeholder="Search the web" autocomplete="off" />
      <button type="submit">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </form>
  </main>

  <div class="date-corner">
    <input type="date" id="datepicker" />
  </div>
`;

const bg = document.querySelector("#bg");
const titleEl = document.querySelector("#apod-title");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const engineSelect = document.querySelector("#engine-select");
const datePicker = document.querySelector("#datepicker");

const APOD_START_DATE = "1995-06-16";
const todayStr = new Date().toISOString().split("T")[0];
datePicker.min = APOD_START_DATE;
datePicker.max = todayStr;
datePicker.value = todayStr;

const BASE_URL = "https://api.nasa.gov/planetary/apod";

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

fetchAPOD();

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  const engine = engineSelect.value;
  const url = SEARCH_ENGINES[engine] + encodeURIComponent(query);
  window.open(url, "_blank");
});

datePicker.addEventListener("change", () => {
  fetchAPOD(datePicker.value);
});