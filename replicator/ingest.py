"""The replicator ingester — CLI (blueprint §9).

This module is a **thin wrapper** and nothing else: it parses flags, decodes
files with PIL, calls `pipeline.ingest_sprite` once, and writes what comes back.
Every stage lives in an importable pure function beside it (blueprint §4b rule
1), so a future live host imports the same functions and feeds them frames off a
wire instead of a disk. A test proves the thinness rather than asserting it, by
byte-comparing the pure pipeline's encoded outputs against the files written
here.

    python3 -m replicator.ingest IMAGE --id desk-joined-oak-1660 \\
        --noun "joined oak writing desk" --archetype sliding \\
        --attachment floor_against --height-m 0.78 --width-m 1.30 --depth-m 0.55 \\
        --view-side left \\
        [--part drawer_front:MASK.png --slide -0.10,0.24,1.06] \\
        [--anchor surface_top:x0,y0,x1,y1] [--footprint x0,x1] \\
        [--state open:IMG --state-datum x0,y0,x1,y1 | --state-origin open:x,y] \\
        [--takeable] [--out library/] [--preview-dir DIR] [--report R.json]
        [--check] [--json]

Exit codes partition by **who must act**, because the asset seat's autonomous
lane branches on them (`Where it goes`: "on gate-(e) light warnings: regenerate
once, then flag"), and exit 0 covers pass-with-warnings:

    0  pass (warnings allowed)
    2  content failure — regenerate the source
    3  invocation failure — fix the command
    4  contract failure — replicator/contract.json itself is wrong
    5  class failure — the object is outside what the frozen thresholds cover;
       the Navigator decides, via the contract's `classes` amendment path
"""

import argparse
import json
import os
import shutil
import sys

import numpy as np

from . import anchors as anchors_mod
from . import contract as contract_mod

from . import matte as matte_mod
from . import parts as parts_mod
from . import pipeline as pipeline_mod
from . import states as states_mod

EXIT_OK = 0
EXIT_CONTENT = 2
EXIT_USAGE = 3
EXIT_CONTRACT = 4
EXIT_CLASS = 5


def environment():
    """Recorded in provenance: the byte-determinism claim is scoped to it.

    Resolved HERE, in the CLI, and passed *into* the pure layer — a pure stage
    that reads its own interpreter's version is not a function of its arguments.
    """
    import numpy
    import PIL
    return {"python": "%d.%d.%d" % sys.version_info[:3],
            "numpy": numpy.__version__, "pillow": PIL.__version__}


def _read_rgb(path):
    from PIL import Image
    try:
        return np.array(Image.open(path).convert("RGB"))
    except OSError as e:
        raise pipeline_mod.IngestError("cannot read image %s: %s" % (path, e))


def _write_rgba(arr, path):
    from PIL import Image
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(arr, "RGBA").save(path)


def _write_rgb(arr, path):
    from PIL import Image
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(arr[..., :3], "RGB").save(path)


def _parse_pair(text, flag):
    parts = text.split(",")
    if len(parts) != 2:
        raise pipeline_mod.IngestError("%s wants two numbers x,y — got %r" % (flag, text))
    return tuple(float(p) for p in parts)


def _parse_slide(text):
    parts = text.split(",")
    if len(parts) != 3:
        raise pipeline_mod.IngestError(
            "--slide wants dx,dy,scale_open — got %r. There is no honest default travel for a "
            "drawer nobody measured; the ingester checks the value you give against the "
            "clearance its own cavity needs." % text)
    dx, dy, sc = (float(p) for p in parts)
    return {"dx": dx, "dy": dy, "scale_open": sc}


