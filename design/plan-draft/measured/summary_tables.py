#!/usr/bin/env python3
"""Print the tables that appear in SUMMARY.md, straight out of _raw.json.

    cd <repo root> && python3 design/plan-draft/measured/summary_tables.py

Run measure.py first. Nothing here re-measures anything; this file exists so the
numbers in the prose can be regenerated and diffed rather than retyped.
"""
import json
import os
import statistics as st

HERE = os.path.dirname(os.path.abspath(__file__))
R = json.load(open(os.path.join(HERE, "_raw.json")))
F = ["study/N", "study/E", "study/S", "study/W", "hall/N", "hall/E", "hall/S", "hall/W"]
STAND = {"study/N": 3.60, "study/E": 4.09, "study/S": 3.60, "study/W": 4.09,
         "hall/N": 1.95, "hall/E": 6.00, "hall/S": 1.95, "hall/W": 6.00}
STAND_NOW = {"study/N": 4.35, "study/E": 4.09, "study/S": 3.85, "study/W": 4.09,
             "hall/N": 2.15, "hall/E": 6.00, "hall/S": 2.15, "hall/W": 6.00}
PLANW = {"study/N": 5.45, "study/E": 4.80, "study/S": 5.45, "study/W": 4.80,
         "hall/N": None, "hall/E": 2.60, "hall/S": None, "hall/W": 2.60}


def n(x, d=2):
    return "-" if x is None else ("%.*f" % (d, x))


