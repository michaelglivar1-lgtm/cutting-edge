/* ───────────────────────────────────────────────────────────
   3D EXPLORE — interactive stage controller
   No framework. Zero ongoing AI/API cost.
   Reads world catalog from window.CE_WORLDS (assets/js/worlds.js).
   ─────────────────────────────────────────────────────────── */

const WORLDS = window.CE_WORLDS;
const ASSET_BASE = window.CE_ASSET_BASE;
const SAVE_KEY = window.CE_SAVE_KEY;
const LEGACY_KEY = window.CE_LEGACY_KEY;

/* ── Saved-board helpers (multi-direction) ───────────────── */
function getSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
    // Migrate legacy single-save
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const obj = JSON.parse(legacy);
      const list = [{ id: obj.id, savedAt: obj.savedAt || Date.now(), note: "" }];
      localStorage.setItem(SAVE_KEY, JSON.stringify(list));
      localStorage.removeItem(LEGACY_KEY);
      return list;
    }
  } catch (e) {}
  return [];
}
function setSaved(list) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch (e) {}
}
function isSaved(id) { return getSaved().some(s => s.id === id); }
function toggleSaved(id) {
  const list = getSaved();
  const idx = list.findIndex(s => s.id === id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push({ id, savedAt: Date.now(), note: "" });
  }
  setSaved(list);
  return idx < 0; // true when just added
}

/* ── DOM references ──────────────────────────────────────── */
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
const compareBtn  = document.getElementById("compareBtn");
const moodBoardBtn= document.getElementById("moodBoardBtn");
const lightbox    = document.getElementById("walkthroughLightbox");
const lbTitle     = document.getElementById("lightboxTitle");
const lbFrame     = document.getElementById("lightboxFrame");
const toast       = document.getElementById("toast");
const boardCount  = document.getElementById("boardCount");
const sceneMeta   = document.getElementById("sceneMeta");
const viewDirLink = document.getElementById("viewDirectionLink");

// Compare DOM
const compareCanvas   = document.getElementById("compareCanvas");
const compareA        = document.getElementById("compareA");
const compareB        = document.getElementById("compareB");
const compareDivider  = document.getElementById("compareDivider");
const compareLabelA   = document.getElementById("compareLabelA");
const compareLabelB   = document.getElementById("compareLabelB");
const compareExitBtn  = document.getElementById("compareExitBtn");

totalEl.textContent = String(WORLDS.length).padStart(2, "0");

/* ── Build scene divs ────────────────────────────────────── */
const sceneEls = {};
WORLDS.forEach((w, i) => {
  const div = document.createElement("div");
  div.className = "stage-scene";
  div.dataset.world = w.id;
  if (i === 0) {
    div.style.backgroundImage = `url('${ASSET_BASE}/${w.id}.webp')`;
  } else {
    div.dataset.bg = `${ASSET_BASE}/${w.id}.webp`;
  }
  stageCanvas.appendChild(div);
  sceneEls[w.id] = div;
});

/* ── Build world rail list ───────────────────────────────── */
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
    if (compareMode) {
      setCompareSide(activeCompareSide, w.id);
    } else {
      setActive(w.id, true);
    }
    if (window.matchMedia("(max-width: 820px)").matches) {
      worldRail.classList.remove("is-open");
    }
  });
  btn.addEventListener("mouseenter", () => preload(w.id));
  li.appendChild(btn);
  worldList.appendChild(li);
});

/* ── Mobile rail toggle ──────────────────────────────────── */
railEyebrow.addEventListener("click", () => {
  if (window.matchMedia("(max-width: 820px)").matches) {
    worldRail.classList.toggle("is-open");
  }
});

/* ── Scene state + crossfade ─────────────────────────────── */
let activeId = null;
const loadedScenes = new Set();

