# packs/INVENTORY.md — every manor constant in the engine

Row 44, step 0, under production law clause 8 ("the theme never bleeds into the code"). Produced by one grep pass over `tools/*.mjs src/*.js design/plan-draft/measured/*.py`:

```
grep -rn -iE "1660|manor|oak|wainscot|heraldr|casement|chair.rail|coping|demo-study|nav-manor|row23-scaffold" \
  tools/*.mjs src/*.js design/plan-draft/measured/*.py
```

**957 hits** across **44 files**. Classified:

| kind | hits |
|---|---:|
| path constant | 62 |
| vocabulary constant | 477 |
| anchor height | 31 |
| era-medium sentence | 17 |
| fixture path | 32 |
| comment-only | 338 |
| **total** | **957** |

Classification is mechanical: a hit is `comment-only` when the line begins with `*`, `//`, `/*` or `#`; otherwise it is a path / fixture-path hit when it composes a filesystem path, an anchor-height hit when it pairs a ruler word with a number or with height/sill/head, an era hit when it says 1660 / seventeenth / circa, and a vocabulary hit otherwise.

## By file

| file | path const | vocabulary | anchor height | era/medium | fixture path | comment-only | total |
|---|--:|--:|--:|--:|--:|--:|--:|
| `tools/room-voices.mjs` | 2 | 130 | 6 | 5 | 1 | 39 | 183 |
| `tools/make-scaffold.mjs` | 12 | 41 | 4 | 5 | 9 | 62 | 133 |
| `src/placeholders.js` | 1 | 49 | 0 | 3 | 0 | 13 | 66 |
| `design/plan-draft/measured/measure.py` | 1 | 41 | 6 | 0 | 0 | 9 | 57 |
| `design/plan-draft/measured/row23_lib.py` | 1 | 31 | 5 | 0 | 0 | 16 | 53 |
| `design/plan-draft/measured/row23_run.py` | 11 | 13 | 0 | 0 | 3 | 12 | 39 |
| `src/renderer.js` | 0 | 8 | 0 | 0 | 0 | 28 | 36 |
| `tools/evolution-arms.mjs` | 0 | 19 | 0 | 1 | 1 | 14 | 35 |
| `design/plan-draft/measured/row41_bays.py` | 0 | 16 | 3 | 0 | 0 | 14 | 33 |
| `tools/promote-backdrop.mjs` | 0 | 2 | 0 | 0 | 1 | 20 | 23 |
| `design/plan-draft/measured/prompt_lint.py` | 0 | 10 | 5 | 1 | 0 | 7 | 23 |
| `design/plan-draft/measured/row35_snap.py` | 4 | 14 | 0 | 0 | 1 | 4 | 23 |
| `tools/frame-language.mjs` | 0 | 2 | 0 | 2 | 0 | 18 | 22 |
| `tools/plan-projection.mjs` | 1 | 11 | 0 | 0 | 1 | 9 | 22 |
| `design/plan-draft/measured/room_consistency.py` | 2 | 15 | 0 | 0 | 0 | 3 | 20 |
| `tools/validate-fixtures.mjs` | 0 | 2 | 0 | 0 | 1 | 16 | 19 |
| `tools/validate-plan.mjs` | 0 | 1 | 0 | 0 | 1 | 16 | 18 |
| `design/plan-draft/measured/test_row40_supersede.py` | 1 | 12 | 0 | 0 | 0 | 5 | 18 |
| `design/plan-draft/measured/derived.py` | 7 | 3 | 0 | 0 | 5 | 0 | 15 |
| `design/plan-draft/measured/timings_report.py` | 6 | 5 | 0 | 0 | 0 | 1 | 12 |
| `design/plan-draft/measured/row32_holdout.py` | 5 | 5 | 0 | 0 | 0 | 1 | 11 |
| `design/plan-draft/measured/test_room_consistency.py` | 0 | 11 | 0 | 0 | 0 | 0 | 11 |
| `tools/grant-content-gap.mjs` | 2 | 3 | 0 | 0 | 1 | 2 | 8 |
| `tools/emit-evolution.mjs` | 2 | 3 | 0 | 0 | 0 | 3 | 8 |
| `design/plan-draft/measured/test_row41_bays.py` | 0 | 8 | 0 | 0 | 0 | 0 | 8 |
| `design/plan-draft/measured/row34_run.py` | 0 | 5 | 0 | 0 | 0 | 2 | 7 |
| `design/plan-draft/measured/row36_assemble.py` | 0 | 3 | 0 | 0 | 1 | 2 | 6 |
| `design/plan-draft/measured/window_measure.py` | 0 | 2 | 2 | 0 | 1 | 1 | 6 |
| `tools/bake-fixtures.mjs` | 0 | 0 | 0 | 0 | 1 | 4 | 5 |
| `tools/edge-seed.mjs` | 0 | 1 | 0 | 0 | 0 | 4 | 5 |
| `src/groundplane.js` | 0 | 0 | 0 | 0 | 0 | 5 | 5 |
| `design/plan-draft/measured/seam_measure.py` | 0 | 4 | 0 | 0 | 1 | 0 | 5 |
| `tools/grant-row34-extension.mjs` | 2 | 1 | 0 | 0 | 0 | 0 | 3 |
| `tools/style-seed.mjs` | 1 | 0 | 0 | 0 | 1 | 1 | 3 |
| `design/plan-draft/measured/row34_promptaudit.py` | 0 | 0 | 0 | 0 | 0 | 3 | 3 |
| `design/plan-draft/measured/door_measure.py` | 0 | 2 | 0 | 0 | 1 | 0 | 3 |
| `tools/bake-library.mjs` | 0 | 0 | 0 | 0 | 0 | 2 | 2 |
| `design/plan-draft/measured/test_window_measure.py` | 0 | 2 | 0 | 0 | 0 | 0 | 2 |
| `tools/flight-evidence.mjs` | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| `src/harness.js` | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| `design/plan-draft/measured/row23_looksheet.py` | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| `design/plan-draft/measured/row36_door_repair_report.py` | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `design/plan-draft/measured/gate.py` | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
| `design/plan-draft/measured/row41_batch.py` | 0 | 1 | 0 | 0 | 0 | 0 | 1 |

