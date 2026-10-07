// Looks (design/production/plan.md §2): what each material role is, for one period and place. A
// kind names roles (wood, wood_face, iron, parchment…); the look decides what they are, so the same
// kinds build an English evidence house in 1660 or, with another look, somewhere else.
import { drawerInside } from "../../lab/painted/procedural.js";

// an English house c. 1660, from the kit's oak and the strongroom's iron, stone and paper
export function lookC1660(THREE, K, S) {
  const m = (cls, o) => { const x = new THREE.MeshStandardMaterial(o); x.userData.cls = cls; return x; };
  K.look1660 = K.look1660 || {
    name: "england-1660",
    roles: {
      wood: K.M.oak, wood_face: K.M.oakH, wood_inside: drawerInside(THREE, K), door_wood: S.doorOak,
      iron: S.iron, dark: S.dark, parchment: S.parch, tape: S.tape,
      ashlar: m("ashlar", { color: 0xc2b598, roughness: 0.9 }),           // the house's outside: limestone ashlar (research-1660 §A)
      metal: m("brass", { color: 0xb08a4a, metalness: 0.7, roughness: 0.35 }),
      pewter: m("pewter", { color: 0x9a968c, metalness: 0.55, roughness: 0.42 }),
      wax: m("tallow", { color: 0xe6dcc2, roughness: 0.55 }),
      seal_wax: m("seal_wax", { color: 0x8a2a1e, roughness: 0.5 }),
      stoneware: m("stoneware", { color: 0x8a6a46, roughness: 0.45 }),       // salt-glazed brown
      earthenware: m("earthenware", { color: 0x9a5a34, roughness: 0.7 }),
      slipware: m("slipware", { color: 0xc8a050, roughness: 0.5 }),
      glass: m("glass", { color: 0x3e5a3a, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.82 }),
      // clear thick glass, a pale cast (Alice's glass table and box: the key is seen through it); draws without writing depth so its own thickness never hides itself
      glass_clear: m("glass_clear", { color: 0xd9eee6, roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.3, depthWrite: false }),
      glazing: (() => { const g = m("glazing", { color: 0xe4ece6, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.07, depthWrite: false }); return g; })(),
      treen: m("treen", { color: 0x7a5434, roughness: 0.7 }),
      porcelain: m("porcelain", { color: 0xe8ecf0, roughness: 0.2 }),
      porcelain_blue: m("porcelain_blue", { color: 0x3a5a9a, roughness: 0.25 }),
      globe: m("globe", { color: 0xc8b48a, roughness: 0.55 }),
      shell: m("shell", { color: 0xe0c8b0, roughness: 0.4 }),
      paper: m("paper", { color: 0xe8dcc0, roughness: 0.6 }),
      turkey: m("turkey_work", { color: 0x7a2a24, roughness: 0.95 }),            // Turkey-work upholstery
      hangings: m("hangings", { color: 0x5a2430, roughness: 0.9 }),             // a bed's woollen curtains and valance
      linen: m("linen", { color: 0xe6e0cf, roughness: 0.85 }),
      japan: m("japan", { color: 0x141010, roughness: 0.25, metalness: 0.1 }),  // black lacquer
      gilt: m("gilt", { color: 0xb8964a, roughness: 0.35, metalness: 0.75 }),
      brick: m("brick", { color: 0x8a4a32, roughness: 0.9 }),
      canvas: m("canvas", { color: 0x3a2e22, roughness: 0.8 }),
      bacon: m("bacon", { color: 0x9a5c40, roughness: 0.6 }),                   // a cured flitch
      brine: m("brine", { color: 0x3a3428, roughness: 0.08, metalness: 0.1 }),   // a powdering tub's pickle
      dough: m("dough", { color: 0xd8c8a0, roughness: 0.9 }),
      bread: m("bread", { color: 0x8a5a2a, roughness: 0.8 }),
      soot: m("soot", { color: 0x141210, roughness: 0.95 }),
      wool: m("wool", { color: 0x4c463a, roughness: 0.95 }),                     // a drab cloak
      carpet: (() => { const x = m("turkey_carpet", { map: turkeyCarpet(THREE), roughness: 0.95 }); return x; })(),
    },
  };
  return K.look1660;
}

// a Turkey carpet for a table, drawn in code: a madder-red field, a row of blue and gold medallions, a
// dark border with a running line; tiled across the cloth at about a metre to a repeat
function turkeyCarpet(THREE) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const g = cv.getContext("2d");
  g.fillStyle = "#7a2422"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#1e2440"; g.fillRect(0, 0, 256, 28); g.fillRect(0, 228, 256, 28); g.fillRect(0, 0, 28, 256); g.fillRect(228, 0, 28, 256);
  g.strokeStyle = "#c8a050"; g.lineWidth = 3; g.strokeRect(14, 14, 228, 228); g.strokeRect(34, 34, 188, 188);
  for (const [x, y, r, c] of [[128, 128, 52, "#24305a"], [128, 128, 30, "#c8a050"], [128, 128, 12, "#7a2422"], [66, 66, 16, "#c8a050"], [190, 66, 16, "#c8a050"], [66, 190, 16, "#c8a050"], [190, 190, 16, "#c8a050"]]) {
    g.fillStyle = c; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, rr = k % 2 ? r * 0.7 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
  g.globalAlpha = 0.15; g.fillStyle = "#000"; for (let y = 0; y < 256; y += 2) g.fillRect(0, y, 256, 1); g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
