# Row 7 batch — the storefront, as a stranger meets it

**Unapproved.** This is material submitted for Kabe's eye, not approved reference: it does **not**
belong in `design/references/`, which the playbook reserves for approved work. **Delete this
directory when his verdict lands**; anything he approves graduates to `design/references/` with its
V-stage, by the hand that receives the verdict.

Ten captures and one transcript, from a cold `file://` load, Chromium, no throttling, no
downscaling, device pixel ratio 1, chrome visible. (These are chrome captures — §12.6's canvas-only
rule governs flip pairs, not these.) Two widths: 1536×1200 and 390×844.

| File | State |
|---|---|
| `01-cold-load-desktop.png` | what a stranger meets first, desktop |
| `02-cold-load-phone-390.png` | the same on a phone |
| `03-a-refusal.png` | a click on the chair |
| `04-an-item-taken.png` | the key, taken |
| `05-broken-boot.png` | a boot viewstate the world does not hold |
| `06-no-frame-ever-painted.png` | a script that never arrived — the boot apology, the one fault line an earlier version of this batch never showed you |
| `07-render-fault.png` | a throw on the render path |
| `08-noun-missing.png` | a record with no usable noun — pixel-identical to 04 by design, since the difference is the tile's accessible *name*; read it in `announced-surface.txt` |
| `09-strip-cannot-show-itself.png` | the inventory strip throws while the picture is intact |
| `scripts-off.png` | scripts disabled |
| `announced-surface.txt` | every string an **assistive** reader meets, in order, per state — the half no screenshot carries |

**The tab title is not in these images.** The harness screenshots the page, not browser chrome, so
`holo-emitter` is described rather than shown; it is the first string a stranger reads and its
verdict is `OPEN` in `design/surface-strings.md`.

**What to look at, in the order it matters:**

1. **The silence.** A healthy cold load now shows a picture and no words at all. This row did not
   create that — before the sweep the only words were developer speech, addressed to nobody who
   opens the link. Row 9 owns the intro and is sequenced after row 4. Remedies, if you want one
   sooner: move row 9 ahead of rows 3–4; allocate a small row for a single line of arrival prose
   now; or accept the silence until row 9 lands.
2. **The fault states** (05–08, scripts-off). Every one speaks in the product's voice, and that is
   the trade to look at: a stranger cannot now tell a broken deploy from an intended mood.
3. **The picture is bigger.** Deleting the status band dropped the chrome reserve from 8.8rem to
   7.6rem, so the frame grows on every height-bound viewport. A look change, in a row sequenced
   before the presentation row.
4. **On a bare facing** the product's whole answer to `turn` is a changed letter on a wall. Row 4's
   assets are the fix; it is here so it is not mistaken for something nobody looked at.

The open questions and forks are in `design/surface-strings.md`'s `QUESTIONS` block.
