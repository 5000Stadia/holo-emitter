import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  /* Several §12.8 cases render the full 1536×1024 canvas a dozen times over
     and read every pixel back. On a loaded machine those run 30–40 s, and
     the 30 s default turned "the suite is green" into "the suite is green
     when the machine is quiet". */
  timeout: 90_000,
  reporter: [["list"]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 900 }
  },
  /* Both engines run everything. Not decoration: §12.2's replay clause was
     red on Firefox for a real product reason — a travel guard that swallowed
     the replay's second passage — while a Chromium-pinned suite stayed green,
     and four boot guards were inert there because `page.route` does not
     intercept `file://` off Chromium.
     It is safe to run all of it because **no test compares a hash to a
     literal**: every hash assertion is a within-run identity (the same page,
     the same run), and everything else is an alpha-bounds or luminance
     measurement. Sub-pixel rasterisation does differ between engines — that
     is accepted residue, recorded in design/architecture.md — and it is
     never what a test reads. Restricting the second engine to "behaviour"
     specs left §12.3, §12.4, §12.5 and §12.8 on one renderer, including the
     clause the intention singles out: the key not existing on screen until
     it is revealed. */
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    {
      name: "firefox",
      use: { browserName: "firefox" }
    }
  ]
});
