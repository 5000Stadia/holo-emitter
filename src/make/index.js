// The production system's front door: the parts (code) and kinds (data) registered once, and what a
// place needs to build things and make them work.
import "./parts/joinery.js";
import "./parts/ironwork.js";
import "./parts/press.js";
import "./parts/lights.js";
import { defineKind } from "./catalogue.js";
import strongroom1660 from "./kinds/strongroom-1660.js";

for (const k of strongroom1660) defineKind(k);

export { build } from "./build.js";
export { makeWorks } from "./works.js";
export { kindOf, kinds, settle } from "./catalogue.js";
export { idOf, seedOf, at } from "./id.js";
export { lookC1660 } from "./looks.js";
export { shutterOpen } from "./parts/joinery.js";
