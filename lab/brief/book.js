// The book: a kind of its own, the first recipe of the catalogue (R48). A period book is a size class, a
// seed and a context; everything else (its height and thickness, its binding, its spine, its title, its
// tone) follows from them, the same every time. A bookcase does not make books: it asks for them by size
// class, seed and context, and packs them. Thousands of books are drawn as ONE shape repeated (an
// instanced mesh), each copy with its own size, place, spine design, title and tone.
//
// The context is what the brief knows about the place: the owner's means and the room's purpose. It sets
// how full the shelves are, how ordered, which bindings, which subjects, how worn; it costs nothing more
// to compute, only different choices from the same seed. Titles are live text: drawn once per look into
// a title atlas and laid onto each spine's lettering-piece or label by the shader, so no two shelves need
// the same title unless their seeds say so.
import { rng, hash } from "../painted/procedural.js";

// English formats c. 1660, heights and thicknesses in metres
export const SIZE_CLASSES = {
  folio: { h: [0.36, 0.42], w: [0.05, 0.09] },
  quarto: { h: [0.27, 0.31], w: [0.04, 0.07] },
  small_quarto: { h: [0.22, 0.26], w: [0.03, 0.055] },
  octavo: { h: [0.19, 0.22], w: [0.025, 0.045] },
  small_octavo: { h: [0.16, 0.19], w: [0.022, 0.04] },
  duodecimo: { h: [0.13, 0.16], w: [0.018, 0.034] },
};
const ORDER = ["folio", "quarto", "small_quarto", "octavo", "small_octavo", "duodecimo"];

