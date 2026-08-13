export type ExternalPortalKey = "customer" | "owner" | "partner" | "template";

const PORTAL_ORIGIN_VARIABLES: Record<ExternalPortalKey, readonly string[]> = {
  customer: ["NEXORA_CUSTOMER_PWA_ORIGIN"],
  owner: ["NEXORA_OWNER_PWA_ORIGIN"],
  partner: ["NEXORA_PARTNER_PWA_ORIGIN", "GROWTH_PARTNER_APP_ORIGIN"],
  template: ["NEXORA_TEMPLATE_PWA_ORIGIN"],
};

const REQUIRED_EXTERNAL_PORTALS = new Set<ExternalPortalKey>(["customer", "owner", "partner"]);

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

/** Resolve a server-side PWA origin without a production fallback. */
export function resolvePortalOrigin(portal: ExternalPortalKey): string | undefined {
  const configured = PORTAL_ORIGIN_VARIABLES[portal]
    .map((variable) => ({ variable, value: process.env[variable]?.trim() }))
    .filter((entry): entry is { variable: string; value: string } => Boolean(entry.value));

  if (configured.length === 0) {
    if (REQUIRED_EXTERNAL_PORTALS.has(portal)) {
      throw new Error(`${PORTAL_ORIGIN_VARIABLES[portal].join(" or ")} is required.`);
    }
    return undefined;
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
