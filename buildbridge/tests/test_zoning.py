import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from buildbridge.zoning import ZoningDB


class ZoningTests(unittest.TestCase):
    def setUp(self):
        self.db = ZoningDB(":memory:")

    def test_add_and_get_roundtrip(self):
        self.db.add("West Palm Beach", "CMUD", 10, 10, 0,
                    "WPB Code Ch. 94, Art. IV", height_limit_ft=100,
                    verified_by="M. Glivar")
        rules = self.db.get("West Palm Beach", "CMUD")
        self.assertEqual(rules["front_ft"], 10)
        self.assertEqual(rules["height_limit_ft"], 100)

    def test_citation_is_mandatory(self):
        with self.assertRaises(ValueError):
            self.db.add("Nowhere", "X", 1, 1, 1, "  ")

    def test_spec_setbacks_block_is_spec_ready(self):
        self.db.add("Boca Raton", "B-1", 25, 20, 15, "Boca Code 28-701",
                    verified_by="M. Glivar")
        block = self.db.spec_setbacks("Boca Raton", "B-1")
        self.assertEqual(block["side_left"], 15)
        self.assertIn("Boca Code 28-701", block["source"])
        self.assertIn("M. Glivar", block["source"])

    def test_unknown_district_returns_none(self):
        self.assertIsNone(self.db.spec_setbacks("Miami", "T6-8"))

    def test_update_overwrites_and_keeps_one_row(self):
        self.db.add("Boca Raton", "B-1", 25, 20, 15, "old cite")
        self.db.add("Boca Raton", "B-1", 30, 20, 15, "new cite")
        self.assertEqual(len(self.db.list_all()), 1)
        self.assertEqual(self.db.get("Boca Raton", "B-1")["front_ft"], 30)


if __name__ == "__main__":
    unittest.main()
