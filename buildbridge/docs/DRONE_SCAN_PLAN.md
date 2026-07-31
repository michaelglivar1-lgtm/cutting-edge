# Drone Site-Scan Add-On — How It Would Work

Separate track from BuildBridge core. Nothing here blocks the hotel pipeline;
this is the plan for when you're ready to add site scanning to feasibility
packages.

## What it produces

From one 20–40 minute drone flight over a parcel:

1. **Orthomosaic** — a single, survey-accurate top-down photo of the whole
   site (like Google Maps, but yours, current, and sharp).
2. **Digital elevation model** — the actual terrain heights, revealing
   drainage, low spots, and fill needs before anyone quotes earthwork.
3. **Textured 3D mesh / point cloud** — the site as a 3D model you can drop
   your Revit massing into.
4. **Gaussian splat (optional)** — a photoreal, walkable 3D capture for
   client presentations; repeat flights make a progress time-lapse.

## Legal first (non-negotiable)

- Commercial drone flight requires an **FAA Part 107 Remote Pilot
  Certificate**: ~$175 test fee, 2–3 weeks of study, no flight hours needed.
- Register the drone ($5, FAA DroneZone), respect airspace (check the free
  B4UFLY/Aloft app), max 400 ft AGL, daylight, visual line of sight.
- South Florida caution: much of the coast is controlled airspace (PBI,
  FLL, MIA) — LAANC authorization through the app is usually instant.

## Equipment

- **Drone:** DJI Mini 4 Pro (~$1,000) is enough to start; a Mavic 3
  Enterprise (~$3,500) adds a mechanical shutter for better mapping.
  Total startup incl. batteries/SD/case: **$1,300–$4,500.**
- **PC:** WebODM wants 16 GB+ RAM (32 GB comfortable); OpenSplat wants an
  NVIDIA GPU. A capable used workstation is ~$800 if the Revit PC can't.

## Software (all free, all on GitHub)

- **WebODM** (github.com/OpenDroneMap/WebODM) — browser interface over
  OpenDroneMap; installs on Windows via Docker. Photos in → orthomosaic,
  elevation model, 3D mesh out.
- **OpenSplat** (github.com/pierotofy/OpenSplat) — the photoreal splat
  layer, fed by the same photos.
- Flight planning: DJI's own automated mapping missions, or free apps
  (e.g. Drone Link / DJI Waypoints) flying a lawnmower grid with 75%
  photo overlap.

## Workflow per site

1. Plan the grid flight (10 min) → fly it (20–40 min, ~150–400 photos).
2. Load photos into WebODM, start processing (1–4 hours, unattended).
3. Export orthomosaic + elevation model; run OpenSplat if the client
   presentation warrants it.
4. Drop the outputs into the feasibility study: massing model on real
   terrain, drainage flags, and a link to the 3D walkthrough.

## The money

- Standalone drone-mapping services bill **$500–$2,500 per site**; your
  cost after the gear is batteries and an afternoon.
- Bundled, it turns a feasibility PDF into "here is your parcel in 3D with
  your hotel standing on it" — the demo that closes hotel work.
- Repeat-flight progress documentation on active jobs is a monthly
  recurring line item GCs already get asked for.

## Order of operations

Get BuildBridge validated on the real hotel parcel FIRST. Then: Part 107
study while WebODM processes test flights of your own current job sites.
First paid scan inside 60 days of starting is realistic.
