/* ────────────────────────────────────────────────────────
   Cutting Edge · Luxury Trend Intelligence — render layer
   ────────────────────────────────────────────────────────
   Reads window.CE_INTEL and renders:
     - Animated KPI counters
     - Style Momentum cards with progress bars
     - City Heat Zone grid
     - Finish Trend leaderboard
     - 2026 Forecast cards with confidence dials
     - Renovation ROI table
   No external deps. Crisp, dark luxury aesthetic.
   ──────────────────────────────────────────────────────── */
(function () {
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const data = window.CE_INTEL;
    if (!data) return;

    renderTicker(data);
    renderSnapshot(data);
    renderBreakoutGallery();
    renderStyleMomentum(data);
    renderCityHeat(data);
    renderFinishTrends(data);
    renderForecast(data);
    renderROI(data);
    initObservers();
    setInterval(pulseLive, 4000);
    // Stock-style live tick: nudge KPI + ticker numbers every 2-4s
    setInterval(liveTick, 2400);
  }

  // ─── Stock-style scrolling ticker (S&P / Bloomberg style) ───
  function renderTicker(data) {
    const track = document.getElementById("intelTickerTrack");
    if (!track) return;
    // Build a long list of ticker items from styles + cities + finishes
    const items = [];
    data.styles.forEach(s => {
      const symbol = s.id.toUpperCase().replace(/-/g, "").slice(0, 6);
      items.push({
        sym: symbol,
        name: s.name,
        value: s.score,
        change: s.momentum,
        type: "score",
      });
    });
    data.cities.forEach(c => {
      const symbol = c.name.replace(/[^A-Z]/g, "").slice(0, 4) || c.name.slice(0, 4).toUpperCase();
      items.push({
        sym: symbol,
        name: c.name,
        value: c.demand,
        change: c.momentum,
        type: "demand",
      });
    });
    data.finishTrends.slice(0, 8).forEach(f => {
      const symbol = f.name.split(" ").map(w => w[0]).join("").slice(0, 5).toUpperCase();
      items.push({
        sym: symbol,
        name: f.name,
        value: f.appearance,
        change: f.change,
        type: "finish",
      });
    });
    // Duplicate the list so the marquee loops seamlessly
    const html = items.concat(items).map((it, i) => {
      const up = it.change >= 0;
      const sign = up ? "+" : "";
      return `
        <span class="intel-tick" data-tick-index="${i % items.length}">
          <span class="intel-tick-sym">${it.sym}</span>
          <span class="intel-tick-val" data-tick-val>${it.value.toFixed(1)}</span>
          <span class="intel-tick-chg ${up ? 'is-up' : 'is-down'}" data-tick-chg>${sign}${it.change.toFixed(1)}%</span>
        </span>
      `;
    }).join("");
    track.innerHTML = html;
    // Save raw values for live tick updates
    window.__intelTickerData = items;
  }

  // ─── Live tick: nudge values ±0.1-0.4 to simulate live market data ───
  function liveTick() {
    // Update ticker symbols
    if (window.__intelTickerData) {
      document.querySelectorAll(".intel-tick").forEach(tick => {
        const idx = parseInt(tick.dataset.tickIndex, 10);
        const base = window.__intelTickerData[idx];
        if (!base) return;
        // Tiny random walk
        const drift = (Math.random() - 0.5) * 0.6;
        const newVal = Math.max(1, base.value + drift);
        const newChg = base.change + (Math.random() - 0.5) * 0.4;
        const valEl = tick.querySelector("[data-tick-val]");
        const chgEl = tick.querySelector("[data-tick-chg]");
        if (valEl) {
          valEl.textContent = newVal.toFixed(1);
          flash(valEl);
        }
        if (chgEl) {
          const up = newChg >= 0;
          chgEl.textContent = (up ? "+" : "") + newChg.toFixed(1) + "%";
          chgEl.classList.toggle("is-up", up);
          chgEl.classList.toggle("is-down", !up);
        }
      });
    }
    // Nudge the 4 top KPI counters too
    document.querySelectorAll("[data-kpi-counter]").forEach(el => {
      const base = parseFloat(el.dataset.target);
      const drift = (Math.random() - 0.5) * (base * 0.003);
      const newVal = base + drift;
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const dec = parseInt(el.dataset.decimals, 10) || 0;
      el.textContent = prefix + formatNum(newVal, dec) + suffix;
      flash(el);
    });
  }
  function flash(el) {
    el.classList.remove("is-flash");
    void el.offsetWidth;
    el.classList.add("is-flash");
  }

  // ─── Breakout gallery: load data-photo into background-image ───
  function renderBreakoutGallery() {
    document.querySelectorAll(".intel-breakout-photo[data-photo]").forEach(el => {
      const path = el.dataset.photo;
      if (path) el.style.backgroundImage = `url(assets/img/${path})`;
    });
  }

  // ─── Animated counter helper ──────────────────────────
  function animateCount(el, target, opts) {
    opts = opts || {};
    const decimals = opts.decimals || 0;
    const duration = opts.duration || 1400;
    const prefix = opts.prefix || "";
    const suffix = opts.suffix || "";
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const cur = target * eased;
      el.textContent = prefix + formatNum(cur, decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + formatNum(target, decimals) + suffix;
    }
    requestAnimationFrame(tick);
  }
  function formatNum(n, dec) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(dec || 2) + "M";
    if (n >= 1000) return Math.round(n).toLocaleString();
    return n.toFixed(dec);
  }

  // ─── KPI snapshot strip ───────────────────────────────
  function renderSnapshot(data) {
    const root = document.getElementById("intelSnapshot");
    if (!root) return;
    root.innerHTML = data.marketSnapshot.map((kpi, i) => `
      <article class="intel-kpi" data-kpi-index="${i}">
        <div class="intel-kpi-eyebrow">
          <span>${kpi.label}</span>
          <span class="intel-kpi-arrow ${kpi.direction === 'up' ? 'is-up' : 'is-down'}" aria-hidden="true">
            ${kpi.direction === 'up' ? '↗' : '↘'}
          </span>
        </div>
        <div class="intel-kpi-value" data-kpi-counter
             data-target="${kpi.value}"
             data-prefix="${kpi.prefix || ''}"
             data-suffix="${kpi.suffix || ''}"
             data-decimals="${(kpi.value % 1) ? 1 : 0}">
          ${kpi.prefix || ''}0${kpi.suffix || ''}
        </div>
        <div class="intel-kpi-note">${kpi.note}</div>
      </article>
    `).join("");
  }

  // ─── Style Momentum cards ─────────────────────────────
  function renderStyleMomentum(data) {
    const root = document.getElementById("intelStyles");
    if (!root) return;
    const sorted = [...data.styles].sort((a, b) => b.score - a.score);
    root.innerHTML = sorted.map(s => `
      <article class="intel-style-card" data-style-card="${s.id}">
        <div class="intel-style-rank">
          <span class="intel-style-score" data-counter-num data-target="${s.score}">0</span>
          <span class="intel-style-score-sub">Momentum</span>
        </div>
        <div class="intel-style-body">
          <h3 class="intel-style-name">${s.name}</h3>
          <p class="intel-style-tagline">${s.tagline}</p>
          <div class="intel-style-meter">
            <div class="intel-style-meter-fill" style="--target: ${s.score}%;"></div>
          </div>
          <dl class="intel-style-meta">
            <div><dt>YoY demand</dt><dd>+${s.yoyDemand}%</dd></div>
            <div><dt>Avg DOM</dt><dd>${s.velocityDays} days</dd></div>
            <div><dt>$/sqft</dt><dd>$${s.pricePerSqft.toLocaleString()}</dd></div>
            <div><dt>Weekly Δ</dt><dd class="${s.momentum >= 5 ? 'is-hot' : ''}">+${s.momentum}%</dd></div>
          </dl>
          <div class="intel-style-forecast">
            <span class="intel-style-forecast-label">Forecast</span>
            <span class="intel-style-forecast-text">${s.forecast}</span>
          </div>
        </div>
      </article>
    `).join("");
  }

  // ─── City Heat Zone grid ──────────────────────────────
  function renderCityHeat(data) {
    const root = document.getElementById("intelCities");
    if (!root) return;
    const sorted = [...data.cities].sort((a, b) => b.demand - a.demand);
    const heatColor = (d) => {
      // 70=warm amber, 100=hottest gold
      const t = Math.max(0, (d - 70) / 30);
      const r = Math.round(140 + t * 75);
      const g = Math.round(100 + t * 70);
      const b = Math.round(40 + t * 35);
      return `rgb(${r}, ${g}, ${b})`;
    };
    root.innerHTML = sorted.map(c => `
      <article class="intel-city" style="--heat: ${heatColor(c.demand)};">
        <header class="intel-city-head">
          <div>
            <div class="intel-city-state">${c.state}</div>
            <h3 class="intel-city-name">${c.name}</h3>
          </div>
          <div class="intel-city-demand">
            <span class="intel-city-demand-num" data-counter-num data-target="${c.demand}">0</span>
            <span class="intel-city-demand-label">Demand</span>
          </div>
        </header>
        <div class="intel-city-bar"><div class="intel-city-bar-fill" style="--target: ${c.demand}%;"></div></div>
        <dl class="intel-city-meta">
          <div><dt>Median price</dt><dd>$${(c.medianPrice / 1_000_000).toFixed(1)}M</dd></div>
          <div><dt>Days on market</dt><dd>${c.dom}</dd></div>
          <div><dt>Top style</dt><dd>${c.topStyle}</dd></div>
          <div><dt>Weekly Δ</dt><dd>+${c.momentum}%</dd></div>
        </dl>
      </article>
    `).join("");
  }

  // ─── Finish Trend leaderboard ─────────────────────────
  function renderFinishTrends(data) {
    const root = document.getElementById("intelFinishes");
    if (!root) return;
    const sorted = [...data.finishTrends].sort((a, b) => b.change - a.change);
    root.innerHTML = sorted.map(f => `
      <article class="intel-finish">
        <div class="intel-finish-category">${f.category}</div>
        <div class="intel-finish-name">${f.name}</div>
        <div class="intel-finish-stats">
          <div class="intel-finish-appearance">
            <div class="intel-finish-bar"><div class="intel-finish-bar-fill" style="--target: ${f.appearance}%;"></div></div>
            <span><span data-counter-num data-target="${f.appearance}">0</span>% of $10M+ listings</span>
          </div>
          <div class="intel-finish-change">+${f.change}% <span>YoY</span></div>
        </div>
      </article>
    `).join("");
  }

  // ─── 2026 Forecast cards ──────────────────────────────
  function renderForecast(data) {
    const root = document.getElementById("intelForecast");
    if (!root) return;
    root.innerHTML = data.forecast2026.map(f => `
      <article class="intel-forecast-card">
        <div class="intel-forecast-confidence">
          <svg class="intel-forecast-dial" viewBox="0 0 60 60" aria-hidden="true">
            <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(193,154,75,0.15)" stroke-width="3"/>
            <circle cx="30" cy="30" r="26" fill="none" stroke="#c19a4b" stroke-width="3"
                    stroke-dasharray="${(f.confidence / 100) * 163.36} 163.36"
                    stroke-dashoffset="0" transform="rotate(-90 30 30)" stroke-linecap="round"/>
          </svg>
          <div class="intel-forecast-confidence-num">
            <span data-counter-num data-target="${f.confidence}">0</span>%
          </div>
          <div class="intel-forecast-confidence-label">Confidence</div>
        </div>
        <div class="intel-forecast-body">
          <div class="intel-forecast-timeframe">${f.timeframe}</div>
          <h3 class="intel-forecast-headline">${f.headline}</h3>
          <p class="intel-forecast-evidence">${f.evidence}</p>
        </div>
      </article>
    `).join("");
  }

  // ─── Renovation ROI ───────────────────────────────────
  function renderROI(data) {
    const root = document.getElementById("intelROI");
    if (!root) return;
    const sorted = [...data.renovationROI].sort((a, b) => b.lift - a.lift);
    root.innerHTML = `
      <table class="intel-roi-table">
        <thead>
          <tr>
            <th>Conversion strategy</th>
            <th>Resale value lift</th>
            <th>Typical payback</th>
            <th>Lift visualization</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(r => `
            <tr>
              <td class="intel-roi-strategy">${r.style}</td>
              <td class="intel-roi-lift">+${r.lift}%</td>
              <td class="intel-roi-payback">${r.payback}</td>
              <td><div class="intel-roi-bar"><div class="intel-roi-bar-fill" style="--target: ${r.lift * 2}%;"></div></div></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // ─── IntersectionObserver to trigger animations on scroll ─
  function initObservers() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        // Counter animations
        if (el.matches("[data-kpi-counter]")) {
          animateCount(el, parseFloat(el.dataset.target), {
            prefix: el.dataset.prefix,
            suffix: el.dataset.suffix,
            decimals: parseInt(el.dataset.decimals, 10) || 0,
          });
        } else if (el.matches("[data-counter-num]")) {
          animateCount(el, parseFloat(el.dataset.target), {});
        }
        // Bar fills via CSS var (triggered by class)
        el.classList.add("is-revealed");
        io.unobserve(el);
      });
    }, { threshold: 0.2 });

    document.querySelectorAll(
      "[data-kpi-counter], [data-counter-num], .intel-style-meter-fill, .intel-city-bar-fill, .intel-finish-bar-fill, .intel-roi-bar-fill"
    ).forEach(el => io.observe(el));
  }

  // ─── Live ticker pulse ────────────────────────────────
  function pulseLive() {
    document.querySelectorAll(".intel-live-dot").forEach(d => {
      d.classList.remove("is-pulse");
      void d.offsetWidth;
      d.classList.add("is-pulse");
    });
  }
})();
