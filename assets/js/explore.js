/* ───────────────────────────────────────────────────────────
   3D EXPLORE — interactive stage controller
   No frameworks, no API calls, no runtime AI usage.
   ─────────────────────────────────────────────────────────── */

const WORLDS = [
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    mood: "White plaster, polished concrete, and a single horizontal flame.",
    materials: [
      { name: "Polished concrete", color: "#9a9690" },
      { name: "White plaster",     color: "#efe9dc" },
      { name: "Matte black steel", color: "#171717" },
      { name: "Bone leather",      color: "#dfd6c5" },
    ],
    walkthrough: null,  // Drop a Matterport / Kuula URL here to enable iframe
  },
  {
    id: "warm-modern",
    name: "Warm Modern",
    mood: "Walnut, raw bronze, and golden-hour canyon light.",
    materials: [
      { name: "Walnut",     color: "#4a2f1c" },
      { name: "White oak",  color: "#c0a274" },
      { name: "Travertine", color: "#d8c2a0" },
      { name: "Raw bronze", color: "#7d5d20" },
    ],
    walkthrough: null,
  },
  {
    id: "miami-modern",
    name: "Miami Modern",
    mood: "Terrazzo, ocean horizons, and white linen at the water's edge.",
    materials: [
      { name: "White terrazzo", color: "#ece6da" },
      { name: "Ocean blue",     color: "#2e6a8a" },
      { name: "Soft coral",     color: "#dba896" },
      { name: "Polished brass", color: "#b08a47" },
    ],
    walkthrough: null,
  },
  {
    id: "calabasas-minimalist",
    name: "Calabasas Minimalist",
    mood: "Monastic plaster, bone boucle, and a single sculptural curve.",
    materials: [
      { name: "Bone plaster",  color: "#e3d8c5" },
      { name: "Oatmeal boucle", color: "#cab9a2" },
      { name: "Microcement",   color: "#a59c8a" },
      { name: "Hidden steel",  color: "#2a2924" },
    ],
    walkthrough: null,
  },
  {
    id: "mediterranean-estate",
    name: "Mediterranean Estate",
    mood: "Lime plaster, terracotta, and a stone fireplace carved by hand.",
    materials: [
      { name: "Lime plaster",   color: "#efe4d1" },
      { name: "Terracotta",     color: "#a8552d" },
      { name: "Cedar beam",     color: "#5a3b21" },
      { name: "Wrought iron",   color: "#1d1a14" },
    ],
    walkthrough: null,
  },
  {
    id: "tuscan-european",
    name: "Tuscan European",
    mood: "Cotto tile, cypress beams, and a fire burning in cracked stone.",
    materials: [
      { name: "Cotto tile",    color: "#b06b3d" },
      { name: "Cream plaster", color: "#e8dcc0" },
      { name: "Cypress",       color: "#4b3a23" },
      { name: "Aged stone",    color: "#998c75" },
    ],
    walkthrough: null,
  },
  {
    id: "spanish-transitional",
    name: "Spanish Transitional",
    mood: "Saltillo, dark mahogany, and palm shadows on white plaster.",
    materials: [
      { name: "Saltillo tile", color: "#8a4a2b" },
      { name: "White plaster", color: "#f0e9da" },
      { name: "Mahogany beam", color: "#3a2317" },
      { name: "Navy ceramic",  color: "#1e3a4a" },
    ],
    walkthrough: null,
  },
  {
    id: "french-european",
    name: "French European",
    mood: "Chevron parquet, dove-gray boiseries, and antique gilt.",
    materials: [
      { name: "Versailles oak", color: "#a87a45" },
      { name: "Dove gray",      color: "#bdb6a7" },
      { name: "Antique gold",   color: "#b89653" },
      { name: "Ivory silk",     color: "#ece2cf" },
    ],
    walkthrough: null,
  },
  {
    id: "coastal-contemporary",
    name: "Coastal Contemporary",
    mood: "Whitewashed oak, driftwood beams, and hazy ocean morning light.",
    materials: [
      { name: "Whitewashed oak", color: "#d4c8b3" },
      { name: "Driftwood gray",  color: "#8a847b" },
      { name: "Linen",           color: "#ece5d4" },
      { name: "Sea glass blue",  color: "#7d9aa5" },
    ],
    walkthrough: null,
  },
];

