#!/usr/bin/env python3
"""One index over every catalogue we may draw from — SQLite + FTS5, no LLM, no GPU.

  python3 tools/catalogue-index.py build   [--db ~/.cache/holo-catalogue.sqlite]     # TexVerse metadata+captions, Objaverse-LVIS
  python3 tools/catalogue-index.py query "art deco side chair" [--class chair] [--limit 12] [--shippable]
  python3 tools/catalogue-index.py stats

Row: uid, source, licence, shippable (CC0 / CC-BY / CC-BY-SA only), name, caption, tags, category,
faces, texture_res, pbr, thumbnail, url. Text search is FTS5 over name+caption+tags with BM25;
a CLIP re-rank can sit on top later without changing the table.
"""
import argparse
import json
import os
import sqlite3
import sys
import time

TEXVERSE = os.path.expanduser("~/.cache/texverse")
SHIPPABLE = {"cc0", "by", "by-sa", "cc-by", "cc-by-sa", "cc by", "cc by-sa", "cc0 1.0", "cc by 4.0", "cc by-sa 4.0", "creative commons attribution", "creative commons attribution-sharealike", "public domain"}


def norm_lic(x):
    x = (x or "").strip().lower()
    for k in ("cc0", "public domain"):
        if k in x: return "cc0"
    if "nc" in x: return "by-nc"
    if "nd" in x: return "by-nd"
    if "by-sa" in x or "sharealike" in x: return "by-sa"
    if x.startswith("by") or "attribution" in x or "cc by" in x or "cc-by" in x: return "by"
    return x or "?"


def build(db):
    t0 = time.time()
    con = sqlite3.connect(db)
    con.executescript("""
    DROP TABLE IF EXISTS assets; DROP TABLE IF EXISTS assets_fts;
    CREATE TABLE assets (uid TEXT PRIMARY KEY, source TEXT, licence TEXT, shippable INTEGER, name TEXT, caption TEXT, tags TEXT, category TEXT,
                         faces INTEGER, texture_res INTEGER, pbr INTEGER, thumbnail TEXT, url TEXT);
    CREATE VIRTUAL TABLE assets_fts USING fts5(uid UNINDEXED, name, caption, tags, category, content='assets', content_rowid='rowid');
    """)
    n = 0
    # --- TexVerse
    mp, cp = os.path.join(TEXVERSE, "metadata.json"), os.path.join(TEXVERSE, "caption.json")
    if os.path.exists(mp):
        meta = json.load(open(mp)); caps = json.load(open(cp)) if os.path.exists(cp) else {}
        pbr = set(open(os.path.join(TEXVERSE, "TexVerse_pbr_id_list.txt")).read().split()) if os.path.exists(os.path.join(TEXVERSE, "TexVerse_pbr_id_list.txt")) else set()
        rows = []
        it = meta.items() if isinstance(meta, dict) else ((m.get("uid") or m.get("id"), m) for m in meta)
        for uid, m in it:
            if not isinstance(m, dict): continue
            lic = norm_lic(m.get("license") or m.get("licence") or (m.get("license_label") if isinstance(m.get("license_label"), str) else ""))
            tags = m.get("tags") or []
            tags = " ".join(t.get("name", t) if isinstance(t, dict) else str(t) for t in tags)
            cap = caps.get(uid) if isinstance(caps, dict) else None
            if isinstance(cap, dict): cap = cap.get("caption") or json.dumps(cap)
            th = m.get("thumbnail") or m.get("thumbnail_url") or ((m.get("thumbnails") or {}).get("images") or [{}])[0].get("url") if isinstance(m.get("thumbnails"), dict) else m.get("thumbnail")
            rows.append((uid, "texverse", lic, int(lic in ("cc0", "by", "by-sa")), m.get("name"), cap, tags, m.get("category") or "",
                         m.get("faceCount") or m.get("faces"), m.get("texture_resolution") or m.get("max_texture_resolution"), int(uid in pbr), th if isinstance(th, str) else None,
                         m.get("viewerUrl") or m.get("url") or f"https://sketchfab.com/3d-models/{uid}"))
            if len(rows) >= 20000:
                con.executemany("INSERT OR REPLACE INTO assets VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", rows); n += len(rows); rows = []
        con.executemany("INSERT OR REPLACE INTO assets VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", rows); n += len(rows)
        print("texverse rows", n, f"{time.time() - t0:.0f}s", flush=True)
    # --- Objaverse-LVIS categories (uids only; names come from annotations when fetched)
    try:
        import objaverse
        lvis = objaverse.load_lvis_annotations()
        rows = [(u, "objaverse-lvis", "?", 0, None, None, None, cat, None, None, 0, None, f"https://sketchfab.com/3d-models/{u}") for cat, us in lvis.items() for u in us]
        con.executemany("INSERT OR IGNORE INTO assets VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", rows)
        # where TexVerse already has the uid, keep its row but carry the LVIS category
        con.executemany("UPDATE assets SET category = CASE WHEN category = '' OR category IS NULL THEN ? ELSE category || ' ' || ? END WHERE uid = ? AND source = 'texverse'",
                        [(cat, cat, u) for cat, us in lvis.items() for u in us])
        print("objaverse-lvis rows", len(rows), flush=True)
    except Exception as e:
        print("objaverse-lvis skipped:", e)
    con.execute("INSERT INTO assets_fts(assets_fts) VALUES ('rebuild')")
    con.commit(); con.close()
    print("built", db, f"{time.time() - t0:.0f}s")


def query(db, q, cls, limit, shippable):
    con = sqlite3.connect(db)
    where = "WHERE assets_fts MATCH ?" + (" AND a.shippable = 1" if shippable else "") + (" AND a.category LIKE ?" if cls else "")
    args = [q] + ([f"%{cls}%"] if cls else [])
    t = time.time()
    rows = con.execute(f"""SELECT a.uid, a.source, a.licence, a.name, substr(a.caption,1,90), a.category, a.faces, a.texture_res, a.pbr, bm25(assets_fts) AS s
                           FROM assets_fts JOIN assets a ON a.rowid = assets_fts.rowid {where} ORDER BY s LIMIT ?""", args + [limit]).fetchall()
    print(f"{len(rows)} in {1000 * (time.time() - t):.0f} ms")
    for r in rows: print(json.dumps(r))


def stats(db):
    con = sqlite3.connect(db)
    for r in con.execute("SELECT source, licence, shippable, count(*) FROM assets GROUP BY 1,2,3 ORDER BY 4 DESC LIMIT 20"): print(r)
    print("total", con.execute("SELECT count(*) FROM assets").fetchone()[0], "shippable", con.execute("SELECT count(*) FROM assets WHERE shippable=1").fetchone()[0],
          "with caption", con.execute("SELECT count(*) FROM assets WHERE caption IS NOT NULL").fetchone()[0], "pbr", con.execute("SELECT count(*) FROM assets WHERE pbr=1").fetchone()[0])


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("cmd", choices=["build", "query", "stats"]); ap.add_argument("q", nargs="?", default="")
    ap.add_argument("--db", default=os.path.expanduser("~/.cache/holo-catalogue.sqlite")); ap.add_argument("--class", dest="cls", default=""); ap.add_argument("--limit", type=int, default=12); ap.add_argument("--shippable", action="store_true")
    a = ap.parse_args()
    {"build": lambda: build(a.db), "query": lambda: query(a.db, a.q, a.cls, a.limit, a.shippable), "stats": lambda: stats(a.db)}[a.cmd]()


if __name__ == "__main__":
    main()