// titles a house of the 1650s might own, by subject; each as it would be lettered on a spine (two short
// lines) and as it would be written out
const T = (spine, full, fmt = "octavo", vols = 1) => ({ spine, full, fmt, vols });   // fmt: the format it was printed in; vols: how many volumes it runs to
export const TITLES = {
  law: [T(["COKES", "REPORTS"], "Coke's Reports", "folio", 6), T(["COKE ON", "LITTLETON"], "Coke upon Littleton", "folio"), T(["STATUTES", "AT LARGE"], "Statutes at Large", "folio", 3), T(["DALTON", "JUSTICE"], "Dalton's Countrey Justice", "quarto"),
    T(["PLACITA", "CORONAE"], "Placita Coronae", "octavo"), T(["YEAR", "BOOKS"], "Year Books", "folio", 5), T(["FITZHERB", "ABRIDGM"], "Fitzherbert's Abridgment", "folio"), T(["LAMBARD", "EIRENAR"], "Lambarde's Eirenarcha", "octavo"), T(["RASTELL", "ENTRIES"], "Rastell's Entries", "folio"), T(["BRACTON", ""], "Bracton", "folio")],
  estate: [T(["COURT", "ROLLS"], "Court Rolls", "folio"), T(["RENTALS", ""], "Rentals", "quarto"), T(["SURVEYS", "OF MANORS"], "Book of Surveys", "folio"), T(["TUSSER", "HUSBANDRY"], "Tusser's Five Hundred Points", "quarto"),
    T(["MARKHAM", "HUSBANDRY"], "Markham's Farewell to Husbandry", "quarto"), T(["SURVEYORS", "DIALOGUE"], "The Surveyor's Dialogue", "quarto"), T(["LEASES", ""], "Leases", "quarto"), T(["ACCOMPTS", ""], "Accompts", "folio")],
  divinity: [T(["HOLY", "BIBLE"], "The Holy Bible", "quarto"), T(["COMMON", "PRAYER"], "The Book of Common Prayer", "octavo"), T(["FOXE", "MARTYRS"], "Foxe's Acts and Monuments", "folio", 3), T(["HOOKER", "ECCL POL"], "Hooker's Ecclesiastical Polity", "folio", 2),
    T(["TAYLOR", "HOLY LIVING"], "Taylor's Holy Living", "duodecimo"), T(["ANDREWES", "SERMONS"], "Andrewes' Sermons", "folio"), T(["BAXTER", "SAINTS REST"], "Baxter's Saints' Rest", "quarto"), T(["DONNE", "SERMONS"], "Donne's Sermons", "folio")],
  history: [T(["HOLINSHED", "CHRONIC"], "Holinshed's Chronicles", "folio", 3), T(["CAMDEN", "BRITANNIA"], "Camden's Britannia", "folio"), T(["RALEGH", "HIST WORLD"], "Ralegh's History of the World", "folio", 2), T(["SPEED", "THEATRE"], "Speed's Theatre of Great Britaine", "folio"),
    T(["STOW", "SURVEY"], "Stow's Survey of London", "quarto"), T(["BACON", "HENRY VII"], "Bacon's Henry VII", "folio"), T(["HAKLUYT", "VOYAGES"], "Hakluyt's Voyages", "folio", 3), T(["PURCHAS", "PILGRIMES"], "Purchas his Pilgrimes", "folio", 5)],
  classics: [T(["PLUTARCH", "LIVES"], "Plutarch's Lives", "folio", 2), T(["VIRGIL", "OPERA"], "Virgil", "octavo"), T(["OVID", "METAM"], "Ovid's Metamorphoses", "octavo"), T(["LIVY", ""], "Livy", "folio", 2), T(["TACITUS", ""], "Tacitus", "duodecimo", 3),
    T(["TULLY", "OFFICES"], "Tully's Offices", "duodecimo"), T(["SENECA", "MORALS"], "Seneca's Morals", "octavo"), T(["HOMER", "CHAPMAN"], "Chapman's Homer", "folio")],
  natural: [T(["GERARD", "HERBALL"], "Gerard's Herball", "folio"), T(["CULPEPER", "HERBAL"], "Culpeper's Herbal", "octavo"), T(["BACON", "ADVANCEM"], "Bacon's Advancement of Learning", "quarto"), T(["HARVEY", "DE MOTU"], "Harvey, De Motu Cordis", "quarto"),
    T(["NAPIER", "LOGARITH"], "Napier's Logarithms", "quarto"), T(["WILKINS", "MAGICK"], "Wilkins' Mathematical Magick", "octavo")],
  popular: [T(["ALMANACK", "1659"], "An Almanack for 1659", "duodecimo"), T(["ALMANACK", "1660"], "An Almanack for 1660", "duodecimo"), T(["WHOLE DUTY", "OF MAN"], "The Whole Duty of Man", "octavo"), T(["PSALTER", ""], "The Psalter", "duodecimo"),
    T(["PRIMER", ""], "A Primer", "duodecimo"), T(["SEVEN", "CHAMPIONS"], "The Seven Champions", "quarto"), T(["REYNARD", "THE FOX"], "Reynard the Fox", "quarto"), T(["GESTA", "ROMANOR"], "Gesta Romanorum", "duodecimo"), T(["BALLADS", ""], "Ballads", "duodecimo")],
};
// beyond the named works above, each subject grows more from its authors and the works they wrote in
// (Latin for the classics), so a full library can letter most of its spines without repeating one
const GROW = {
  law: [["PLOWDEN", "DYER", "CROKE", "HOBART", "MOORE", "HUTTON", "POPHAM", "BROOKE", "LEONARD", "SAVILE"], [["REPORTS", "folio"], ["ENTRIES", "folio"], ["READINGS", "quarto"], ["CASES", "octavo"], ["TABLES", "duodecimo"]]],
  divinity: [["HALL", "SANDERSON", "USHER", "PERKINS", "SIBBES", "PRESTON", "HAMMOND", "CHILLINGWORTH", "HERBERT", "FULLER"], [["SERMONS", "folio"], ["WORKS", "folio"], ["ANNOTATIONS", "quarto"], ["MEDITATIONS", "octavo"], ["DEVOTIONS", "duodecimo"]]],
  history: [["DANIEL", "HEYLYN", "BAKER", "KNOLLES", "HAYWARD", "WEEVER", "SELDEN", "HOWELL", "CAREW", "VERSTEGAN"], [["HISTORY", "folio"], ["CHRONICLE", "folio"], ["ANNALS", "quarto"], ["RELATIONS", "octavo"], ["EPITOME", "duodecimo"]]],
  classics: [["HORATII", "JUVENALIS", "LUCANI", "TERENTII", "SALLUSTII", "CAESARIS", "MARTIALIS", "LUCRETII", "PLINII", "SUETONII"], [["OPERA", "folio"], ["COMMENT", "quarto"], ["OPERA", "octavo"], ["EPISTOLAE", "duodecimo"], ["SELECTA", "duodecimo"]]],
  natural: [["DIGBY", "BROWNE", "GILBERT", "BOYLE", "WILKINS", "KEPLER", "GALILEI", "GASSENDI", "CARTESII", "BACONI"], [["OF BODIES", "quarto"], ["EXPERIM", "octavo"], ["DIALOGUES", "quarto"], ["OPERA", "folio"], ["EPISTOLAE", "duodecimo"]]],
  estate: [["NORDEN", "BLITH", "HARTLIB", "FITZHERB", "LEIGH", "STANDISH"], [["SURVEYING", "quarto"], ["HUSBANDRY", "quarto"], ["IMPROVER", "quarto"], ["PLANTING", "octavo"]]],
  popular: [["DELONEY", "GREENE", "BRETON", "TAYLOR", "JOHNSON", "PARKER"], [["JESTS", "quarto"], ["HISTORIES", "quarto"], ["MERRY TALES", "duodecimo"], ["GARLAND", "duodecimo"]]],
};
for (const [tp, [authors, works]] of Object.entries(GROW)) authors.forEach((a, i) => works.forEach(([w, fmt], j) => {
  const name = a[0] + a.slice(1).toLowerCase();
  TITLES[tp].push(T([a, w], `${name}, ${w[0] + w.slice(1).toLowerCase()}`, fmt));
}));
const TOPICS = Object.keys(TITLES), FLAT = TOPICS.flatMap(t => TITLES[t].map((x, i) => ({ topic: t, i, ...x })));
export const titleIndex = (topic, i) => FLAT.findIndex(t => t.topic === topic && t.i === i);
export const titleOf = (spec) => spec.title >= 0 ? FLAT[spec.title].full + (spec.vol ? `, vol. ${spec.vol}` : "") : null;

