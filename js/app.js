/* =========================================================
   FrameVix — app.js
   UI behavior shared by every page (navbar, loader, search,
   back-to-top, scroll reveal) plus one init function per
   page, picked via document.body.dataset.page.
   Relies on helpers defined in movies.js, so movies.js must
   be loaded first — see the <script> order in each HTML file.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initNavbar();
  initMobileMenu();
  initSearchOverlay();
  initBackToTop();
  initRevealObserver();
  initModal();

  const page = document.body.dataset.page;
  MovieStore.load().then(() => {
    if (page === "home") initHomePage();
    if (page === "browse") initBrowsePage();
    if (page === "movie") initMoviePage();
    if (page === "about") initAboutPage();
    if (page === "mylist") initMyListPage();
    // reveal is applied after content exists, run again post-render
    initRevealObserver();
  });
  if (page === "contact") initContactPage();
});

/* =========================================================
   Loading screen
   ========================================================= */
function initLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.classList.add("hidden");
      document.body.classList.add("page-ready");
    }, 500);
  });
  // safety net in case 'load' already fired
  setTimeout(() => {
    loader.classList.add("hidden");
    document.body.classList.add("page-ready");
  }, 2200);
}

/* =========================================================
   Navbar blur-on-scroll + active link
   ========================================================= */
function initNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  const onScroll = () => navbar.classList.toggle("blurred", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const current = document.body.dataset.page;
  document.querySelectorAll(".nav-links a, .mobile-panel a").forEach((a) => {
    if (a.dataset.page === current) a.classList.add("active");
  });
}

/* =========================================================
   Mobile hamburger menu
   ========================================================= */
function initMobileMenu() {
  const toggle = document.getElementById("navToggle");
  const panel = document.getElementById("mobilePanel");
  if (!toggle || !panel) return;
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("open");
    panel.classList.toggle("open");
  });
  panel.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      toggle.classList.remove("open");
      panel.classList.remove("open");
    })
  );
}

/* =========================================================
   Search overlay (global quick search -> browse.html)
   ========================================================= */
function initSearchOverlay() {
  const openBtn = document.getElementById("searchOpen");
  const overlay = document.getElementById("searchOverlay");
  const closeBtn = document.getElementById("searchCloseBtn");
  const input = document.getElementById("globalSearchInput");
  if (!openBtn || !overlay) return;

  const open = () => {
    overlay.classList.add("open");
    setTimeout(() => input.focus(), 150);
  };
  const close = () => overlay.classList.remove("open");

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && !overlay.classList.contains("open")) {
      e.preventDefault();
      open();
    }
  });
  document.addEventListener("click", (e) => {
  const clickedInsideOverlay = overlay.contains(e.target);
  const clickedSearchButton = openBtn.contains(e.target);
  if (overlay.classList.contains("open") && !clickedInsideOverlay && !clickedSearchButton) {
    close();
  }
});
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      window.location.href = `browse.html?q=${encodeURIComponent(input.value.trim())}`;
    }
  });
}

/* =========================================================
   Back to top button
   ========================================================= */
function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("show", window.scrollY > 500), { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* =========================================================
   Scroll reveal (IntersectionObserver)
   ========================================================= */
function initRevealObserver() {
  const targets = document.querySelectorAll(".reveal:not(.visible), .reveal-scale:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible)");
  if (!targets.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((t) => io.observe(t));
}

/* =========================================================
   Quick-play modal wiring (index/browse "Watch Now")
   ========================================================= */
function initModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.querySelector("#modalCloseBtn").addEventListener("click", closeQuickModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeQuickModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeQuickModal(); });
}

/* =========================================================
   HOME PAGE
   ========================================================= */
function initHomePage() {
  const featured = MovieStore.trending()[0] || MovieStore.all()[0];
  if (featured) renderHero(featured);

  const rows = document.getElementById("rows");
  rows.appendChild(buildRow("FrameVix Originals", MovieStore.originals(), { large: true, viewAllHref: "browse.html" }));
  rows.appendChild(buildRow("Trending Now", MovieStore.trending(), { viewAllHref: "browse.html" }));
  rows.appendChild(buildRow("Latest Uploads", MovieStore.latest(), { viewAllHref: "browse.html" }));
}

function renderHero(movie) {
  document.getElementById("heroGenre").textContent = movie.genre;
  document.getElementById("heroYear").textContent = movie.year;
  document.getElementById("heroDuration").textContent = movie.duration;
  document.getElementById("heroTitle").textContent = movie.title;
  document.getElementById("heroDesc").textContent = movie.description;
  document.getElementById("heroWatchBtn").addEventListener("click", () => openQuickModal(movie));
  document.getElementById("heroInfoBtn").addEventListener("click", () => (window.location.href = `movie.html?id=${movie.id}`));
}