function preload(id) {
  if (loadedScenes.has(id)) return;
  const el = sceneEls[id];
  if (el && el.dataset.bg) {
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
  Object.values(sceneEls).forEach(el => el.classList.remove("is-active"));
  sceneEls[id].classList.add("is-active");

  const metaEls = [titleEl, moodEl, materialsEl];
  if (animate) {
    metaEls.forEach(el => { el.style.transition = "opacity 0.25s ease"; el.style.opacity = "0"; });
    setTimeout(() => {
      writeMeta(world);
      updateSaveBtn();
      metaEls.forEach(el => { el.style.opacity = "1"; });
    }, 240);
  } else {
    writeMeta(world);
    updateSaveBtn();
  }

  worldList.querySelectorAll(".world-item").forEach(b => {
    b.classList.toggle("is-active", b.dataset.world === id);
  });
  const idx = WORLDS.findIndex(w => w.id === id) + 1;
  indexEl.textContent = String(idx).padStart(2, "0");

  if (viewDirLink) {
    viewDirLink.href = `directions/${id}.html`;
    viewDirLink.setAttribute("aria-label", `View full ${world.name} direction page`);
  }

  activeId = id;
  const order = idx - 1;
  preload(WORLDS[(order + 1) % WORLDS.length].id);
  preload(WORLDS[(order + 2) % WORLDS.length].id);

  // Update particle tint to match world palette
  if (world.palette) tintParticles(world.palette.glow);
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

function updateSaveBtn() {
  const saved = isSaved(activeId);
  saveBtn.classList.toggle("is-saved", saved);
  saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
  saveBtn.querySelector(".action-text-save").textContent = saved ? "Saved" : "Save Direction";
  // Update board count badge
  const n = getSaved().length;
  if (n > 0) {
    boardCount.hidden = false;
    boardCount.textContent = String(n);
  } else {
    boardCount.hidden = true;
  }
}

/* ── Walkthrough lightbox ────────────────────────────────── */
let panoViewer = null;

function openLightbox() {
  const world = WORLDS.find(w => w.id === activeId);
  if (!world) return;
  lbTitle.textContent = `${world.name} — 360° Walkthrough`;

  // Build the in-walkthrough direction switcher
  const switcher = WORLDS.map(w => `
    <button class="lb-switch-pill ${w.id === world.id ? 'is-active' : ''}" type="button" data-world="${w.id}">${w.name}</button>
  `).join("");

  if (world.walkthrough) {
    lbFrame.classList.remove("has-pano");
    // Real Matterport / Kuula iframe path. Build URL with embed-friendly params
    // hl=0 hides highlights, play=1 starts the tour, qs=1 enables Quickstart UI.
    const src = world.walkthrough.includes("?")
      ? `${world.walkthrough}&hl=0&play=1&qs=1`
      : `${world.walkthrough}?hl=0&play=1&qs=1`;
    lbFrame.innerHTML = `
      <div class="lb-iframe-wrap">
        <iframe src="${src}" title="${world.name} walkthrough" allow="xr-spatial-tracking; fullscreen; vr; gyroscope; accelerometer" allowfullscreen></iframe>
      </div>
      <div class="lb-vr-badge" aria-label="Compatible with VR headsets">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="2"/><circle cx="7.5" cy="12" r="1.5"/><circle cx="16.5" cy="12" r="1.5"/></svg>
        VR Ready · Quest · Vision Pro
      </div>
      ${world.walkthroughCredit ? `
        <div class="lb-credit">
          <span class="lb-credit-eyebrow">Reference Walkthrough</span>
          <span class="lb-credit-text">${world.walkthroughCredit}${world.walkthroughHostedBy ? ` — <em>${world.walkthroughHostedBy}</em>` : ""}</span>
        </div>
      ` : ""}
    `;
  } else {
    // Pannellum 360 panorama path — default for every world until real walkthroughs are wired
    lbFrame.classList.add("has-pano");
    lbFrame.innerHTML = `
      <div id="panoStage" class="pano-stage"></div>
      <div class="pano-instructions">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 12h20M12 2v20M5 5l14 14M19 5l-14 14"/></svg>
        <span>Drag to look around · Pinch / scroll to zoom · Tap a hotspot to switch direction</span>
      </div>
      <div class="pano-loading" id="panoLoading">
        <span class="action-spinner"></span>
        <span>Composing ${world.name}…</span>
      </div>
      <div class="lb-vr-badge" aria-label="Compatible with VR headsets">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="2"/><circle cx="7.5" cy="12" r="1.5"/><circle cx="16.5" cy="12" r="1.5"/></svg>
        360° · VR Ready
      </div>
      <div class="pano-actions">
        <a class="scene-action scene-action-primary" href="index.html#contact" data-tour="${world.id}">
          <span class="action-dot" aria-hidden="true"></span>
          Request Private Tour
        </a>
        <a class="scene-action" href="directions/${world.id}.html">
          <svg class="action-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 10h14M11 4l6 6-6 6"/></svg>
          View Full Direction
        </a>
        <button class="scene-action" type="button" data-save-from-lightbox>
          <svg class="action-icon" viewBox="0 0 16 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 2h12v17l-6-4-6 4z"/></svg>
          Save This Direction
        </button>
      </div>
    `;
    lbFrame.querySelector("[data-save-from-lightbox]")?.addEventListener("click", () => {
      handleSave();
    });
  }

  // Inject the in-walkthrough direction switcher
  let switcherEl = document.getElementById("lbSwitcher");
  if (!switcherEl) {
    switcherEl = document.createElement("div");
    switcherEl.id = "lbSwitcher";
    switcherEl.className = "lb-switcher";
    lbFrame.parentElement.insertBefore(switcherEl, lbFrame.nextSibling);
  }
  switcherEl.innerHTML = `
    <div class="lb-switcher-eyebrow">Step into another direction</div>
    <div class="lb-switcher-pills">${switcher}</div>
  `;
  switcherEl.querySelectorAll(".lb-switch-pill").forEach(p => {
    p.addEventListener("click", () => {
      const id = p.dataset.world;
      setActive(id, false);
      openLightbox();
    });
  });

  lightbox.hidden = false;
  document.body.style.overflow = "hidden";

  // Mount Pannellum panorama (only when no real walkthrough)
  if (!world.walkthrough) {
    lightbox.classList.add("is-pano-active");
    mountPanorama(world);
  } else {
    lightbox.classList.remove("is-pano-active");
  }
}

function mountPanorama(world) {
  if (!window.pannellum) {
    // Pannellum still loading — wait for it
    const wait = setInterval(() => {
      if (window.pannellum) { clearInterval(wait); mountPanorama(world); }
    }, 100);
    return;
  }

  // Destroy any existing viewer first
  try { if (panoViewer && panoViewer.destroy) panoViewer.destroy(); } catch (e) {}
  panoViewer = null;

  const stage = document.getElementById("panoStage");
  if (!stage) return;

  // Build hotspots: a small marker for each OTHER world to jump into
  const order = WORLDS.findIndex(w => w.id === world.id);
  const others = WORLDS.filter((_, i) => i !== order);
  // Distribute hotspots evenly around the horizontal plane (yaw 0-360, pitch slightly above horizon)
  const hotspots = others.slice(0, 6).map((w, i) => {
    const yaw = (i * (360 / 6)) - 180; // spread across the room
    return {
      pitch: -5 + (i % 2) * 10,
      yaw: yaw,
      type: "info",
      text: w.name,
      clickHandlerFunc: () => {
        setActive(w.id, false);
        openLightbox();
      },
    };
  });

  try {
    panoViewer = window.pannellum.viewer("panoStage", {
      type: "equirectangular",
      panorama: `${ASSET_BASE}/${world.id}-pano.jpg`,
      autoLoad: true,
      autoRotate: -2,             // slow gentle rotation when idle
      autoRotateInactivityDelay: 3000,
      compass: false,
      showZoomCtrl: false,
      showFullscreenCtrl: true,
      showControls: true,
      mouseZoom: true,
      keyboardZoom: true,
      doubleClickZoom: true,
      draggable: true,
      orientationOnByDefault: false,
      // Source images are 1774×887 ≈ 2:1 — standard equirectangular.
      // Let Pannellum default to full 360°×180° mapping.
      vOffset: 0,
      minHfov: 30,
      maxHfov: 120,
      hfov: 95,
      pitch: 0,
      yaw: 0,
      hotSpots: hotspots,
      hotSpotDebug: false,
      sceneFadeDuration: 800,
    });

    panoViewer.on("load", () => {
      const loading = document.getElementById("panoLoading");
      if (loading) loading.classList.add("is-hidden");
      // After Pannellum mounts, prevent touch events on the canvas from
      // bubbling up to the lightbox panel (which would scroll instead of drag).
      const stage = document.getElementById("panoStage");
      if (stage) {
        const stopper = (e) => { e.stopPropagation(); };
        ['touchstart','touchmove','touchend','pointerdown','pointermove','pointerup'].forEach(evt => {
          stage.addEventListener(evt, stopper, { passive: false });
        });
      }
    });
    panoViewer.on("error", (err) => {
      console.error("Pannellum error:", err);
      const loading = document.getElementById("panoLoading");
      if (loading) loading.innerHTML = `<span>Unable to load 360° view. <a href="directions/${world.id}.html" style="color:var(--explore-gold)">View direction page</a></span>`;
    });
  } catch (e) {
    console.error("mountPanorama failed:", e);
  }
}

function closeLightbox() {
  try { if (panoViewer && panoViewer.destroy) panoViewer.destroy(); } catch (e) {}
  panoViewer = null;
  lightbox.hidden = true;
  lightbox.classList.remove("is-pano-active");
  lbFrame.innerHTML = "";
  lbFrame.classList.remove("has-pano");
  const sw = document.getElementById("lbSwitcher");
  if (sw) sw.remove();
  document.body.style.overflow = "";
}

lightbox.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) closeLightbox();
});
walkBtn.addEventListener("click", openLightbox);