const ASSET_BASE = "assets/worlds";
const SAVE_KEY = "cuttingedge:savedDirection";

// ── Build DOM ────────────────────────────────────────────
const stageCanvas = document.getElementById("stageCanvas");
const worldList   = document.getElementById("worldList");
const worldRail   = document.querySelector(".world-rail");
const railEyebrow = document.querySelector(".world-rail-eyebrow");
const titleEl     = document.getElementById("sceneTitle");
const moodEl      = document.getElementById("sceneMood");
const materialsEl = document.getElementById("sceneMaterials");
const indexEl     = document.getElementById("directionIndex");
const totalEl     = document.getElementById("directionTotal");
const walkBtn     = document.getElementById("walkthroughBtn");
const saveBtn     = document.getElementById("saveBtn");
const lightbox    = document.getElementById("walkthroughLightbox");
const lbTitle     = document.getElementById("lightboxTitle");
const lbFrame     = document.getElementById("lightboxFrame");
const toast       = document.getElementById("toast");

totalEl.textContent = String(WORLDS.length).padStart(2, "0");

// Create one scene div per world (so we can crossfade between them)
const sceneEls = {};
WORLDS.forEach((w, i) => {
  const div = document.createElement("div");
  div.className = "stage-scene";
  div.dataset.world = w.id;
  // Lazy-load: only set background for active scene; others use data-bg
  if (i === 0) {
    div.style.backgroundImage = `url('${ASSET_BASE}/${w.id}.webp')`;
  } else {
    div.dataset.bg = `${ASSET_BASE}/${w.id}.webp`;
  }
  stageCanvas.appendChild(div);
  sceneEls[w.id] = div;
});

// Build right-rail world list
WORLDS.forEach((w, i) => {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "world-item";
  btn.dataset.world = w.id;
  btn.setAttribute("role", "option");
  btn.innerHTML = `
    <span class="world-item-mark" aria-hidden="true"></span>
    <span class="world-item-name">${w.name}</span>
    <span class="world-item-number">${String(i+1).padStart(2,"0")}</span>
  `;
  btn.addEventListener("click", () => {
    setActive(w.id, true);
    // On mobile, close the rail after selection
    if (window.matchMedia("(max-width: 820px)").matches) {
      worldRail.classList.remove("is-open");
    }
  });
  btn.addEventListener("mouseenter", () => preload(w.id));
  li.appendChild(btn);
  worldList.appendChild(li);
});

// ── Mobile rail toggle ────────────────────────────────────
// The rail eyebrow becomes a tappable handle on small screens
railEyebrow.addEventListener("click", (e) => {
  if (window.matchMedia("(max-width: 820px)").matches) {
    worldRail.classList.toggle("is-open");
  }
});

// ── Active state ─────────────────────────────────────────
let activeId = null;
let loadedScenes = new Set();

function preload(id) {
  if (loadedScenes.has(id)) return;
  const el = sceneEls[id];
  if (el && el.dataset.bg) {
    // Set background-image immediately so the browser starts fetching and paints
    // as soon as the bytes arrive. Also kick off a parallel Image() so we know
    // when it's done (for analytics / future use).
    const url = el.dataset.bg;
    el.style.backgroundImage = `url('${url}')`;
    delete el.dataset.bg;
    const img = new Image();
    img.src = url;
    img.onload = () => loadedScenes.add(id);
  } else {
    loadedScenes.add(id);
  }
}

