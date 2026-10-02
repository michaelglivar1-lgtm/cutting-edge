#! python3
"""pyRevit script: build massing from a Building Spec in ONE batched pass.

Run from Revit via pyRevit (free: github.com/pyrevitlabs/pyRevit).
Creates levels, structural grids, and the exterior wall loop of the massed
bar inside a single transaction — all-or-nothing, no half-built models.

Modes:
  UI mode (pyRevit tab / Run Script): file-picker dialog for the spec.
  Headless mode (pyrevit run CLI):    set BB_SPEC=<path-to-spec.json>
    [optional] BB_TEMPLATE=<path.rte>   template for a new blank doc
    [optional] BB_SAVE=<path.rvt>       save the built model here

v0.1 scope: levels, grids, exterior walls. Guestroom partitions, cores,
doors, and sheets are the next increments; each stays a pure function of
the spec so the model remains reproducible.

SHAKEDOWN FIXES (first live Revit run, 2026-07-12):
  - `#! python3` shebang: the buildbridge package uses f-strings; the
    default pyRevit engine is IronPython 2.7 which cannot parse them.
  - robust package path via os.path (was a brittle backslash rsplit).
  - Transaction wrapped in try/RollBack (Revit's Transaction is not a
    Python context manager under CPython engines).
  - headless BB_SPEC/BB_TEMPLATE/BB_SAVE mode so `pyrevit run` works
    with no dialogs and no open document.
"""

import os
import sys

# --- put the buildbridge package on the path, robustly -----------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)              # .../buildbridge
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from buildbridge.spec import load_spec                       # noqa: E402
from buildbridge.calc.massing import hotel_massing           # noqa: E402

from Autodesk.Revit.DB import (                              # noqa: E402
    Line, Transaction, Wall, XYZ, Level, Grid,
)

try:                       # available in UI context; optional headless
    from pyrevit import forms
except Exception:          # pragma: no cover - headless import guard
    forms = None


def _fail(message):
    if forms is not None and os.environ.get("BB_SPEC") is None:
        forms.alert(message, exitscript=True)
    raise SystemExit("BuildBridge: " + message)


def build(doc, spec):
    massing = hotel_massing(spec)
    if not massing["fits"]:
        _fail(massing["fit_problem"])
    if not massing.get("height_ok", True):
        _fail(massing["height_problem"])

    program = spec["program"]
    length = float(massing["bar_length_ft"])
    width = float(massing["bar_width_ft"])
    bay = float(program["guestroom_bay_width_ft"])

    tx = Transaction(doc, "BuildBridge: massing from spec")
    tx.Start()
    try:
        # Levels (spec heights are feet; Revit internal length unit is feet)
        elevation = 0.0
        levels = []
        for floor in range(program["floors"] + 1):  # +1 = roof level
            level = Level.Create(doc, elevation)
            level.Name = ("BB Roof" if floor == program["floors"]
                          else "BB Level {}".format(floor + 1))
            levels.append(level)
            elevation += (
                program["ground_floor_to_floor_ft"] if floor == 0
                else program["floor_to_floor_ft"]
            )

        # Grids: one per bay along the bar, three across it
        bays = int(round(length / bay))
        for i in range(bays + 1):
            x = i * bay
            Grid.Create(doc, Line.CreateBound(XYZ(x, -5, 0), XYZ(x, width + 5, 0)))
        for y in (0.0, width / 2.0, width):
            Grid.Create(doc, Line.CreateBound(XYZ(-5, y, 0), XYZ(length + 5, y, 0)))

        # Exterior wall loop on every floor
        corners = [XYZ(0, 0, 0), XYZ(length, 0, 0),
                   XYZ(length, width, 0), XYZ(0, width, 0)]
        for floor in range(program["floors"]):
            for i, corner in enumerate(corners):
                edge = Line.CreateBound(corner, corners[(i + 1) % 4])
                Wall.Create(doc, edge, levels[floor].Id, False)

        tx.Commit()
    except Exception:
        if tx.HasStarted():
            tx.RollBack()
        raise

    return massing


def _resolve_doc():
    """Return the active doc, or (headless) a new doc from a template."""
    app = __revit__.Application                                # noqa: F821
    uidoc = getattr(__revit__, "ActiveUIDocument", None)       # noqa: F821
    doc = getattr(uidoc, "Document", None) if uidoc else None
    if doc is not None:
        return doc
    template = os.environ.get(
        "BB_TEMPLATE",
        r"C:\ProgramData\Autodesk\RVT 2027\Templates\Default_I_ENU.rte",
    )
    if not os.path.exists(template):
        _fail("No open document and template not found: " + template)
    return app.NewProjectDocument(template)


def main():
    spec_path = os.environ.get("BB_SPEC")
    headless = spec_path is not None
    if not headless:
        if forms is None:
            _fail("Run inside Revit via pyRevit, or set BB_SPEC for headless use.")
        spec_path = forms.pick_file(file_ext="json", title="Pick a Building Spec")
        if not spec_path:
            return
    spec = load_spec(spec_path)

    doc = _resolve_doc()
    result = build(doc, spec)

    save_path = os.environ.get("BB_SAVE")
    if save_path:
        from Autodesk.Revit.DB import SaveAsOptions
        opts = SaveAsOptions()
        opts.OverwriteExistingFile = True
        doc.SaveAs(save_path, opts)

    summary = ("Built {keys_requested}-key massing: {bar_length_ft} ft x "
               "{bar_width_ft} ft x {floors} floors "
               "({gross_area_sf:,} gross sf).".format(**result))
    if headless:
        print("BUILDBRIDGE OK - " + summary)
        if save_path:
            print("BUILDBRIDGE SAVED - " + save_path)
    else:
        forms.alert(summary)


main()
