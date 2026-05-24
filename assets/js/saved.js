/* ───────────────────────────────────────────────────────────
   My Direction Board — saved.html
   Reads/writes window.CE_SAVE_KEY in localStorage.
   No backend; submission is a structured mailto + downloadable PDF.
   ─────────────────────────────────────────────────────────── */

const WORLDS    = window.CE_WORLDS;
const ASSET_BASE = window.CE_ASSET_BASE;
const SAVE_KEY  = window.CE_SAVE_KEY;
const STUDIO_EMAIL = "info@cuttingedgedesignfl.com"; // change here if you have a different inbox

function getSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}
function setSaved(list) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch (e) {}
}

const grid       = document.getElementById("savedGrid");
const empty      = document.getElementById("savedEmpty");
const send       = document.getElementById("savedSend");
const stats      = document.getElementById("savedStats");
const statCount  = document.getElementById("statCount");
const statLabel  = document.getElementById("statLabel");
const toast      = document.getElementById("toast");
const confirmOL  = document.getElementById("confirmOverlay");

function render() {
  const saved = getSaved();
  statCount.textContent = saved.length;
  statLabel.textContent = saved.length === 1 ? "direction saved" : "directions saved";

  if (saved.length === 0) {
    empty.hidden = false;
    grid.hidden = true;
    send.hidden = true;
    stats.hidden = true;
    return;
  }
  empty.hidden = true;
  grid.hidden = false;
  send.hidden = false;
  stats.hidden = false;

  grid.innerHTML = "";
  saved.forEach((s, i) => {
    const w = WORLDS.find(x => x.id === s.id);
    if (!w) return;
    const card = document.createElement("article");
    card.className = "saved-card";
    card.innerHTML = `
      <div class="card-image" style="background-image:url('${ASSET_BASE}/${w.id}.webp')">
        <button class="card-remove" type="button" aria-label="Remove ${w.name} from board">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg>
        </button>
      </div>
      <div class="card-body">
        <div class="card-eyebrow">
          <span>Direction ${String(i+1).padStart(2,"0")}</span>
          <span class="card-saved-date">${formatDate(s.savedAt)}</span>
        </div>
        <h2 class="card-title">${w.name}</h2>
        <p class="card-mood">${w.mood}</p>
        <div class="card-materials">
          ${w.materials.map(m => `
            <span class="material-chip">
              <span class="material-swatch" style="background:${m.color}"></span>
              ${m.name}
            </span>
          `).join("")}
        </div>
        <label class="card-note-label" for="note-${w.id}">Notes for the studio</label>
        <textarea class="card-note" id="note-${w.id}" data-id="${w.id}"
          placeholder="What you love about this direction… rooms you imagine in it, materials to push further, anything to refine.">${escapeHtml(s.note || "")}</textarea>
      </div>
    `;
    grid.appendChild(card);

    // Wire remove
    card.querySelector(".card-remove").addEventListener("click", () => {
      const list = getSaved().filter(x => x.id !== w.id);
      setSaved(list);
      render();
      showToast(`${w.name} removed from your board`);
    });
    // Wire note auto-save
    const ta = card.querySelector(".card-note");
    ta.addEventListener("input", debounce(() => {
      const list = getSaved();
      const item = list.find(x => x.id === w.id);
      if (item) { item.note = ta.value; setSaved(list); }
    }, 300));
  });
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

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

/* ── Clear board ─────────────────────────────────────────── */
document.getElementById("clearBoardBtn").addEventListener("click", () => {
  if (!confirm("Clear your entire board? This cannot be undone.")) return;
  setSaved([]);
  render();
  showToast("Board cleared");
});

/* ── PDF builder for the full board ─────────────────────── */
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

function hexToRgb(hex) {
  hex = hex.replace("#","");
  if (hex.length === 3) hex = hex.split("").map(c=>c+c).join("");
  return { r: parseInt(hex.slice(0,2),16), g: parseInt(hex.slice(2,4),16), b: parseInt(hex.slice(4,6),16) };
}

async function buildBoardPDF(opts = {}) {
  const saved = getSaved();
  if (saved.length === 0) return;
  await loadJsPDF();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Convert crest once
  let crestDataUrl = null;
  try {
    const svgUrl = await imageToDataUrl("assets/img/logo-crest.svg");
    const svgImg = new Image();
    await new Promise(r => { svgImg.onload = r; svgImg.src = svgUrl; });
    const cv = document.createElement("canvas");
    cv.width = 200; cv.height = 230;
    cv.getContext("2d").drawImage(svgImg, 0, 0, 200, 230);
    crestDataUrl = cv.toDataURL("image/png");
  } catch (e) {}

  // ─── COVER PAGE ───
  doc.setFillColor(244, 240, 232);
  doc.rect(0, 0, W, H, "F");
  doc.setDrawColor(193, 154, 75);
  doc.setLineWidth(0.5);
  doc.rect(36, 36, W - 72, H - 72);

  if (crestDataUrl) doc.addImage(crestDataUrl, "PNG", W/2 - 32, 110, 64, 72);

  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(122, 96, 50);
  doc.text("BY PRIVATE INVITATION", W/2, 220, { align: "center", charSpace: 3 });

  doc.setFont("times", "normal");
  doc.setFontSize(48);
  doc.setTextColor(26, 20, 13);
  doc.text("My Direction", W/2, 296, { align: "center" });
  doc.setFont("times", "italic");
  doc.text("Board", W/2, 350, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.setTextColor(77, 69, 55);
  const subLines = doc.splitTextToSize(
    "A curated collection of architectural directions, prepared for review with the Cutting Edge studio.",
    W - 200
  );
  doc.text(subLines, W/2, 396, { align: "center" });

  // Client info if available
  const clientName = (opts.name || "").trim();
  if (clientName) {
    doc.setFont("times", "italic");
    doc.setFontSize(14);
    doc.setTextColor(122, 96, 50);
    doc.text(`Prepared for ${clientName}`, W/2, 460, { align: "center" });
  }

  // Footer cover
  const today = new Date();
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(122, 110, 88);
  doc.text(`${saved.length} ${saved.length === 1 ? "direction" : "directions"}`, W/2, H - 130, { align: "center", charSpace: 1.5 });
  doc.text(today.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" }).toUpperCase(), W/2, H - 110, { align: "center", charSpace: 1.8 });

  doc.setDrawColor(193, 154, 75);
  doc.setLineWidth(0.4);
  doc.line(W/2 - 60, H - 88, W/2 + 60, H - 88);
  doc.setFontSize(9);
  doc.text("CUTTING EDGE  ·  DESIGN & CONSTRUCTION", W/2, H - 72, { align: "center", charSpace: 2 });
  doc.text("PALM BEACH  ·  MIAMI  ·  NAPLES  ·  SARASOTA", W/2, H - 58, { align: "center", charSpace: 1.5 });

  // ─── ONE PAGE PER DIRECTION ───
  for (let i = 0; i < saved.length; i++) {
    const s = saved[i];
    const w = WORLDS.find(x => x.id === s.id);
    if (!w) continue;

    doc.addPage();
    doc.setFillColor(244, 240, 232);
    doc.rect(0, 0, W, H, "F");
    doc.setDrawColor(193, 154, 75);
    doc.setLineWidth(0.5);
    doc.rect(36, 36, W - 72, H - 72);

    // Header
    if (crestDataUrl) doc.addImage(crestDataUrl, "PNG", 56, 56, 28, 32);
    doc.setFont("times", "italic"); doc.setFontSize(9);
    doc.setTextColor(122, 96, 50);
    doc.text("CUTTING EDGE", 92, 70, { charSpace: 2 });
    doc.setFontSize(7); doc.text("DESIGN & CONSTRUCTION", 92, 82, { charSpace: 1.5 });
    doc.setFontSize(8); doc.setTextColor(122, 110, 88);
    doc.text(`DIRECTION ${String(i+1).padStart(2,"0")} / ${String(saved.length).padStart(2,"0")}`, W - 56, 70, { align: "right", charSpace: 1.5 });
    doc.text(today.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}).toUpperCase(), W - 56, 82, { align: "right", charSpace: 1.5 });

    // Direction label + title
    doc.setTextColor(122, 96, 50); doc.setFontSize(8);
    doc.text("DIRECTION", 56, 140, { charSpace: 2 });
    doc.setFont("times","normal"); doc.setFontSize(32);
    doc.setTextColor(26, 20, 13);
    const tLines = doc.splitTextToSize(w.name, W - 112);
    doc.text(tLines, 56, 170);

    // Mood
    doc.setFont("times","italic"); doc.setFontSize(12);
    doc.setTextColor(77, 69, 55);
    const moodLines = doc.splitTextToSize(`"${w.mood}"`, W - 112);
    doc.text(moodLines, 56, 208);

    // Scene image
    let afterImageY = 240;
    try {
      const sceneUrl = await imageToDataUrl(`${ASSET_BASE}/${w.id}.webp`);
      const sImg = new Image();
      await new Promise(r => { sImg.onload = r; sImg.src = sceneUrl; });
      const targetW = W - 112;
      const targetH = targetW * (sImg.height / sImg.width);
      const sCv = document.createElement("canvas");
      sCv.width = sImg.width; sCv.height = sImg.height;
      sCv.getContext("2d").drawImage(sImg, 0, 0);
      doc.addImage(sCv.toDataURL("image/jpeg", 0.85), "JPEG", 56, 244, targetW, targetH);
      afterImageY = 244 + targetH + 24;
    } catch (e) {}

    // Materials
    doc.setFont("times","italic"); doc.setFontSize(8);
    doc.setTextColor(122, 96, 50);
    doc.text("SIGNATURE MATERIALS", 56, afterImageY, { charSpace: 2 });
    const swatchY = afterImageY + 12;
    const cellW = (W - 112) / w.materials.length;
    w.materials.forEach((m, j) => {
      const x = 56 + j * cellW;
      const rgb = hexToRgb(m.color);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(x, swatchY, 22, 22, "F");
      doc.setDrawColor(184, 171, 138); doc.setLineWidth(0.3);
      doc.rect(x, swatchY, 22, 22);
      doc.setFont("times","normal"); doc.setFontSize(8.5);
      doc.setTextColor(26, 20, 13);
      const lines = doc.splitTextToSize(m.name, cellW - 32);
      doc.text(lines, x + 30, swatchY + 13);
    });

    // Client note if present
    if (s.note && s.note.trim()) {
      const noteY = swatchY + 50;
      doc.setFont("times","italic"); doc.setFontSize(8);
      doc.setTextColor(122, 96, 50);
      doc.text("CLIENT NOTES", 56, noteY, { charSpace: 2 });
      doc.setFont("times","italic"); doc.setFontSize(11);
      doc.setTextColor(40, 32, 22);
      const noteLines = doc.splitTextToSize(s.note.trim(), W - 112);
      doc.text(noteLines, 56, noteY + 16);
    }

    // Footer
    doc.setDrawColor(193,154,75); doc.setLineWidth(0.4);
    doc.line(56, H - 76, W - 56, H - 76);
    doc.setFont("times","italic"); doc.setFontSize(8);
    doc.setTextColor(122, 110, 88);
    doc.text("cuttingedgedesignfl.com", 56, H - 58);
    doc.text("BY PRIVATE INVITATION", W - 56, H - 58, { align: "right", charSpace: 1.5 });
  }

  // ─── PROJECT BRIEF PAGE (if details provided) ───
  if (opts.name || opts.email || opts.vision || opts.phone || opts.location) {
    doc.addPage();
    doc.setFillColor(244, 240, 232);
    doc.rect(0, 0, W, H, "F");
    doc.setDrawColor(193, 154, 75);
    doc.setLineWidth(0.5);
    doc.rect(36, 36, W - 72, H - 72);

    doc.setFont("times","italic"); doc.setFontSize(11);
    doc.setTextColor(122, 96, 50);
    doc.text("PROJECT BRIEF", W/2, 110, { align: "center", charSpace: 3 });

    doc.setFont("times","normal"); doc.setFontSize(34);
    doc.setTextColor(26, 20, 13);
    doc.text("The Conversation", W/2, 168, { align: "center" });

    let y = 240;
    function row(label, value) {
      if (!value) return;
      doc.setFont("times","italic"); doc.setFontSize(8);
      doc.setTextColor(122, 96, 50);
      doc.text(label.toUpperCase(), 80, y, { charSpace: 2 });
      doc.setFont("times","normal"); doc.setFontSize(13);
      doc.setTextColor(26, 20, 13);
      const lines = doc.splitTextToSize(value, W - 160);
      doc.text(lines, 80, y + 16);
      y += 16 + lines.length * 16 + 18;
      doc.setDrawColor(193,154,75); doc.setLineWidth(0.2);
      doc.line(80, y - 8, W - 80, y - 8);
    }
    row("Client", opts.name);
    row("Email", opts.email);
    row("Phone", opts.phone);
    row("Project Location", opts.location);
    row("Vision", opts.vision);

    // Footer
    doc.setFont("times","italic"); doc.setFontSize(8);
    doc.setTextColor(122, 110, 88);
    doc.text("CUTTING EDGE  ·  DESIGN & CONSTRUCTION", W/2, H - 72, { align: "center", charSpace: 2 });
    doc.text("cuttingedgedesignfl.com", W/2, H - 58, { align: "center" });
  }

  const filename = clientName
    ? `Cutting-Edge-Board-${clientName.replace(/\s+/g,"-")}.pdf`
    : `Cutting-Edge-Direction-Board.pdf`;
  doc.save(filename);
}

/* ── Download Board button ───────────────────────────────── */
document.getElementById("downloadBoardBtn").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="action-spinner" aria-hidden="true"></span> Preparing…`;
  try {
    // Pull current form values so the PDF reflects the in-progress brief
    const form = document.getElementById("sendForm");
    const fd = new FormData(form);
    await buildBoardPDF({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      location: fd.get("location"),
      vision: fd.get("vision"),
    });
    showToast("Board downloaded");
  } catch (err) {
    console.error(err);
    showToast("Unable to build PDF — please try again");
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
});

/* ── Send My Board form ──────────────────────────────────── */
document.getElementById("sendForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  if (!form.reportValidity()) return;
  const fd = new FormData(form);
  const data = {
    name: (fd.get("name") || "").trim(),
    email: (fd.get("email") || "").trim(),
    phone: (fd.get("phone") || "").trim(),
    location: (fd.get("location") || "").trim(),
    vision: (fd.get("vision") || "").trim(),
  };
  const saved = getSaved();
  const directions = saved.map((s, i) => {
    const w = WORLDS.find(x => x.id === s.id);
    if (!w) return "";
    const note = (s.note || "").trim();
    return `${String(i+1).padStart(2,"0")}. ${w.name}\n   ${w.mood}\n   Materials: ${w.materials.map(m=>m.name).join(", ")}${note ? `\n   Notes: ${note}` : ""}`;
  }).filter(Boolean).join("\n\n");

  const subject = `Direction Board from ${data.name || "a future client"} — ${saved.length} ${saved.length===1?"direction":"directions"}`;
  const body =
`Hello Cutting Edge studio,

I curated a direction board for our project. Here are my selections:

${directions}

— PROJECT BRIEF —
Name:     ${data.name}
Email:    ${data.email}
Phone:    ${data.phone || "(not provided)"}
Location: ${data.location || "(not provided)"}

Vision:
${data.vision || "(not provided)"}

Sent from cuttingedgedesignfl.com / 3D Explore
`;
  const mailto = `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Also generate the PDF so they have it as a tangible asset
  try { await buildBoardPDF(data); } catch (e) { console.warn("PDF build failed", e); }

  // Open mail client
  window.location.href = mailto;

  // Show confirmation overlay
  setTimeout(() => { confirmOL.hidden = false; document.body.style.overflow = "hidden"; }, 400);
});

/* Confirmation overlay close */
confirmOL.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) {
    confirmOL.hidden = true;
    document.body.style.overflow = "";
  }
});

/* ── Init ────────────────────────────────────────────────── */
render();