// means: how a household of that standing keeps its books
export const MEANS = {
  great: { fullness: [0.9, 1.0], ordered: true, bind: { gilt: 0.22, plain: 0.58, vellum: 0.2, paper: 0 }, sets: 0.35, flat: 0.0, tone: [0.95, 1.12], topics: { law: 2, history: 2, classics: 2, divinity: 1.5, natural: 1, estate: 1 } },
  gentry: { fullness: [0.78, 0.95], ordered: true, bind: { gilt: 0.45, plain: 0.33, vellum: 0.16, paper: 0.06 }, sets: 0.2, flat: 0.05, tone: [0.9, 1.06], topics: { law: 1.5, estate: 1.5, divinity: 1.5, history: 1, classics: 1, natural: 0.5 } },
  middling: { fullness: [0.5, 0.8], ordered: false, bind: { gilt: 0.08, plain: 0.55, vellum: 0.2, paper: 0.17 }, sets: 0.05, flat: 0.25, tone: [0.8, 1.0], topics: { divinity: 2, estate: 1.5, popular: 1.5, law: 0.5, history: 0.5 } },
  poor: { fullness: [0.12, 0.42], ordered: false, bind: { gilt: 0, plain: 0.35, vellum: 0.15, paper: 0.5 }, sets: 0, flat: 0.55, tone: [0.58, 0.82], topics: { popular: 3, divinity: 2 } },
};
// a room's purpose leans its shelves toward its subjects
const PURPOSE = { muniment_room: { law: 3, estate: 4 }, study: { history: 1, classics: 1, natural: 1 }, chapel: { divinity: 4 }, library: {} };
export function bookContext(means = "gentry", purpose = null) {
  const m = MEANS[means] || MEANS.gentry, topics = { ...m.topics };
  for (const [k, v] of Object.entries(PURPOSE[purpose] || {})) topics[k] = (topics[k] || 0) + v;
  return { ...m, means, purpose, topics };
}

// ---- the look's spines: 256 designs in four bindings, made once per look and shared by every book
const BIND = { gilt: [0, 128], plain: [128, 192], vellum: [192, 224], paper: [224, 256] };
const CELLS = 256;
// where the title goes on each binding's spine, in the spine's own 0..1 (u across, v up)
const LABEL = { gilt: [0.083, 0.6675, 0.917, 0.7724], plain: [0.12, 0.655, 0.88, 0.785], vellum: [0.18, 0.3, 0.82, 0.86], paper: [0.14, 0.62, 0.86, 0.78] };
const pick = (r, weights) => { const e = Object.entries(weights).filter(([, w]) => w > 0), s = e.reduce((a, [, w]) => a + w, 0); let x = r() * s; for (const [k, w] of e) if ((x -= w) <= 0) return k; return e[e.length - 1][0]; };

