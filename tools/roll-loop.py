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

def wall_state(key):
    return json.load(open(STATE))["walls"].get(key, {})

def set_retry(key):
    rs = json.load(open(STATE))
    w = rs["walls"][key]
    w["status"] = "retry"
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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wall", required=True)
    ap.add_argument("--budget", type=int, default=8)
    ap.add_argument("--wait-mins", type=int, default=40)
    a = ap.parse_args()
    key = a.wall
    loc, f = key.split("/")
    spent = 0
    while True:
        st = wall_state(key)
        if st.get("status") == "promoted" and os.path.exists(
                os.path.join(ROOT, "backdrops", loc, f + ".png")):
            print(f"LANDED: {key} promoted after {spent} loop roll(s)", flush=True)
            return 0
        if spent >= a.budget:
            print(f"BUDGET SPENT: {key} not landed in {spent} rolls; parked for the Captain", flush=True)
            return 1
        set_retry(key)
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
        m = sh(["agentpost", "message", "holoemitter-assets", order, "--notify", "immediate"])
        print(f"pair {spent // 2}: attempt {attempt}, rolls {[i for i, _ in rolls]} ordered "
              f"({'mail ok' if m.returncode == 0 else 'MAIL FAILED: ' + m.stderr[:120]})", flush=True)
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

if __name__ == "__main__":
    sys.exit(main())