def build_parser():
    p = argparse.ArgumentParser(prog="replicator.ingest", add_help=True,
                                description="Ingest one generated image into a library sprite.")
    p.add_argument("image", help="the source image (blueprint §9's IMAGE)")
    p.add_argument("--id", required=True)
    p.add_argument("--noun", required=True)
    p.add_argument("--archetype", required=True)
    p.add_argument("--attachment", required=True)
    p.add_argument("--height-m", type=float, required=True)
    p.add_argument("--width-m", type=float, required=True,
                   help="from period reference — never derived through §5's unsettled camera")
    p.add_argument("--depth-m", type=float, required=True, help="likewise")
    p.add_argument("--view-side", default=None)
    p.add_argument("--takeable", action="store_true")
    p.add_argument("--airborne", action="store_true")
    p.add_argument("--source", default="generated")
    p.add_argument("--object-class", default=None,
                   help="selects a `classes` override in contract.json, if one exists")
    p.add_argument("--period-earliest", type=int, default=None)
    p.add_argument("--period-latest", type=int, default=None)
    p.add_argument("--period-region", default=None)
    p.add_argument("--anchor", action="append", default=[], metavar="NAME:x0,y0,x1,y1",
                   help="a manual anchor region, in SOURCE image coordinates")
    p.add_argument("--footprint", default=None, metavar="x0,x1",
                   help="override the derived ground-contact extent, SOURCE coordinates")
    p.add_argument("--part", action="append", default=[], metavar="ID:MASK.png")
    p.add_argument("--slide", action="append", default=[], metavar="dx,dy,scale_open")
    p.add_argument("--state", action="append", default=[], metavar="NAME:IMAGE.png")
    p.add_argument("--state-origin", action="append", default=[], metavar="NAME:x,y")
    p.add_argument("--state-datum", action="append", default=[], metavar="x0,y0,x1,y1",
                   help="a feature present in BOTH state images; the origin is derived from it")
    p.add_argument("--out", default="library")
    p.add_argument("--preview-dir", default=None,
                   help="where the dark/light composited previews go; never inside --out")
    p.add_argument("--report", default=None)
    p.add_argument("--check", action="store_true",
                   help="run everything, write nothing, exit the code it would have exited")
    p.add_argument("--json", action="store_true", help="the report on stdout, nothing else")
    p.add_argument("--contract", default=contract_mod.CONTRACT_PATH)
    return p


def _collect_parts(args):
    if len(args.slide) != len(args.part):
        raise pipeline_mod.IngestError(
            "%d --part and %d --slide: each part needs exactly one slide, in the same order"
            % (len(args.part), len(args.slide)))
    out = []
    for spec, slide in zip(args.part, args.slide):
        if ":" not in spec:
            raise pipeline_mod.IngestError("--part wants ID:MASK.png — got %r" % spec)
        pid, path = spec.split(":", 1)
        from PIL import Image
        try:
            mask_img = np.array(Image.open(path))
        except OSError as e:
            raise pipeline_mod.IngestError("cannot read part mask %s: %s" % (path, e))
        out.append({"id": pid.strip(), "mask": parts_mod.mask_from_image(mask_img),
                    "slide": _parse_slide(slide), "mask_path": path})
    return out


def _collect_states(args):
    origins = dict(states_mod.parse_state_origin(t) for t in args.state_origin)
    data = [states_mod.parse_datum(t) for t in args.state_datum]
    out = []
    for i, spec in enumerate(args.state):
        if ":" not in spec:
            raise pipeline_mod.IngestError("--state wants NAME:IMAGE.png — got %r" % spec)
        name, path = spec.split(":", 1)
        name = name.strip()
        out.append({"name": name, "source_rgb": _read_rgb(path),
                    "origin": origins.get(name),
                    "datum": data[i] if i < len(data) else (data[0] if data else None)})
    return out


def _prune(directory, keep, subdir):
    """Delete artifacts in `library/<id>/<subdir>` the new record does not name."""
    d = os.path.join(directory, subdir)
    if not os.path.isdir(d):
        return []
    removed = []
    for name in sorted(os.listdir(d)):
        if name not in keep:
            os.remove(os.path.join(d, name))
            removed.append(os.path.join(subdir, name))
    if not os.listdir(d):
        shutil.rmtree(d)
    return removed


