#!/usr/bin/env python3
"""Static file server for the review viewer, plus a POST sink that saves canvas captures.

`python3 -m http.server` cannot take a file back from the page, and the browser sandbox
cannot write one, so the render-review loop had no way to hand a real PNG to the skill's
diagnostic scripts. This adds exactly one route for that:

    POST /save/<name>.png   body: raw base64 of the PNG (no data: prefix)

Everything else is served from the working directory exactly as http.server would.

    python3 tools/serve.py 8712
"""
from __future__ import annotations

import base64
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RENDERS = ROOT / "renders"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):  # quieter console
        if "/save/" in (self.path or ""):
            sys.stderr.write("saved %s\n" % self.path)

    def do_POST(self):  # noqa: N802
        if not self.path.startswith("/save/"):
            self.send_error(404)
            return
        name = Path(self.path[len("/save/"):]).name
        if not name.endswith(".png"):
            self.send_error(400, "only .png")
            return
        length = int(self.headers.get("Content-Length") or 0)
        payload = self.rfile.read(length)
        RENDERS.mkdir(parents=True, exist_ok=True)
        (RENDERS / name).write_bytes(base64.b64decode(payload))
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8712
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
