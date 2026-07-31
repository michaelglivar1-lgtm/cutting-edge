"""Jurisdiction zoning-rules store, backed by SQLite.

This file is the moat: every municipality researched once is answered
instantly forever after. Rules go in with a source citation and a
verified_by field; lookups feed the Building Spec's setbacks section.

The database is a single file (default: zoning.db next to this package).
Python ships with SQLite built in — no install required.

CLI:
    python -m buildbridge.zoning add   "West Palm Beach" "CMUD" \
        --front 10 --rear 10 --side 0 --height 100 \
        --cite "WPB Code Ch. 94, Art. IV" --verified-by "M. Glivar"
    python -m buildbridge.zoning get   "West Palm Beach" "CMUD"
    python -m buildbridge.zoning list
"""

import argparse
import datetime
import json
import os
import sqlite3

DEFAULT_DB = os.path.join(os.path.dirname(__file__), "..", "zoning.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS districts (
    jurisdiction TEXT NOT NULL,
    district     TEXT NOT NULL,
    front_ft     REAL NOT NULL,
    rear_ft      REAL NOT NULL,
    side_ft      REAL NOT NULL,
    height_limit_ft REAL,
    far          REAL,
    parking_note TEXT,
    source_citation TEXT NOT NULL,
    verified_by  TEXT,
    updated_at   TEXT NOT NULL,
    PRIMARY KEY (jurisdiction, district)
);
"""


class ZoningDB:
    def __init__(self, path=DEFAULT_DB):
        self.conn = sqlite3.connect(path)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)

    def add(self, jurisdiction, district, front_ft, rear_ft, side_ft,
            source_citation, height_limit_ft=None, far=None,
            parking_note=None, verified_by=None):
        """Insert or update one district's rules. Citation is mandatory."""
        if not source_citation or not source_citation.strip():
            raise ValueError(
                "source_citation is required — no rule enters the database "
                "without saying where it came from."
            )
        self.conn.execute(
            "INSERT INTO districts VALUES (?,?,?,?,?,?,?,?,?,?,?) "
            "ON CONFLICT(jurisdiction, district) DO UPDATE SET "
            "front_ft=excluded.front_ft, rear_ft=excluded.rear_ft, "
            "side_ft=excluded.side_ft, height_limit_ft=excluded.height_limit_ft, "
            "far=excluded.far, parking_note=excluded.parking_note, "
            "source_citation=excluded.source_citation, "
            "verified_by=excluded.verified_by, updated_at=excluded.updated_at",
            (jurisdiction.strip(), district.strip(), front_ft, rear_ft,
             side_ft, height_limit_ft, far, parking_note, source_citation,
             verified_by, datetime.datetime.now().isoformat(timespec="seconds")),
        )
        self.conn.commit()

    def get(self, jurisdiction, district):
        row = self.conn.execute(
            "SELECT * FROM districts WHERE jurisdiction=? AND district=?",
            (jurisdiction.strip(), district.strip()),
        ).fetchone()
        return dict(row) if row else None

    def list_all(self):
        return [dict(r) for r in self.conn.execute(
            "SELECT jurisdiction, district, source_citation, verified_by, "
            "updated_at FROM districts ORDER BY jurisdiction, district"
        )]

    def spec_setbacks(self, jurisdiction, district):
        """Return a ready-to-paste site.setbacks_ft block for a Building Spec,
        or None if the district hasn't been researched yet."""
        rules = self.get(jurisdiction, district)
        if rules is None:
            return None
        return {
            "front": rules["front_ft"],
            "rear": rules["rear_ft"],
            "side_left": rules["side_ft"],
            "side_right": rules["side_ft"],
            "source": (
                f"{rules['source_citation']} "
                f"(verified by {rules['verified_by'] or 'UNVERIFIED'}, "
                f"{rules['updated_at']})"
            ),
        }


def main():
    parser = argparse.ArgumentParser(prog="buildbridge.zoning")
    sub = parser.add_subparsers(dest="cmd", required=True)

    add = sub.add_parser("add")
    add.add_argument("jurisdiction")
    add.add_argument("district")
    add.add_argument("--front", type=float, required=True)
    add.add_argument("--rear", type=float, required=True)
    add.add_argument("--side", type=float, required=True)
    add.add_argument("--height", type=float, default=None)
    add.add_argument("--far", type=float, default=None)
    add.add_argument("--parking", default=None)
    add.add_argument("--cite", required=True,
                     help="Municipal code section these numbers came from")
    add.add_argument("--verified-by", default=None)

    get = sub.add_parser("get")
    get.add_argument("jurisdiction")
    get.add_argument("district")

    sub.add_parser("list")

    args = parser.parse_args()
    db = ZoningDB()

    if args.cmd == "add":
        db.add(args.jurisdiction, args.district, args.front, args.rear,
               args.side, args.cite, args.height, args.far, args.parking,
               args.verified_by)
        print(f"Saved {args.jurisdiction} / {args.district}.")
    elif args.cmd == "get":
        setbacks = db.spec_setbacks(args.jurisdiction, args.district)
        print(json.dumps(setbacks, indent=2) if setbacks
              else "Not in the database yet — research it once, add it forever.")
    elif args.cmd == "list":
        rows = db.list_all()
        if not rows:
            print("Database is empty.")
        for r in rows:
            print(f"{r['jurisdiction']:25} {r['district']:12} "
                  f"[{r['source_citation']}] "
                  f"verified: {r['verified_by'] or 'NO'} ({r['updated_at']})")


if __name__ == "__main__":
    main()
