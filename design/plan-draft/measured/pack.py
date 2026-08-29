#!/usr/bin/env python3
"""pack.py — the location, as data, for the measured instruments.

The Python twin of `tools/pack.mjs`. Same four files under `packs/<name>/`,
same resolution order (`--pack <name>` / `--pack=<name>`, else `HOLO_PACK`,
else `manor`), and the SAME THREE REFUSALS, made before an image can exist:

  1. A PACK WITH NO RULER. Every instrument in this directory converts pixels
     to metres by dividing a measured horizontal by the ruler's height. A pack
     that declares no ruler is not a location that measures badly — it is one
     that cannot be measured at all.
  2. A ROOM WITH NO VOICE, BY NAME. A default voice is how one world's
     materials reach another world's room.
  3. A VOICE NAMING AN ANCHOR THE PACK DOES NOT DEFINE.

WHY A SECOND LOADER RATHER THAN A SHELL-OUT: the measured instruments run
without node in the loop (row 33's timings prove it), and a refusal that has to
cross a process boundary is a refusal that can be lost in a pipe. The two
loaders read the same JSON and must refuse the same packs; `tests/` holds the
pack whose ruler is deleted, and both must name it.

`design/production-law.md` clause 8: the theme never bleeds into the code.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
PACKS_DIR = os.path.join(REPO, "packs")

#: The default, for as long as every caller means the manor when it says
#: nothing. Not a fallback for an unknown name — an unknown name refuses.
DEFAULT_PACK = "manor"


class PackRefused(Exception):
    """A pack that cannot be built from. Always names the pack and the fault."""


def _refuse(name, msg):
    raise PackRefused("pack `%s`: %s" % (name, msg))


def active_pack_name(argv=None, env=None):
    """`--pack <name>` / `--pack=<name>` wins, then `HOLO_PACK`, then manor."""
    argv = sys.argv if argv is None else argv
    env = os.environ if env is None else env
    for i, a in enumerate(argv):
        if a == "--pack" and i + 1 < len(argv) and not argv[i + 1].startswith("--"):
            return argv[i + 1]
        if a.startswith("--pack="):
            return a[len("--pack="):]
    if env.get("HOLO_PACK"):
        return env["HOLO_PACK"]
    return DEFAULT_PACK


def strip_pack_args(argv):
    """argv without the `--pack` selection, so a tool's file arguments are its
    file arguments. The selection is read by `active_pack_name` from the whole
    argv; every caller that also takes positional paths needs this."""
    out, skip = [], False
    for i, a in enumerate(argv):
        if skip:
            skip = False
            continue
        if a == "--pack" and i + 1 < len(argv) and not argv[i + 1].startswith("--"):
            skip = True
            continue
        if a.startswith("--pack="):
            continue
        out.append(a)
    return out


def _read_json(name, path, what):
    if not os.path.exists(path):
        _refuse(name, "%s is missing — `%s` does not exist" % (what, path))
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except ValueError as e:
        _refuse(name, "%s at `%s` is not readable JSON: %s" % (what, path, e))


def _under_root(p):
    return p if os.path.isabs(p) else os.path.normpath(os.path.join(REPO, p))


_CACHE = {}


class Pack(object):
    """A loaded, validated pack. Attribute access for what instruments read."""

    def __init__(self, name, directory, files, plan, voices, world):
        self.name = name
        self.dir = directory
        self.files = files
        self.plan = plan
        self.voices = voices
        self.world = world
        self.ruler = world["ruler"]
        p = world.get("paths", {})
        self.paths = {
            "plan": os.path.join(directory, files["plan"]),
            "batch_dir": _under_root(p["batch_dir"]) if p.get("batch_dir") else None,
            "fixture_dir": _under_root(p["fixture_dir"]) if p.get("fixture_dir") else None,
            "store_dir": _under_root(p["store_dir"]) if p.get("store_dir") else None,
            "readings_dir": _under_root(p["readings_dir"]) if p.get("readings_dir") else None,
            "world_query": p.get("world_query"),
        }

    # -- the numbers every instrument used to type as a literal --------------
    @property
    def ruler_height_m(self):
        """The one divisor. `rail_above / ruler_height_m` is a length in metres."""
        return float(self.ruler["height_m"])

    @property
    def ruler_datum(self):
        """What the ruler's height is measured from — `floor`, `ground`, ..."""
        return self.ruler.get("datum", "floor")

    @property
    def ruler_name(self):
        """The ruler's name in this world's own language, for a message."""
        for r in self.world.get("rulers", []):
            if abs(float(r["size_m"]) - self.ruler_height_m) < 1e-9 and \
                    self.ruler["kind"].replace("_", " ").split()[0] in r["name"].lower():
                return r["name"]
        return self.ruler["kind"].replace("_", " ")

    def convention(self, key):
        """A vertical a plan view cannot hold: window_sill_m, window_head_m,
        door_head_m, light_module_m. Refuses by name rather than defaulting —
        a silent 0 is another world's building practice."""
        c = self.world.get("conventions", {})
        if key not in c:
            _refuse(self.name, "world.json declares no convention `%s`. A plan view holds no "
                               "vertical dimension, so this world must state it: the "
                               "conventions it does state are: %s"
                    % (key, ", ".join(sorted(k for k in c if not k.endswith("_why"))) or "(none)"))
        return c[key]

    def refusal(self, key):
        """A refusal word list, as a regex source string. Refuses by name."""
        r = self.world.get("refusals", {})
        if key not in r:
            _refuse(self.name, "world.json declares no refusal list `%s` — it holds: %s"
                    % (key, ", ".join(sorted(k for k in r if not k.endswith("_why"))) or "(none)"))
        return r[key]

    def why(self, key):
        """The justification beside a refusal list, in this world's own words.
        Empty when the pack states none: a message may quote it, never require
        it. This is how the lint's prose stopped being the manor's prose."""
        return self.world.get("refusals", {}).get(key + "_why", "")

    @property
    def rulers(self):
        """[(compiled match, size_m, name)] — the rulers the gate actually has."""
        import re
        out = []
        for r in self.world.get("rulers", []):
            out.append((re.compile(r["match"], re.I), float(r["size_m"]), r["name"]))
        return out


