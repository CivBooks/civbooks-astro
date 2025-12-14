// @ts-check
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://books.civinfo.net/",
  integrations: [
    pagefind({
      indexConfig: {
        keepIndexUrl: true,
      },
    }),
    sitemap(),
  ],
});
