import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from buildbridge.spec import load_spec
from buildbridge.calc.massing import hotel_massing
from buildbridge.calc.electrical import electrical_service_report, _lighting_demand
from buildbridge.calc.plumbing import fixture_report

EXAMPLE = os.path.join(os.path.dirname(__file__), "..", "examples", "hotel_120key.json")


def example():
    spec = load_spec(EXAMPLE)
    return hotel_massing(spec), spec


class ElectricalTests(unittest.TestCase):
    def test_lighting_demand_tiers(self):
        tiers = [(20000, 0.50), (100000, 0.40), (None, 0.30)]
        # 150,000 VA -> 20k*0.5 + 80k*0.4 + 50k*0.3 = 10k + 32k + 15k
        self.assertAlmostEqual(_lighting_demand(150000, tiers), 57000)
        # below first break: all at 50%
        self.assertAlmostEqual(_lighting_demand(10000, tiers), 5000)

    def test_report_computes_flags_and_cites(self):
        massing, spec = example()
        r = electrical_service_report(massing, spec, misc_va=100000)
        self.assertGreater(r["total_demand_va"], 0)
        self.assertGreater(r["amps_480v_3ph"], 0)
        self.assertTrue(r["review_required"])
        self.assertIn("220.42", r["citations"]["lighting_demand_tiers_hotel"])
        self.assertIn("DESIGN ASSUMPTION", r["citations"]["hvac_va_per_key"])

    def test_demand_less_than_connected(self):
        massing, spec = example()
        r = electrical_service_report(massing, spec)
        self.assertLess(r["lighting_demand_va"], r["lighting_connected_va"])
        self.assertLess(r["receptacle_demand_va"], r["receptacle_connected_va"])


class PlumbingTests(unittest.TestCase):
    def test_private_fixtures_match_keys(self):
        _, spec = example()
        r = fixture_report(spec)
        self.assertEqual(r["private_per_sleeping_unit"]["water_closets"], 120)
        self.assertIsNone(r["public_assembly"])
        self.assertTrue(r["review_required"])

    def test_public_assembly_ratios(self):
        _, spec = example()
        r = fixture_report(spec, public_dining_sf=3000)
        pub = r["public_assembly"]
        self.assertEqual(pub["occupant_load"], 200)      # 3000/15
        self.assertEqual(pub["wc_male"], 2)              # ceil(100/75)
        self.assertEqual(pub["lav_female"], 1)           # ceil(100/200)
        self.assertEqual(pub["drinking_fountains"], 1)
        self.assertIn("Table 403.1", r["citations"]["a2_occupants_per_wc"])


if __name__ == "__main__":
    unittest.main()
