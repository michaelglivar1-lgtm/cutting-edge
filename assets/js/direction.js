/* ───────────────────────────────────────────────────────────
   Direction landing page interactivity:
   - FAQ accordion
   - Reveal-on-scroll for sections
   - Mood Board PDF for this direction
   - Save / Compare deep-links to the explore stage
   ─────────────────────────────────────────────────────────── */

(function () {
  // ── FAQ accordion ─────────────────────────────────────
  document.querySelectorAll(".dir-faq-q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".dir-faq-item");
      item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", item.classList.contains("is-open") ? "true" : "false");
    });
  });

  // ── Reveal on scroll ──────────────────────────────────
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));

  // ── Save direction from landing page ─────────────────
  const SAVE_KEY = window.CE_SAVE_KEY || "cuttingedge:savedDirections";
  const worldId = document.body.dataset.world;

  function getSaved() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "[]"); } catch (e) { return []; }
  }
  function setSaved(l) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(l)); } catch (e) {} }
  function isSaved(id) { return getSaved().some((s) => s.id === id); }

  const saveBtn = document.getElementById("dirSaveBtn");
  if (saveBtn) {
    function refresh() {
      const saved = isSaved(worldId);
      saveBtn.classList.toggle("is-saved", saved);
      saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
      const label = saveBtn.querySelector(".action-text-save");
      if (label) label.textContent = saved ? "Saved to My Board" : "Save This Direction";
    }
    saveBtn.addEventListener("click", () => {
      const list = getSaved();
      const idx = list.findIndex((s) => s.id === worldId);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        list.push({ id: worldId, savedAt: Date.now(), note: "" });
      }
      setSaved(list);
      refresh();
      showToast(isSaved(worldId)
        ? "Added to your direction board"
        : "Removed from your direction board");
    });
    refresh();
  }

  // ── Mood Board PDF ────────────────────────────────────
  const pdfBtn = document.getElementById("dirMoodPdfBtn");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", async () => {
      const orig = pdfBtn.innerHTML;
      pdfBtn.disabled = true;
      pdfBtn.innerHTML = `<span class="action-spinner" aria-hidden="true"></span> Preparing…`;
      try {
        await loadJsPDF();
        const world = (window.CE_WORLDS || []).find((w) => w.id === worldId);
        if (!world) throw new Error("World not found");
        await buildMoodBoardPDF(world);
        showToast(`${world.name} mood board downloaded`);
      } catch (e) {
        console.error(e);
        showToast("Unable to build PDF — please try again");
      } finally {
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = orig;
      }
    });
  }

  // ── Toast ─────────────────────────────────────────────
  let toastEl = document.getElementById("toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "toast";
    toastEl.className = "toast";
    toastEl.hidden = true;
    toastEl.setAttribute("role", "status");
    document.body.appendChild(toastEl);
  }
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    void toastEl.offsetWidth;
    toastEl.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toastEl.classList.remove("is-visible");
      setTimeout(() => { toastEl.hidden = true; }, 400);
    }, 2600);
  }

  // ── PDF helpers (duplicated minimally so this page can stand alone) ─
  let jsPDFLoaded = false;
  function loadJsPDF() {
    return new Promise((res, rej) => {
      if (jsPDFLoaded || window.jspdf) { jsPDFLoaded = true; return res(); }
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = () => { jsPDFLoaded = true; res(); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  async function imageToDataUrl(url) {
    const r = await fetch(url);
    const b = await r.blob();
    return new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
  }
  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
  }
  async function buildMoodBoardPDF(world) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    doc.setFillColor(244, 240, 232); doc.rect(0, 0, W, H, "F");
    doc.setDrawColor(193, 154, 75); doc.setLineWidth(0.5); doc.rect(28, 28, W - 56, H - 56);

    // Crest (from current page — paths are relative to /directions/)
    try {
      const svgUrl = await imageToDataUrl("../assets/img/logo-crest.svg");
      const svgImg = new Image();
      await new Promise((r) => { svgImg.onload = r; svgImg.src = svgUrl; });
      const cv = document.createElement("canvas"); cv.width = 200; cv.height = 230;
      cv.getContext("2d").drawImage(svgImg, 0, 0, 200, 230);
      doc.addImage(cv.toDataURL("image/png"), "PNG", 56, 56, 44, 50);
    } catch (e) {}

    doc.setTextColor(26, 20, 13); doc.setFont("times", "italic"); doc.setFontSize(10);
    doc.text("CUTTING EDGE", 114, 76, { charSpace: 2 });
    doc.setFontSize(8); doc.setTextColor(122, 96, 50);
    doc.text("DESIGN & CONSTRUCTION", 114, 90, { charSpace: 1.5 });

    const d = new Date();
    doc.setFontSize(8); doc.setTextColor(122, 110, 88);
    doc.text(d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }).toUpperCase(), W - 56, 76, { align: "right", charSpace: 1.5 });
    doc.text("MOOD BOARD · 01 / 01", W - 56, 90, { align: "right", charSpace: 1.5 });

    doc.setTextColor(122, 96, 50); doc.setFontSize(8);
    doc.text("DIRECTION", 56, 156, { charSpace: 2 });
    doc.setFont("times", "normal"); doc.setTextColor(26, 20, 13); doc.setFontSize(36);
    doc.text(doc.splitTextToSize(world.name, W - 112), 56, 192);

    doc.setFont("times", "italic"); doc.setFontSize(12); doc.setTextColor(77, 69, 55);
    doc.text(doc.splitTextToSize(`"${world.mood}"`, W - 112), 56, 232);

    let afterImageY = 280;
    try {
      const sceneUrl = await imageToDataUrl(`../assets/worlds/${world.id}.webp`);
      const sImg = new Image();
      await new Promise((r) => { sImg.onload = r; sImg.src = sceneUrl; });
      const targetW = W - 112;
      const targetH = targetW * (sImg.height / sImg.width);
      const sCv = document.createElement("canvas"); sCv.width = sImg.width; sCv.height = sImg.height;
      sCv.getContext("2d").drawImage(sImg, 0, 0);
      doc.addImage(sCv.toDataURL("image/jpeg", 0.86), "JPEG", 56, 268, targetW, targetH);
      afterImageY = 268 + targetH + 28;
    } catch (e) {}

    doc.setFont("times", "italic"); doc.setFontSize(8); doc.setTextColor(122, 96, 50);
    doc.text("SIGNATURE MATERIALS", 56, afterImageY, { charSpace: 2 });

    const swatchY = afterImageY + 14;
    const mats = world.materials.slice(0, 4);
    const cellW = (W - 112) / mats.length;
    mats.forEach((m, i) => {
      const x = 56 + i * cellW;
      const rgb = hexToRgb(m.color);
      doc.setFillColor(rgb.r, rgb.g, rgb.b); doc.rect(x, swatchY, 28, 28, "F");
      doc.setDrawColor(184, 171, 138); doc.setLineWidth(0.3); doc.rect(x, swatchY, 28, 28);
      doc.setFont("times", "normal"); doc.setFontSize(9); doc.setTextColor(26, 20, 13);
      doc.text(doc.splitTextToSize(m.name, cellW - 40), x + 36, swatchY + 14);
    });

    doc.setDrawColor(193, 154, 75); doc.setLineWidth(0.4);
    doc.line(56, H - 96, W - 56, H - 96);
    doc.setFont("times", "italic"); doc.setFontSize(9); doc.setTextColor(77, 69, 55);
    doc.text("Cutting Edge Design and Construction", 56, H - 76);
    doc.setFontSize(8); doc.setTextColor(122, 110, 88);
    doc.text("Palm Beach  ·  Miami  ·  Naples  ·  Sarasota", 56, H - 62, { charSpace: 1.2 });
    doc.text("cuttingedgedesignfl.com", W - 56, H - 76, { align: "right" });
    doc.text("BY PRIVATE INVITATION", W - 56, H - 62, { align: "right", charSpace: 1.5 });
    doc.save(`Cutting-Edge-MoodBoard-${world.name.replace(/\s+/g, "-")}.pdf`);
  }

  // ── Material cards — click opens a luxe detail modal ───────────
  // Each material card becomes an interactive button. Tapping/clicking opens a
  // full-screen modal with the large swatch, name, story, application notes,
  // and a "Pin to My Board" action that saves the material spec to localStorage
  // so it surfaces on /saved alongside the saved directions.
  const MAT_KEY = "cuttingedge:savedMaterials";
  function getSavedMats() {
    try { return JSON.parse(localStorage.getItem(MAT_KEY) || "[]"); } catch (_) { return []; }
  }
  function setSavedMats(list) {
    try { localStorage.setItem(MAT_KEY, JSON.stringify(list)); } catch (_) {}
  }
  function matKey(directionId, name) { return `${directionId}::${name}`; }
  function isMatSaved(directionId, name) {
    const k = matKey(directionId, name);
    return getSavedMats().some((m) => m.key === k);
  }
  function toggleMatSaved(directionId, name, note, swatch) {
    const list = getSavedMats();
    const k = matKey(directionId, name);
    const idx = list.findIndex((m) => m.key === k);
    if (idx >= 0) { list.splice(idx, 1); }
    else { list.push({ key: k, directionId, name, note, swatch, savedAt: Date.now() }); }
    setSavedMats(list);
    return idx < 0; // returns true if it was added
  }

  // Build the modal container once and reuse it.
  let matModal = null;
  function ensureMatModal() {
    if (matModal) return matModal;
    matModal = document.createElement("div");
    matModal.className = "mat-modal";
    matModal.setAttribute("role", "dialog");
    matModal.setAttribute("aria-modal", "true");
    matModal.hidden = true;
    matModal.innerHTML = `
      <div class="mat-modal-backdrop" data-mat-close></div>
      <div class="mat-modal-card" role="document">
        <button type="button" class="mat-modal-close" data-mat-close aria-label="Close">×</button>
        <div class="mat-modal-swatch" data-mat-swatch></div>
        <div class="mat-modal-body">
          <div class="mat-modal-eyebrow" data-mat-eyebrow>Material</div>
          <h3 class="mat-modal-name" data-mat-name>Material</h3>
          <p class="mat-modal-note" data-mat-note></p>
          <dl class="mat-modal-meta">
            <div><dt>Where we use it</dt><dd data-mat-where>Primary surfaces, throughout the public rooms.</dd></div>
            <div><dt>How we specify</dt><dd data-mat-spec>Sourced from our European salvage and atelier partners, hand-finished on site.</dd></div>
            <div><dt>Pairs beautifully with</dt><dd data-mat-pairs>The companion materials in this direction.</dd></div>
          </dl>
          <div class="mat-modal-actions">
            <button type="button" class="scene-action scene-action-primary" data-mat-pin>
              <span class="action-dot" aria-hidden="true"></span>
              <span data-mat-pin-label>Pin to My Board</span>
            </button>
            <a class="scene-action" href="/saved" data-mat-view-board>
              <svg class="action-icon" viewBox="0 0 16 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 2h12v17l-6-4-6 4z"/></svg>
              View My Board
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(matModal);
    matModal.addEventListener("click", (e) => {
      if (e.target.matches("[data-mat-close]")) closeMatModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !matModal.hidden) closeMatModal();
    });
    return matModal;
  }
  function openMatModal(card) {
    const modal = ensureMatModal();
    const name = card.querySelector(".dir-material-name")?.textContent?.trim() || "";
    const note = card.querySelector(".dir-material-note")?.textContent?.trim() || "";
    const swatchEl = card.querySelector(".dir-material-swatch");
    const swatchColor = swatchEl ? getComputedStyle(swatchEl).backgroundColor : "#3a2317";
    const world = (window.CE_WORLDS || []).find((w) => w.id === worldId);

    modal.querySelector("[data-mat-swatch]").style.backgroundColor = swatchColor;
    modal.querySelector("[data-mat-eyebrow]").textContent = world ? `${world.name} · Material` : "Material";
    modal.querySelector("[data-mat-name]").textContent = name;
    modal.querySelector("[data-mat-note]").textContent = note;

    // Build the "Pairs beautifully with" line from the other materials in this world.
    if (world && Array.isArray(world.materials)) {
      const others = world.materials.filter((m) => m.name !== name).slice(0, 3).map((m) => m.name);
      modal.querySelector("[data-mat-pairs]").textContent = others.length
        ? others.join(", ") + "."
        : "The companion materials in this direction.";
    }

    // Pin button reflects saved state.
    const pinBtn = modal.querySelector("[data-mat-pin]");
    const pinLabel = modal.querySelector("[data-mat-pin-label]");
    function refreshPin() {
      const saved = isMatSaved(worldId, name);
      pinBtn.classList.toggle("is-saved", saved);
      pinLabel.textContent = saved ? "Pinned to My Board" : "Pin to My Board";
    }
    refreshPin();
    pinBtn.onclick = () => {
      const added = toggleMatSaved(worldId, name, note, swatchColor);
      refreshPin();
      showToast(added ? `Pinned ${name} to your board` : `Removed ${name} from your board`);
    };

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => modal.classList.add("is-open"));
  }
  function closeMatModal() {
    if (!matModal) return;
    matModal.classList.remove("is-open");
    setTimeout(() => {
      matModal.hidden = true;
      document.body.style.overflow = "";
    }, 280);
  }

  document.querySelectorAll(".dir-material-card").forEach((card) => {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.classList.add("is-interactive");
    card.addEventListener("click", () => openMatModal(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMatModal(card);
      }
    });
  });

  // ── Direction landing-page photo gallery ───────────────────────────
  // If the world has a photoGallery, render a magazine-style image grid section
  // after the rooms section so visitors see real reference homes inline.
  (function renderDirectionGallery() {
    const world = (window.CE_WORLDS || []).find((w) => w.id === worldId);
    if (!world || !world.photoGallery || !world.photoGallery.length) return;

    // Resolve asset path (direction pages live at /directions/ so use ../assets/img/...)
    const photos = world.photoGallery.map(p => `../assets/img/${p}`);

    // Build the section
    const section = document.createElement("section");
    section.className = "dir-section dir-gallery-section";
    section.innerHTML = `
      <div class="dir-section-eyebrow reveal">Reference Gallery</div>
      <h2 class="dir-section-title reveal">${world.name} · The Aesthetic In The Wild</h2>
      <p class="dir-section-sub reveal">A curated collection of estates that exemplify this direction. Click any image to view full-size.</p>
      <div class="dir-gallery-grid">
        ${photos.map((src, i) => `
          <button type="button" class="dir-gallery-tile ${i === 0 ? 'is-feature' : ''}" data-photo-index="${i}" aria-label="View photo ${i + 1}">
            <img src="${src}" alt="${world.name} reference photo ${i + 1}" loading="lazy" />
          </button>
        `).join("")}
      </div>
    `;

    // Insert after the rooms section (or materials if no rooms)
    const insertAfter = document.querySelector(".dir-rooms-section") ||
                        document.querySelector(".dir-materials-section") ||
                        document.querySelector(".dir-section");
    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(section, insertAfter.nextSibling);
    }

    // Wire click-to-open-fullscreen-lightbox
    let lightbox = null;
    function openPhotoLightbox(startIdx) {
      if (lightbox) lightbox.remove();
      lightbox = document.createElement("div");
      lightbox.className = "dir-gallery-lightbox";
      lightbox.innerHTML = `
        <button class="dir-gallery-lb-close" data-lb-close aria-label="Close" type="button">×</button>
        <button class="dir-gallery-lb-arrow dir-gallery-lb-prev" data-lb-prev aria-label="Previous" type="button">‹</button>
        <button class="dir-gallery-lb-arrow dir-gallery-lb-next" data-lb-next aria-label="Next" type="button">›</button>
        <div class="dir-gallery-lb-counter"><span data-lb-current>${startIdx + 1}</span> / ${photos.length}</div>
        <img class="dir-gallery-lb-img" data-lb-img src="${photos[startIdx]}" alt="" />
      `;
      document.body.appendChild(lightbox);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => lightbox.classList.add("is-open"));

      let idx = startIdx;
      const img = lightbox.querySelector("[data-lb-img]");
      const counter = lightbox.querySelector("[data-lb-current]");
      function go(n) {
        idx = (n + photos.length) % photos.length;
        img.src = photos[idx];
        counter.textContent = idx + 1;
      }
      lightbox.querySelector("[data-lb-prev]").addEventListener("click", () => go(idx - 1));
      lightbox.querySelector("[data-lb-next]").addEventListener("click", () => go(idx + 1));
      lightbox.querySelector("[data-lb-close]").addEventListener("click", close);
      lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });
      const keyHandler = (e) => {
        if (e.key === "ArrowLeft") go(idx - 1);
        else if (e.key === "ArrowRight") go(idx + 1);
        else if (e.key === "Escape") close();
      };
      document.addEventListener("keydown", keyHandler);
      function close() {
        lightbox.classList.remove("is-open");
        document.removeEventListener("keydown", keyHandler);
        setTimeout(() => { lightbox.remove(); lightbox = null; document.body.style.overflow = ""; }, 280);
      }
    }
    section.querySelectorAll("[data-photo-index]").forEach(tile => {
      tile.addEventListener("click", () => openPhotoLightbox(parseInt(tile.dataset.photoIndex, 10)));
    });
  })();
})();