/* =========================================================
   BROWSE PAGE
   ========================================================= */
function initBrowsePage() {
  const grid = document.getElementById("browseGrid");
  const chips = document.querySelectorAll(".filter-chip");
  const searchInput = document.getElementById("browseSearchInput");
  const resultsCount = document.getElementById("resultsCount");
  let activeCategory = "All";

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    let list = activeCategory === "All" ? MovieStore.all() : MovieStore.byCategory(activeCategory);
    if (q) list = list.filter((m) => [m.title, m.genre, m.category].join(" ").toLowerCase().includes(q));
    resultsCount.textContent = `${list.length} title${list.length !== 1 ? "s" : ""}`;
    buildGrid(list, grid);
    initRevealObserver();
  }

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeCategory = chip.dataset.category;
      render();
    })
  );

  searchInput.addEventListener("input", render);

  // support ?q= coming from the navbar quick search, and
  // ?category= coming from the footer's category links
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q");
  const initialCategory = params.get("category");
  if (initialQuery) searchInput.value = initialQuery;
  if (initialCategory) {
    chips.forEach((c) => c.classList.toggle("active", c.dataset.category === initialCategory));
    activeCategory = initialCategory;
  }

  render();
}

/* =========================================================
   MOVIE DETAIL PAGE
   ========================================================= */
function initMoviePage() {
  const params = new URLSearchParams(window.location.search);
  const movie = MovieStore.byId(params.get("id")) || MovieStore.all()[0];
  if (!movie) return;

  document.title = `${movie.title} · FrameVix`;
  document.getElementById("bannerImg").src = thumbHi(movie.youtubeId);
  document.getElementById("bannerImg").onerror = function () { this.src = thumb(movie.youtubeId); };
  document.getElementById("posterImg").src = thumb(movie.youtubeId);
  document.getElementById("movieGenre").textContent = movie.genre;
  document.getElementById("movieYear").textContent = movie.year;
  document.getElementById("movieDuration").textContent = movie.duration;
  document.getElementById("movieCategory").textContent = movie.category;
  document.getElementById("movieTitle").textContent = movie.title;
  document.getElementById("movieDesc").textContent = movie.description;
  document.getElementById("playerFrame").src = `https://www.youtube.com/embed/${movie.youtubeId}?rel=0&color=white`;

  const wlBtn = document.getElementById("watchlistBtn");
  const syncWl = () => {
    const active = Watchlist.has(movie.id);
    wlBtn.classList.toggle("active", active);
    wlBtn.querySelector("span").textContent = active ? "Added to My List" : "Watch Later";
  };
  syncWl();
  wlBtn.addEventListener("click", () => {
    Watchlist.toggle(movie.id);
    syncWl();
    document.dispatchEvent(new CustomEvent("watchlist-change"));
  });

  const related = MovieStore.related(movie);
  const relatedWrap = document.getElementById("relatedRow");
  if (related.length) {
    relatedWrap.appendChild(buildRow("More Like This", related));
  } else {
    relatedWrap.remove();
  }
}

/* =========================================================
   MY LIST PAGE — everything the user has saved
   ========================================================= */
function initMyListPage() {
  const grid = document.getElementById("myListGrid");
  const countEl = document.getElementById("myListCount");
  const emptyState = document.getElementById("myListEmpty");

  function render() {
    const ids = Watchlist.get();
    const movies = ids.map((id) => MovieStore.byId(id)).filter(Boolean);
    countEl.textContent = `${movies.length} title${movies.length !== 1 ? "s" : ""} saved`;
    grid.innerHTML = "";
    emptyState.hidden = movies.length > 0;
    if (movies.length) movies.forEach((m, i) => grid.appendChild(buildCard(m, { index: i })));
    initRevealObserver();
  }

  render();
  // stay in sync if a card's save button is toggled while this page is open
  document.addEventListener("watchlist-change", render);
}

/* =========================================================
   ABOUT PAGE — animated counters
   ========================================================= */
function initAboutPage() {
  const counters = document.querySelectorAll(".stat-num[data-target]");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((c) => io.observe(c));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || "";
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* =========================================================
   CONTACT PAGE — front-end only form
   ========================================================= */
function initContactPage() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.textContent = "There's no backend wired up yet, but your message looked great — thanks for testing the form!";
    status.classList.add("show");
    form.reset();
  });
}
