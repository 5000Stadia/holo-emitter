import unittest
from row23_lib import foot_of


class FootAboveShadow(unittest.TestCase):
    """[Kabe, 2026-08-30] The floor line is the foot, not the shadow under it."""

    def test_ward_w_takes_the_foot_nine_rows_up(self):
        cands = [dict(y=706, strength=61.1), dict(y=735, strength=48.9)]
        self.assertEqual(foot_of(744, cands), 735)

    def test_reception_n_takes_the_strongest_within_reach_not_the_nearest(self):
        cands = [dict(y=723, strength=100), dict(y=747, strength=51), dict(y=752, strength=16)]
        self.assertEqual(foot_of(758, cands), 747)

    def test_reception_e_keeps_a_foot_that_coincides_with_the_seam(self):
        cands = [dict(y=776, strength=37), dict(y=781, strength=100)]
        self.assertEqual(foot_of(780, cands), 781)

    def test_the_skirting_cap_is_out_of_reach(self):
        cands = [dict(y=734, strength=100)]
        self.assertIsNone(foot_of(761, cands))

    def test_no_candidates_means_keep_the_minimum(self):
        self.assertIsNone(foot_of(700, []))


if __name__ == "__main__":
    unittest.main()
