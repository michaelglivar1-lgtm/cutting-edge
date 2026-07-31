"""Preliminary plumbing fixture counts per FBC-P / IPC Table 403.1 (R-1 hotel).

CONSTANTS POLICY — read before trusting any number:
Every value in FIXTURE_CONSTANTS carries its source citation and a
`verify` flag. Guestrooms in R-1 carry private fixtures per sleeping
unit; public/assembly areas (dining, meeting) are ratio-based on
occupant load. The plumbing engineer of record must confirm each ratio
against the adopted FBC-Plumbing edition and local amendments before
these results appear in any deliverable.
"""

import math

FIXTURE_CONSTANTS = {
    "r1_wc_per_sleeping_unit": {
        "value": 1,
        "cite": "FBC-P/IPC Table 403.1 — R-1: 1 water closet per sleeping unit",
        "verify": True,
    },
    "r1_lav_per_sleeping_unit": {
        "value": 1,
        "cite": "FBC-P/IPC Table 403.1 — R-1: 1 lavatory per sleeping unit",
        "verify": True,
    },
    "r1_bath_per_sleeping_unit": {
        "value": 1,
        "cite": "FBC-P/IPC Table 403.1 — R-1: 1 bathtub/shower per sleeping unit",
        "verify": True,
    },
    "a2_occupants_per_wc": {
        "value": 75,
        "cite": "FBC-P/IPC Table 403.1 — A-2 restaurants: 1 WC per 75 (each sex)",
        "verify": True,
    },
    "a2_occupants_per_lav": {
        "value": 200,
        "cite": "FBC-P/IPC Table 403.1 — A-2 restaurants: 1 lavatory per 200 (each sex)",
        "verify": True,
    },
    "occupants_per_drinking_fountain": {
        "value": 500,
        "cite": "FBC-P/IPC Table 403.1 — 1 drinking fountain per 500",
        "verify": True,
    },
    "service_sinks": {
        "value": 1,
        "cite": "FBC-P/IPC Table 403.1 — 1 service sink",
        "verify": True,
    },
    "dining_sf_per_occupant_net": {
        "value": 15,
        "cite": "IBC/FBC Table 1004.5 — assembly, unconcentrated (tables+chairs), "
                "15 net sf/occupant",
        "verify": True,
    },
}


def fixture_report(spec, public_dining_sf=0):
    """Fixture counts: private (per key) + public (ratio on occupant load).

    `public_dining_sf` is NET assembly area (e.g. the rooftop restaurant);
    50/50 male/female split per 403.1.1 unless the AHJ approves otherwise.
    """
    c = {k: v["value"] for k, v in FIXTURE_CONSTANTS.items()}
    keys = spec["program"]["keys"]

    private = {
        "water_closets": keys * c["r1_wc_per_sleeping_unit"],
        "lavatories": keys * c["r1_lav_per_sleeping_unit"],
        "bathtubs_showers": keys * c["r1_bath_per_sleeping_unit"],
    }

    public = None
    if public_dining_sf > 0:
        occupants = math.ceil(public_dining_sf / c["dining_sf_per_occupant_net"])
        per_sex = occupants / 2.0  # 403.1.1 default 50/50 split
        public = {
            "dining_net_sf": public_dining_sf,
            "occupant_load": occupants,
            "wc_male": math.ceil(per_sex / c["a2_occupants_per_wc"]),
            "wc_female": math.ceil(per_sex / c["a2_occupants_per_wc"]),
            "lav_male": math.ceil(per_sex / c["a2_occupants_per_lav"]),
            "lav_female": math.ceil(per_sex / c["a2_occupants_per_lav"]),
            "drinking_fountains": math.ceil(
                occupants / c["occupants_per_drinking_fountain"]),
            "service_sinks": c["service_sinks"],
        }

    return {
        "keys": keys,
        "private_per_sleeping_unit": private,
        "public_assembly": public,
        "citations": {k: v["cite"] for k, v in FIXTURE_CONSTANTS.items()},
        "review_required": True,
        "verify_note": (
            "PRELIMINARY FBC-P/IPC Table 403.1 basis-of-design. Every ratio "
            "is flagged VERIFY. Employee facilities, accessible-fixture "
            "distribution (FBC Ch.11/ICC A117.1), and any AHJ-approved "
            "occupancy split are the plumbing engineer of record's call."
        ),
    }
