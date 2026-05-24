/* ───────────────────────────────────────────────────────────
   Shared design-world catalog used by /3d-explore and /saved.
   Drop a Matterport / Kuula URL in `walkthrough` to enable the
   iframe in the walkthrough lightbox.
   ─────────────────────────────────────────────────────────── */

window.CE_WORLDS = [
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    mood: "White plaster, polished concrete, and a single horizontal flame.",
    palette: { hero: "#9a9690", glow: "rgba(220,220,215,0.10)" },
    materials: [
      { name: "Polished concrete", color: "#9a9690" },
      { name: "White plaster",     color: "#efe9dc" },
      { name: "Matte black steel", color: "#171717" },
      { name: "Bone leather",      color: "#dfd6c5" },
    ],
    walkthrough: null,
  },
  {
    id: "warm-modern",
    name: "Warm Modern",
    mood: "Walnut, raw bronze, and golden-hour canyon light.",
    palette: { hero: "#a87d4a", glow: "rgba(193,154,75,0.18)" },
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
    palette: { hero: "#7daab8", glow: "rgba(125,170,184,0.16)" },
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
    palette: { hero: "#c8b89c", glow: "rgba(200,184,156,0.14)" },
    materials: [
      { name: "Bone plaster",   color: "#e3d8c5" },
      { name: "Oatmeal boucle", color: "#cab9a2" },
      { name: "Microcement",    color: "#a59c8a" },
      { name: "Hidden steel",   color: "#2a2924" },
    ],
    walkthrough: null,
  },
  {
    id: "mediterranean-estate",
    name: "Mediterranean Estate",
    mood: "Lime plaster, terracotta, and a stone fireplace carved by hand.",
    palette: { hero: "#a8552d", glow: "rgba(168,85,45,0.18)" },
    materials: [
      { name: "Lime plaster", color: "#efe4d1" },
      { name: "Terracotta",   color: "#a8552d" },
      { name: "Cedar beam",   color: "#5a3b21" },
      { name: "Wrought iron", color: "#1d1a14" },
    ],
    walkthrough: null,
  },
  {
    id: "tuscan-european",
    name: "Tuscan European",
    mood: "Cotto tile, cypress beams, and a fire burning in cracked stone.",
    palette: { hero: "#b06b3d", glow: "rgba(176,107,61,0.18)" },
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
    palette: { hero: "#8a4a2b", glow: "rgba(138,74,43,0.16)" },
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
    palette: { hero: "#b89653", glow: "rgba(184,150,83,0.16)" },
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
    palette: { hero: "#7d9aa5", glow: "rgba(125,154,165,0.14)" },
    materials: [
      { name: "Whitewashed oak", color: "#d4c8b3" },
      { name: "Driftwood gray",  color: "#8a847b" },
      { name: "Linen",           color: "#ece5d4" },
      { name: "Sea glass blue",  color: "#7d9aa5" },
    ],
    walkthrough: null,
  },
];

window.CE_ASSET_BASE = "assets/worlds";
window.CE_SAVE_KEY   = "cuttingedge:savedDirections";  // upgraded to plural for multi-save
window.CE_LEGACY_KEY = "cuttingedge:savedDirection";   // migrate from old single-save
