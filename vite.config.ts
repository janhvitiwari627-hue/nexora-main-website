import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  // compatibility_flags are already declared in wrangler.json; defining them
  // here as well makes Miniflare reject the preview config as a duplicate.
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

/**
 * Dev-only cache hygiene for the preview:
 *
 * 1) HTML documents get `Cache-Control: no-store`. Vite/vinext send no
 *    caching directive on the document, which lets browsers heuristically
 *    cache it — a stale document keeps referencing old module URLs and mixes
 *    dependency-optimizer sessions ("Cannot read properties of null (reading
 *    'useContext')" from duplicated React). Never storing the document means
 *    every reload fetches current HTML with current module URLs.
 * 2) Optimized deps (`node_modules/.vite/deps/*.js?v=…`) arrive with
 *    `max-age=31536000, immutable`. Those URLs keep their path across
 *    re-optimizations while their transformed content changes, so an
 *    immutable cached copy also mixes sessions. Downgraded to `no-cache`
 *    (revalidate + ETag): 304s keep loads fast, content is always current.
 *
 * Production builds are unaffected — `apply: "serve"` keeps this plugin out
 * of `vite build`.
 */
function devRevalidationOnlyCache(): Plugin {
  return {
    name: "dev-revalidation-only-cache",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        const originalSetHeader = res.setHeader.bind(res);
        res.setHeader = ((name: string, value: unknown) => {
          if (typeof name === "string") {
            const lower = name.toLowerCase();
            if (
              lower === "content-type" &&
              typeof value === "string" &&
              value.includes("text/html")
            ) {
              originalSetHeader("Cache-Control", "no-store");
            }
            if (
              lower === "cache-control" &&
              typeof value === "string" &&
              value.includes("immutable")
            ) {
              return originalSetHeader("Cache-Control", "no-cache");
            }
          }
          return originalSetHeader(name as never, value as never);
        }) as typeof res.setHeader;
        next();
      });
    },
  };
}

  return {
    server: {
      host: "0.0.0.0",
      // Arena previews are proxied under a generated host, not terminal.local.
      allowedHosts: true as const,
      // NOTE: immutable dep caching is downgraded to no-cache by the
      // devRevalidationOnlyCache() plugin above (server.headers cannot
      // override Vite's internal middleware headers).
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      devRevalidationOnlyCache(),
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
