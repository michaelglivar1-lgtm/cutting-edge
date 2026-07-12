"""Run the non-Revit half of the pipeline on a spec and print the report.

    python3 demo.py examples/hotel_120key.json
"""

import json
import sys

from buildbridge.spec import load_spec
from buildbridge.calc.massing import hotel_massing
from buildbridge.calc.egress import egress_report


def main(spec_path):
    spec = load_spec(spec_path)
    print(f"== {spec['project']['name']} ==\n")

    massing = hotel_massing(spec)
    print("MASSING")
    for key in ("envelope_width_ft", "envelope_depth_ft", "bar_length_ft",
                "bar_width_ft", "building_height_ft", "floors",
                "keys_per_room_floor", "max_keys", "keys_requested",
                "gross_area_sf"):
        print(f"  {key:24} {massing[key]:,}")
    print(f"  {'fits':24} {'YES' if massing['fits'] else 'NO — ' + massing['fit_problem']}")
    if not massing.get("height_ok", True):
        print(f"  {'height':24} {massing['height_problem']}")

    egress = egress_report(massing, spec)
    print("\nEGRESS (preliminary — all constants flagged VERIFY)")
    for key in ("occupant_load_per_floor", "required_stair_width_in",
                "required_corridor_width_in", "corridor_provided_in",
                "worst_case_travel_ft", "travel_limit_ft"):
        print(f"  {key:28} {egress[key]}")
    print(f"  {'corridor_ok':28} {'YES' if egress['corridor_ok'] else 'NO'}")
    print(f"  {'travel_ok':28} {'YES' if egress['travel_ok'] else 'NO'}")
    print(f"\n  {egress['verify_note']}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "examples/hotel_120key.json")