def main():
    print("### A. Everything measured\n")
    h = ("| facing | source | ceil y | floor y | horizon y | horizon x | corner x0 | "
         "corner x1 | corner span px | corner mid | dado rail y | rail above floor px | "
         "calibration_px | ceiling-ramp VP (x,y) | ramp resid px |")
    print(h)
    print("|" + "---|" * (h.count("|") - 1))
    for f in F:
        v = R[f]
        m = v["measured"]
        rp = v["ceiling_ramp_vp"]
        span = (m["corner_x1_px"] - m["corner_x0_px"]) if m["corner_x0_px"] is not None else None
        print("| `%s` | %s | %d | %d | **%d** | %d | %s | %s | %s | %s | %d | %d | %.0f | %s | %s |" % (
            f, v["src"].replace("backdrops/source/", ""),
            m["wall_ceiling_line_y_px"], m["wall_floor_line_y_px"],
            m["horizon_y_px"], m["horizon_x_px"],
            m["corner_x0_px"] if m["corner_x0_px"] is not None else "**null**",
            m["corner_x1_px"] if m["corner_x1_px"] is not None else "**null**",
            span if span else "-",
            n(m.get("corner_midpoint_px"), 1),
            m["dado_rail_top_y_px"], m["dado_rail_above_floor_px"], v["calib_px"],
            ("%.1f, %.1f" % (rp["x"], rp["y"])) if rp else "-",
            ("%.2f / %.2f" % (rp["left_resid_px"], rp["right_resid_px"])) if rp else "-"))

    print("\n### B. Everything derived\n")
    h = ("| facing | calibration feature | conf | px/m at wall | px/m at bottom | "
         "eye height m | storey m | nearest floor m | implied camera m | plan camera m | "
         "implied wall width m | plan wall m | key_tint | key_dir |")
    print(h)
    print("|" + "---|" * (h.count("|") - 1))
    short = {"fireplace": "fireplace opening 0.90 m wide",
             "door_h": "door opening 2.00 m tall",
             "dado": "dado rail 0.90 m above floor"}
    for f in F:
        v = R[f]
        d = v["derived"]
        doc = json.load(open(os.path.join(HERE, f.replace("/", "-") + ".json")))
        conf = doc["calibration_confidence"].split(".")[0].split(" in ")[0].strip()
        print("| `%s` | %s | %s | **%.2f** | %.1f | **%.3f** | **%.3f** | %.3f | %.2f | %.2f | %s | %s | `%s` | %s |" % (
            f, short[v["cfg_calib"]], conf, v["ppm"], d["px_per_m_at_bottom"],
            d["eye_height_m"], d["storey_height_m"], d["nearest_visible_floor_m"],
            d["implied_camera_wall_m"], STAND[f],
            n(d["implied_wall_width_m"], 2), n(PLANW[f], 2),
            v["light"]["key_tint"], doc["key_dir"]))

    print("\n### C. Implied focal length\n")
    print("| facing | px/m at wall | standpoint AS RULED FOR THIS RUN m | px/m x that | "
          "vs 1024 px | standpoint IN standpoints.tsv NOW m | px/m x that | vs 1024 px |")
    print("|---|---|---|---|---|---|---|---|")
    fs, gs = [], []
    for f in F:
        v = R[f]["ppm"] * STAND[f]
        w = R[f]["ppm"] * STAND_NOW[f]
        fs.append(v)
        gs.append(w)
        print("| `%s` | %.2f | %.2f | **%.0f** | %+.1f %% | %.2f | **%.0f** | %+.1f %% |" % (
            f, R[f]["ppm"], STAND[f], v, 100 * (v - 1024) / 1024,
            STAND_NOW[f], w, 100 * (w - 1024) / 1024))
    print("\nas ruled: spread %.0f..%.0f px, mean %.0f, sd %.0f" % (
        min(fs), max(fs), st.mean(fs), st.pstdev(fs)))
    print("\nagainst standpoints.tsv as it stands now: spread %.0f..%.0f px, "
          "mean %.0f, sd %.0f" % (min(gs), max(gs), st.mean(gs), st.pstdev(gs)))

    for label, key, target in [("D. Eye height", "eye_height_m", 1.83),
                               ("E. Storey height", "storey_height_m", 2.80)]:
        vals = [R[f]["derived"][key] for f in F]
        print("\n### %s\n" % label)
        print("| facing | " + " | ".join("`%s`" % f for f in F) + " |")
        print("|---|" + "---|" * len(F))
        print("| m | " + " | ".join("%.3f" % v for v in vals) + " |")
        print("\nmin %.3f (`%s`), max %.3f (`%s`), spread %.3f m, mean %.3f, sd %.3f, "
              "asked for %.2f" % (min(vals), F[vals.index(min(vals))],
                                  max(vals), F[vals.index(max(vals))],
                                  max(vals) - min(vals), st.mean(vals),
                                  st.pstdev(vals), target))

    print("\n### F. Horizon, region by region\n")
    print("| facing | floor vote (x,y,edge px) | ceiling vote | side-wall vote | "
          "adopted y | ceiling-ramp VP y | ramp - vote px | ramp - vote m of eye |")
    print("|---|---|---|---|---|---|---|---|")
    for f in F:
        v = R[f]
        vt = v["votes"]

        def c(k):
            if k not in vt or vt[k]["y"] is None:
                return "-"
            return "%d, %d, %d" % (vt[k]["x"], vt[k]["y"], vt[k]["edge_px"])
        rp = v["ceiling_ramp_vp"]
        print("| `%s` | %s | %s | %s | **%d** | %s | %s | %s |" % (
            f, c("floor"), c("ceiling"), c("side_walls"),
            v["measured"]["horizon_y_px"],
            n(rp["y"], 1) if rp else "-",
            ("%+d" % round(rp["y"] - v["measured"]["horizon_y_px"])) if rp else "-",
            ("%+.3f" % ((rp["y"] - v["measured"]["horizon_y_px"]) / v["ppm"])) if rp else "-"))

    print("\n### G. Light\n")
    print("| facing | brightest 21x21 px | key_tint | floor alt | mid-wall L alt | "
          "mid-wall R alt | sobel bright-side deg | third tilt frame | third tilt wall |")
    print("|---|---|---|---|---|---|---|---|---|")
    for f in F:
        l = R[f]["light"]
        a = l["key_tint_alternates"]
        print("| `%s` | %d, %d | `%s` | `%s` | `%s` | `%s` | %.1f | %+.2f | %+.2f |" % (
            f, l["key_dir_brightest_x"], l["key_dir_brightest_y"], l["key_tint"],
            a["floor_bottom_strip"], a["mid_wall_left"], a["mid_wall_right"],
            l["sobel_bright_side_deg_whole_frame"],
            l["left_third_minus_right_third_luminance_whole_frame"],
            l["left_third_minus_right_third_luminance_wall_band"]))


if __name__ == "__main__":
    main()