/* ── Save direction (toggle) ─────────────────────────────── */
function handleSave() {
  const world = WORLDS.find(w => w.id === activeId);
  if (!world) return;
  const added = toggleSaved(world.id);
  updateSaveBtn();
  showToast(added
    ? `${world.name} added to your direction board`
    : `${world.name} removed from your board`
  );
}
saveBtn.addEventListener("click", handleSave);

function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  void toast.offsetWidth;
  toast.classList.add("is-visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => { toast.hidden = true; }, 400);
  }, 2800);
}

/* ── Compare mode ────────────────────────────────────────── */
let compareMode = false;
let activeCompareSide = "B"; // which side a rail-click should change
const compareState = { A: null, B: null };

function enterCompare() {
  compareMode = true;
  // Pick a contrasting second world if possible
  const order = WORLDS.findIndex(w => w.id === activeId);
  compareState.A = activeId;
  compareState.B = WORLDS[(order + 4) % WORLDS.length].id; // 4 steps away = good contrast
  compareCanvas.hidden = false;
  stageCanvas.style.opacity = "0";
  document.body.classList.add("is-comparing");
  compareExitBtn.hidden = false;
  renderCompare();
}

function exitCompare() {
  compareMode = false;
  compareCanvas.hidden = true;
  stageCanvas.style.opacity = "";
  document.body.classList.remove("is-comparing");
  compareExitBtn.hidden = true;
}

