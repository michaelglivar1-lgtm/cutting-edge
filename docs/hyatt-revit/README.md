# Hyatt Place – New Smyrna Beach — Concept + Revit Automation Bridge

Working notes and deliverables for the Hyatt Place concept at **429 E. 3rd Ave, New Smyrna Beach, FL** (9.5-acre PUD, parcel 3798066).

## Approved design (BASE4)
- 4 stories, 114 rooms, ~72,000 sf, ~40 ft, Type IIB, R-1, fully sprinklered (2020 FBC)
- Owner: Lagoon Hospitality / Waterview NSB · Architect: BASE4 · Civil: Florida Engineering Group · Survey: Abel Surveying

## Concept additions (this project)
- 5th floor (keeps the Hyatt Place look)
- Public **rooftop pool + tiki bar & grill**
- Rear ground-level **mangrove-view pool**
- 4-level, **240 ft × 240 ft parking garage** on the inland (north/east) side

## Confirmed site orientation (from survey)
| Direction | Feature |
|---|---|
| **North** | E. 3rd Ave / South Causeway road (site access) |
| **West** | Indian River + causeway bridge; Callalisa Creek mangroves along west/south |
| **South** | Callalisa Creek mangroves |
| **East** | Atlantic Ocean ~1 mile away; inland side |

Sun path (~29° N): **sunrise over the Atlantic/east**, **sunset over the Indian River/west**. Golden-hour views from the rooftop face **west**.

---

## Files in this folder
- **`render-prompts.md`** — ChatGPT/image-gen prompts refined to the real parcel orientation (Step 4).
- **`bridge-plan.md`** — roadmap for the in-house Revit automation bridge + family/module library (Step 5).
- **`windows-setup.md`** — exact steps to run **on the Windows/Revit machine** for getting the model + wiring the MCP bridge (Steps 1–3).

> **Why a separate Windows doc?** These deliverables were produced in a **Claude Code web session** — an isolated Linux cloud container attached to the `cutting-edge` GitHub repo. That container has **no access** to the Windows machine, its `C:\` drive, Revit 2027, or the locally-connected Google Drive. Steps 1–3 physically require being on the Windows box, so they're written as copy-paste instructions to run there.