function spineAtlas(THREE, seed) {
  const cw = 48, ch = 384, cols = 32, rows = Math.ceil((CELLS + 1) / cols);
  const c = document.createElement("canvas"); c.width = cols * cw; c.height = rows * ch;
  const g = c.getContext("2d"), r = rng(seed);
  const gilt = (a) => `rgba(${196 + r() * 30},${158 + r() * 24},${70 + r() * 20},${a})`;
  const cell = (k) => { const x = (k % cols) * cw, y = Math.floor(k / cols) * ch; return [x / c.width, 1 - (y + ch) / c.height, (x + cw) / c.width, 1 - y / c.height]; };
  const wear = (x, y, n) => { for (let q = 0; q < n; q++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,240,220"},${0.03 + r() * 0.05})`; g.fillRect(x + r() * cw, y + r() * ch, 1 + r() * 3, 1 + r() * 6); } };
  const bandsAt = (y) => { const top = 0.06, step = 0.88 / 6; return [1, 2, 3, 4, 5].map(b => y + ch * (top + step * b)); };
  for (let k = 0; k < CELLS; k++) {
    const x = (k % cols) * cw, y = Math.floor(k / cols) * ch;
    const kind = k < 128 ? "gilt" : k < 192 ? "plain" : k < 224 ? "vellum" : "paper";
    let base;
    if (kind === "gilt") { const t = r(); base = t < 0.1 ? [118, 42, 32] : t < 0.16 ? [40, 52, 40] : (() => { const s = 0.45 + r() * 0.55; return [118 * s + 30, 74 * s + 18, 42 * s + 10]; })(); }
    if (kind === "plain") { const s = 0.35 + r() * 0.45; base = [104 * s + 34, 72 * s + 24, 46 * s + 16]; }
    if (kind === "vellum") { const s = 0.9 + r() * 0.1; base = [214 * s, 200 * s, 168 * s]; }
    if (kind === "paper") { const t = r(); base = t < 0.4 ? [118, 124, 128] : t < 0.7 ? [150, 128, 96] : [104, 92, 80]; }
    g.fillStyle = `rgb(${base.map(v => v | 0).join(",")})`; g.fillRect(x, y, cw, ch);
    wear(x, y, kind === "paper" ? 260 : 160);
    const rub = g.createLinearGradient(0, y, 0, y + ch); rub.addColorStop(0, "rgba(240,220,190,0.22)"); rub.addColorStop(0.06, "rgba(0,0,0,0)"); rub.addColorStop(0.94, "rgba(0,0,0,0)"); rub.addColorStop(1, "rgba(240,220,190,0.22)");
    g.fillStyle = rub; g.fillRect(x, y, cw, ch);
    if (kind === "gilt" || kind === "plain") for (const by of bandsAt(y)) {
      g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(x, by - 3, cw, 6);
      g.fillStyle = kind === "gilt" ? gilt(0.85) : "rgba(0,0,0,0.3)"; g.fillRect(x + 3, by - 6, cw - 6, 1.4); g.fillRect(x + 3, by + 5, cw - 6, 1.4);
    }
    if (kind === "gilt") {
      const top = 0.06, step = 0.88 / 6, lp = y + ch * (top + step) + 8, lh = ch * step - 16;
      g.fillStyle = r() < 0.6 ? "rgb(120,30,24)" : "rgb(26,20,16)"; g.fillRect(x + 4, lp, cw - 8, lh);
      for (let p = 2; p <= 5; p++) { const py = y + ch * (top + step * p + step / 2); g.fillStyle = gilt(0.7); g.beginPath(); g.arc(x + cw / 2, py, 3.5, 0, 7); g.fill(); g.fillRect(x + cw / 2 - 7, py - 0.6, 14, 1.2); g.fillRect(x + cw / 2 - 0.6, py - 7, 1.2, 14); }
    }
    if (kind === "vellum") { g.strokeStyle = "rgba(120,100,70,0.25)"; g.lineWidth = 1; for (const f of [0.2, 0.8]) { g.beginPath(); g.moveTo(x, y + ch * f); g.lineTo(x + cw, y + ch * f); g.stroke(); } }
    if (kind === "paper" && r() < 0.4) { for (let q = 0; q < 30; q++) { g.fillStyle = `rgba(${r() * 80 | 0},${r() * 60 | 0},${r() * 90 | 0},0.12)`; g.beginPath(); g.arc(x + r() * cw, y + r() * ch, 2 + r() * 6, 0, 7); g.fill(); } }   // marbled
  }
  const px = (CELLS % cols) * cw, py = Math.floor(CELLS / cols) * ch;
  g.fillStyle = "rgb(222,210,182)"; g.fillRect(px, py, cw, ch);
  for (let q = 0; q < ch; q += 2) { g.fillStyle = `rgba(120,100,70,${0.05 + r() * 0.08})`; g.fillRect(px, py + q, cw, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return { texture: t, cell, pages: cell(CELLS) };
}

// ---- the titles: every title in each style it can take, drawn once per look. Gilt: capitals in gold
// on the lettering-piece (with a volume number for a set); plain and paper: ink on a pasted paper label;
// vellum: written in ink down the spine.
const VOLS = 6;
function titleAtlas(THREE) {
  const hw = 112, hh = 56, hcols = 18, vw = 40, vh = 200, vcols = 50;
  const nH = FLAT.reduce((a, t) => a + (t.vols > 1 ? t.vols + 1 : 1), 0) + FLAT.length, nV = FLAT.length;
  const hRows = Math.ceil(nH / hcols), vRows = Math.ceil(nV / vcols);
  const W = Math.max(hcols * hw, vcols * vw), Hh = hRows * hh, Hv = vRows * vh;
  const c = document.createElement("canvas"); c.width = W; c.height = Hh + Hv;
  const g = c.getContext("2d"), roman = ["", "I", "II", "III", "IV", "V"];
  const rect = (x, y, w, h) => [x / W, 1 - (y + h) / c.height, (x + w) / W, 1 - y / c.height];
  const cells = { gilt: [], ink: [], vellum: [] };
  let k = 0;
  FLAT.forEach((t, ti) => {
    cells.gilt[ti] = [];
    for (let v = 0; v < (t.vols > 1 ? t.vols + 1 : 1); v++, k++) {
      const x = (k % hcols) * hw, y = Math.floor(k / hcols) * hh;
      g.fillStyle = "rgba(214,174,86,0.95)"; g.textAlign = "center"; g.textBaseline = "middle";
      const lines = t.spine.filter(Boolean);
      g.font = `bold ${lines.some(l => l.length > 9) ? 13 : 15}px Georgia, "Times New Roman", serif`;
      lines.forEach((l, i) => g.fillText(l, x + hw / 2, y + hh / 2 + (i - (lines.length - 1) / 2) * 16 - (v ? 6 : 0)));
      if (v) { g.font = "bold 12px Georgia, serif"; g.fillText(roman[v], x + hw / 2, y + hh - 9); }
      cells.gilt[ti][v] = rect(x, y, hw, hh);
    }
  });
  FLAT.forEach((t, ti) => {
    const x = (k % hcols) * hw, y = Math.floor(k / hcols) * hh; k++;
    g.fillStyle = "rgb(226,214,186)"; g.fillRect(x + 2, y + 2, hw - 4, hh - 4);
    g.strokeStyle = "rgba(90,70,40,0.5)"; g.lineWidth = 1.5; g.strokeRect(x + 6, y + 6, hw - 12, hh - 12);
    g.fillStyle = "rgba(52,34,18,0.9)"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "italic 15px Georgia, serif";
    const lines = t.spine.filter(Boolean).map(l => l[0] + l.slice(1).toLowerCase());
    lines.forEach((l, i) => g.fillText(l, x + hw / 2, y + hh / 2 + (i - (lines.length - 1) / 2) * 17));
    cells.ink[ti] = rect(x, y, hw, hh);
  });
  FLAT.forEach((t, ti) => {
    const x = (ti % vcols) * vw, y = Hh + Math.floor(ti / vcols) * vh;
    g.save(); g.translate(x + vw / 2, y + vh / 2); g.rotate(-Math.PI / 2);
    g.fillStyle = "rgba(60,38,20,0.85)"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "italic 17px Georgia, serif";
    g.fillText(t.full.length > 22 ? t.spine.filter(Boolean).map(l => l[0] + l.slice(1).toLowerCase()).join(" ") : t.full, 0, 0); g.restore();
    cells.vellum[ti] = rect(x, y, vw, vh);
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { texture: tex, cells };
}

// a book's whole description from its size class, seed and context: the recipe's output, before geometry
export function bookSpec(size, seed, ctx = bookContext(), over = {}) {
  const c = SIZE_CLASSES[size], r = rng((seed * 2654435761) >>> 0);
  const binding = over.binding || pick(r, ctx.bind);
  let h = c.h[0] + r() * (c.h[1] - c.h[0]), w = c.w[0] + r() * (c.w[1] - c.w[0]);
  if (binding === "paper") w = 0.006 + r() * 0.012;                 // a pamphlet in wrappers: thin
  const [b0, b1] = BIND[binding], cell = over.cell ?? (b0 + Math.floor(r() * (b1 - b0)));
  // the book decides its shelf: a shelf asks for a format, and only works printed in it answer, from
  // the owner's subjects first (the topic drawn, then the others); a library holds each work once
  const near = { folio: ["folio"], quarto: ["quarto", "folio"], small_quarto: ["quarto"], octavo: ["octavo"], small_octavo: ["octavo", "duodecimo"], duodecimo: ["duodecimo"] }[size];
  const used = ctx.used || new Set(), wantSet = !!over.set;
  const of = (tp) => TITLES[tp].map((t, i) => ({ ...t, i, tp })).filter(t => near.includes(t.fmt) && (!wantSet || t.vols > 1) && !used.has(titleIndex(tp, t.i)));
  let topic = pick(r, ctx.topics), list = of(topic);
  if (!list.length) for (const tp of [...Object.keys(ctx.topics), ...Object.keys(ctx.more || {})]) if ((list = of(tp)).length) { topic = tp; break; }
  // a gilt book always shows its title; a plain one usually has a label; a pamphlet now and then
  const titled = binding === "gilt" || binding === "vellum" || (binding === "plain" ? r() < 0.7 : r() < 0.3);
  const title = over.title ?? (titled && list.length ? titleIndex(topic, list[Math.floor(r() * list.length)].i) : -1);
  if (title >= 0 && ctx.used) ctx.used.add(title);
  // a gilt lettering-piece always names its book; with no work left to name, the book is plain calf,
  // blind-tooled, its spine unlettered, as most were in 1660
  let bind = binding, cellF = cell;
  if (bind === "gilt" && title < 0) { bind = "plain"; cellF = BIND.plain[0] + (cell % (BIND.plain[1] - BIND.plain[0])); }
  const [t0, t1] = ctx.tone;
  return { kind: "book", size, seed, binding: bind, h, w, d: h * 0.72, cell: cellF, title, vol: over.vol || 0, tone: t0 + r() * (t1 - t0) };
}

// what a pocket or a bag can take: decided from size, never listed object by object
export const takeable = (dims) => { const [a, b, c] = [...dims].sort((p, q) => q - p); return a <= 0.5 && b <= 0.35 && c <= 0.2 && a * b * c <= 0.02; };

// one unit book (1 × 1 × 1, centred), its faces marked: spine +z, page block top and bottom, leather elsewhere
function unitBook(THREE) {
  const g = new THREE.BoxGeometry(1, 1, 1), n = g.attributes.uv.count, page = new Float32Array(n), side = new Float32Array(n);
  for (let f = 0; f < 6; f++) for (let i = f * 4; i < f * 4 + 4; i++) { page[i] = f === 2 || f === 3 ? 1 : 0; side[i] = f === 4 || f === 2 || f === 3 ? 0 : 1; }
  g.setAttribute("aPage", new THREE.BufferAttribute(page, 1)); g.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
  return g;
}

// the look's books: atlases, materials and the unit shape, made once and kept on the kit
export function bookLook(THREE, K, seed = 1667) {
  if (K.books) return K.books;
  const A = spineAtlas(THREE, seed), TA = titleAtlas(THREE);
  const material = (instanced) => {
    const m = new THREE.MeshStandardMaterial({ map: A.texture, roughness: 0.7 }); m.userData.cls = "books";
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uPages = { value: new THREE.Vector4(...A.pages) }; sh.uniforms.uTitles = { value: TA.texture };
      const per = instanced ? "attribute vec4 aCell; attribute vec4 aTitle; attribute vec4 aLabel;" : "uniform vec4 uCell; uniform vec4 uTitle; uniform vec4 uLabel;";
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", `#include <common>\nattribute float aPage; attribute float aSide; uniform vec4 uPages; ${per}\nvarying vec2 vLocal; varying float vSpine; varying vec4 vTitle; varying vec4 vLabel;`)
        .replace("#include <uv_vertex>", `#include <uv_vertex>
          { vec4 c = ${instanced ? "aCell" : "uCell"}; vec2 q = aSide > 0.5 ? vec2(0.1, uv.y) : uv;
            vMapUv = aPage > 0.5 ? mix(uPages.xy, uPages.zw, uv) : mix(c.xy, c.zw, q);
            vLocal = uv; vSpine = (aPage < 0.5 && aSide < 0.5) ? 1.0 : 0.0;
            vTitle = ${instanced ? "aTitle" : "uTitle"}; vLabel = ${instanced ? "aLabel" : "uLabel"}; }`);
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D uTitles; varying vec2 vLocal; varying float vSpine; varying vec4 vTitle; varying vec4 vLabel;")
        .replace("#include <map_fragment>", `#include <map_fragment>
          if (vSpine > 0.5 && vTitle.z > vTitle.x) {
            vec2 L = (vLocal - vLabel.xy) / (vLabel.zw - vLabel.xy);
            if (L.x >= 0.0 && L.x <= 1.0 && L.y >= 0.0 && L.y <= 1.0) { vec4 t = texture2D(uTitles, mix(vTitle.xy, vTitle.zw, L)); diffuseColor.rgb = mix(diffuseColor.rgb, t.rgb, t.a); }
          }`);
      m.userData.shader = sh;
    };
    m.customProgramCacheKey = () => "book" + (instanced ? "I" : "S");
    return m;
  };
  const titleRect = (s) => s.title < 0 ? [0, 0, 0, 0] : s.binding === "gilt" ? (TA.cells.gilt[s.title][s.vol || 0] || TA.cells.gilt[s.title][0]) : s.binding === "vellum" ? TA.cells.vellum[s.title] : TA.cells.ink[s.title];
  return (K.books = { atlas: A, titles: TA, titleRect, unit: unitBook(THREE), instanced: material(true), material });
}

// where a book stands: a matrix from its spec and its place (x centre, y shelf, z centre), upright,
// leaning (lean, radians, pivoting on its foot by the books) or lying flat (flat: spine still outward)
export function bookMatrix(THREE, s, x, y, z, lean = 0, flat = false) {
  const m = new THREE.Matrix4();
  if (flat) { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2); return m.compose(new THREE.Vector3(x, y + s.w / 2, z), q, new THREE.Vector3(s.w, s.h, s.d)); }
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -lean);
  const px = x - s.w / 2, py = y + (lean ? s.w * Math.sin(lean) : 0);
  const c = new THREE.Vector3(s.w / 2, s.h / 2, 0).applyQuaternion(q);
  return m.compose(new THREE.Vector3(px + c.x, py + c.y, z), q, new THREE.Vector3(s.w, s.h, s.d));
}

// many books as one instanced mesh: placements = [{ spec, matrix }]
export function booksMesh(THREE, K, placements) {
  const L = bookLook(THREE, K), n = placements.length;
  const g = L.unit.clone(), cells = new Float32Array(n * 4), titles = new Float32Array(n * 4), labels = new Float32Array(n * 4);
  placements.forEach((p, i) => { cells.set(L.atlas.cell(p.spec.cell), i * 4); titles.set(L.titleRect(p.spec), i * 4); labels.set(LABEL[p.spec.binding], i * 4); });
  g.setAttribute("aCell", new THREE.InstancedBufferAttribute(cells, 4));
  g.setAttribute("aTitle", new THREE.InstancedBufferAttribute(titles, 4));
  g.setAttribute("aLabel", new THREE.InstancedBufferAttribute(labels, 4));
  const mesh = new THREE.InstancedMesh(g, L.instanced, n), col = new THREE.Color();
  placements.forEach((p, i) => { mesh.setMatrixAt(i, p.matrix); mesh.setColorAt(i, col.setScalar(p.spec.tone)); });
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { instance: "books", material: "books", slots: placements.map(p => p.spec) };
  return mesh;
}

// one book on its own: what a player picks up, or one that matters to the story
export function buildBook(THREE, K, spec, id = null) {
  const L = bookLook(THREE, K), m = L.material(false), prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => { sh.uniforms.uCell = { value: new THREE.Vector4(...L.atlas.cell(spec.cell)) }; sh.uniforms.uTitle = { value: new THREE.Vector4(...L.titleRect(spec)) }; sh.uniforms.uLabel = { value: new THREE.Vector4(...LABEL[spec.binding]) }; prev(sh, r); };
  m.color.setScalar(spec.tone);
  const mesh = new THREE.Mesh(L.unit, m); mesh.scale.set(spec.w, spec.h, spec.d); mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { entity: id, kind: "book", spec, title: titleOf(spec), takeable: takeable([spec.w, spec.h, spec.d]) };
  return mesh;
}

// fill one shelf row from a context: how full, in what order, sets kept together, now and then a stack
// lying flat. Two habits: a full shelf runs end to end, its last book leaning into any small gap; a shelf
// with few books keeps them TUCKED together in one run from the left, and the run's open end is held,
// either by a heap of books laid flat or (holder) by something heavy the owner puts against it.
// count caps the books; sorted orders the run by height. Returns placements, faults, and where the run
// ends (end), so the rest of the shelf can take other things.
export function fillRow(THREE, { size, seed, x0, x1, y, zFront, depthMax, clear, ctx = bookContext(), count = Infinity, tuck = false, holder = false, sorted = ctx.ordered }) {
  const r = rng(seed), out = [], faults = [], span = x1 - x0;
  const fullness = ctx.fullness[0] + r() * (ctx.fullness[1] - ctx.fullness[0]);
  const smaller = ORDER.slice(ORDER.indexOf(size));
  const fits = (s) => { s.h = Math.min(s.h, clear - 0.012); s.d = Math.min(s.d, depthMax); return s; };
  const specs = [];
  let used = 0, i = 0;
  while (used < span * fullness && specs.length < count && i < 400) {
    if (r() < ctx.sets * 0.25) {         // a set: several volumes of one work, one binding, one size, numbered
      const first = fits(bookSpec(size, hash(seed, i++, 7) * 1e9 | 0, ctx, { binding: r() < 0.5 ? "gilt" : "plain", set: true }));
      if (first.title < 0 || FLAT[first.title].vols < 2) { if (first.title >= 0) { specs.push(first); used += first.w + 0.001; } continue; }
      const n = FLAT[first.title].vols;
      for (let v = 1; v <= n && used + first.w + 0.001 < span * fullness && specs.length < count; v++) { const s = { ...first, seed: first.seed + v, vol: v, tone: first.tone * (0.97 + r() * 0.06) }; specs.push(s); used += s.w + 0.001; }
      continue;
    }
    const sz = ctx.ordered ? size : smaller[Math.floor(r() * Math.min(3, smaller.length))];
    const prev = specs[specs.length - 1], alike = ctx.ordered && prev && r() < 0.85 ? { binding: prev.binding, cell: prev.cell } : {};
    const s = fits(bookSpec(sz, hash(seed, i++, 7) * 1e9 | 0, ctx, alike));
    if (used + s.w > span - 0.01) break;
    specs.push(s); used += s.w + 0.001;
  }
  if (sorted) { // tallest first, sets kept together: sort runs, not books
    const runs = []; for (const s of specs) { const last = runs[runs.length - 1]; if (s.vol > 1 && last) last.push(s); else runs.push([s]); }
    runs.sort((a, b) => b[0].h - a[0].h); specs.length = 0; for (const run of runs) specs.push(...run);
  }
  // a heap laid flat: in a poor house part of the row is a heap; in a tucked run with nothing to hold its
  // end, the last books are laid flat to hold it. Pamphlets in paper wrappers never stand: they lie flat.
  const flat = [];
  for (let q = specs.length - 1; q >= 0; q--) if (specs[q].binding === "paper" && specs.length > 1) flat.push(...specs.splice(q, 1));
  const runEndsOpen = tuck && !holder && used < span - 0.05;
  if ((r() < ctx.flat || runEndsOpen) && specs.length > 1 && !flat.length) { const k = runEndsOpen ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3); for (let q = 0; q < k && specs.length > 1; q++) flat.push(specs.pop()); }
  flat.sort((a, b) => b.h - a.h);
  const heapW = flat.length ? flat[0].h + 0.006 : 0, xu1 = tuck ? x1 : x1 - heapW;
  while (specs.length && specs.reduce((a, s) => a + s.w + 0.001, 0) + (tuck ? heapW : 0) > xu1 - x0) specs.pop();
  used = specs.reduce((a, s) => a + s.w + 0.001, 0);
  // gaps belong to a careless, half-empty shelf; a tucked run has none
  const slack = Math.max(0, xu1 - x0 - used - 0.004), gaps = sorted || tuck ? 0 : Math.min(3, Math.floor(slack / 0.08));
  const gapAfter = new Set(); for (let q = 0; q < gaps; q++) gapAfter.add(Math.floor(r() * specs.length));
  let x = x0;
  specs.forEach((s, j) => {
    let lean = 0;
    const nextX = x + s.w, gapNext = gapAfter.has(j) ? slack / Math.max(1, gaps + 1) : 0;
    const isLast = j === specs.length - 1, room = isLast ? (tuck ? 0 : xu1 - nextX) : gapNext;
    if ((isLast || gapNext) && room > 0.01 && room < s.h * Math.sin(0.4)) {
      const reach = (a) => s.w * Math.cos(a) + s.h * Math.sin(a);
      let lo = 0, hi = 0.4; for (let q = 0; q < 30; q++) { const m = (lo + hi) / 2; if (reach(m) < s.w + room - 0.004) lo = m; else hi = m; }
      if (lo > 0.05) lean = lo;
    }
    const M = bookMatrix(THREE, s, x + s.w / 2, y, zFront - s.d / 2, lean);
    for (const cx of [-0.5, 0.5]) for (const cy of [-0.5, 0.5]) { const p = new THREE.Vector3(cx, cy, 0).applyMatrix4(M);
      if (p.y > y + clear + 1e-4) faults.push(`book ${s.seed} into the shelf above`); if (p.y < y - 1e-4) faults.push(`book ${s.seed} sunk in its shelf`);
      if (p.x < x0 - 1e-4 || p.x > xu1 + 1e-4) faults.push(`book ${s.seed} through the end`); }
    out.push({ spec: s, matrix: M }); x = nextX + 0.001 + gapNext;
  });
  // the heap: biggest at the bottom; against the run's end when tucked, else at the shelf's free end
  let hy = y, end = x;
  const hx = tuck ? x + 0.002 + heapW / 2 : x1 - heapW / 2;
  for (const s of flat) {
    if (hy + s.w > y + clear) continue;
    out.push({ spec: s, matrix: bookMatrix(THREE, s, hx, hy, zFront - s.d / 2, 0, true) }); hy += s.w;
    end = Math.max(end, hx + heapW / 2);
  }
  return { placements: out, faults, end: tuck ? end : x1 };
}
