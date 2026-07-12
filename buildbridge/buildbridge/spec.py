"""Building Spec loader and validator.

Zero-dependency validation of the fields the calculators and the Revit
generator actually rely on. A spec that fails here must never reach Revit.
"""

import json


class SpecError(ValueError):
    """Raised with a plain-English list of problems found in a spec."""


PROGRAM_DEFAULTS = {
    "guestroom_bay_width_ft": 13.0,
    "guestroom_depth_ft": 30.0,
    "corridor_width_ft": 6.0,
    "floor_to_floor_ft": 10.5,
    "ground_floor_to_floor_ft": 14.0,
    "ground_floor_amenity": True,
}


def load_spec(path):
    with open(path) as f:
        spec = json.load(f)
    problems = validate(spec)
    if problems:
        raise SpecError("Spec is not buildable:\n- " + "\n- ".join(problems))
    program = spec["program"]
    for key, value in PROGRAM_DEFAULTS.items():
        program.setdefault(key, value)
    spec["project"].setdefault("sprinklered", True)
    return spec


def validate(spec):
    problems = []

    def require(section, field, kind, positive=False):
        value = spec.get(section, {}).get(field)
        if value is None:
            problems.append(f"{section}.{field} is missing")
            return None
        if not isinstance(value, kind) or isinstance(value, bool) and kind is not bool:
            problems.append(f"{section}.{field} must be {kind.__name__}, got {type(value).__name__}")
            return None
        if positive and value <= 0:
            problems.append(f"{section}.{field} must be greater than zero, got {value}")
            return None
        return value

    for section in ("project", "site", "program"):
        if not isinstance(spec.get(section), dict):
            problems.append(f"top-level '{section}' section is missing")
    if problems:
        return problems

    if spec["project"].get("building_type") != "hotel":
        problems.append("project.building_type: only 'hotel' is supported in v0.1")

    require("site", "parcel_width_ft", (int, float), positive=True)
    require("site", "parcel_depth_ft", (int, float), positive=True)

    setbacks = spec["site"].get("setbacks_ft")
    if not isinstance(setbacks, dict):
        problems.append("site.setbacks_ft is missing")
    else:
        for side in ("front", "rear", "side_left", "side_right"):
            value = setbacks.get(side)
            if not isinstance(value, (int, float)) or value < 0:
                problems.append(f"site.setbacks_ft.{side} must be a number >= 0")

    require("program", "keys", int, positive=True)
    require("program", "floors", int, positive=True)

    return problems
