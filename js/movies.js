/* =========================================================
   FrameVix — movies.js
   Everything related to DATA lives here:
     - fetching movies.json (with an inline fallback so the
       site still works if it's opened straight from disk,
       where fetch() gets blocked by the browser's CORS rule
       for local files)
     - small query helpers (by category, by id, search)
     - reusable DOM builders: card, row, grid
     - a tiny localStorage-backed watchlist
   app.js imports this module and decides what to render
   on each page.
   ========================================================= */

/* Inline fallback — used only if data/movies.json can't be
   fetched (e.g. double-clicking index.html instead of using
   a local server). Keep this in sync with data/movies.json. */
const FALLBACK_MOVIES = [
  { id: "the-storyverse", title: "The Storyverse", youtubeId: "roVkpNvxXxo", genre: "Cinematic", category: "Trailers", year: 2024, duration: "0:26", description: "A 26-second cinematic trailer that sets the tone for everything FrameVix stands for.", trending: true, original: true, latest: true },
  { id: "parallel", title: "Parallel", youtubeId: "zTqvN5zM4oA", genre: "Drama", category: "Short Films", year: 2024, duration: "6:40", description: "Two sides of an engineering student's life, told in parallel.", trending: true, original: true, latest: false },
  { id: "the-notebook-endgame", title: "The Notebook — Endgame", youtubeId: "MRMh3NCNig8", genre: "Drama", category: "Short Films", year: 2024, duration: "5:12", description: "A story that closes the loop it opened.", trending: false, original: true, latest: true },
  { id: "the-call", title: "The Call", youtubeId: "Hs_ItslyXq0", genre: "Horror", category: "Short Films", year: 2024, duration: "8:03", description: "A slow-burn descent into horror and the psychology of fear.", trending: true, original: true, latest: false },
  { id: "unfold", title: "Unfold", youtubeId: "RbjmBPf1j5w", genre: "Psychological", category: "Short Films", year: 2024, duration: "7:21", description: "A mind-bending psychological short film.", trending: false, original: true, latest: true },
  { id: "college-escape", title: "We Escaped College for a Day", youtubeId: "kjLg6p9rqAQ", genre: "Documentary", category: "Documentaries", year: 2024, duration: "12:47", description: "A cinematic trek documentary following one day of escape.", trending: false, original: false, latest: true },
];

const MovieStore = (() => {
  let cache = null;

  async function load() {
    if (cache) return cache;
    try {
      const res = await fetch("data/movies.json");
      if (!res.ok) throw new Error("bad response");
      cache = await res.json();
    } catch (err) {
      // fetch() fails on file:// pages — fall back to inline data
      // so the site keeps working without a local server.
      console.warn("[FrameVix] Couldn't fetch data/movies.json, using fallback data.", err.message);
      cache = FALLBACK_MOVIES;
    }
    return cache;
  }

  return {
    load,
    all: () => cache || [],
    byId: (id) => (cache || []).find((m) => m.id === id),
    byCategory: (cat) => (cache || []).filter((m) => m.category === cat),
    trending: () => (cache || []).filter((m) => m.trending),
    originals: () => (cache || []).filter((m) => m.original),
    latest: () => (cache || []).filter((m) => m.latest),
    search: (q) => {
      const query = q.trim().toLowerCase();
      if (!query) return [];
      return (cache || []).filter((m) =>
        [m.title, m.genre, m.category].join(" ").toLowerCase().includes(query)
      );
    },
    related: (movie, limit = 6) =>
      (cache || [])
        .filter((m) => m.id !== movie.id && (m.category === movie.category || m.genre === movie.genre))
        .slice(0, limit),
  };
})();

/* ---------- thumbnails straight from YouTube's CDN ---------- */
const thumb = (youtubeId) => `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
const thumbHi = (youtubeId) => `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

/* =========================================================
   Watchlist — persisted in localStorage
   ========================================================= */
