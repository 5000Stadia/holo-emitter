#!/usr/bin/env python3
"""Port the generated TypeScript factory to a plain ES-module JavaScript factory.

The generated factory is machine-written in a narrow, predictable style, so this is a
targeted stripper rather than a TypeScript parser. It:

  * drops every `three/examples/jsm/...` import and the three exported helpers that need
    them (environment, presentation composer, inspect controls), so the port imports only
    the bare specifier "three";
  * drops the reference-texture loading path, so the port cannot reach for an image file
    even if a future spec revision stops declaring its materials textureless;
  * removes type aliases, annotations, casts, predicates and generic arguments;
  * appends a default export alongside the named one.

Run:  python3 tools/port_ts_to_js.py src/createChairLiner1934Model.ts src/createChairLiner1934Model.js
Verify: node --check src/createChairLiner1934Model.js
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

DROP_FUNCTIONS = (
    "createChairLiner1934Environment",
    "createChairLiner1934PresentationComposer",
    "createChairLiner1934InspectControls",
    "createLoadedMapTexture",
    "makeReferenceTextureSet",
    "referenceMapUrl",
)


def split_top_level_blocks(lines: list[str]) -> list[tuple[int, int, str]]:
    """Return (start, end_exclusive, header) for every top-level `{ ... }` block."""
    blocks: list[tuple[int, int, str]] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r"^(export )?(async )?function |^(export )?type |^type |^const .*= \(", line):
            # The generator writes every top-level block with its closing brace in column 0,
            # so scanning for that is exact where brace counting is not: the factory body
            # carries multi-kilobyte JSON literals whose braces live inside string data.
            start = i
            if lines[i].rstrip().endswith(";"):
                # a single-line declaration (`type TaperedStation = { ... };`) is its own block;
                # scanning past it swallowed eleven live functions the first time this ran.
                blocks.append((start, start + 1, lines[start]))
                i += 1
                continue
            i += 1
            while i < len(lines) and lines[i] not in ("}", "};"):
                i += 1
            blocks.append((start, min(i + 1, len(lines)), lines[start]))
        i += 1
    return blocks


OPENERS = {"(": ")", "[": "]", "{": "}", "<": ">"}
CLOSERS = {v: k for k, v in OPENERS.items()}


def _skip_type(text: str, i: int, stop: str) -> int:
    """From the colon at `text[i]`, return the index just past the type annotation.

    Stops at the first character of `stop` seen at nesting depth zero. Nesting counts
    (), [], {} and <>, so `Record<string, unknown>` and `{ a: number; b: string }` are
    crossed whole instead of being cut at their internal commas.
    """
    i += 1
    depth: list[str] = []
    while i < len(text):
        ch = text[i]
        # The stop test runs BEFORE the nesting test, so a return type can stop at the `{`
        # that opens the function body instead of counting it as the start of an object type.
        if not depth and (ch in stop or (ch == "=" and text[i:i + 2] == "=>")):
            return i
        if ch in OPENERS:
            depth.append(ch)
        elif ch in CLOSERS:
            if depth and depth[-1] == CLOSERS[ch]:
                depth.pop()
            elif not depth:
                return i
        i += 1
    return i


def _matching(text: str, open_index: int) -> int:
    depth = 0
    i = open_index
    while i < len(text):
        if text[i] == "(":
            depth += 1
        elif text[i] == ")":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def _strip_param_list(span: str) -> str:
    out: list[str] = []
    i = 0
    while i < len(span):
        ch = span[i]
        if ch == ":":
            end = _skip_type(span, i, ",)=")
            if out and out[-1] == "?":
                out.pop()
            i = end
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def strip_signatures(text: str) -> str:
    """Strip parameter and return-type annotations from function and arrow signatures."""
    out = text
    # function declarations / expressions
    while True:
        changed = False
        for match in re.finditer(r"\bfunction\b\s*\*?\s*[A-Za-z_$][\w$]*\s*\(", out):
            open_index = match.end() - 1
            close = _matching(out, open_index)
            if close < 0:
                continue
            params = out[open_index + 1:close]
            new_params = _strip_param_list(params)
            tail_start = close + 1
            tail_end = tail_start
            rest = out[tail_start:]
            ret = re.match(r"\s*:", rest)
            if ret:
                tail_end = _skip_type(out, tail_start + ret.end() - 1, "{")
            if new_params != params or tail_end != tail_start:
                out = out[:open_index + 1] + new_params + ")" + out[tail_end:]
                changed = True
                break
        if not changed:
            break
    # arrow functions: `(a: T, b: U) => ...` and `(v): v is string =>`
    def arrow(match: re.Match[str]) -> str:
        params = match.group(1)
        return "(" + _strip_param_list(params) + ") =>"

    out = re.sub(r"\(([^()]*)\)\s*:\s*[^=\n]*?=>", arrow, out)
    out = re.sub(r"\(([^()]*:[^()]*)\)\s*=>", arrow, out)
    return out


def strip_declarations(text: str) -> str:
    """Strip `const x: T = ...` / `let x: T;` annotations."""
    out: list[str] = []
    i = 0
    for match in re.finditer(r"\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*:", text):
        colon = match.end() - 1
        end = _skip_type(text, colon, "=;")
        out.append(text[i:colon])
        i = end
    out.append(text[i:])
    return "".join(out)


def strip_types(text: str) -> str:
    out = text

    # Single-line declarations FIRST. A one-line `type X = { ... };` otherwise gets eaten by the
    # multi-line rule below, which then runs on to the next line-initial `};` and takes eleven
    # live functions with it.
    out = re.sub(r"^(?:export\s+)?type\s+\w+\s*=[^\n]*;[ \t]*$", "", out, flags=re.M)
    # `export type X = {` ... `};` with the brace opening the line
    out = re.sub(r"^(?:export\s+)?type\s+\w+\s*=\s*\{[ \t]*$.*?^\};[ \t]*$", "", out, flags=re.S | re.M)
    out = re.sub(r"^(?:export\s+)?interface\s+\w+\s*\{.*?^\}\s*$", "", out, flags=re.S | re.M)

    out = strip_signatures(out)
    out = strip_declarations(out)

    # `x as const`, `x as Foo`, `x as { declared?: boolean } | undefined`
    cast_atom = (
        r"(?:readonly\s+)?"
        r"(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\[[^\[\]]*\]|[A-Za-z_$][\w$.]*(?:<[^<>]*>)?)"
        r"(?:\[\])*"
    )
    # `import * as THREE from 'three'` is not a cast; park it before the cast pass runs.
    sentinel = "/*__IMPORT_NS__*/"
    imports = re.findall(r"^import \* as .*$", out, flags=re.M)
    out = re.sub(r"^import \* as .*$", sentinel, out, flags=re.M)
    out = re.sub(rf"\s+as\s+(?:const|{cast_atom}(?:\s*\|\s*{cast_atom})*)", "", out)
    for line in imports:
        out = out.replace(sentinel, line, 1)

    # `expr satisfies Type`
    out = re.sub(rf"\s+satisfies\s+{cast_atom}(?:\s*\|\s*{cast_atom})*", "", out)

    # explicit generic call arguments, e.g. `new Map<string, number>()`
    out = re.sub(r"(new\s+[A-Za-z_$][\w$.]*)<[^<>()]*>(\s*\()", r"\1\2", out)

    # non-null assertions
    out = re.sub(r"([\w$\])])!(\s*[.\[)])", r"\1\2", out)

    return out


def main(argv: list[str]) -> int:
    src = Path(argv[1])
    dst = Path(argv[2])
    lines = src.read_text(encoding="utf-8").splitlines()

    # 1. imports: keep only the bare "three" specifier
    lines = [ln for ln in lines if "three/examples/jsm" not in ln]

    # 2. drop the blocks that need those imports or that could load an image file
    drop_ranges: list[tuple[int, int]] = []
    for start, end, header in split_top_level_blocks(lines):
        if any(re.search(rf"\b{name}\b", header) for name in DROP_FUNCTIONS):
            lead = start
            while lead > 0 and (lines[lead - 1].startswith("//") or lines[lead - 1].strip() == ""):
                lead -= 1
                if lines[lead].strip() == "" and lead > 0 and not lines[lead - 1].startswith("//"):
                    break
            drop_ranges.append((lead, end))
    keep = [True] * len(lines)
    for start, end in drop_ranges:
        for i in range(start, min(end, len(lines))):
            keep[i] = False
    lines = [ln for ln, k in zip(lines, keep) if k]

    text = "\n".join(lines)

    # 3. the one call site of the dropped reference path
    text = text.replace(
        "    : makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);",
        "    : makeProceduralTextureSet(id, spec, options);",
    )

    text = strip_types(text)

    # collapse the runs of blank lines the drops leave behind
    text = re.sub(r"\n{3,}", "\n\n", text)

    header = (
        "// Plain ES-module JavaScript port of src/createChairLiner1934Model.ts.\n"
        "// Generated by tools/port_ts_to_js.py - edit the spec and regenerate, never this file.\n"
        "// Imports only the bare specifier \"three\". Creates no texture and loads no image:\n"
        "// every material in the spec declares textureless, so createSculptMaterial takes its\n"
        "// solid-albedo branch, and the reference-map loading path is not present in this file.\n"
        "//\n"
        "// createChairLiner1934Model() returns a THREE.Group whose local origin is the centre of\n"
        "// the chair's footprint on the floor plane: y = 0 is the underside of the chrome\n"
        "// ferrules, +y is up, +z is the direction a sitter faces, units are real metres and the\n"
        "// chair stands 0.880 m tall.\n"
    )
    text = header + text.lstrip("\n")
    if not text.endswith("\n"):
        text += "\n"
    text += "\nexport default createChairLiner1934Model;\n"

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(text, encoding="utf-8")
    print(dst)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
