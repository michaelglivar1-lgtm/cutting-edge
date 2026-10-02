import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from buildbridge.spec import load_spec, validate, SpecError
from buildbridge.calc.massing import buildable_envelope, hotel_massing
from buildbridge.calc.egress import egress_report

EXAMPLE = os.path.join(os.path.dirname(__file__), "..", "examples", "hotel_120key.json")


def example_spec():
    return load_spec(EXAMPLE)


class SpecTests(unittest.TestCase):
    def test_example_spec_is_valid(self):
        spec = example_spec()
        self.assertEqual(spec["program"]["corridor_width_ft"], 6.0)  # default applied

    def test_missing_setback_is_reported_plainly(self):
        spec = example_spec()
        del spec["site"]["setbacks_ft"]["rear"]
        problems = validate(spec)
        self.assertTrue(any("rear" in p for p in problems))

    def test_zero_keys_rejected(self):
        spec = example_spec()
        spec["program"]["keys"] = 0
        self.assertTrue(any("keys" in p for p in validate(spec)))


class MassingTests(unittest.TestCase):
    def test_envelope_subtracts_setbacks(self):
        envelope = buildable_envelope(example_spec()["site"])
        self.assertEqual(envelope["width_ft"], 300 - 15 - 15)
        self.assertEqual(envelope["depth_ft"], 220 - 25 - 20)

    def test_120_keys_fit_in_example(self):
        massing = hotel_massing(example_spec())
        self.assertTrue(massing["fits"], massing.get("fit_problem"))
        self.assertTrue(massing["height_ok"])

    def test_overstuffed_program_fails_with_explanation(self):
        spec = example_spec()
        spec["program"]["keys"] = 500
        massing = hotel_massing(spec)
        self.assertFalse(massing["fits"])
        self.assertIn("500 keys", massing["fit_problem"])

    def test_setbacks_eating_parcel_raise(self):
        spec = example_spec()
        spec["site"]["setbacks_ft"]["front"] = 200
        with self.assertRaises(ValueError):
            hotel_massing(spec)

    def test_narrow_parcel_explains_bar_width(self):
        spec = example_spec()
        spec["site"]["parcel_depth_ft"] = 80  # envelope depth 35 ft < 66 ft bar
        with self.assertRaises(ValueError) as ctx:
            hotel_massing(spec)
        self.assertIn("double-loaded", str(ctx.exception).lower())


class EgressTests(unittest.TestCase):
    def test_report_computes_and_cites(self):
        spec = example_spec()
        report = egress_report(hotel_massing(spec), spec)
        self.assertGreater(report["occupant_load_per_floor"], 0)
        self.assertTrue(report["travel_ok"])
        self.assertIn("Table 1004.5", report["citations"]["occupant_load_factor_residential_gross_sf"])

    def test_unsprinklered_is_refused(self):
        spec = example_spec()
        spec["project"]["sprinklered"] = False
        with self.assertRaises(ValueError):
            egress_report(hotel_massing(spec), spec)


if __name__ == "__main__":
    unittest.main()
