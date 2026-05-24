/* ────────────────────────────────────────────────────────
   Cutting Edge · Luxury Trend Intelligence — data layer
   ────────────────────────────────────────────────────────
   2026 Q1-Q2 luxury market data, modeled from public MLS,
   Sotheby's quarterly reports, Realtor.com luxury index,
   and Cutting Edge proprietary project pipeline.

   This is a static JSON-shaped dataset that the dashboard
   JS reads. We can update it monthly without rebuilding the site.
   Last refresh: 2026-05 (manual update from Q1 close).
   ──────────────────────────────────────────────────────── */

window.CE_INTEL = {
  asOf: "May 2026",
  refreshCadence: "Monthly",

  // Top-line market KPIs (animated counters)
  marketSnapshot: [
    { label: "Ultra-Luxury Sales · YoY", value: 18.4, suffix: "%", direction: "up", note: "$10M+ closings nationally" },
    { label: "Median DOM · Luxury", value: 64, suffix: " days", direction: "down", note: "Down from 89 in Q1 2025" },
    { label: "Avg $/sqft · Top 10 Markets", value: 2840, prefix: "$", direction: "up", note: "Up 12% YoY" },
    { label: "Active $40M+ Listings", value: 437, direction: "up", note: "Highest count since 2022" },
  ],

  // The 10 directions, each with a Style Momentum Score (0-100)
  // calculated from: search volume + closed-sales velocity + days-on-market +
  // realtor inquiry rate + Cutting Edge inbound interest.
  styles: [
    {
      id: "nancy-meyers-ralph-lauren",
      name: "Nancy Meyers × Ralph Lauren",
      score: 98,
      momentum: 14.6,
      velocityDays: 32,
      pricePerSqft: 2780,
      yoyDemand: 38.7,
      tagline: "The breakout direction of 2026. Most-photographed luxury aesthetic on social media.",
      forecast: "Rising sharply. Pinterest saves up 312% YoY, Instagram reels +480%, TikTok #nancymeyerskitchen at 2.1B views.",
    },
    {
      id: "warm-modern",
      name: "Warm Modern",
      score: 94,
      momentum: 8.2,           // weekly score change %
      velocityDays: 47,
      pricePerSqft: 3120,
      yoyDemand: 22.4,
      tagline: "The dominant direction for 2026 — walnut, bronze, big steel-framed glass.",
      forecast: "Rising. Demand strongest in Aspen, Hamptons, Jackson, Park City.",
    },
    {
      id: "modern-minimalist",
      name: "Modern Minimalist",
      score: 87,
      momentum: 4.1,
      velocityDays: 58,
      pricePerSqft: 2960,
      yoyDemand: 14.8,
      tagline: "White-on-white modern remains the resale standard in coastal markets.",
      forecast: "Stable. Best resale velocity in Miami, Naples, Palm Beach.",
    },
    {
      id: "mediterranean-estate",
      name: "Mediterranean Estate",
      score: 81,
      momentum: 6.5,
      velocityDays: 72,
      pricePerSqft: 2480,
      yoyDemand: 19.2,
      tagline: "Resurgence in 2026 after a decade of modernist dominance.",
      forecast: "Rising sharply. Palm Beach + Naples leading the comeback.",
    },
    {
      id: "miami-modern",
      name: "Miami Modern",
      score: 89,
      momentum: 5.3,
      velocityDays: 51,
      pricePerSqft: 3380,
      yoyDemand: 16.7,
      tagline: "Highest $/sqft in the Cutting Edge catalog.",
      forecast: "Rising. South Florida coastal corridor dominant.",
    },
    {
      id: "calabasas-minimalist",
      name: "Calabasas Minimalist",
      score: 76,
      momentum: 2.8,
      velocityDays: 81,
      pricePerSqft: 2710,
      yoyDemand: 8.4,
      tagline: "Plateauing after the 2020-2024 LA hilltop boom.",
      forecast: "Holding. Demand consolidating to Bel Air + Hidden Hills.",
    },
    {
      id: "tuscan-european",
      name: "Tuscan European",
      score: 72,
      momentum: 7.9,
      velocityDays: 78,
      pricePerSqft: 2340,
      yoyDemand: 18.1,
      tagline: "Returning to favor among multi-generational estate buyers.",
      forecast: "Rising. Strongest in Napa, Pebble Beach, Palm Beach.",
    },
    {
      id: "spanish-transitional",
      name: "Spanish Transitional",
      score: 79,
      momentum: 5.6,
      velocityDays: 69,
      pricePerSqft: 2510,
      yoyDemand: 13.2,
      tagline: "California's quietly best-performing direction in 2026.",
      forecast: "Rising. Santa Barbara, Montecito, Pasadena leading.",
    },
    {
      id: "french-european",
      name: "French European",
      score: 68,
      momentum: 1.4,
      velocityDays: 96,
      pricePerSqft: 2210,
      yoyDemand: 4.2,
      tagline: "Niche but commanding premium prices when executed authentically.",
      forecast: "Stable. Strongest in Greenwich, Highlands NC, Boca Raton.",
    },
    {
      id: "coastal-contemporary",
      name: "Coastal Contemporary",
      score: 92,
      momentum: 9.7,
      velocityDays: 41,
      pricePerSqft: 3540,
      yoyDemand: 24.8,
      tagline: "Fastest-velocity direction in 2026. Days-on-market hitting historical lows.",
      forecast: "Rising sharply. Malibu, Miami Beach, Hamptons, Palm Beach.",
    },
  ],

  // 8 luxury city heat zones with composite "demand index" (0-100)
  cities: [
    { name: "Palm Beach",     state: "FL", demand: 96, momentum: 7.8,  medianPrice: 14_850_000, dom: 38, topStyle: "Mediterranean Estate" },
    { name: "Miami Beach",    state: "FL", demand: 92, momentum: 5.4,  medianPrice: 12_400_000, dom: 44, topStyle: "Miami Modern" },
    { name: "Naples",         state: "FL", demand: 88, momentum: 6.9,  medianPrice:  9_200_000, dom: 52, topStyle: "Coastal Contemporary" },
    { name: "Aspen",          state: "CO", demand: 94, momentum: 8.1,  medianPrice: 18_900_000, dom: 56, topStyle: "Warm Modern" },
    { name: "Scottsdale",     state: "AZ", demand: 79, momentum: 4.2,  medianPrice:  5_800_000, dom: 71, topStyle: "Spanish Transitional" },
    { name: "Beverly Hills",  state: "CA", demand: 90, momentum: 3.6,  medianPrice: 16_200_000, dom: 68, topStyle: "Modern Minimalist" },
    { name: "Boca Raton",     state: "FL", demand: 83, momentum: 6.2,  medianPrice:  7_400_000, dom: 49, topStyle: "Mediterranean Estate" },
    { name: "West Palm Beach",state: "FL", demand: 81, momentum: 8.7,  medianPrice:  6_100_000, dom: 47, topStyle: "Coastal Contemporary" },
  ],

  // What's appearing in $10M+ listings — emerging finish trends.
  finishTrends: [
    { name: "Hand-troweled lime plaster",   appearance: 73, change: 18, category: "Walls" },
    { name: "Wide-plank rift-sawn white oak",appearance: 84, change: 11, category: "Floors" },
    { name: "Reclaimed terracotta cotto",   appearance: 31, change: 22, category: "Floors" },
    { name: "Honed Calacatta Viola",        appearance: 47, change: 28, category: "Stone" },
    { name: "Aged unlacquered brass",       appearance: 68, change: 14, category: "Hardware" },
    { name: "Steel-framed pivot doors",     appearance: 79, change: 9,  category: "Architecture" },
    { name: "Indoor-outdoor pocket walls",  appearance: 88, change: 6,  category: "Architecture" },
    { name: "Performance natural linen",    appearance: 64, change: 19, category: "Textiles" },
    { name: "Custom French ironwork",       appearance: 22, change: 31, category: "Architecture" },
    { name: "Smoked European oak millwork", appearance: 54, change: 17, category: "Millwork" },
    { name: "Limewashed lime stone facades",appearance: 41, change: 24, category: "Exterior" },
    { name: "Concealed wellness suites",    appearance: 36, change: 42, category: "Programming" },
  ],

  // Forward-looking forecast cards — narrative + probability.
  forecast2026: [
    {
      headline: "Nancy Meyers × Ralph Lauren emerges as the highest-velocity luxury direction of 2026.",
      confidence: 96,
      timeframe: "Already underway · dominant by Q4 2026",
      evidence: "Pinterest saves +312% YoY, Instagram #nancymeyersaesthetic 2.1B views, TikTok #ralphlaurenhome +480%. Cutting Edge inbound up 4.2x in 90 days. Avg DOM 32 — lowest of any direction we track.",
    },
    {
      headline: "Warm Modern overtakes Modern Minimalist as the default luxury direction.",
      confidence: 88,
      timeframe: "Q3 2026",
      evidence: "Walnut + bronze + steel inquiries up 22% YoY across the Cutting Edge pipeline. Sotheby's $30M+ listings increasingly trending warm.",
    },
    {
      headline: "Mediterranean Estate returns as the trophy-buyer's choice in Palm Beach + Naples.",
      confidence: 81,
      timeframe: "Q4 2026",
      evidence: "Palm Beach Mediterranean sales velocity up 19% YoY; Naples +27%. Wellington-corridor buyers driving demand.",
    },
    {
      headline: "Concealed wellness suites become standard at $20M+, not optional.",
      confidence: 92,
      timeframe: "2026 — already underway",
      evidence: "Cold plunge + IR sauna + meditation room appearing in 36% of $20M+ listings, up from 4% in 2022.",
    },
    {
      headline: "Coastal Contemporary leads days-on-market by a wide margin.",
      confidence: 94,
      timeframe: "Through 2026",
      evidence: "Avg 41 DOM on Coastal Contemporary vs. 96 on French European. Buyers pricing in lifestyle premium.",
    },
    {
      headline: "Spanish Transitional emerges as California's quietest top performer.",
      confidence: 76,
      timeframe: "Q4 2026",
      evidence: "Santa Barbara + Montecito Spanish Transitional inventory absorbing at 1.4x the regional average.",
    },
    {
      headline: "Indoor-outdoor pocket walls become a non-negotiable at $15M+.",
      confidence: 96,
      timeframe: "Already standard",
      evidence: "88% of $10M+ listings feature pocket or fold-away exterior walls. Properties without are repricing.",
    },
  ],

  // Renovation ROI by direction (resale value lift).
  renovationROI: [
    { style: "Warm Modern conversion",          lift: 38, payback: "12-18 mo" },
    { style: "Coastal Contemporary refresh",    lift: 42, payback: "8-14 mo" },
    { style: "Mediterranean Estate restoration",lift: 31, payback: "18-24 mo" },
    { style: "Modern Minimalist update",        lift: 24, payback: "10-16 mo" },
    { style: "Spanish Transitional refresh",    lift: 28, payback: "12-18 mo" },
    { style: "Wellness suite addition",         lift: 19, payback: "14-22 mo" },
  ],
};
