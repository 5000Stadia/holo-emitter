#!/usr/bin/env python3
"""The deterministic landing loop [Kabe, 2026-09-01: "The process needs to be
automated because we are trying to build the deterministic engine to do this
automatically, and we want to improve to minimize retries."]

One wall, hands off: emit the retry packet -> order the seat by AgentPost mail
-> wait for the rolls -> sweep -> the loop's own exits judge (camera, warp
finisher inside CLOSE, provenance) -> promoted or next pair, until the roll
budget is spent. Every ask is compliant by construction (the emitter appends
the voice record); every roll is judged by the standing instruments only.

Usage: HOLO_PACK=<pack> python3 tools/roll-loop.py --wall <loc/F> --budget <rolls>
       [--guide close [--precomp z] [--from-wall <lead loc/F>]]

--guide close [2026-09-01]: before every pair the wall's Image 1 is rebuilt by
tools/close-guide.py from its best roll, zoomed z about the vanishing point so
the painter's uniform shrink hands back the ruled picture; after every pair z
is learned from the pair's own measured scale (z <- z / scale, clamped to
[1.0, 1.3] and to the row that keeps the cornice in frame). Each step is
appended to design/batches/<pack>/guide-loop.jsonl.
"""
import argparse, json, os, subprocess, sys, tempfile, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.environ.get("HOLO_PACK", "underground-2")
BATCH = os.path.join(ROOT, "design", "batches", PACK)
STATE = os.path.join(BATCH, "run-state.json")
RETRIES = os.path.join(BATCH, "retries.json")
CORRECTION = ("constrained surface completion: hold the fixed far-wall corners and the "
              "declared depth exactly as Image 1 draws them; nothing finished may change")

def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT, **kw)

def dispatch(order):
    """The seat is a Codex thread in the `holoemitter-assets` tmux pane. Mail
    reaches it only while its AgentPost hooks are live (hospital-3 step 4 found
    the order QUEUED and never woken); typing into the pane needs no adapter.
    HOLO_DISPATCH=mail keeps the mail route; the default is the pane."""
    if os.environ.get("HOLO_DISPATCH", "tmux") == "mail":
        return sh(["agentpost", "message", "holoemitter-assets", order, "--notify", "immediate"])
    # A long order lands in the composer as a paste; the Enter that rides in
    # the same send-keys is swallowed while the paste settles (liner-3 phase 1
    # sat unsent for eight minutes). Type, let it settle, then submit - and
    # check the pane actually went to work.
    m = sh(["tmux", "send-keys", "-t", "holoemitter-assets:0.0", "-l", order])
    if m.returncode != 0:
        return m
    time.sleep(1.0)
    m = sh(["tmux", "send-keys", "-t", "holoemitter-assets:0.0", "Enter"])
    for _ in range(10):
        time.sleep(1.0)
        pane = sh(["tmux", "capture-pane", "-p", "-t", "holoemitter-assets:0.0"]).stdout
        if "esc to interrupt" in pane:
            return m
    return sh(["tmux", "send-keys", "-t", "holoemitter-assets:0.0", "Enter"])

def wall_state(key):
    return json.load(open(STATE))["walls"].get(key, {})

GUIDE_CORRECTION = ("Image 1 is already drawn at the ruled scale for this camera; return the same "
                    "picture at exactly the same size - the wall must not come back smaller, "
                    "farther away, or with more ceiling and floor around it than Image 1 shows")


def set_retry(key, correction=None):
    rs = json.load(open(STATE))
    w = rs["walls"][key]
    w["status"] = "retry"
    if correction:
        w["correction"] = correction
    w.setdefault("correction", CORRECTION)
    if not w.get("correction"):
        w["correction"] = CORRECTION
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(STATE)); os.close(fd)
    json.dump(rs, open(tmp, "w"), indent=1)
    json.load(open(tmp))
    os.replace(tmp, STATE)

def latest_rolls(key):
    r = json.load(open(RETRIES))
    es = [x for x in r["entries"] if x["key"] == key]
    e = max(es, key=lambda x: x["attempt"])
    return e["attempt"], [(x["id"], x["candidate"]) for x in e["rolls"]]

GUIDE_LOG = os.path.join(BATCH, "guide-loop.jsonl")
Z_MIN, Z_MAX = 0.85, 1.3
# The painted scale the guide aims the painter at. With a close guide as Image
# 1 the painter returns the picture within ~1% of the guide's own scale
# (gallery/N: z 1.0954 -> 1.104/1.091, z 1.0 -> 1.007/0.994), so the target
# is chosen for the FINISHER, not for the gate: the warp exit enlarges a
# slightly-small painting to the ruled camera by cropping (0 px revealed) but
# can only shrink a large one by revealing frame edge (1.043 -> 8.6%, over the
# 8% budget). A hair under ruled lands every roll inside the warp's 1.075
# stretch with nothing revealed.
Z_TARGET = 0.975


def close_measure(key, roll):
    r = sh(["python3", "tools/close-guide.py", "--wall", key, "--measure", os.path.join(ROOT, roll)],
           env={**os.environ, "HOLO_PACK": PACK})
    try:
        return json.loads(r.stdout.strip().splitlines()[-1])
    except Exception:
        return None


def z_ceiling(key):
    """The largest zoom that still keeps the ruled cornice row in the picture."""
    r = sh(["python3", "tools/close-guide.py", "--wall", key, "--ruled"],
           env={**os.environ, "HOLO_PACK": PACK})
    g = json.loads(r.stdout.strip().splitlines()[-1])
    return (g["vp_y"] - 8.0) / max(1e-6, g["vp_y"] - g["ceiling_y"])


