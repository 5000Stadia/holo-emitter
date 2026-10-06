// The fps lab's layout (lab/fps/layout.json): every object's position, size and colour, and every
// point light's, from the seed, so every engine builds the same scene. Usage: node tools/fps-layout.mjs
import { writeFileSync, readFileSync } from "node:fs";
const spec = JSON.parse(readFileSync(new URL("../lab/fps/spec.json", import.meta.url)));
let s = 1660 >>> 0; const r = () => { s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9 >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; };
const round = (x) => Math.round(x * 1000) / 1000;
const objects = [], boxes = [], lights = [];
for (let i = 0; i < 10000; i++) objects.push([round((r() - 0.5) * 70), round(0.6 + r() * 6), round((r() - 0.5) * 70), round(0.4 + r() * 0.6), round(r()), round(r()), round(r())]);
for (let i = 0; i < 2000; i++) boxes.push([round((r() - 0.5) * 20), round(4 + i * 0.25), round((r() - 0.5) * 20), round(r() * 3.14), round(r()), round(r()), round(r())]);
for (let i = 0; i < 32; i++) lights.push([round((r() - 0.5) * 60), round(2 + r() * 5), round((r() - 0.5) * 60), round(r()), round(r()), round(r())]);
writeFileSync(new URL("../lab/fps/layout.json", import.meta.url), JSON.stringify({ _what: "x, y, z, radius, r, g, b per object; x, y, z, yaw, r, g, b per falling box (0.8 m cubes); x, y, z, r, g, b per point light", objects, boxes, lights }));
console.log("objects", objects.length, "boxes", boxes.length, "lights", lights.length);
