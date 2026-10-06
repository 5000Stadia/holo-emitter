// Influences for England, c. 1660: data only. Owners reach their things by possession; a room's
// purpose reaches what lies in it by space. An owner's traits are what the ONE AI call at ingestion
// writes for a person a text names ("a poor widow", "the smith", "Sir Fancy-Pants"), in the
// catalogue's own terms; everything after is rules. Reviewed 2026-10-05 (a fresh reviewer, the shelves
// written out): book counts follow means and reading; only things that stay put hold a run of books;
// a smith's tools stay in the smithy; a great library's unit is one section by subject, folios low;
// curiosities stand on top of the case; a lantern clock hangs on the wall.
export const OWNERS = {
  // a poor widow: two boards on brackets on the wall; one of each thing she owns
  widow: { who: "a poor widow", reach: "possession", weight: 1, traits: {
    means: "poor", care: "tidy", topics: { divinity: 4, popular: 2 }, books: { 0: 1, 1: 3, 2: 3, 3: 2, 4: 1 },
    keeps: { "candle/stub": 1, "jug/earthen": 1, "bowl/turned": 1, "letters/bundle": 1, "bottle/onion": 1, "box/oak-lidded": 1 }, things: [3, 6],
    daily: ["candle/stub", "bowl/turned", "jug/earthen"], wood_tone: [1.3, 1.2, 1.05],
    shelving: { kind: "shelves/wall-boards", W: 0.9, ys: [0.95, 1.25] } } },
  // a smith's house shelf: domestic things, pewter as a matched pair at most; his stock stays in the smithy
  smith: { who: "the blacksmith", reach: "possession", weight: 1, traits: {
    means: "middling", care: "rough", topics: { popular: 3, divinity: 1.5, estate: 1 }, books: { 0: 1, 1: 2, 2: 3, 3: 2, 4: 1 },
    keeps: { "tankard/pewter-lidded": 2, "candle/stub": 1, "jug/earthen": 1, "bottle/onion": 1, "box/oak-lidded": 1, "bowl/turned": 2 }, things: [6, 8],
    daily: ["tankard/pewter-lidded", "candle/stub", "bowl/turned"], wood_tone: [0.75, 0.72, 0.7],
    shelving: { kind: "shelves/open-case", W: 0.9, H: 1.3, ys: [0.62, 0.96] } } },
  // a great library's press: one section by subject, folios at the bottom, curiosities on top
  gentleman: { who: "Sir Fancy-Pants", reach: "possession", weight: 1, traits: {
    means: "great", care: "kept", topics: { classics: 3, history: 3, natural: 2, law: 1, divinity: 1 }, books: "fill", section: 2, display: "top",
    keeps: { porcelain: 2, "globe/terrestrial": 1, "shell/curiosity": 1 }, things: [2, 3], daily: [], wood_tone: [1, 1, 1],
    shelving: { kind: "shelves/open-case", W: 1.1, H: 1.95, ys: [0.08, 0.53, 0.88, 1.18, 1.44, 1.7] } } },
};
// a room's purpose leans its shelves toward its subjects
export const PURPOSES = {
  muniment_room: { who: "an evidence house", reach: "space", weight: 1, traits: { topics: { law: 3, estate: 4 } } },
  study: { who: "a study", reach: "space", weight: 1, traits: { topics: { history: 1, classics: 1, natural: 1 } } },
  chapel: { who: "a chapel", reach: "space", weight: 1, traits: { topics: { divinity: 4 } } },
};
