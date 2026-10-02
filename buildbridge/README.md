# BuildBridge

Text → validated Building Spec → deterministic Revit model.

The core idea: **Claude never places a wall.** The AI produces and revises a
single structured spec file; tested, deterministic code does everything else.
Same spec in, same building out, every time.

```
VOICE / TEXT (Claude)
   ↓ writes / revises
BUILDING SPEC  (spec/*.json — the single source of truth)
   ↓
SITE DATA      (buildbridge/sitedata) — FEMA flood zone, county parcel/zoning
   ↓
CALCULATORS    (buildbridge/calc) — buildable envelope, hotel massing, egress
   ↓
GENERATOR      (revit/build_from_spec.py, pyRevit) — builds the model in one pass
   ↓
COMPLIANCE REPORT → engineer of record reviews, refines, stamps
```

## What exists today

| Module | Status | Runs where |
|---|---|---|
| `schema/building_spec.schema.json` | v0.1 spec contract | anywhere |
| `buildbridge/spec.py` | spec loader + validation | anywhere |
| `buildbridge/sitedata/fema.py` | FEMA NFHL flood zone by lat/lon | your machine (needs internet) |
| `buildbridge/sitedata/parcel.py` | county ArcGIS parcel query (Palm Beach preset) | your machine (needs internet) |
| `buildbridge/calc/massing.py` | setback envelope + double-loaded hotel massing | anywhere |
| `buildbridge/calc/egress.py` | occupant load / exit width / travel-distance checks | anywhere |
| `revit/build_from_spec.py` | pyRevit script: spec → levels, grids, exterior walls | inside Revit via pyRevit |
| `tests/` | unit tests for the pure-math modules | anywhere |

## Quickstart (your machine)

```bash
cd buildbridge
python3 -m pip install requests          # only dependency, fetchers only
python3 -m unittest discover tests       # run the math tests
python3 -m buildbridge.sitedata.fema 26.7153 -80.0534   # flood zone lookup
python3 demo.py examples/hotel_120key.json               # spec → massing + egress report
```

To build in Revit: install [pyRevit](https://github.com/pyrevitlabs/pyRevit) (free),
then run `revit/build_from_spec.py` from the pyRevit tab with a spec file path.

## Non-negotiable rules

1. **No LLM-invented numbers.** Every code value lives in a reviewed constants
   table with a citation. Constants marked `VERIFY` must be confirmed against
   the adopted code edition by a licensed professional before any deliverable.
2. **Validate before generate.** A spec that fails validation never reaches Revit.
3. **The engineer of record is in responsible charge.** BuildBridge output is a
   basis-of-design package, not a stamped design.

## Roadmap

- [ ] NEC Art. 220 electrical load calculator (constants entered with engineer, not from memory)
- [ ] FBC-P fixture count calculator (public areas)
- [ ] Zoning rules tables per municipality (setbacks/height/FAR/parking)
- [ ] Guestroom-mix interior layout generator
- [ ] Grasshopper / Rhino.Inside geometry backend (if pyRevit batching hits limits)
- [ ] Compliance report generator (PDF)
