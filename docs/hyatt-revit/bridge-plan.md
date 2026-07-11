# Revit Automation Bridge — Engineering Plan

In-house extension of the Apache-2.0 `bimwright/rvt-mcp` fork: a Claude→Revit write bridge plus a reusable family/module library, aimed at select-service hotel work (Hyatt Place prototype first).

## 1. Current state (from prior session)
- **Add-in** (`%APPDATA%\Autodesk\Revit\Addins\2027\RvtMcp\`): token-secured named pipe; ~216 commands (create_wall/floor/level/room, doors/windows, views, schedules, sheets). Added: `create_roof`, `save_as`, `set_view_display_style`. **Disabled**: delete tools + arbitrary-code execution. Warning-suppressor on.
- **MCP server**: `C:\Users\michaelglivar\RevitAI\dist\server\RvtMcp.Server.exe` (args `--target 2027`).
- **Concept model**: `Hyatt_Concept.rvt` — massing boxes only, no family library.
- **Real BASE4 model**: PDFs on-machine; editable `.rvt` in Google Drive (see `windows-setup.md`).

## 2. Design principles
1. **Read before write, always.** Every write command has a paired query (count/list/get) so scripts verify state before and after. No blind mutation.
2. **Idempotency + transactions.** Each logical operation wraps a single Revit transaction with a descriptive name; re-running a script should converge, not duplicate. Guard creates with an existence check keyed on a stable identity (level name, grid intersection, room number).
3. **Safety rails stay on.** Keep delete + arbitrary-code disabled. Any destructive capability, if ever needed, goes behind an explicit allow-list + dry-run that reports what *would* change before doing it.
4. **Deterministic units.** Fix on internal feet; every command validates and echoes units. Never infer.
5. **Apache-2.0 hygiene.** Preserve upstream `LICENSE` + `NOTICE`, keep attribution to `bimwright/rvt-mcp`, and record our modifications in a `CHANGES`/`NOTICE` addendum. Our family library and modules are our own IP layered on top.
6. **Audit trail.** Every write returns the created ElementIds + a one-line summary; the server logs command → result so a run is reproducible and reviewable.

## 3. Family / module library taxonomy
Organize as parametric, catalog-driven Revit families + higher-level "modules" (assemblies the bridge places as a unit). Proposed structure on disk:

```
RevitAI/library/
  families/
    core/            stairs, elevator shafts, MEP chases
    envelope/        exterior wall types, curtain wall panels, storefront, EIFS/stucco assemblies
    guestroom/       king, double-queen, ADA king, ADA double, corner suite
    circulation/     double-loaded corridor segment, elevator lobby
    amenity/         porte-cochère, pool structure, tiki bar/grill canopy, rooftop deck railing/parapet
    parking/         precast double-tee bay, ramp module, garage stair/elevator core, façade screen
    site/            landscape mangrove proxy, boardwalk, drop-off drive
  modules/           JSON/param definitions the bridge assembles from families
  catalogs/          type catalogs (.txt) for parametric families
```

**Guestroom module (the workhorse):** a parametric room bundle — wall lines, door, window, bathroom pod, room object with number — placed by grid coordinate. Hyatt Place prototype guestroom is ~13'–14' wide × ~25'–30' deep; drive width/depth/handedness from a type catalog so one module yields king/double/ADA variants. 114 rooms across 4 floors → the 5th-floor concept adds ~28–30 more.

**Corridor + core modules** snap guestroom bands to a double-loaded corridor with stair/elevator cores at code-required travel distances.

**Rooftop amenity module:** floor slab as roof deck, parapet/railing, pool basin (floor + walls as a depressed slab), tiki bar canopy family, equipment screen — placed on Level 5 (concept).

**Parking garage module:** precast double-tee bay tiled to the 240'×240' footprint, ramp module, 4 levels via `create_level` + slab per level, perimeter screen façade. Kept as a separate model / linked file so it doesn't bloat the hotel model.

## 4. New/hardened commands to add (priority order)
| Priority | Command | Purpose |
|---|---|---|
| P0 | `place_family_instance` (by family+type+location, with existence guard) | foundation for every module |
| P0 | `list_levels` / `ensure_level(name, elev)` | idempotent level creation for the 5th floor + garage levels |
| P0 | `place_guestroom_module` | tile the guestroom bands from the catalog |
| P1 | `create_curtain_wall` / `place_storefront` | the floor-to-ceiling glazing that defines the look |
| P1 | `place_amenity(pool/tiki/deck)` | rooftop + rear pools |
| P1 | `link_model` / `place_garage` | garage as a linked file |
| P2 | `create_sheet_set` + `place_views` | auto-generate concept sheets for review |
| P2 | `export(pdf/nwc/ifc)` | shareable deliverables |
| P2 | `tag_and_schedule(rooms/doors)` | QA + area takeoff to check the ~72,000 sf target |

Each ships with: input schema, a read-only companion query, a dry-run mode, and a golden-file test.

## 5. Testing / verification harness
- **Fixture model**: a tiny blank `.rvt` seeded with 2 levels + 2 grids, checked into the repo's test assets.
- **Golden runs**: each command has a scripted run whose expected output (element counts, ids-normalized) is snapshotted; CI-style comparison flags drift.
- **Round-trip check**: create → list → assert count delta == expected → (optional) undo via transaction rollback in test mode.
- **Never test against the real BASE4 model.** Work on a `save_as` copy; the original stays untouched.

## 6. Versioning & deployment
- Semantic-versioned add-in + server; the version is reported by a `ping`/`version` command so Claude can assert compatibility before running a script.
- Deploy add-in via a build step that stamps the manifest into `%APPDATA%\...\Addins\2027\RvtMcp\`; keep a `2026`/`2028` target matrix as Revit versions roll.
- Config (pipe token, target year, library path) in one file; never hard-code the token.

## 7. Immediate next actions
1. **On Windows**: complete `windows-setup.md` Steps 1–3 so the bridge is live against the real model.
2. Run a **read-only inventory** on the BASE4 model: levels, grids, wall/room/door counts, total area — this becomes the ground truth the concept edits build on.
3. Stand up `library/` and author the **guestroom module** first (highest leverage), driven by a type catalog.
4. Implement **`ensure_level` + `place_family_instance`** with existence guards — the two P0 primitives everything else composes from.
5. Prototype the **5th-floor + rooftop amenity** on a `save_as` copy, render from the model, and cross-check against the ChatGPT concept images.