def load_pack(name=None):
    """Load a pack, validated. Raises PackRefused, naming the pack and the
    offending room or voice, on any of the three refusals in the header."""
    if name is None:
        name = active_pack_name()
    if name in _CACHE:
        return _CACHE[name]
    directory = os.path.join(PACKS_DIR, name)
    if not os.path.isdir(directory):
        have = sorted(d for d in os.listdir(PACKS_DIR)
                      if os.path.isdir(os.path.join(PACKS_DIR, d))) \
            if os.path.isdir(PACKS_DIR) else []
        _refuse(name, "there is no such pack. `packs/` holds: %s" % (", ".join(have) or "(none)"))
    manifest = _read_json(name, os.path.join(directory, "pack.json"), "pack.json")
    files = manifest.get("files", {})
    for k in ("plan", "voices", "world"):
        if not files.get(k):
            _refuse(name, "pack.json names no `%s` file — a pack is plan.json, voices.json and "
                          "world.json, and all three are required" % k)
    plan = _read_json(name, os.path.join(directory, files["plan"]), "plan.json")
    voices = _read_json(name, os.path.join(directory, files["voices"]), "voices.json")
    world = _read_json(name, os.path.join(directory, files["world"]), "world.json")

    # -- Refusal 1: the ruler ------------------------------------------------
    ruler = world.get("ruler")
    if not isinstance(ruler, dict):
        _refuse(name, "world.json declares no `ruler`. Every instrument converts pixels to metres "
                      "by dividing a measured horizontal by the ruler's height, so a pack with no "
                      "ruler is not a location that measures badly — it is one that cannot be "
                      "measured at all. Declare `ruler: { kind, height_m }` naming a continuous "
                      "horizontal the painter will draw and the instrument can find.")
    if not ruler.get("kind"):
        _refuse(name, "world.json's `ruler` names no `kind` — the anchor id it points at in "
                      "voices.json")
    h = ruler.get("height_m")
    if not isinstance(h, (int, float)) or isinstance(h, bool) or not h > 0:
        _refuse(name, "world.json's ruler declares height_m `%r`, which is not a positive number "
                      "of metres" % (h,))
    anchors = voices.get("ANCHORS", {})
    if ruler["kind"] not in anchors:
        _refuse(name, "world.json rules the anchor `%s` and voices.json does not define it — it "
                      "holds: %s" % (ruler["kind"], ", ".join(sorted(anchors)) or "(no anchors at all)"))

    # -- Refusal 3: a voice naming an anchor that does not exist -------------
    vs = voices.get("VOICES", {})
    if not vs:
        _refuse(name, "voices.json defines no voices at all")
    for vid, v in sorted(vs.items()):
        if not v.get("anchor"):
            _refuse(name, "voice `%s` names no anchor" % vid)
        if v["anchor"] not in anchors:
            _refuse(name, "voice `%s` names anchor `%s`, which voices.json does not define"
                    % (vid, v["anchor"]))

    # -- Refusal 2: a room with no voice, BY NAME ---------------------------
    room_voice = voices.get("ROOM_VOICE", {})
    arch = voices.get("ARCHETYPE_FALLBACK", {})
    typ = voices.get("TYPE_FALLBACK", {})
    open_voice = voices.get("OPEN_FACING_VOICE")
    for room in plan.get("rooms", []):
        facings = room.get("facings", {})
        needs = any((facings.get(f) or {}).get("type") != "open" for f in facings)
        if not needs:
            if not open_voice or open_voice not in vs:
                _refuse(name, "room `%s` is open on every facing and voices.json names no "
                              "`OPEN_FACING_VOICE` for a wall line with nothing built at it"
                        % room.get("id"))
            continue
        vid = room_voice.get(room.get("id")) or arch.get(room.get("archetype")) \
            or typ.get(room.get("type"))
        if not vid:
            _refuse(name, "room `%s` resolves to no voice — its id is not in ROOM_VOICE, its "
                          "archetype `%s` is not in ARCHETYPE_FALLBACK and its type `%s` is not in "
                          "TYPE_FALLBACK. Give it a voice in this pack's own language with its "
                          "justification; a room never silently becomes another world's room."
                    % (room.get("id"), room.get("archetype"), room.get("type")))
        if vid not in vs:
            _refuse(name, "room `%s` resolves to voice `%s`, which voices.json does not define"
                    % (room.get("id"), vid))

    pack = Pack(name, directory, files, plan, voices, world)
    _CACHE[name] = pack
    return pack


def active_pack():
    """The active pack, loaded once. The common case in every instrument."""
    return load_pack(active_pack_name())


def reset_cache():
    """Only tests that load several packs in one process need this."""
    _CACHE.clear()


if __name__ == "__main__":
    try:
        p = load_pack(active_pack_name())
    except PackRefused as e:
        print("REFUSED %s" % e)
        sys.exit(1)
    print("ok      pack `%s` at %s" % (p.name, os.path.relpath(p.dir, REPO)))
    print("        ruler: %s at %.2f m above the %s" %
          (p.ruler["kind"], p.ruler_height_m, p.ruler_datum))
    print("        rooms: %d, rulers: %d" % (len(p.plan.get("rooms", [])), len(p.rulers)))
