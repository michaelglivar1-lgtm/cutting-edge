"""Preliminary NEC Article 220 service-load calculation for hotels (R-1).

CONSTANTS POLICY — read before trusting any number:
Every value in NEC_CONSTANTS carries its source citation and a `verify`
flag. Values were entered from NEC 2017/2020 provisions commonly applied
to hotel services; NEC 2023 RENUMBERED and in places REVISED these tables
(e.g. 220.12 -> 220.42(A)). The electrical engineer of record must confirm
every constant against the adopted edition and local amendments before
these results appear in any deliverable. Two constants are DESIGN
ASSUMPTIONS (not code values) and say so on their face.
"""

import math

NEC_CONSTANTS = {
    "general_lighting_va_per_sf_hotel": {
        "value": 2.0,
        "cite": ("NEC Table 220.12 (2017/2020) — hotels and motels, 2 VA/sq ft. "
                 "NEC 2023 renumbers to Table 220.42(A) and revises unit loads — "
                 "confirm adopted edition."),
        "verify": True,
    },
    "lighting_demand_tiers_hotel": {
        # (tier ceiling in VA, demand factor); None = remainder
        "value": [(20000, 0.50), (100000, 0.40), (None, 0.30)],
        "cite": "NEC Table 220.42 — lighting demand factors, hotels/motels",
        "verify": True,
    },
    "receptacle_va_each": {
        "value": 180,
        "cite": "NEC 220.14(I) — 180 VA per receptacle strap, nondwelling",
        "verify": True,
    },
    "receptacle_demand_break_va": {
        "value": 10000,
        "cite": "NEC Table 220.44 — first 10 kVA at 100%, remainder at 50%",
        "verify": True,
    },
    "receptacles_per_key": {
        "value": 6,
        "cite": "DESIGN ASSUMPTION (typical select-service guestroom) — "
                "replace with device count from the electrical plans",
        "verify": True,
    },
    "hvac_va_per_key": {
        "value": 1500,
        "cite": "DESIGN ASSUMPTION (PTAC/VTAC nameplate placeholder) — "
                "replace with mechanical equipment schedule; NEC 220.60 "
                "noncoincident loads (larger of heat/cool)",
        "verify": True,
    },
    "continuous_load_factor": {
        "value": 1.25,
        "cite": "NEC 210.19(A)/215.2(A) — continuous loads at 125%",
        "verify": True,
    },
    "spare_capacity_factor": {
        "value": 1.25,
        "cite": "DESIGN ALLOWANCE (owner/EOR practice), not a code value",
        "verify": True,
    },
}


def _lighting_demand(connected_va, tiers):
    remaining, demand, floor_va = connected_va, 0.0, 0
    for ceiling, factor in tiers:
        band = (remaining if ceiling is None
                else max(0.0, min(remaining, ceiling - floor_va)))
        demand += band * factor
        remaining -= band
        if ceiling is not None:
            floor_va = ceiling
        if remaining <= 0:
            break
    return demand


def electrical_service_report(massing, spec, misc_va=0):
    """Preliminary hotel service sizing from the massed building.

    `misc_va` covers named large loads (elevators, kitchen, pool, fire pump)
    at their connected value — enter them from equipment schedules; this
    module deliberately provides NO defaults for them.
    """
    c = {k: v["value"] for k, v in NEC_CONSTANTS.items()}
    keys = spec["program"]["keys"]
    gross_sf = massing["gross_area_sf"]

    lighting_connected = gross_sf * c["general_lighting_va_per_sf_hotel"]
    lighting_demand = _lighting_demand(lighting_connected,
                                       c["lighting_demand_tiers_hotel"])

    recept_connected = keys * c["receptacles_per_key"] * c["receptacle_va_each"]
    brk = c["receptacle_demand_break_va"]
    recept_demand = (recept_connected if recept_connected <= brk
                     else brk + (recept_connected - brk) * 0.5)

    hvac_demand = keys * c["hvac_va_per_key"]  # noncoincident larger-of, per key

    demand_va = lighting_demand + recept_demand + hvac_demand + misc_va
    design_va = demand_va * c["spare_capacity_factor"]

    def amps(va, volts, phases=3):
        return va / (volts * (math.sqrt(3) if phases == 3 else 1))

    return {
        "keys": keys,
        "gross_area_sf": gross_sf,
        "lighting_connected_va": round(lighting_connected),
        "lighting_demand_va": round(lighting_demand),
        "receptacle_connected_va": round(recept_connected),
        "receptacle_demand_va": round(recept_demand),
        "hvac_demand_va": round(hvac_demand),
        "misc_va": round(misc_va),
        "total_demand_va": round(demand_va),
        "design_va_with_spare": round(design_va),
        "amps_480v_3ph": round(amps(design_va, 480)),
        "amps_208v_3ph": round(amps(design_va, 208)),
        "citations": {k: v["cite"] for k, v in NEC_CONSTANTS.items()},
        "review_required": True,
        "verify_note": (
            "PRELIMINARY NEC Art. 220 basis-of-design. Every constant is "
            "flagged VERIFY; two are design assumptions, misc loads are "
            "not defaulted. The electrical engineer of record must confirm "
            "all values against the adopted NEC edition before use."
        ),
    }
