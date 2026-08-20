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
  /* Chromium runs everything. A second engine runs the specs whose claims are
     about behaviour rather than about this renderer's exact pixels — §12.2's
     replay clause, the pinned walkthrough, the harness, the boot and fault
     surfaces. It is not decoration: §12.2 clause 2 was red on Firefox for a
     real product reason (a travel guard that swallowed the replay's second
     passage) while the Chromium-only suite stayed green, and four boot guards
     were inert there because `page.route` does not intercept `file://` off
     Chromium. Hash VALUES are never compared across engines — clause 1 is a
     within-run identity and stays so; sub-pixel rasterisation differs and
     that is accepted residue, recorded in design/architecture.md. */
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    {
      name: "firefox-behaviour",
      use: { browserName: "firefox" },
      testMatch: /(walkthrough|determinism|harness|harness-refusals|turning)\.spec\.mjs$/
    }
  ]
});