function renderCompare() {
  const a = WORLDS.find(w => w.id === compareState.A);
  const b = WORLDS.find(w => w.id === compareState.B);
  if (!a || !b) return;
  compareA.style.backgroundImage = `url('${ASSET_BASE}/${a.id}.webp')`;
  compareB.style.backgroundImage = `url('${ASSET_BASE}/${b.id}.webp')`;
  compareLabelA.textContent = a.name;
  compareLabelB.textContent = b.name;
  preload(a.id); preload(b.id);
  // Mark which side is the "active selector target"
  compareLabelA.classList.toggle("is-target", activeCompareSide === "A");
  compareLabelB.classList.toggle("is-target", activeCompareSide === "B");
}

function setCompareSide(side, id) {
  compareState[side] = id;
  renderCompare();
}

// Click on a label to make it the target (next rail click swaps that side)
compareLabelA.addEventListener("click", () => { activeCompareSide = "A"; renderCompare(); });
compareLabelB.addEventListener("click", () => { activeCompareSide = "B"; renderCompare(); });

compareBtn.addEventListener("click", enterCompare);
compareExitBtn.addEventListener("click", exitCompare);

// Compare divider drag
(function setupDividerDrag() {
  let dragging = false;
  function setPercent(pct) {
    pct = Math.max(5, Math.min(95, pct));
    compareCanvas.style.setProperty("--split", pct + "%");
  }
  compareDivider.addEventListener("pointerdown", (e) => {
    dragging = true;
    compareDivider.setPointerCapture(e.pointerId);
  });
  compareDivider.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = compareCanvas.getBoundingClientRect();
    setPercent(((e.clientX - rect.left) / rect.width) * 100);
  });
  compareDivider.addEventListener("pointerup", (e) => {
    dragging = false;
    compareDivider.releasePointerCapture(e.pointerId);
  });
  // Initialize at 50%
  setPercent(50);
})();

/* ── Mood Board PDF export ───────────────────────────────── */
let jsPDFLoaded = false;
function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (jsPDFLoaded || window.jspdf) { jsPDFLoaded = true; return resolve(); }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => { jsPDFLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function imageToDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(blob);
  });
}

