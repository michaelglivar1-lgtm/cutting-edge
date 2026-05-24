/* ─────────────────────────────────────────────
   Mobile hamburger menu — auto-injects on every page.
   Adds a hamburger button to the .site-header .nav and a
   fullscreen .nav-drawer with every navigation link.
   ───────────────────────────────────────────── */
(function () {
  // Resolve correct relative paths regardless of where the page lives.
  // Pages at root: index.html, 3d-explore.html, saved.html
  // Pages at /directions/: index.html and each direction.html
  const path = window.location.pathname;
  const isDeep = /\/directions\//.test(path);
  const root = isDeep ? "../" : "";

  // Items to show in mobile drawer. Mirrors the desktop nav but always present.
  const items = [
    { href: root + "index.html", label: "Atelier" },
    { href: root + "3d-explore.html", label: "3D Explore" },
    { href: root + "directions/", label: "Nine Directions" },
    { href: root + "saved.html", label: "My Board" },
    { href: root + "index.html#process", label: "Process" },
    { href: root + "index.html#contact", label: "Begin a Project" },
  ];

  document.addEventListener("DOMContentLoaded", function () {
    const nav = document.querySelector(".site-header .nav");
    if (!nav) return;

    // Skip if a hamburger already exists (defensive).
    if (nav.querySelector(".nav-toggle")) return;

    // Build the hamburger button.
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-toggle";
    btn.setAttribute("aria-label", "Open menu");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "navDrawer");
    btn.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(btn);

    // Build the drawer (lives outside the header so it can use position:fixed cleanly).
    const drawer = document.createElement("div");
    drawer.id = "navDrawer";
    drawer.className = "nav-drawer";
    drawer.setAttribute("aria-hidden", "true");

    const close = document.createElement("button");
    close.type = "button";
    close.className = "nav-drawer-close";
    close.setAttribute("aria-label", "Close menu");
    close.textContent = "×";
    drawer.appendChild(close);

    items.forEach(function (it) {
      const a = document.createElement("a");
      a.href = it.href;
      a.textContent = it.label;
      drawer.appendChild(a);
    });

    document.body.appendChild(drawer);

    function open() {
      document.body.classList.add("nav-open");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close menu");
      drawer.setAttribute("aria-hidden", "false");
    }
    function shut() {
      document.body.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open menu");
      drawer.setAttribute("aria-hidden", "true");
    }
    btn.addEventListener("click", function () {
      if (document.body.classList.contains("nav-open")) shut(); else open();
    });
    close.addEventListener("click", shut);
    drawer.addEventListener("click", function (e) {
      if (e.target.tagName === "A") shut();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) shut();
    });
  });
})();
