/* assets.js — heavy files from jsDelivr, with the Pages URL as the fallback.
 *
 * [Kabe, gate g8dfd99, 2026-10-07] GitHub Pages caches for 10 minutes and has no
 * Brotli; jsDelivr serves a GitHub file by commit for a year, immutable, Brotli,
 * HTTP/3. The published site lists the files it moves in a manifest
 * (tools/asset-manifest.mjs, made by tools/publish-site.sh) and the publish
 * prepends it to this file as `globalThis.HOLO_ASSET_MANIFEST = {...};` and
 * adds this script to the published copy of every page. NOTHING IN THE WORKING
 * TREE CHANGES: with no manifest (a local run, the test suite, file://) this
 * file does nothing at all and every URL is the one the page wrote.
 *
 * With a manifest it
 *   - exposes  HoloAssets.assetURL(path)   (path as the page would fetch it,
 *     relative to the page or absolute; returns the jsDelivr URL if the file is
 *     listed, else the same path resolved) for code that wants it directly, and
 *   - hooks the two ways a page loads data: fetch(url) and img.src = url (so
 *     THREE.TextureLoader / ImageLoader / ImageBitmapLoader / GLTF fetches /
 *     the painted-wall <img>s all go through without being edited). Only a URL
 *     that resolves to a LISTED path on this site is touched; everything else
 *     (three.js, fonts, blobs, data: URIs, other origins) passes through.
 *
 * FALLBACK. fetch: a network error, a non-2xx, or no answer within 8 s falls back
 * to the Pages URL. img: the CDN is tried on a detached probe Image first; an error,
 * or no load within 20 s, gives the page's element the Pages URL instead (so the
 * page's own error handlers only ever hear about the Pages URL failing). After the first CDN
 * failure the page stops asking the CDN at all (HoloAssets.cdnDown), so one dead
 * CDN costs one timeout, not one per file. An image taken from the CDN gets
 * crossOrigin="anonymous" (jsDelivr sends Access-Control-Allow-Origin: *), which
 * WebGL needs to use it as a texture.
 *
 * Classic script, no imports, so it loads before module scripts and works in
 * every page: <script src="…/src/make/assets.js"></script>. */
(function (g) {
  "use strict";
  var M = g.HOLO_ASSET_MANIFEST;
  var A = g.HoloAssets = { active: false, cdnDown: false, served: 0, fellBack: 0, files: 0, assetURL: null };
  if (!M || !M.groups || !g.document) { A.assetURL = function (p) { try { return new URL(p, g.document ? g.document.baseURI : g.location.href).href; } catch (e) { return p; } }; return; }

  var cs = g.document.currentScript;
  var root = null;                                    // the site root: the directory the manifest's paths are relative to
  try { root = new URL(cs && cs.src ? "../../" : "./", cs && cs.src ? cs.src : g.location.href); } catch (e) { return; }
  // assets.js is published at <root>/src/make/assets.js, so ../../ is the root
  var path2url = {};
  for (var sha in M.groups) for (var i = 0, a = M.groups[sha]; i < a.length; i++) { path2url[a[i]] = M.cdn + sha + "/" + a[i]; A.files++; }

  function rel(u) {                                   // absolute URL -> manifest key, or null
    var x;
    try { x = new URL(u, g.document.baseURI); } catch (e) { return null; }
    if (x.origin !== root.origin || x.pathname.indexOf(root.pathname) !== 0) return null;
    var p = x.pathname.slice(root.pathname.length);
    try { p = decodeURIComponent(p); } catch (e) { /* keep raw */ }
    return Object.prototype.hasOwnProperty.call(path2url, p) ? p : null;
  }
  function cdn(u) { var p = rel(u); return p ? path2url[p] : null; }

  A.assetURL = function (p) { var x = new URL(p, g.document.baseURI).href; return (!A.cdnDown && cdn(x)) || x; };

  /* fetch */
  var nativeFetch = g.fetch && g.fetch.bind(g);
  if (nativeFetch) g.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input instanceof g.URL ? input.href : (input && input.url));
    var plain = typeof input === "string" || input instanceof g.URL ||
      (input instanceof g.Request && input.method === "GET" && ![...input.headers].length);
    var c = !A.cdnDown && plain && (!init || ((!init.method || /^GET$/i.test(init.method)) && !init.headers)) ? cdn(url) : null;
    if (!c) return nativeFetch(input, init);
    var ctl = new g.AbortController(), timer = setTimeout(function () { ctl.abort(); }, 8000);
    var opts = {}; for (var k in (init || {})) opts[k] = init[k];
    opts.signal = ctl.signal; opts.mode = "cors"; opts.credentials = "omit";
    return nativeFetch(c, opts).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("cdn " + r.status);
      A.served++; return r;
    }).catch(function () {
      clearTimeout(timer); A.cdnDown = true; A.fellBack++;
      return nativeFetch(input, init);
    });
  };

  /* Image.src */
  var desc = g.HTMLImageElement && Object.getOwnPropertyDescriptor(g.HTMLImageElement.prototype, "src");
  if (desc && desc.set) Object.defineProperty(g.HTMLImageElement.prototype, "src", {
    configurable: true, enumerable: desc.enumerable, get: desc.get,
    set: function (v) {
      var img = this, c = (!A.cdnDown && typeof v === "string") ? cdn(v) : null;
      if (!c) { img.__holoTok = null; return desc.set.call(img, v); }
      /* The CDN is tried on a DETACHED probe Image, then the page's own element is given the
         URL that worked (a cache hit). A failure then fires its error event on the probe,
         which is not in the document and so never reaches a window-level error listener
         (index.html's "boot fault" handler captures every resource error, and prints an
         apology while nothing has painted); the page's element only ever hears about the
         Pages URL. */
      if (img.crossOrigin == null) img.crossOrigin = "anonymous";
      var tok = img.__holoTok = {}, probe = new g.Image(), done = false, timer = null;
      probe.crossOrigin = "anonymous";
      function settle(url, ok) {
        if (done) return; done = true; clearTimeout(timer);
        if (ok) A.served++; else { A.cdnDown = true; A.fellBack++; }
        if (img.__holoTok === tok) desc.set.call(img, url);
      }
      probe.onload = function () { settle(c, true); };
      probe.onerror = function () { settle(v, false); };
      timer = setTimeout(function () { probe.onload = probe.onerror = null; settle(v, false); }, 20000);
      desc.set.call(probe, c);
      return;
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