async function buildMoodBoardPDF(world) {
  await loadJsPDF();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background: warm cream
  doc.setFillColor(244, 240, 232);
  doc.rect(0, 0, W, H, "F");

  // Hairline gold border
  doc.setDrawColor(193, 154, 75);
  doc.setLineWidth(0.5);
  doc.rect(28, 28, W - 56, H - 56);

  // Crest at top-left
  try {
    const crestUrl = await imageToDataUrl("assets/img/logo-crest.svg");
    // jsPDF supports SVG via dataurl as image only for PNG/JPEG, so convert SVG to PNG by rasterizing
    // We'll rasterize via an offscreen canvas instead
    const svgImg = new Image();
    await new Promise((res) => { svgImg.onload = res; svgImg.src = crestUrl; });
    const cv = document.createElement("canvas");
    cv.width = 200; cv.height = 230;
    cv.getContext("2d").drawImage(svgImg, 0, 0, 200, 230);
    doc.addImage(cv.toDataURL("image/png"), "PNG", 56, 56, 44, 50);
  } catch (e) { /* non-fatal */ }

  // Header text right of crest
  doc.setTextColor(26, 20, 13);
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text("CUTTING EDGE", 114, 76, { charSpace: 2 });
  doc.setFontSize(8);
  doc.setTextColor(122, 96, 50);
  doc.text("DESIGN & CONSTRUCTION", 114, 90, { charSpace: 1.5 });

  // Date top-right
  const d = new Date();
  const dateStr = d.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  doc.setFontSize(8);
  doc.setTextColor(122, 110, 88);
  doc.text(dateStr.toUpperCase(), W - 56, 76, { align: "right", charSpace: 1.5 });
  doc.text("MOOD BOARD · 01 / 01", W - 56, 90, { align: "right", charSpace: 1.5 });

  // Direction label + title
  doc.setTextColor(122, 96, 50);
  doc.setFontSize(8);
  doc.text("DIRECTION", 56, 156, { charSpace: 2 });
  doc.setFont("times", "normal");
  doc.setTextColor(26, 20, 13);
  doc.setFontSize(36);
  // Wrap if too long
  const titleLines = doc.splitTextToSize(world.name, W - 112);
  doc.text(titleLines, 56, 192);

  // Mood line
  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.setTextColor(77, 69, 55);
  const moodLines = doc.splitTextToSize(`"${world.mood}"`, W - 112);
  doc.text(moodLines, 56, 232);

  // Hero scene image
  try {
    const sceneUrl = await imageToDataUrl(`${ASSET_BASE}/${world.id}.webp`);
    // Convert webp dataurl to JPEG via canvas for max compatibility
    const sImg = new Image();
    await new Promise((res) => { sImg.onload = res; sImg.src = sceneUrl; });
    const sCv = document.createElement("canvas");
    const targetW = W - 112;
    const targetH = targetW * (sImg.height / sImg.width);
    sCv.width = sImg.width; sCv.height = sImg.height;
    sCv.getContext("2d").drawImage(sImg, 0, 0);
    doc.addImage(sCv.toDataURL("image/jpeg", 0.86), "JPEG", 56, 268, targetW, targetH);
    var afterImageY = 268 + targetH + 28;
  } catch (e) {
    var afterImageY = 280;
  }

  // Materials section
  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.setTextColor(122, 96, 50);
  doc.text("SIGNATURE MATERIALS", 56, afterImageY, { charSpace: 2 });

  const swatchY = afterImageY + 14;
  const cellW = (W - 112) / world.materials.length;
  world.materials.forEach((m, i) => {
    const x = 56 + i * cellW;
    // Swatch
    const rgb = hexToRgb(m.color);
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(x, swatchY, 28, 28, "F");
    doc.setDrawColor(184, 171, 138);
    doc.setLineWidth(0.3);
    doc.rect(x, swatchY, 28, 28);
    // Material name
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(26, 20, 13);
    const nameLines = doc.splitTextToSize(m.name, cellW - 40);
    doc.text(nameLines, x + 36, swatchY + 14);
  });

  // Footer
  doc.setDrawColor(193, 154, 75);
  doc.setLineWidth(0.4);
  doc.line(56, H - 96, W - 56, H - 96);
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(77, 69, 55);
  doc.text("Cutting Edge Design and Construction", 56, H - 76);
  doc.setFontSize(8);
  doc.setTextColor(122, 110, 88);
  doc.text("Palm Beach  ·  Miami  ·  Naples  ·  Sarasota", 56, H - 62, { charSpace: 1.2 });
  doc.text("cuttingedgedesignfl.com", W - 56, H - 76, { align: "right" });
  doc.text("BY PRIVATE INVITATION", W - 56, H - 62, { align: "right", charSpace: 1.5 });

  doc.save(`Cutting-Edge-MoodBoard-${world.name.replace(/\s+/g,"-")}.pdf`);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map(c => c+c).join("");
  return { r: parseInt(hex.slice(0,2),16), g: parseInt(hex.slice(2,4),16), b: parseInt(hex.slice(4,6),16) };
}

