// What a part is, said by the part (R79 S2; codex's review, 2026-10-13: "make parts the authority for their implications"):
// the pure half of a part, readable before any part's code (which needs THREE) loads, so a kind resolves the same in node,
// in a test and on the page, and its pin with it. A characteristic reads these properties, never part names:
//   emits(p) -> the light groups the part makes (a candlestick its flame; a bulb its glass's glow): it gives light;
//   source(p) -> what makes its light (a candle, a rush, an oil lamp's wick, a filament): its colour and strength are the
//   look's for that source, at build (src/make/characteristics.js lightOf), never the part's own.
// The part's code is held to its word at authoring (checks.spec.mjs check 33): every light a built part makes is in a group
// its contract emits, and every group it emits is made, so a new part that makes a light and says nothing is caught there.
export const PART_CONTRACTS = {
  candlestick: { emits: () => ["flame"], source: () => "candle" },
  flame: { emits: (p) => [p.group || "flame"], source: (p) => p.source || "candle" },
  bulb: { emits: (p) => [p.group || "bulb"], source: () => "filament" },
};
export const contractOf = (name) => PART_CONTRACTS[name] || null;
