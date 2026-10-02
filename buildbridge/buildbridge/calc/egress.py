"""Preliminary egress checks for R-1 (hotel) occupancies.

CONSTANTS POLICY — read before trusting any number:
Every value in CODE_CONSTANTS carries its source citation and a `verify`
flag. Values are entered from IBC 2021 / FBC 2023 (8th Ed.) provisions
commonly applicable to sprinklered R-1 buildings. They are PRELIMINARY:
the engineer or architect of record must confirm each against the adopted
edition and any local amendments before these results appear in any
deliverable. This module refuses to run for unsprinklered buildings.
"""

CODE_CONSTANTS = {
    "occupant_load_factor_residential_gross_sf": {
        "value": 200,
        "cite": "IBC/FBC Table 1004.5 — Residential, 200 gross sf/occupant",
        "verify": True,
    },
    "stair_width_in_per_occupant": {
        "value": 0.3,
        "cite": "IBC/FBC 1005.3.1 (base rate, no 1005.3.1 exception taken)",
        "verify": True,
    },
    "other_egress_width_in_per_occupant": {
        "value": 0.2,
        "cite": "IBC/FBC 1005.3.2 (base rate)",
        "verify": True,
    },
    "min_corridor_width_in": {
        "value": 44,
        "cite": "IBC/FBC Table 1020.2",
        "verify": True,
    },
    "max_exit_access_travel_ft_r1_sprinklered": {
        "value": 250,
        "cite": "IBC/FBC Table 1017.2 — R, sprinklered (NFPA 13/13R per code)",
        "verify": True,
    },
    "max_common_path_ft_r1_sprinklered": {
        "value": 125,
        "cite": "IBC/FBC Table 1006.2.1 — R-1, sprinklered",
        "verify": True,
    },
    "max_dead_end_corridor_ft_sprinklered": {
        "value": 50,
        "cite": "IBC/FBC 1020.5 Exception 2",
        "verify": True,
    },
}


def egress_report(massing, spec):
    """Preliminary per-room-floor egress numbers for the massed bar.

    `massing` is the result of calc.massing.hotel_massing().
    Returns a dict of computed values plus the citations used, so the
    downstream compliance report can show its work.
    """
    if not spec["project"].get("sprinklered", True):
        raise ValueError(
            "egress_report only implements sprinklered R-1 provisions; "
            "this spec is unsprinklered."
        )

    c = {k: v["value"] for k, v in CODE_CONSTANTS.items()}

    floor_area_sf = massing["bar_width_ft"] * massing["bar_length_ft"]
    occupant_load = -(-floor_area_sf // c["occupant_load_factor_residential_gross_sf"])

    required_stair_width_in = max(
        occupant_load * c["stair_width_in_per_occupant"] / 2,  # split between 2 stairs
        44,  # never below a code-minimum stair
    )
    required_corridor_width_in = max(
        occupant_load * c["other_egress_width_in_per_occupant"],
        c["min_corridor_width_in"],
    )

    # Worst-case travel on a double-loaded bar with end stairs: from the
    # middle of the bar to an end stair, along the corridor.
    worst_travel_ft = massing["bar_length_ft"] / 2 + massing["bar_width_ft"] / 2

    return {
        "floor_area_sf": round(floor_area_sf),
        "occupant_load_per_floor": int(occupant_load),
        "stairs_provided": 2,
        "required_stair_width_in": round(required_stair_width_in, 1),
        "required_corridor_width_in": round(required_corridor_width_in, 1),
        "corridor_provided_in": spec["program"]["corridor_width_ft"] * 12,
        "corridor_ok": spec["program"]["corridor_width_ft"] * 12
        >= required_corridor_width_in,
        "worst_case_travel_ft": round(worst_travel_ft),
        "travel_limit_ft": c["max_exit_access_travel_ft_r1_sprinklered"],
        "travel_ok": worst_travel_ft
        <= c["max_exit_access_travel_ft_r1_sprinklered"],
        "citations": {k: v["cite"] for k, v in CODE_CONSTANTS.items()},
        "verify_note": (
            "All constants are preliminary and flagged for verification "
            "against the adopted code edition by the design professional "
            "of record."
        ),
    }