## Line numbers, by file and kind

### `design/plan-draft/measured/derived.py`
- **path constant** (7): 109, 110, 974, 994, 1007, 1019, 1029
- **vocabulary constant** (3): 15, 51, 807
- **fixture path** (5): 111, 939, 995, 1008, 1040

### `design/plan-draft/measured/door_measure.py`
- **vocabulary constant** (2): 5, 10
- **fixture path** (1): 282

### `design/plan-draft/measured/gate.py`
- **vocabulary constant** (1): 37

### `design/plan-draft/measured/measure.py`
- **path constant** (1): 3871
- **vocabulary constant** (41): 509, 817, 1037, 2018, 2340, 2351, 2374, 2396, 2756, 2771, 2773, 2781, 2838, 2840, 2842, 2914, 2916, 3032, 3117, 3271, 3273, 3276, 3278, 3286, 3373, 3374, 3379, 3399, 3402, 3417, 3460, 3462, 3463, 3609, 3667, 3668, 3704, 3747, 3749, 3914, 3960
- **anchor height** (6): 2322, 2363, 2714, 3378, 3577, 3608
- **comment-only** (9): 2683, 2684, 2685, 2707, 2710, 2978, 3007, 3008, 3045

### `design/plan-draft/measured/prompt_lint.py`
- **vocabulary constant** (10): 129, 130, 142, 148, 179, 182, 260, 268, 269, 286
- **anchor height** (5): 38, 143, 146, 147, 149
- **era-medium sentence** (1): 281
- **comment-only** (7): 99, 132, 133, 162, 170, 174, 175

### `design/plan-draft/measured/room_consistency.py`
- **path constant** (2): 751, 873
- **vocabulary constant** (15): 53, 168, 169, 171, 176, 178, 182, 185, 187, 188, 189, 192, 529, 530, 556
- **comment-only** (3): 490, 633, 636