function setActive(id, animate = false) {
  if (activeId === id) return;
  const world = WORLDS.find(w => w.id === id);
  if (!world) return;

  preload(id);

  // Swap active scene
  Object.values(sceneEls).forEach(el => el.classList.remove("is-active"));
  sceneEls[id].classList.add("is-active");

  // Animate meta out then update + in
  const metaEls = [titleEl, moodEl, materialsEl];
  if (animate) {
    metaEls.forEach(el => { el.style.transition = "opacity 0.25s ease"; el.style.opacity = "0"; });
    setTimeout(() => {
      writeMeta(world);
      metaEls.forEach(el => { el.style.opacity = "1"; });
    }, 240);
  } else {
    writeMeta(world);
  }

  // Update rail active state + index
  worldList.querySelectorAll(".world-item").forEach(b => {
    b.classList.toggle("is-active", b.dataset.world === id);
  });
  const idx = WORLDS.findIndex(w => w.id === id) + 1;
  indexEl.textContent = String(idx).padStart(2, "0");

  activeId = id;

  // Preload the next two scenes for snappy switching
  const order = WORLDS.findIndex(w => w.id === id);
  preload(WORLDS[(order + 1) % WORLDS.length].id);
  preload(WORLDS[(order + 2) % WORLDS.length].id);
}

function writeMeta(world) {
  titleEl.textContent = world.name;
  moodEl.textContent  = world.mood;
  materialsEl.innerHTML = world.materials.map(m => `
    <span class="material-chip">
      <span class="material-swatch" style="background:${m.color}"></span>
      ${m.name}
    </span>
  `).join("");
}

// ── Walkthrough lightbox ─────────────────────────────────
function openLightbox() {
  const world = WORLDS.find(w => w.id === activeId);
  if (!world) return;
  lbTitle.textContent = `${world.name} — Walkthrough`;

  // If a real walkthrough URL exists, drop it in. Otherwise show placeholder.
  if (world.walkthrough) {
    lbFrame.innerHTML = `<iframe src="${world.walkthrough}" title="${world.name} walkthrough" allow="xr-spatial-tracking; fullscreen; vr; gyroscope; accelerometer" allowfullscreen></iframe>`;
  } else {
    lbFrame.innerHTML = `
      <div class="lightbox-placeholder">
        <div class="placeholder-mark" aria-hidden="true">
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#c19a4b" stroke-width="1.4" aria-hidden="true">
            <rect x="6" y="6" width="48" height="48"/>
            <path d="M6 22h48M22 6v48"/>
            <circle cx="38" cy="38" r="6"/>
          </svg>
        </div>
        <p class="placeholder-text">
          Immersive walkthrough launching soon.<br/>
          Schedule a <a href="index.html#contact">private tour</a> to step inside this direction.
        </p>
      </div>
    `;
  }
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.hidden = true;
  lbFrame.innerHTML = "";
  document.body.style.overflow = "";
}

lightbox.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) closeLightbox();
});
walkBtn.addEventListener("click", openLightbox);

// ── Save direction ───────────────────────────────────────
saveBtn.addEventListener("click", () => {
  const world = WORLDS.find(w => w.id === activeId);
  if (!world) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      id: world.id, name: world.name, savedAt: Date.now()
    }));
    showToast(`${world.name} saved to your direction board`);
  } catch (e) {
    showToast(`${world.name} noted for your consultation`);
  }
});

function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  // Force reflow then add class
  void toast.offsetWidth;
  toast.classList.add("is-visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => { toast.hidden = true; }, 400);
  }, 2800);
}

// ── Keyboard nav ─────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (!lightbox.hidden && e.key === "Escape") { closeLightbox(); return; }
  if (e.target && /input|textarea/i.test(e.target.tagName)) return;
  const order = WORLDS.findIndex(w => w.id === activeId);
  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    e.preventDefault();
    setActive(WORLDS[(order + 1) % WORLDS.length].id, true);
  } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    e.preventDefault();
    setActive(WORLDS[(order - 1 + WORLDS.length) % WORLDS.length].id, true);
  }
});

// ── Init ─────────────────────────────────────────────────
// Restore saved direction on load if present, else start at Warm Modern
let startId = "warm-modern";
try {
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
  if (saved && WORLDS.some(w => w.id === saved.id)) startId = saved.id;
} catch (e) {}
setActive(startId, false);