def clamp_z(z, zcap):
    return max(Z_MIN, min(Z_MAX, zcap, z))


def build_close_guide(key, z, from_wall=None):
    cmd = ["python3", "tools/close-guide.py", "--wall", key, "--precomp", f"{z:.4f}"]
    if from_wall:
        cmd += ["--from-wall", from_wall]
    r = sh(cmd, env={**os.environ, "HOLO_PACK": PACK})
    out = r.stdout.strip().splitlines()[-1] if r.stdout.strip() else ""
    try:
        return json.loads(out)
    except Exception:
        print("GUIDE FAILED:", r.stdout[-300:], r.stderr[-300:], flush=True)
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wall", required=True)
    ap.add_argument("--budget", type=int, default=8)
    ap.add_argument("--wait-mins", type=int, default=40)
    ap.add_argument("--guide", choices=["none", "close"], default="none")
    ap.add_argument("--precomp", type=float, default=None,
                    help="starting zoom for --guide close (default: 1/mean scale of the wall's rolls)")
    ap.add_argument("--from-wall", dest="from_wall", default=None,
                    help="cut the close guide from this wall's promoted asset (a follower from its lead)")
    a = ap.parse_args()
    key = a.wall
    loc, f = key.split("/")
    spent = 0
    z = None
    if a.guide == "close":
        zcap = z_ceiling(key)
        if a.precomp is None:
            # unguided rolls carry the painter's shrink bias and say nothing
            # about how it reproduces a guide, so the first guided pair starts
            # at the target itself
            z = clamp_z(Z_TARGET, zcap)
        else:
            z = clamp_z(a.precomp, zcap)
        print(f"guide close: z0 {z:.4f} (cap {zcap:.4f})", flush=True)
    while True:
        st = wall_state(key)
        if st.get("status") == "promoted" and os.path.exists(
                os.path.join(ROOT, "backdrops", loc, f + ".png")):
            print(f"LANDED: {key} promoted after {spent} loop roll(s)", flush=True)
            return 0
        if spent >= a.budget:
            print(f"BUDGET SPENT: {key} not landed in {spent} rolls; parked for the Captain", flush=True)
            return 1
        if a.guide == "close":
            g = build_close_guide(key, z, a.from_wall)
            if not g:
                return 5
            with open(GUIDE_LOG, "a") as fh:
                fh.write(json.dumps({"key": key, "step": "guide", "z": round(z, 4), "roll": g["roll"],
                                     "measured": g["measured"], "zoom": g["zoom"], "t": time.time()}) + "\n")
            print(f"guide: z {z:.4f} from {g['roll']} (scale {g['measured']['scale']})", flush=True)
        set_retry(key, GUIDE_CORRECTION if a.guide == "close" else None)
        r = sh(["node", "tools/make-scaffold.mjs", "--emit-retries", "--pack", PACK,
                "--wall", key, "--retries", "99"])
        if "1 re-ask packet" not in r.stdout:
            print("EMIT FAILED:", r.stdout[-300:], r.stderr[-300:], flush=True)
            return 2
        attempt, rolls = latest_rolls(key)
        spent += len(rolls)
        packet = os.path.join("design", "batches", PACK, f"{loc}-{f}", f"retry-{attempt}")
        paths = " and ".join(os.path.join(ROOT, c) for _i, c in rolls)
        order = (f"Automated landing loop - {key} {packet}, pair of independent stateless "
                 f"calls. Image 1 is grown-{loc}-{f}.png in that packet dir; send its "
                 f"prompt.txt verbatim with Image 1 only. Save EXACTLY to {paths}. "
                 f"Prompt files already sit beside those paths - do not rewrite them.")
        m = dispatch(order)
        print(f"pair {spent // 2}: attempt {attempt}, rolls {[i for i, _ in rolls]} ordered "
              f"({'order ok' if m.returncode == 0 else 'ORDER FAILED: ' + m.stderr[:120]})", flush=True)
        if m.returncode != 0:
            return 3
        deadline = time.time() + a.wait_mins * 60
        while time.time() < deadline:
            if all(os.path.exists(os.path.join(ROOT, c)) for _i, c in rolls):
                break
            time.sleep(15)
        else:
            print("TIMEOUT waiting for rolls", flush=True)
            return 4
        s = sh(["python3", "design/plan-draft/measured/row23_run.py"],
               env={**os.environ, "HOLO_PACK": PACK})
        for line in s.stdout.splitlines():
            if key in line:
                print("sweep:", line.strip()[:160], flush=True)
        if a.guide == "close":
            ms = [close_measure(key, c) for _i, c in rolls]
            sc = [m["scale"] for m in ms if m and m.get("scale")]
            z_prev = z
            if sc:
                z = clamp_z(z_prev * Z_TARGET / (sum(sc) / len(sc)), zcap)
            with open(GUIDE_LOG, "a") as fh:
                fh.write(json.dumps({"key": key, "step": "learn", "attempt": attempt, "z_prev": round(z_prev, 4),
                                     "scales": sc, "z_next": round(z, 4), "t": time.time()}) + "\n")
            print(f"learn: pair scales {sc} -> z {z_prev:.4f} -> {z:.4f}", flush=True)

if __name__ == "__main__":
    sys.exit(main())