### `design/plan-draft/measured/row23_lib.py`
- **path constant** (1): 1043
- **vocabulary constant** (31): 50, 104, 132, 180, 183, 189, 191, 252, 253, 425, 433, 472, 486, 511, 512, 513, 532, 549, 567, 878, 906, 1031, 1033, 1038, 1045, 1089, 1090, 1092, 1096, 1097, 1103
- **anchor height** (5): 423, 431, 443, 519, 994
- **comment-only** (16): 84, 119, 122, 169, 177, 216, 239, 246, 249, 250, 262, 266, 267, 988, 1081, 1084

### `design/plan-draft/measured/row23_looksheet.py`
- **path constant** (1): 31

### `design/plan-draft/measured/row23_run.py`
- **path constant** (11): 79, 80, 81, 82, 135, 429, 448, 593, 616, 623, 2761
- **vocabulary constant** (13): 2, 48, 231, 240, 266, 413, 495, 550, 620, 1536, 2129, 2297, 2299
- **fixture path** (3): 137, 470, 485
- **comment-only** (12): 171, 176, 187, 259, 421, 551, 2038, 2039, 2041, 2043, 2266, 2291

### `design/plan-draft/measured/row32_holdout.py`
- **path constant** (5): 55, 100, 102, 112, 117
- **vocabulary constant** (5): 24, 34, 99, 183, 189
- **comment-only** (1): 58

### `design/plan-draft/measured/row34_promptaudit.py`
- **comment-only** (3): 84, 95, 189

### `design/plan-draft/measured/row34_run.py`
- **vocabulary constant** (5): 18, 23, 28, 31, 75
- **comment-only** (2): 48, 175

### `design/plan-draft/measured/row35_snap.py`
- **path constant** (4): 197, 198, 199, 1360
- **vocabulary constant** (14): 22, 23, 90, 125, 142, 650, 660, 814, 1137, 1263, 1578, 1632, 1633, 1722
- **fixture path** (1): 200
- **comment-only** (4): 487, 688, 1155, 1166

### `design/plan-draft/measured/row36_assemble.py`
- **vocabulary constant** (3): 5, 37, 51
- **fixture path** (1): 73
- **comment-only** (2): 108, 308

### `design/plan-draft/measured/row36_door_repair_report.py`
- **fixture path** (1): 24

### `design/plan-draft/measured/row41_batch.py`
- **vocabulary constant** (1): 215

### `design/plan-draft/measured/row41_bays.py`
- **vocabulary constant** (16): 24, 110, 351, 352, 358, 523, 574, 585, 643, 663, 732, 739, 740, 750, 788, 944
- **anchor height** (3): 37, 91, 674
- **comment-only** (14): 81, 106, 138, 157, 161, 165, 244, 361, 411, 424, 588, 591, 879, 927

### `design/plan-draft/measured/seam_measure.py`
- **vocabulary constant** (4): 38, 43, 167, 223
- **fixture path** (1): 253

### `design/plan-draft/measured/test_room_consistency.py`
- **vocabulary constant** (11): 55, 116, 125, 126, 143, 144, 155, 156, 157, 158, 169

### `design/plan-draft/measured/test_row40_supersede.py`
- **path constant** (1): 131
- **vocabulary constant** (12): 45, 56, 125, 144, 153, 154, 251, 254, 256, 263, 637, 642
- **comment-only** (5): 85, 95, 96, 99, 108

### `design/plan-draft/measured/test_row41_bays.py`
- **vocabulary constant** (8): 30, 203, 206, 215, 216, 219, 304, 307

### `design/plan-draft/measured/test_window_measure.py`
- **vocabulary constant** (2): 43, 170

### `design/plan-draft/measured/timings_report.py`
- **path constant** (6): 378, 379, 542, 543, 553, 1005
- **vocabulary constant** (5): 416, 554, 567, 662, 912
- **comment-only** (1): 370

### `design/plan-draft/measured/window_measure.py`
- **vocabulary constant** (2): 5, 15
- **anchor height** (2): 45, 303
- **fixture path** (1): 640
- **comment-only** (1): 118

### `src/groundplane.js`
- **comment-only** (5): 66, 124, 352, 387, 455

### `src/harness.js`
- **comment-only** (1): 91

