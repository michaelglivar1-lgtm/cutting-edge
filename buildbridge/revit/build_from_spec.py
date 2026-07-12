"""pyRevit script: build massing from a Building Spec in ONE batched pass.

Run from Revit via pyRevit (free: github.com/pyrevitlabs/pyRevit).
Creates levels, structural grids, and the exterior wall loop of the massed
bar inside a single transaction — all-or-nothing, no half-built models.

v0.1 scope: levels, grids, exterior walls. Guestroom partitions, cores,
doors, and sheets are the next increments; each stays a pure function of
the spec so the model remains reproducible.
"""

import json
import sys

# pyRevit / Revit API imports — resolved when run inside Revit.
from pyrevit import forms, revit
from Autodesk.Revit.DB import (
    Line, Transaction, Wall, XYZ, Level, Grid,
)

sys.path.append(__file__.rsplit("\\", 2)[0])  # buildbridge/ on the path
from buildbridge.spec import load_spec
from buildbridge.calc.massing import hotel_massing


def build(doc, spec):
    massing = hotel_massing(spec)
    if not massing["fits"]:
        forms.alert(massing["fit_problem"], exitscript=True)
    if not massing.get("height_ok", True):
        forms.alert(massing["height_problem"], exitscript=True)

    program = spec["program"]
    length = massing["bar_length_ft"]
    width = massing["bar_width_ft"]
    bay = program["guestroom_bay_width_ft"]

    with Transaction(doc, "BuildBridge: massing from spec") as tx:
        tx.Start()

        # Levels
        elevation = 0.0
        levels = []
        for floor in range(program["floors"] + 1):  # +1 = roof level
            level = Level.Create(doc, elevation)
            level.Name = "BB Roof" if floor == program["floors"] else f"BB Level {floor + 1}"
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

    return massing


if __name__ == "__main__":
    spec_path = forms.pick_file(file_ext="json", title="Pick a Building Spec")
    if spec_path:
        result = build(revit.doc, load_spec(spec_path))
        forms.alert(
            "Built {keys_requested}-key massing: {bar_length_ft} ft x "
            "{bar_width_ft} ft x {floors} floors "
            "({gross_area_sf:,} gross sf).".format(**result)
        )
