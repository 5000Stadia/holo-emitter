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
    browserName: "chromium",
    headless: true,
    viewport: { width: 1280, height: 900 }
  }
});
