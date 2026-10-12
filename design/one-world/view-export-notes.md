# Our side of pattern-buffer's offline mirror (R75): what was agreed (2026-10-12)

**Source:** pattern-buffer's `specs/VIEW-EXPORT-V1.md` (branch `spec/view-export-v1` in `/home/k/pattern-buffer`), its offline mirror. It's a `patternbuffer.view/1` document: the player's view (`known`), plus drawables of unseen things (`present`) under opaque handles, kept in step by a pull feed with a signed cursor.

**Our review** (m095e7d) **and pb's r2 answer** (m6ea764):
1. **Offline perception goes back.** The host gains `unhandle(h)`, and recording accepts `h:` handles, mapped by the key and refused when stale. A drawer opened offline can be reported later.
2. **Containment carries a slot:** `in = [relation, ref, slot?]`, from a canon `slot` literal on the item.
3. **Kind and look are canon's words.** They're drawable by the closed vocabulary our aspects declare. **We owe this:** a declared mapping from canon's kinds and aspects onto our catalogue (`key/iron` and its settings), registered with our generators.
4. **Present records carry `address`** when canon holds one. They add to our generated contents, never replace them.
5. **Set-valued keys** we fold on our side. A disputed physical state (say, a door's) we draw at the generator's default.

**Blueprint §3's "the client never receives unknown entities"** is superseded for the offline mirror, under Kabe's point 5 (gate gde97f3). Our wording, taken verbatim by pb: "the client may hold drawables of unknown things (the present layer) but never their meaning, and treats them as unknown until perceived". Our blueprint §3 is amended to match (VIEW-EXPORT-V1 green at r3, pbr's review).

**Ours to build, when R75's step comes** (after M7, M9 and M8 in Kabe's order):
- a JS `apply`, checked against `tests/vectors/view-feed-v1.json`;
- the vocabulary mapping above;
- observed events that accept handles.

**r3 change (pbr):** recording a handle answers only `{status: recorded}` or `{status: refused}`, never a receipt (a receipt would name the id the handle hides). The id reaches us through the next feed's `reveal`. So the page keeps an offline-perceived thing under its handle until that reveal arrives.
