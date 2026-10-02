"""Buildable envelope and double-loaded-corridor hotel massing.

Pure arithmetic — no code tables, no network, no Revit. Everything here is
derivable from the spec and standard hotel planning modules.

Planning defaults (industry-typical, adjustable per spec):
  guestroom bay 13'-0" wide x 30'-0" deep, 6'-0" corridor
  -> double-loaded building width = 30 + 6 + 30 = 66'-0"
  End-of-corridor egress stairs allowance: one bay each end.
  Mid-building core (elevators/linen/electrical) allowance: two bays.
"""

END_STAIR_BAYS = 1      # per end, in guestroom-bay widths
MID_CORE_BAYS = 2       # elevators + service, in guestroom-bay widths


class MassingResult(dict):
    """Dict with attribute access, so results read cleanly in reports."""

    __getattr__ = dict.__getitem__


def buildable_envelope(site):
    """Parcel minus setbacks -> the rectangle we may build in."""
    setbacks = site["setbacks_ft"]
    width = site["parcel_width_ft"] - setbacks["side_left"] - setbacks["side_right"]
    depth = site["parcel_depth_ft"] - setbacks["front"] - setbacks["rear"]
    if width <= 0 or depth <= 0:
        raise ValueError(
            "Setbacks consume the entire parcel: envelope is "
            f"{width:.1f} ft x {depth:.1f} ft"
        )
    return {"width_ft": width, "depth_ft": depth}


def hotel_massing(spec):
    """Fit the requested key count into the buildable envelope.

    The double-loaded bar runs along the envelope's long dimension.
    Returns a MassingResult; raises ValueError with a plain-English
    explanation when the program does not fit.
    """
    site, program = spec["site"], spec["program"]
    envelope = buildable_envelope(site)

    bar_width = 2 * program["guestroom_depth_ft"] + program["corridor_width_ft"]
    long_axis = max(envelope["width_ft"], envelope["depth_ft"])
    short_axis = min(envelope["width_ft"], envelope["depth_ft"])

    if bar_width > short_axis:
        raise ValueError(
            f"A double-loaded bar needs {bar_width:.0f} ft of width; the "
            f"envelope only offers {short_axis:.0f} ft. Reduce room depth, "
            "use a single-loaded corridor, or seek a setback variance."
        )

    bay = program["guestroom_bay_width_ft"]
    total_bays = int(long_axis // bay)
    service_bays = 2 * END_STAIR_BAYS + MID_CORE_BAYS
    room_bays = total_bays - service_bays
    if room_bays < 2:
        raise ValueError(
            f"Envelope long axis ({long_axis:.0f} ft) fits only {total_bays} "
            f"bays; {service_bays} are consumed by stairs and core."
        )

    keys_per_room_floor = room_bays * 2  # double-loaded: rooms both sides
    room_floors = program["floors"] - (1 if program["ground_floor_amenity"] else 0)
    if room_floors < 1:
        raise ValueError("No guestroom floors: floors=1 with a ground-floor amenity level.")

    max_keys = keys_per_room_floor * room_floors
    keys = program["keys"]

    bar_length = total_bays * bay
    height = (
        program["ground_floor_to_floor_ft"]
        + (program["floors"] - 1) * program["floor_to_floor_ft"]
    )

    result = MassingResult(
        envelope_width_ft=round(envelope["width_ft"], 1),
        envelope_depth_ft=round(envelope["depth_ft"], 1),
        bar_width_ft=round(bar_width, 1),
        bar_length_ft=round(bar_length, 1),
        building_height_ft=round(height, 1),
        floors=program["floors"],
        room_floors=room_floors,
        keys_requested=keys,
        keys_per_room_floor=keys_per_room_floor,
        max_keys=max_keys,
        fits=keys <= max_keys,
        gross_area_sf=round(bar_width * bar_length * program["floors"]),
    )

    height_limit = site.get("height_limit_ft")
    result["height_ok"] = height_limit is None or height <= height_limit
    if height_limit is not None and not result["height_ok"]:
        result["height_problem"] = (
            f"Building height {height:.0f} ft exceeds the {height_limit:.0f} ft limit."
        )
    if not result["fits"]:
        floors_needed = -(-keys // keys_per_room_floor)  # ceil
        result["fit_problem"] = (
            f"{keys} keys need {floors_needed} room floors at "
            f"{keys_per_room_floor} keys/floor; spec provides {room_floors}."
        )
    return result
