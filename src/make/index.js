// The production system's front door: the parts (code) and kinds (data) registered once, and what a
// place needs to build things and make them work.
import "./parts/joinery.js";
import "./parts/ironwork.js";
import "./parts/press.js";
import "./parts/lights.js";
import "./parts/shapes.js";
import "./parts/shelving.js";
import "./parts/bookcases.js";
import { defineKind } from "./catalogue.js";
import strongroom1660 from "./kinds/strongroom-1660.js";
import household1660 from "./kinds/household-1660.js";
import house1660 from "./kinds/house-1660.js";

for (const k of [...strongroom1660, ...household1660, ...house1660]) defineKind(k);

export { build } from "./build.js";
export { makeWorks } from "./works.js";
export { kindOf, kinds, settle, defineKind, definePart, onPartArrives, missingParts } from "./catalogue.js";
export { idOf, seedOf, at, hashOf } from "./id.js";
export { makeWorld, GENERATOR } from "./world.js";
export { layoutOf } from "./layout.js";
export { lookC1660 } from "./looks.js";
export { shutterOpen } from "./parts/joinery.js";
export { blend, reaching } from "./influence.js";
export { OWNERS, PURPOSES } from "./influences/england-1660.js";
export { planHybridE, DIMS } from "./plans/hybrid-e.js";
export { GENTRY_SEAT_1660 } from "./programs/england-1660.js";
export { ROOM_TYPES_1660 } from "./rooms/england-1660.js";
