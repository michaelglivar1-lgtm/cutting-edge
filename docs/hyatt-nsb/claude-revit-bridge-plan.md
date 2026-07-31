# Claude → Revit Automation Bridge — Planning Doc

Goal: let in-house engineers drive Revit from natural language via Claude — "add a 5th floor matching L4," "place the 240×240 garage grid," "tag all mangrove-side balconies" — with Claude proposing changes that a human reviews and commits inside Revit.

Status: **planning / architecture**. This continues the concept; nothing is wired to production yet.

## Architecture (recommended)

Revit's API is .NET and only runs **in-process** inside Revit, on the UI thread via the `IExternalEvent` pattern. Claude cannot call it directly. The bridge is therefore three parts:

```
Claude (LLM + tools)
        │  MCP (stdio/websocket) — structured tool calls
        ▼
MCP server  (Python or Node, runs outside Revit)
        │  local socket / named pipe (JSON commands)
        ▼
Revit listener add-in  (pyRevit routes OR a C# add-in)
        │  ExternalEvent → Revit API on the UI thread
        ▼
Revit model  (transactions, all reversible / undoable)
```

Why this shape:
- **MCP server** is the clean seam. Claude sees a fixed catalog of tools; the server validates inputs and forwards to Revit. Same server can back Claude Desktop, Claude Code, or a custom app.
- **Revit listener** does the privileged work. All model edits happen inside a `Transaction` (named, so each Claude action is a single Undo step) via `ExternalEvent.Raise()` — never block or edit off-thread.

## Two viable listener implementations

| Option | Effort | Notes |
|--------|--------|-------|
| **pyRevit routes** (recommended to start) | Low | pyRevit ships an HTTP "routes" server in-process. Expose `GET/POST` endpoints; the MCP server calls localhost. Fast iteration in Python, no compile step, easy for engineers to read/extend. |
| **C# `IExternalApplication` add-in** | Higher | Full control, best for packaged deployment and complex transactions. Use once the toolset stabilizes. |

Start on pyRevit routes to prototype the tool catalog, port hot paths to a C# add-in later if needed.

## Tool catalog (v1 — start read-heavy, add writes behind confirmation)

**Read (safe, no transaction):**
- `list_levels` → name, elevation, id
- `get_element(id)` / `query_elements(category, filter)` → params, bbox
- `get_project_info` / `get_units`
- `snapshot_view(view_id)` → export PNG for Claude to "see" the model

**Write (each = one named transaction, returns the new element ids):**
- `duplicate_level(source_level, new_name, offset)` — the "add 5th floor" primitive
- `copy_elements_to_level(ids | category, target_level)` — bring L4 walls/rooms up
- `place_grid(origin, x_count, y_count, spacing)` — garage bay grid
- `set_parameter(id, name, value)`
- `create_floor / create_wall(curve, type, level)`

Design rules:
- Every write tool returns **element ids + a one-line summary** so Claude can verify and the engineer can inspect.
- Nothing auto-saves; the engineer reviews in Revit and saves. Claude proposes, human commits.
- Wrap risky ops in a `dry_run: true` mode that reports what *would* change.

## Guardrails

- **Human-in-the-loop by default.** Write tools require an explicit confirm flag; Claude surfaces the plan first.
- **One Undo per action.** Named transactions → clean rollback.
- **Whitelist categories/params.** No deletes or family-wide edits in v1.
- **Local only.** Socket bound to `127.0.0.1`; no model data leaves the machine unless the engineer opts in.
- **Audit log.** MCP server logs every tool call + result to a file per session.

## Build phases

1. **Spike (read-only):** pyRevit routes exposing `list_levels` + `snapshot_view`; minimal MCP server; prove Claude can "see" the model. *(1–2 days)*
2. **First write:** `duplicate_level` + `copy_elements_to_level` behind confirm — demo the 5th-floor add end-to-end. *(2–3 days)*
3. **Garage/grid + parameter tools;** add `dry_run`. *(week 2)*
4. **Harden:** audit log, whitelists, error surfaces; package the add-in; write the engineer runbook. *(week 3)*

## Open questions for the team

1. **Revit version(s)** in house (API differs across 2023/2024/2025)?
2. **pyRevit already deployed**, or do we standardize it as the listener runtime?
3. Preferred Claude surface for engineers — **Claude Desktop (MCP)**, Claude Code, or an internal app?
4. Scope of v1 writes — is **level duplication + grid placement** the right first target, or is there a higher-value repetitive task (sheet setup, tagging, schedule edits) to automate first?
5. Any firm standards (shared parameters, family library, naming) the tools must honor?

_Recommendation: build the read-only spike first so engineers can feel it working before we grant write access._
