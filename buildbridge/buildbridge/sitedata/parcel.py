"""County parcel lookup via public ArcGIS REST services.

Ships with a Palm Beach County preset; add counties by appending to
COUNTY_SERVICES with that county's public parcel layer URL and field names
(find them at the county GIS open-data portal — every large FL county has one).

Usage:
    python3 -m buildbridge.sitedata.parcel palm_beach 74434404090000010
"""

import json
import sys
import urllib.parse
import urllib.request

COUNTY_SERVICES = {
    # Palm Beach County public parcel layer (verify current URL at
    # https://gis.pbcgov.org — county endpoints occasionally move).
    "palm_beach": {
        "url": "https://services1.arcgis.com/ZWOoUZbtaYePLlPw/arcgis/rest/services/PARCELS/FeatureServer/0/query",
        "parcel_id_field": "PARID",
        "fields": ["PARID", "OWNER1", "SITEADDRESS", "LANDUSECODE", "TOTALACRES"],
    },
}


def parcel_by_id(county, parcel_id, timeout=30):
    """Return attributes + geometry for one parcel."""
    service = COUNTY_SERVICES[county]
    params = urllib.parse.urlencode({
        "where": f"{service['parcel_id_field']} = '{parcel_id}'",
        "outFields": ",".join(service["fields"]),
        "returnGeometry": "true",
        "outSR": 4326,
        "f": "json",
    })
    with urllib.request.urlopen(f"{service['url']}?{params}", timeout=timeout) as response:
        data = json.load(response)
    if "error" in data:
        raise RuntimeError(f"Parcel query failed: {data['error']}")
    features = data.get("features", [])
    if not features:
        return None
    feature = features[0]
    return {
        "attributes": feature["attributes"],
        "geometry": feature.get("geometry"),
    }


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(f"usage: python3 -m buildbridge.sitedata.parcel "
                 f"{{{'|'.join(COUNTY_SERVICES)}}} PARCEL_ID")
    result = parcel_by_id(sys.argv[1], sys.argv[2])
    print(json.dumps(result, indent=2) if result else "Parcel not found.")