### `src/placeholders.js`
- **path constant** (1): 303
- **vocabulary constant** (49): 118, 119, 155, 184, 247, 249, 250, 269, 271, 279, 281, 282, 301, 308, 310, 311, 534, 535, 536, 537, 538, 557, 558, 559, 562, 585, 586, 587, 589, 591, 606, 607, 628, 629, 653, 654, 687, 688, 716, 769, 801, 802, 803, 804, 805, 809, 907, 908, 909
- **era-medium sentence** (3): 152, 154, 904
- **comment-only** (13): 9, 44, 55, 68, 69, 529, 552, 578, 701, 707, 721, 763, 766

### `src/renderer.js`
- **vocabulary constant** (8): 1060, 1063, 1439, 1440, 1441, 1444, 1447, 1450
- **comment-only** (28): 154, 268, 458, 878, 1156, 1225, 1313, 1365, 1371, 1394, 1408, 1424, 1434, 1437, 1448, 1449, 1584, 1638, 1698, 1702, 1704, 1708, 1752, 1864, 1871, 1988, 1991, 2074

### `tools/bake-fixtures.mjs`
- **fixture path** (1): 42
- **comment-only** (4): 16, 78, 79, 175

### `tools/bake-library.mjs`
- **comment-only** (2): 7, 19

### `tools/edge-seed.mjs`
- **vocabulary constant** (1): 483
- **comment-only** (4): 55, 215, 513, 559

### `tools/emit-evolution.mjs`
- **path constant** (2): 395, 652
- **vocabulary constant** (3): 177, 462, 576
- **comment-only** (3): 14, 15, 404

### `tools/evolution-arms.mjs`
- **vocabulary constant** (19): 49, 186, 226, 353, 390, 406, 434, 447, 512, 587, 783, 798, 980, 1129, 1137, 1187, 1414, 1418, 1498
- **era-medium sentence** (1): 415
- **fixture path** (1): 1242
- **comment-only** (14): 18, 19, 42, 47, 53, 85, 262, 1116, 1267, 1276, 1291, 1355, 1396, 1405

### `tools/flight-evidence.mjs`
- **comment-only** (1): 38

### `tools/frame-language.mjs`
- **vocabulary constant** (2): 695, 840
- **era-medium sentence** (2): 694, 1160
- **comment-only** (18): 5, 15, 19, 300, 303, 346, 356, 434, 479, 507, 543, 700, 791, 812, 838, 841, 1118, 1142

### `tools/grant-content-gap.mjs`
- **path constant** (2): 52, 57
- **vocabulary constant** (3): 77, 89, 305
- **fixture path** (1): 381
- **comment-only** (2): 11, 228

### `tools/grant-row34-extension.mjs`
- **path constant** (2): 43, 134
- **vocabulary constant** (1): 51

### `tools/make-scaffold.mjs`
- **path constant** (12): 1100, 1105, 1116, 1267, 1299, 1321, 1344, 2493, 2788, 3229, 3839, 4158
- **vocabulary constant** (41): 79, 132, 498, 505, 506, 538, 921, 943, 1001, 1104, 1106, 1240, 1382, 1431, 1436, 1454, 1577, 1585, 1634, 1977, 2090, 2328, 2355, 2393, 2419, 2428, 2518, 2560, 2575, 2633, 2691, 2719, 2820, 2840, 2879, 3889, 3921, 3953, 4176, 4272, 4320
- **anchor height** (4): 123, 135, 1628, 1793
- **era-medium sentence** (5): 1615, 1626, 2039, 2086, 4529
- **fixture path** (9): 1127, 1152, 1328, 2427, 2767, 3770, 4150, 4232, 4542
- **comment-only** (62): 4, 24, 83, 121, 122, 128, 410, 490, 491, 495, 562, 753, 1468, 1804, 1826, 1831, 1832, 1837, 1859, 1955, 2016, 2023, 2046, 2061, 2062, 2109, 2132, 2133, 2135, 2162, 2214, 2215, 2227, 2293, 2294, 2312, 2322, 2323, 2366, 2372, 2388, 2410, 2601, 2781, 3005, 3062, 3119, 3120, 3142, 3143, 3316, 3318, 3324, 3417, 3418, 3426, 3440, 3459, 3916, 4616, 4617, 4642