moodBoardBtn.addEventListener("click", async () => {
  const world = WORLDS.find(w => w.id === activeId);
  if (!world) return;
  const label = moodBoardBtn.querySelector("*") ? null : null; // no-op placeholder
  moodBoardBtn.disabled = true;
  const original = moodBoardBtn.innerHTML;
  moodBoardBtn.innerHTML = `<span class="action-spinner" aria-hidden="true"></span> Preparing…`;
  try {
    await buildMoodBoardPDF(world);
    showToast(`${world.name} mood board downloaded`);
  } catch (e) {
    console.error(e);
    showToast(`Unable to build PDF — please try again`);
  } finally {
    moodBoardBtn.disabled = false;
    moodBoardBtn.innerHTML = original;
  }
});

/* ── Ambient gold particles ──────────────────────────────── */
const particleCanvas = document.getElementById("particleCanvas");
const particleCtx = particleCanvas.getContext("2d", { alpha: true });
let particleTint = "rgba(193,154,75,0.55)";
const particles = [];
const PARTICLE_COUNT = 18;

function resizeParticles() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  particleCanvas.width = window.innerWidth * dpr;
  particleCanvas.height = window.innerHeight * dpr;
  particleCanvas.style.width = window.innerWidth + "px";
  particleCanvas.style.height = window.innerHeight + "px";
  particleCtx.scale(dpr, dpr);
}
function seedParticles() {
  particles.length = 0;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.6 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.08 - Math.random() * 0.22,
      alpha: 0.15 + Math.random() * 0.45,
      twinkle: Math.random() * Math.PI * 2,
    });
  }
}
function tintParticles(color) {
  particleTint = color || "rgba(193,154,75,0.55)";
}

let lastTs = 0;
function animateParticles(ts) {
  const dt = Math.min(50, ts - lastTs || 16);
  lastTs = ts;
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  for (const p of particles) {
    p.x += p.vx * (dt / 16);
    p.y += p.vy * (dt / 16);
    p.twinkle += 0.03;
    if (p.y < -10) { p.y = window.innerHeight + 10; p.x = Math.random() * window.innerWidth; }
    if (p.x < -10) p.x = window.innerWidth + 10;
    if (p.x > window.innerWidth + 10) p.x = -10;
    const a = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkle));
    particleCtx.beginPath();
    particleCtx.fillStyle = particleTint.replace(/[\d.]+\)$/, a.toFixed(3) + ")");
    particleCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    particleCtx.fill();
  }
  rafId = requestAnimationFrame(animateParticles);
}
let rafId;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!prefersReducedMotion) {
  resizeParticles();
  seedParticles();
  rafId = requestAnimationFrame(animateParticles);
  window.addEventListener("resize", () => { resizeParticles(); seedParticles(); });
}

/* ── Keyboard nav ────────────────────────────────────────── */
document.addEventListener("keydown", (e) => {
  if (!lightbox.hidden && e.key === "Escape") { closeLightbox(); return; }
  if (compareMode && e.key === "Escape") { exitCompare(); return; }
  if (e.target && /input|textarea/i.test(e.target.tagName)) return;
  const order = WORLDS.findIndex(w => w.id === activeId);
  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    e.preventDefault();
    setActive(WORLDS[(order + 1) % WORLDS.length].id, true);
  } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    e.preventDefault();
    setActive(WORLDS[(order - 1 + WORLDS.length) % WORLDS.length].id, true);
  } else if (e.key === "s" && !e.metaKey && !e.ctrlKey) {
    handleSave();
  } else if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
    compareMode ? exitCompare() : enterCompare();
  }
});

/* ── Init ────────────────────────────────────────────────── */
function parseHash() {
  const h = (window.location.hash || "").replace(/^#/, "");
  const params = {};
  h.split("&").forEach(kv => {
    const [k, v] = kv.split("=");
    if (k) params[decodeURIComponent(k)] = v ? decodeURIComponent(v) : "";
  });
  return params;
}

let startId = "warm-modern";
const params = parseHash();
const saved = getSaved();
if (params.world && WORLDS.some(w => w.id === params.world)) {
  startId = params.world;
} else if (saved.length > 0 && WORLDS.some(w => w.id === saved[saved.length - 1].id)) {
  startId = saved[saved.length - 1].id;
}
setActive(startId, false);
updateSaveBtn();

if (params.tour === "1" || params.tour === "true") {
  setTimeout(openLightbox, 500);
}
