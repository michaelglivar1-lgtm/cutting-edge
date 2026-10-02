"""FEMA National Flood Hazard Layer lookup.

Given lat/lon, returns the effective flood zone and base flood elevation
from FEMA's public NFHL ArcGIS service. No API key required.

Usage:
    python3 -m buildbridge.sitedata.fema 26.7153 -80.0534
"""

import json
import sys
import urllib.parse
import urllib.request

NFHL_FLOOD_ZONES_LAYER = (
    "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query"
)


def flood_zone(lat, lon, timeout=30):
    """Return {'zone', 'base_flood_elevation_ft', 'raw'} for a point.

    Zone 'X' (or 'X (shaded)') means outside the 1%-annual-chance floodplain.
    Zones A/AE/AH/AO/VE etc. mean flood design requirements apply.
    """
    params = urllib.parse.urlencode({
        "geometry": json.dumps({
            "x": lon, "y": lat,
            "spatialReference": {"wkid": 4326},
        }),
        "geometryType": "esriGeometryPoint",
        "inSR": 4326,
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "FLD_ZONE,ZONE_SUBTY,STATIC_BFE",
        "returnGeometry": "false",
        "f": "json",
    })
    with urllib.request.urlopen(
        f"{NFHL_FLOOD_ZONES_LAYER}?{params}", timeout=timeout
    ) as response:
        data = json.load(response)

    if "error" in data:
        raise RuntimeError(f"NFHL query failed: {data['error']}")

    features = data.get("features", [])
    if not features:
        return {"zone": None, "base_flood_elevation_ft": None, "raw": data,
                "note": "No NFHL polygon at this point — check coordinates "
                        "or an unmapped area."}

    attrs = features[0]["attributes"]
    bfe = attrs.get("STATIC_BFE")
    return {
        "zone": attrs.get("FLD_ZONE"),
        "zone_subtype": attrs.get("ZONE_SUBTY"),
        # NFHL uses -9999 for 'no static BFE on this polygon'
        "base_flood_elevation_ft": None if bfe in (None, -9999) else bfe,
        "raw": attrs,
    }


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: python3 -m buildbridge.sitedata.fema LAT LON")
    result = flood_zone(float(sys.argv[1]), float(sys.argv[2]))
    print(json.dumps({k: v for k, v in result.items() if k != "raw"}, indent=2))