### `tools/plan-projection.mjs`
- **path constant** (1): 2148
- **vocabulary constant** (11): 2008, 2104, 2109, 2115, 2141, 2150, 2250, 2252, 2318, 2346, 2357
- **fixture path** (1): 2502
- **comment-only** (9): 554, 599, 618, 643, 699, 776, 833, 1442, 1849

### `tools/promote-backdrop.mjs`
- **vocabulary constant** (2): 651, 863
- **fixture path** (1): 67
- **comment-only** (20): 13, 195, 204, 205, 206, 207, 239, 278, 395, 460, 490, 535, 595, 734, 805, 823, 873, 934, 938, 944

### `tools/room-voices.mjs`
- **path constant** (2): 955, 1182
- **vocabulary constant** (130): 94, 106, 107, 113, 115, 117, 120, 121, 125, 126, 127, 129, 131, 132, 133, 141, 143, 144, 145, 151, 153, 155, 156, 157, 165, 167, 168, 169, 174, 175, 176, 183, 186, 187, 193, 195, 196, 198, 199, 205, 207, 209, 210, 211, 217, 219, 221, 232, 241, 244, 264, 282, 300, 301, 302, 306, 311, 313, 320, 322, 336, 337, 338, 342, 343, 369, 370, 371, 415, 422, 545, 554, 615, 663, 871, 877, 883, 889, 892, 893, 895, 898, 901, 903, 906, 907, 909, 910, 912, 915, 917, 918, 920, 923, 924, 926, 930, 974, 980, 986, 1016, 1019, 1053, 1058, 1059, 1061, 1066, 1067, 1087, 1092, 1093, 1095, 1147, 1149, 1150, 1151, 1152, 1153, 1154, 1162, 1163, 1164, 1165, 1169, 1171, 1172, 1173, 1174, 1175, 1176
- **anchor height** (6): 276, 304, 305, 340, 341, 868
- **era-medium sentence** (5): 92, 163, 181, 229, 325
- **fixture path** (1): 1530
- **comment-only** (39): 4, 9, 10, 14, 16, 39, 41, 44, 47, 54, 57, 66, 98, 101, 375, 431, 508, 517, 535, 559, 621, 651, 710, 825, 826, 830, 833, 842, 843, 846, 854, 1142, 1143, 1156, 1157, 1192, 1284, 1294, 1301

### `tools/style-seed.mjs`
- **path constant** (1): 66
- **fixture path** (1): 321
- **comment-only** (1): 22

### `tools/validate-fixtures.mjs`
- **vocabulary constant** (2): 777, 1238
- **fixture path** (1): 2012
- **comment-only** (16): 61, 94, 101, 112, 284, 319, 331, 371, 1222, 1261, 1297, 1302, 1328, 1396, 1402, 1575

### `tools/validate-plan.mjs`
- **vocabulary constant** (1): 1101
- **fixture path** (1): 1851
- **comment-only** (16): 46, 137, 273, 346, 430, 697, 1073, 1088, 1182, 1495, 1506, 1508, 1618, 1650, 1661, 1745

## What step 0 must move

Load-bearing (a constant the engine reads): **619** hits — everything but the 338 comment-only ones. The pack files claim them as:

- `plan.json` — the plan itself (the fixture-path hits: `fixtures/demo-study/plan.json`).
- `voices.json` — the room voice table, MATERIALS, SAID_BEFORE and the per-room anchors (vocabulary + anchor-height hits, overwhelmingly `tools/room-voices.mjs`).
- `world.json` — the era and medium sentences, the ruler kind and height (0.95 m) with the window sill/head bands, the outdoor/interior refusal word lists, and the batch / fixture / store directories (era, anchor-height and path hits).
- `pack.json` — names the pack and its three files.

Comment-only hits are prose about the manor in docblocks. Clause 8 forbids the theme in *code*; a comment narrating why a clause exists is history, not a constant, and is left alone unless the code beside it moves.