def run(args):
    contract = contract_mod.load(args.contract)
    source = _read_rgb(args.image)

    regions = {}
    for text in args.anchor:
        name, rect = anchors_mod.parse_region(text)
        regions[name] = rect
    footprint = None
    if args.footprint:
        footprint = _parse_pair(args.footprint, "--footprint")

    part_specs = _collect_parts(args)
    for spec in part_specs:
        spec["source_rgb"] = source
    state_specs = _collect_states(args)

    period = None
    if args.period_earliest or args.period_latest or args.period_region:
        base = dict(contract["ingest"]["period"])
        base.pop("authority", None)
        base.pop("basis", None)
        if args.period_earliest:
            base["earliest"] = args.period_earliest
        if args.period_latest:
            base["latest"] = args.period_latest
        if args.period_region:
            base["region"] = args.period_region
        period = base
    else:
        period = {k: v for k, v in contract["ingest"]["period"].items()
                  if k in ("earliest", "latest", "region")}

    result = pipeline_mod.ingest_sprite(
        source_rgb=source, contract=contract, sprite_id=args.id, noun=args.noun,
        archetype=args.archetype, attachment=args.attachment,
        dims_m={"h": args.height_m, "w": args.width_m, "d": args.depth_m},
        view_side=args.view_side, period=period, takeable=args.takeable,
        airborne=args.airborne, source=args.source, object_class=args.object_class,
        environment=environment(), anchor_regions=regions, footprint_src=footprint,
        part_specs=part_specs, state_specs=state_specs)

    written = []
    if result.ok and not args.check:
        target = os.path.join(args.out, args.id)
        os.makedirs(target, exist_ok=True)
        from . import record as record_mod
        _write_rgba(result.body, os.path.join(target, "sprite.png"))
        written.append(os.path.join(target, "sprite.png"))
        for pid, arr in sorted(result.parts.items()):
            path = os.path.join(target, "parts", "%s.png" % pid)
            _write_rgba(arr, path)
            written.append(path)
        for sname, arr in sorted(result.states.items()):
            path = os.path.join(target, "states", "%s.png" % sname)
            _write_rgba(arr, path)
            written.append(path)
        if result.thumb is not None:
            _write_rgba(result.thumb, os.path.join(target, "thumb.png"))
            written.append(os.path.join(target, "thumb.png"))
        rec_path = os.path.join(target, "record.json")
        with open(rec_path, "w", encoding="utf-8") as fh:
            fh.write(record_mod.to_json(result.record))
        written.append(rec_path)
        _prune(target, {"%s.png" % p for p in result.parts}, "parts")
        _prune(target, {"%s.png" % s for s in result.states}, "states")

    # Previews live OUTSIDE the library: blueprint §2 defines library/<id>/ as
    # the sprite's shipped contents and row 4's bake reads it.
    if args.preview_dir and not args.check:
        for name, arr in sorted(result.previews.items()):
            path = os.path.join(args.preview_dir, "%s-preview-%s.png" % (args.id, name))
            _write_rgb(arr, path)
            written.append(path)

    return result, written


def report_of(result, args, written, exit_code):
    rec = result.record or {}
    return {
        "tool": "replicator-ingest-v1",
        "contract": rec.get("provenance", {}).get("contract", {}),
        "environment": rec.get("provenance", {}).get("environment", {}),
        "id": args.id,
        "source": args.image,
        "written": written,
        "ok": bool(result.ok),
        "exit_code": exit_code,
        "gates": [{k: g[k] for k in ("id", "severity", "passed", "measured", "threshold",
                                     "message")} for g in result.gates],
        "warnings": result.warnings,
        "failures": result.failures,
        "derived": result.derived,
        "measured": result.measured,
    }


def human(result, args, written, exit_code):
    lines = ["%s  %s" % (args.id, "PASS" if result.ok else "FAIL")]
    for i, g in enumerate(result.gates, 1):
        mark = "ok  " if g["passed"] else ("FAIL" if g["severity"] == "hard" else "warn")
        lines.append("  %2d. [%s] %-12s %s" % (i, mark, g["id"], g["message"]))
    if written:
        lines.append("  wrote:")
        lines.extend("    %s" % w for w in written)
    elif args.check:
        lines.append("  --check: nothing written")
    elif not result.ok:
        lines.append("  nothing written — the library directory is never left half-built")
    lines.append("  exit %d" % exit_code)
    return "\n".join(lines)


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        result, written = run(args)
    except contract_mod.ContractError as e:
        print("contract: %s" % e, file=sys.stderr)
        return EXIT_CONTRACT
    except matte_mod.MatteError as e:
        print("content: %s" % e, file=sys.stderr)
        return EXIT_CONTENT
    except (pipeline_mod.IngestError, parts_mod.PartError, states_mod.StateError,
            anchors_mod.AnchorError) as e:
        print("usage: %s" % e, file=sys.stderr)
        return EXIT_USAGE
    except ValueError as e:
        print("usage: %s" % e, file=sys.stderr)
        return EXIT_USAGE

    exit_code = EXIT_OK if result.ok else EXIT_CONTENT
    rep = report_of(result, args, written, exit_code)
    if args.report:
        d = os.path.dirname(os.path.abspath(args.report))
        os.makedirs(d, exist_ok=True)
        with open(args.report, "w", encoding="utf-8") as fh:
            json.dump(rep, fh, sort_keys=True, indent=2)
            fh.write("\n")
    if args.json:
        json.dump(rep, sys.stdout, sort_keys=True, indent=2)
        sys.stdout.write("\n")
    else:
        print(human(result, args, written, exit_code), file=sys.stderr)
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
