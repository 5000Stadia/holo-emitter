// The case's people painted off the main thread (R65): src/make/sitter.js in a worker, while the house is raised.
// Asked { id, look, opts } (paintSitter's arguments); answers { id, bitmap, face } (the canvas as an ImageBitmap, its
// pixels as painted), or { id, error } (the page then paints it itself, as before)
import { paintSitter } from "./sitter.js";
self.onmessage = ({ data: { id, look, opts } }) => {
  try { const c = paintSitter(look, opts), bitmap = c.transferToImageBitmap(); self.postMessage({ id, bitmap, face: c.face || null }, [bitmap]); }
  catch (e) { self.postMessage({ id, error: String(e?.message || e) }); }
};
