# BuildBridge — Windows + Revit Setup

You need three free installs, then one prompt pasted into Claude.

## One-time installs (15 minutes)

1. **Python 3** — https://www.python.org/downloads/windows/
   During install, CHECK THE BOX "Add python.exe to PATH".
2. **Git for Windows** — https://git-scm.com/download/win (accept all defaults).
3. **pyRevit** — https://github.com/pyrevitlabs/pyRevit/releases (latest installer).
   After installing, open Revit once; a "pyRevit" tab should appear.
4. **Claude Code for Windows** — https://claude.com/claude-code (so Claude can
   run these steps for you instead of you typing commands).

## Get the code

Open "Command Prompt" and run:

    git clone -b claude/new-session-7gugtn https://github.com/michaelglivar1-lgtm/cutting-edge.git
    cd cutting-edge\buildbridge

(No Git? Download the ZIP instead:
https://github.com/michaelglivar1-lgtm/cutting-edge/archive/refs/heads/claude/new-session-7gugtn.zip
and unzip it.)

## Verify it works (no Revit needed yet)

    python -m unittest discover tests
    python demo.py examples\hotel_120key.json

Expected: "OK" after 10 tests, then a massing + egress report for a
120-key hotel.

## First live data pull

    python -m buildbridge.sitedata.fema 26.7153 -80.0534

Expected: a JSON answer with a FEMA flood zone. Swap in your real parcel's
latitude/longitude.

## Run it in Revit

1. Open Revit with a new empty project (metric or imperial template).
2. pyRevit tab -> pyRevit menu -> "Run Script" (or add a custom button).
3. Pick `revit\build_from_spec.py`, then pick `examples\hotel_120key.json`.
4. Expected: levels, grids, and the exterior wall loop of a 260 ft x 66 ft,
   5-story bar appear in one shot.

If anything errors, copy the EXACT error text back into Claude — that
feedback drives the next version.
