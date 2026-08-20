import { test, expect, appUrl } from "./helpers.mjs";

test.describe("harness and envelope discipline (§8)", () => {
  test("valid turn: exactly one envelope with one view event; invalid intents: empty envelope, no redraw", async ({ page }) => {
    await page.goto(appUrl());
    const before = await page.evaluate(() => window.__T.hashScene());

    // Valid turn through the harness API: one envelope, one view event.
    const valid = await page.evaluate(() => {
      const h = window.HOLO_APP.harness;
      const n0 = h.envelopes.length;
      const env = h.dispatch({ type: "turn", dir: "right" });
      return { added: h.envelopes.length - n0, events: env.events };
    });
    expect(valid.added).toBe(1);
    expect(valid.events).toEqual([{ type: "view", location: "study", facing: "E" }]);
    const afterValid = await page.evaluate(() => window.__T.hashScene());
    expect(afterValid).not.toBe(before);

    // Invalid intents: an envelope with zero events, and the scene hash is
    // unchanged — the picture never changes when the world doesn't.
    for (const intent of [{ type: "turn", dir: "up" }, { type: "go" }, { type: "nonsense" }]) {
      const res = await page.evaluate((intent) => {
        const h = window.HOLO_APP.harness;
        const n0 = h.envelopes.length;
        const env = h.dispatch(intent);
        return { added: h.envelopes.length - n0, events: env.events.length };
      }, intent);
      expect(res.added, `refusal of ${JSON.stringify(intent)} is enveloped`).toBe(1);
      expect(res.events, "refusal envelope carries no events").toBe(0);
      const h = await page.evaluate(() => window.__T.hashScene());
      expect(h, "refusal triggers no redraw").toBe(afterValid);
    }

    // turn_id increments monotonically across all envelopes.
    const ids = await page.evaluate(() =>
      window.HOLO_APP.harness.envelopes.map((e) => e.turn_id));
    expect(ids).toEqual(ids.map((_, i) => i + 1));
  });
});