const Watchlist = {
  KEY: "framevix_watchlist",
  get() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || [];
    } catch {
      return [];
    }
  },
  has(id) {
    return this.get().includes(id);
  },
  toggle(id) {
    const list = this.get();
    const idx = list.indexOf(id);
    if (idx > -1) list.splice(idx, 1);
    else list.push(id);
    localStorage.setItem(this.KEY, JSON.stringify(list));
    return list.includes(id);
  },
};

/* =========================================================
   DOM builders
   ========================================================= */
function buildCard(movie, { large = false, index = 0 } = {}) {
  const card = document.createElement("article");
  card.className = `card${large ? " card-lg" : ""} card-pop`;
  card.style.animationDelay = `${index * 45}ms`;
  card.dataset.id = movie.id;
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `Open ${movie.title}`);

  const saved = Watchlist.has(movie.id);
  const bookmarkIcon = (filled) => filled
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

  card.innerHTML = `
    <div class="card-thumb">
      <img src="${thumb(movie.youtubeId)}" alt="${movie.title}" loading="lazy">
      <div class="card-shade"></div>
      <button class="card-save-btn${saved ? " saved" : ""}" type="button" aria-label="${saved ? "Remove from My List" : "Add to My List"}">
        ${bookmarkIcon(saved)}
      </button>
      <span class="card-duration">${movie.duration}</span>
      <div class="card-play">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M6 4l14 8-14 8V4z"/></svg>
      </div>
    </div>
    <div class="card-body">
      <h3>${movie.title}</h3>
      <div class="card-tags">
        <span class="genre-dot">●</span>
        <span>${movie.genre}</span>
        <span>·</span>
        <span>${movie.year}</span>
      </div>
    </div>
  `;

  // clicking a card takes you to its dedicated detail page,
  // exactly like a real streaming platform.
  const goToMovie = () => (window.location.href = `movie.html?id=${movie.id}`);
  card.addEventListener("click", goToMovie);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToMovie();
    }
  });

  // the save button lives inside the card but must NOT trigger navigation
  const saveBtn = card.querySelector(".card-save-btn");
  saveBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const nowSaved = Watchlist.toggle(movie.id);
    saveBtn.classList.toggle("saved", nowSaved);
    saveBtn.innerHTML = bookmarkIcon(nowSaved);
    saveBtn.setAttribute("aria-label", nowSaved ? "Remove from My List" : "Add to My List");
    document.dispatchEvent(new CustomEvent("watchlist-change"));
  });

  return card;
}

function buildRow(title, movies, { large = false, viewAllHref = null } = {}) {
  const section = document.createElement("section");
  section.className = "section reveal";

  section.innerHTML = `
    <div class="section-head">
      <h2 class="section-title">${title}</h2>
      ${viewAllHref ? `<a class="view-all" href="${viewAllHref}">View all
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>` : ""}
    </div>
    <div class="row-track-wrap">
      <button class="row-arrow left" aria-label="Scroll left">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="row-track"></div>
      <button class="row-arrow right" aria-label="Scroll right">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  `;

  const track = section.querySelector(".row-track");
  movies.forEach((m, i) => track.appendChild(buildCard(m, { large, index: i })));

  section.querySelector(".row-arrow.left").addEventListener("click", () => track.scrollBy({ left: -520, behavior: "smooth" }));
  section.querySelector(".row-arrow.right").addEventListener("click", () => track.scrollBy({ left: 520, behavior: "smooth" }));

  return section;
}

function buildGrid(movies, container) {
  container.innerHTML = "";
  if (!movies.length) {
    container.innerHTML = `<div class="empty-state"><span>🎬</span>No titles found. Try another search or filter.</div>`;
    return;
  }
  movies.forEach((m, i) => container.appendChild(buildCard(m, { index: i })));
}

/* =========================================================
   Quick-play modal (used on index.html hero "Watch Now")
   ========================================================= */
function openQuickModal(movie) {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.querySelector("#modalIframe").src = `https://www.youtube.com/embed/${movie.youtubeId}?autoplay=1&rel=0&color=white`;
  overlay.querySelector("#modalTitleText").textContent = movie.title;
  overlay.querySelector("#modalDescText").textContent = movie.description;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeQuickModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  overlay.querySelector("#modalIframe").src = "";
  document.body.style.overflow = "";
}
