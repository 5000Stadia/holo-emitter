/* inventory.js — the inventory strip (blueprint §8).
 *
 * A projection, like the scene: it re-renders from the world document's
 * held_by relations on every envelope and holds no state of its own. Tile
 * order follows held_by relation order in the world document (truth
 * decides). Each tile is a 128x128 canvas drawn pixel-identical to the
 * entity's thumb (the walkthrough hashes tile getImageData against the thumb
 * canvas), displayed small by CSS; the title attribute carries the record's
 * noun — product speech, per the intention's voice rule. The empty strip
 * renders no tiles and no words.
 */
(function () {
  "use strict";

  /**
   * Render the strip.
   * @param {HTMLElement} container  the #inventory element (emptied first)
   * @param {object} world           the world document (held_by relations)
   * @param {object} library         the sprite library (thumb canvases)
   * @param {Document} doc           DOM document, for createElement
   */
  function render(container, world, library, doc) {
    while (container.firstChild) container.removeChild(container.firstChild);
    var relations = world.relations || [];
    for (var i = 0; i < relations.length; i++) {
      var rel = relations[i];
      if (rel[0] !== "held_by" || rel[2] !== "player") continue;
      var id = rel[1];
      var entity = null;
      for (var j = 0; j < world.entities.length; j++) {
        if (world.entities[j].id === id) { entity = world.entities[j]; break; }
      }
      if (!entity) continue;
      var sprite = library[entity.sprite];
      var tile = doc.createElement("canvas");
      tile.width = 128;
      tile.height = 128;
      tile.className = "inv-tile";
      tile.setAttribute("data-entity", id);
      if (sprite) {
        // The record's noun, as an accessible name and not only as a
        // hover title: a canvas has no text content, and on touch there is
        // no hover at all, so `title` alone names the tile to nobody.
        tile.title = sprite.record.noun;
        tile.setAttribute("role", "img");
        tile.setAttribute("aria-label", sprite.record.noun);
        if (sprite.images.thumb) {
          tile.getContext("2d").drawImage(sprite.images.thumb, 0, 0);
        }
      }
      container.appendChild(tile);
    }
  }

  var api = { render: render };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.inventory = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
