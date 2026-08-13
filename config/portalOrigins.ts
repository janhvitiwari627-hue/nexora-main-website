export type ExternalPortalKey = "customer" | "owner" | "partner" | "template";

const PORTAL_ORIGIN_VARIABLES: Record<ExternalPortalKey, readonly string[]> = {
  customer: ["NEXORA_CUSTOMER_PWA_ORIGIN"],
  owner: ["NEXORA_OWNER_PWA_ORIGIN"],
  partner: ["NEXORA_PARTNER_PWA_ORIGIN", "GROWTH_PARTNER_APP_ORIGIN"],
  template: ["NEXORA_TEMPLATE_PWA_ORIGIN"],
};

const REQUIRED_EXTERNAL_PORTALS = new Set<ExternalPortalKey>(["customer", "owner", "partner"]);

/**
 * Built-in origins used when no environment variable is configured.
 *
 * The Template App (website builder) is deployed at its own Vercel origin, so
 * `/app/template` must reach it even on a deployment that never set
 * `NEXORA_TEMPLATE_PWA_ORIGIN`. The env var always wins when present; this is
 * only the fallback. Customer / Owner / Partner intentionally have no default
 * and still fail closed, because a wrong guess there would break sign-in.
 */
const DEFAULT_PORTAL_ORIGINS: Partial<Record<ExternalPortalKey, string>> = {
  template: "https://new-tamplete-app.vercel.app",
};

/** Default Template App origin used when NEXORA_TEMPLATE_PWA_ORIGIN is unset. */
export const DEFAULT_TEMPLATE_ORIGIN = DEFAULT_PORTAL_ORIGINS.template!;

function deploymentHostnames(): Set<string> {
  const hostnames = new Set<string>();
  for (const variable of ["VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL", "NEXT_PUBLIC_SITE_URL"]) {
    const value = process.env[variable]?.trim();
    if (!value) continue;
    try {
      const candidate = new URL(value.includes("://") ? value : `https://${value}`);
      hostnames.add(candidate.hostname.toLowerCase());
    } catch {
      throw new Error(`${variable} must contain a valid deployment hostname.`);
    }
  }
  return hostnames;
}

function parseHttpsOrigin(variable: string, rawValue: string): string {
  let url: URL;
  try {
    url = new URL(rawValue);
  } catch {
    throw new Error(`${variable} must be an absolute HTTPS URL.`);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`${variable} must be an origin-only absolute HTTPS URL.`);
  }
  if (deploymentHostnames().has(url.hostname.toLowerCase())) {
    throw new Error(`${variable} must not point back to this deployment.`);
  }
  return url.origin;
}

/**
 * Resolve a server-side PWA origin.
 *
 * Environment configuration always wins. Required portals fail closed when
 * unset; optional portals fall back to their built-in origin (Template), and
 * to `undefined` when they have none.
 */
export function resolvePortalOrigin(portal: ExternalPortalKey): string | undefined {
  const configured = PORTAL_ORIGIN_VARIABLES[portal]
    .map((variable) => ({ variable, value: process.env[variable]?.trim() }))
    .filter((entry): entry is { variable: string; value: string } => Boolean(entry.value));

  if (configured.length === 0) {
    if (REQUIRED_EXTERNAL_PORTALS.has(portal)) {
      throw new Error(`${PORTAL_ORIGIN_VARIABLES[portal].join(" or ")} is required.`);
    }
    const fallback = DEFAULT_PORTAL_ORIGINS[portal];
    if (!fallback) return undefined;
    // A default that resolves to this deployment would redirect onto itself.
    if (deploymentHostnames().has(new URL(fallback).hostname.toLowerCase())) return undefined;
    return new URL(fallback).origin;
  }

  const normalized = configured.map(({ variable, value }) => ({ variable, origin: parseHttpsOrigin(variable, value) }));
  if (new Set(normalized.map(({ origin }) => origin)).size !== 1) {
    throw new Error(`${PORTAL_ORIGIN_VARIABLES[portal].join(" and ")} must resolve to the same origin.`);
  }
  return normalized[0].origin;
}

export function configuredPortalOrigins(): Record<"customer" | "owner" | "partner", string> & { template?: string } {
  return {
    customer: resolvePortalOrigin("customer")!,
    owner: resolvePortalOrigin("owner")!,
    partner: resolvePortalOrigin("partner")!,
    template: resolvePortalOrigin("template"),
  };
}
