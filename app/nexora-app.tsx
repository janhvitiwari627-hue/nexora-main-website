"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import { BackToMainWebsiteButton } from "./BackToMainWebsiteButton";
import {
  AUTH_ROUTES,
  EXPECTED_SUPABASE_HOSTNAME,
  ROLE_LABELS,
  SUPABASE_PROJECT_REF,
  authErrorMessage,
  getSupabaseClient,
  homePathForRole,
  isSignupRole,
  neutralRecoveryMessage,
  normalizeSignupRole,
  requireCustomerAccount,
  requireOwnerWorkspace,
  requirePartnerMembership,
  safeRedirectUrl,
  destinationForVerifiedRole,
  supabaseConfigErrorMessage,
  useAuth,
  type PlatformRole,
} from "./lib/auth";
import {
  PORTAL_PATHS,
  TEMPLATE_PATH,
  isPortalPath,
  legacyDashboardRoleFromPath,
  portalMountKeyFromPath,
  portalPathForMountKey,
  portalPathForRole,
  portalRoleFromPath,
  roleQueryForPortalRole,
  type PortalKey,
} from "./lib/portalRoutes";
// Phase 1 · Section 02 Hero — verified trust claims (data only, no JSX).
import { HERO_TRUST_CLAIMS } from "./lib/heroTrustClaims";
// Phase 1 · Section 03 Smart Search — Jaipur boundary check for the
// user-triggered GPS flow (answers yes/no only; raw coordinates never leave
// the device, the URL or the UI).
import { isInsideJaipur } from "./lib/jaipurBounds";
// Phase 1 · Section 05 — approved category icon library (SVG only; raw
// emoji/admin icon strings are never rendered directly).
import { CategoryIcon } from "./lib/categoryIcons";
// Phase 1 · Section 07 — Open Now pure time logic (IST-safe, unit-tested;
// never claims open on missing/invalid hours).
import {
  dayOfWeekIST,
  minutesNowIST as minutesNowISTShared,
  openNowVerdict,
  type OpenNowVerdict,
} from "./lib/openNow";
// Phase 1 · Section 10 — Jaipur city eligibility (real city field only;
// (renumbered from "Section 08" per locked MEMORY.md order — PHASE1_SECTION10.md).
// area names and missing cities never qualify).
import { isJaipurCity } from "./lib/jaipurCity";
// GPS location system — browser-native geolocation only. No Google
// Geolocation/Maps Geocoding, no Mapbox, no Nominatim, no API keys.
import {
  formatAccuracy,
  formatDistance,
  haversineKm,
  locationFreshness,
  locationService,
  useLocation,
  useNearbySalons,
  type RankedItem,
  type UseLocationResult,
} from "./lib/location";

type Role = PlatformRole;
type Salon = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string;
  area: string | null;
  city: string;
  rating_average: number;
  review_count: number;
  starting_price_paise: number | null;
  cover_image_path: string | null;
  business_category: string | null;
  verified?: boolean;
  is_active?: boolean;
  accepts_online_bookings?: boolean;
  organization_id?: string | null;
  /** Joined only from public.business_locations after approval. */
  latitude?: number | null;
  longitude?: number | null;
  approval_status?: "approved" | null;
  phone?: string | null;
};
type Website = {
  salon_id: string;
  slug: string;
  template_key: string;
  config: Record<string, unknown>;
  published_at: string | null;
};
type CatalogItem = Salon & { website: Website };

// Live marketplace aggregates (Customer PWA data — security-definer RPCs so
// anon may read aggregates without exposing private rows).
type MarketplaceRecentReview = {
  /** Public author text returned by marketplace_salon_stats; never joined to profiles. */
  author: string;
  rating: number;
  comment: string;
  /** Present in the existing RPC row, but not promoted to a homepage badge. */
  verified_booking: boolean;
  created_at: string;
};
type SalonStats = {
  salon_id: string;
  rating_avg: number;
  review_count: number;
  booking_count: number;
  recent_reviews: MarketplaceRecentReview[];
  partner_onboarded: boolean;
};

/**
 * Section 14's deliberately narrow view model. It is adapted only from the
 * public marketplace aggregate and carries no customer, auth, booking, or
 * appointment identifiers. The aggregate has no avatar, reply, or review-id
 * field, so those are intentionally absent here.
 */
type CustomerReviewCardData = {
  /** Internal deterministic React key from the public source fields; not a review ID. */
  sourceKey: string;
  salonName: string;
  salonSlug: string;
  rating: number;
  text: string;
  displayName: string;
  /** Existing public aggregate timestamp; rendered only when formatable. */
  reviewDate: string;
};

type PublicSalonReviewReference = {
  name: string;
  slug: string;
};

// Existing homepage review feed capped output at three rows. This is a
// frontend presentation limit only; no backend review-limit configuration is
// defined in this repository.
const SECTION14_REVIEW_LIMIT = 3;
type PopularService = {
  service_id: string;
  salon_id: string;
  salon_name: string;
  service_name: string;
  price_paise: number | null;
  duration_minutes: number | null;
  booking_count: number;
};

type PartnerPromo = {
  offer_id: string;
  salon_id: string;
  salon_name: string;
  salon_slug: string;
  offer_name: string;
  description: string | null;
  discount_type: string | null;
  discount_value: number | null;
  valid_until: string | null;
};

// Admin Panel / advanced discovery — public-safe RPC result types.
type SearchRow = {
  id: string; slug: string; name: string; business_category: string | null;
  area: string | null; city: string | null; landmark: string | null; gender_category: string | null;
  rating_avg: number; review_count: number; booking_count: number;
  starting_price_paise: number | null; cover_image_path: string | null;
  has_offer: boolean; score: number;
  /** On-device distance from the user's own GPS fix (Section 03). Present
      only when the distance filter is active; never the raw coordinates. */
  distanceKm?: number | null;
};
type Suggestion = { name: string; slug: string; kind: "salon" | "category" };
type CategoryRow = { name: string; slug: string; icon: string; sort_order: number; salon_count: number; service_count: number };
type SponsoredData = {
  shops: Array<{ id: string; title: string; badge: string | null; image: string | null; salon_name: string; salon_slug: string; area: string | null; city: string | null; rating: number; review_count: number }>;
  brands: Array<{ id: string; name: string; tagline: string | null; logo: string | null; website: string | null }>;
  videos: Array<{ id: string; title: string; video_url: string | null; thumbnail: string | null }>;
};
type TopRatedRow = {
  id: string; slug: string; name: string; business_category: string | null;
  area: string | null; city: string | null; rating_avg: number; review_count: number;
  booking_count: number; starting_price_paise: number | null; cover_image_path: string | null;
  bayesian_rating: number;
};
type TrendingRow = {
  id: string; slug: string; name: string; business_category: string | null;
  area: string | null; city: string | null; rating_avg: number; review_count: number;
  booking_count: number; trending_score: number; overridden: boolean;
};

const RECENT_SEARCHES_KEY = "nexora_recent_searches";
const SEARCH_DEBOUNCE_MS = 300;

// Parts 7-9 types.
type OfferDetail = {
  offer_id: string; salon_id: string; salon_name: string; salon_slug: string;
  name: string | null; description: string | null; terms: string | null;
  discount_type: string | null; discount_value: number | null;
  maximum_discount_paise: number | null; minimum_booking_paise: number | null;
  valid_from: string | null; valid_until: string | null;
  code: string | null; membership_only: boolean;
  eligible_services: Array<{ service_id: string; service_name: string }>;
  remaining_global: number | null;
};
type SlotRow = { slot_start: string; slot_end: string; staff_id: string | null; staff_name: string | null };

type MembershipPlan = {
  id: string; name: string; slug: string; description: string | null;
  price_paise: number; billing_period: string; benefits: string[];
  discount_percent: number; reward_points_rate: number;
};
type MembershipStatus = {
  plan_name: string; status: string; starts_at: string | null; expires_at: string | null;
  discount_percent: number; reward_points_rate: number; benefits: string[];
  renewal_price_paise: number | null;
};

type HomepageSection = { section_key: string; visible: boolean; sort_order: number; title: string | null };
type RecentlyViewedRow = { id: string; slug: string; name: string; area: string | null; city: string | null; cover_image_path: string | null; viewed_at: string };

const REF_CODE_KEY = "nexora_ref_code";

/**
 * Partner attribution capture: reads ?ref= / ?code= / ?partner= from the URL,
 * validates it against the shared project (resolve_partner_code RPC — returns
 * only validity + kind, never partner identity or commissions), and persists
 * the valid code for the session so it survives navigation and is passed into
 * sign-up and the booking handoff. Invalid codes are dropped silently.
 */
function useReferralCode(online: boolean) {
  const [refCode, setRefCode] = useState<string>(() => {
    try { return sessionStorage.getItem(REF_CODE_KEY) ?? ""; } catch { return ""; }
  });

  useEffect(() => {
    if (!online) return;
    let active = true;
    const capture = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const candidate = (params.get("ref") || params.get("code") || params.get("partner") || "").trim();
        if (!candidate) return;
        const client = getClient();
        if (!client) return;
        const { data } = await client.rpc("resolve_partner_code", { p_code: candidate });
        const row = (data ?? [])[0] as { valid?: boolean } | undefined;
        if (active && row?.valid) {
          setRefCode(candidate.toUpperCase());
          try { sessionStorage.setItem(REF_CODE_KEY, candidate.toUpperCase()); } catch { /* storage unavailable */ }
        }
      } catch { /* attribution capture is best-effort */ }
    };
    const t = window.setTimeout(() => void capture(), 0);
    return () => { active = false; window.clearTimeout(t); };
  }, [online]);

  return refCode;
}

// Jaipur localities from Jaipur_Zones_Localities.pdf (5 zones, 124 areas).
const JAIPUR_ZONES: Array<{ zone: string; areas: string[] }> = [
  {
    zone: "Central Jaipur",
    areas: ["C-Scheme", "Civil Lines", "Bani Park", "Pink City", "M I Road", "Sindhi Camp", "Lal Kothi", "Bais Godam", "Sethi Colony", "Ashok Nagar", "Adarsh Nagar", "Bapu Nagar", "Tilak Nagar", "Raja Park", "Jawahar Nagar", "Ramganj", "Brahmpuri", "Transport Nagar", "Jalupura", "Gopalbari", "Moti Dongri Road", "Laxmi Narayan Puri", "Purani Basti", "Anita Colony", "Sagram Colony", "Raj Bhavan Road", "Subhash Marg", "Sahdev Marg", "Lajpat Marg", "Vivekanand Marg", "Sachivalaya Nagar", "Bhawani Singh Road"],
  },
  {
    zone: "East Jaipur",
    areas: ["Malviya Nagar", "Jagatpura", "Pratap Nagar", "Tonk Road", "Agra Road", "Kanota", "JLN Marg", "Durgapura", "Sitapura", "Mahal Road", "Paldi Meena", "Jamdoli", "Bassi", "Jamwa Ramgarh", "Goner Road", "Vatika", "Shivdaspura", "Chaksu", "Bagrana", "Mangarh Khokhawala", "Kho Nagoriyan", "Ghati Karolan", "Dholai"],
  },
  {
    zone: "North Jaipur",
    areas: ["Vidhyadhar Nagar", "Jhotwara", "Kalwar Road", "Sikar Road", "Niwaru", "Shastri Nagar", "Ambabari", "Benad Road", "Muralipura", "Vishwakarma Industrial Area", "Amer", "Chomu", "Kotputli", "Achrol", "Boytawala", "Sarna Doongar", "Nari Ka Bas", "Shiv Nagar", "Govindpura"],
  },
  {
    zone: "South Jaipur",
    areas: ["Mansarovar", "New Sanganer Road", "Muhana", "Sanganer", "Shiprapath", "Triveni Nagar", "Patrakar Colony", "Mahaveer Nagar", "Sidharth Nagar", "Narayan Vihar", "Shanti Nagar", "Budhsinghpura", "Mahapura", "Diggi Road", "Phagi Road", "Padampura", "Renwal Phagi Road", "Doongri", "Jairampura", "Ramsinghpura", "Shikarpura", "Ganatpura", "Bhambori", "Madhorajpura - Chandma Road"],
  },
  {
    zone: "West Jaipur",
    areas: ["Vaishali Nagar", "Sirsi Road", "Gandhi Path", "Chitrakoot", "Kanakpura", "Khatipura", "Gopalpura", "Gopalpura By Pass", "Sodala", "Nirman Nagar", "Shyam Nagar", "Ajmer Road", "Jaipur-Ajmer Express Highway", "Bhankrota", "Bagru", "Mahalan Ajmer Road", "Heerawala", "Brijlalpura", "Hasanpura", "Lalarpura", "Tagore Nagar", "Milap Nagar", "Marudhar Nagar", "Bhan Nagar", "Officers Campus Colony", "Udyog Nagar"],
  },
];

// Canonical business categories — "Salon" is the default owner category;
// dynamic categories from live data are appended when they aren't in this set.
const CANONICAL_CATEGORIES = ["Salon", "Spa", "Tattoo Studio", "Clinic", "Beauty Parlour", "Nail Studio", "Hair Studio", "Makeup Studio", "Unisex Salon"];

// Marketplace rows — Owner PWA managed data, anon-readable via RLS
// (verified live: services/staff/offers/salon_hours all 200 for anon).
type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price_paise: number | null;
  image_path: string | null;
};
type StaffRow = {
  id: string;
  name: string;
  role: string | null;
  specialty: string | null;
  avatar_path: string | null;
};
type HoursRow = {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};
type OfferRow = {
  id: string;
  salon_id: string;
  name: string | null;
  description: string | null;
  discount_type: string | null;
  discount_value: number | null;
  valid_until: string | null;
};
type SalonMarketplace = {
  services: ServiceRow[];
  staff: StaffRow[];
  hours: HoursRow[];
  offers: OfferRow[];
};
type AuthState = {
  loading: boolean;
  session: Session | null;
  role?: Role;
};

// Main Website is Next/vinext. Do not mix Vite prefixes into this app.
// PHASE 1: the client itself is created by the shared Nexora auth package so
// that this app, the Customer/Owner/Partner/Delivery PWAs and the Job Portal
// all use ONE project, ONE storage key and ONE set of PKCE options. These two
// reads stay literal because Next inlines them textually at build time.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const EXPECTED_SUPABASE_HOST = EXPECTED_SUPABASE_HOSTNAME;

const missingSupabaseConfigMessage =
  `Nexora login service is not configured for this deployment. Set NEXT_PUBLIC_SUPABASE_URL=https://${EXPECTED_SUPABASE_HOST} and NEXT_PUBLIC_SUPABASE_ANON_KEY from the shared Supabase project ${SUPABASE_PROJECT_REF}.`;

function isMountedPortalRole(value: unknown): value is "customer" | "business_user" | "growth_partner" {
  return value === "customer" || value === "business_user" || value === "growth_partner";
}

/**
 * The one Supabase client for this origin. Delegating to the shared package
 * guarantees flowType: "pkce", persistSession and the Nexora storage key —
 * creating a second client here would fork the session state.
 */
function getClient() {
  return getSupabaseClient({ url: supabaseUrl, anonKey: supabaseKey });
}

function money(paise: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((paise ?? 0) / 100);
}


// decodeURIComponent throws on malformed URLs (e.g. /salons/%zz) and would
// otherwise crash the page render; fall back to the raw segment instead.
function safeDecodePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function friendlyError(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "You appear to be offline. Reconnect and try again.";
  let message = "Something went wrong.";
  if (error instanceof Error) message = error.message;
  else if (typeof error === "object" && error !== null && "message" in error) {
    message = String((error as { message: unknown }).message);
  } else if (typeof error === "string") message = error;

  // Surface real Supabase errors – don't hide “Invalid credentials” etc.
  // But map common network errors to friendly text.
  if (/failed to fetch|networkerror|network error/i.test(message)) {
    return "We could not reach Nexora. Please check your connection and retry.";
  }
  if (/rate.*limit|too many requests|429/i.test(message)) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  // Keep original message for everything else – critical for debugging wrong project etc.
  return message;
}

function parseSupabaseAuthError(error: unknown): string {
  const raw = friendlyError(error);
  const lower = raw.toLowerCase();

  if (lower.includes("user already registered") || lower.includes("already registered") || lower.includes("user already exists")) {
    return "An account with this email already exists. Please log in instead.";
  }
  if (lower.includes("email not confirmed") || lower.includes("confirmation")) {
    return "Please confirm your email first. Check your inbox (and spam) for a confirmation link.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    // Show real cause – could be wrong project, wrong password, etc.
    return raw;
  }
  if (lower.includes("password should be at least") || lower.includes("password is too short") || lower.includes("weak password")) {
    return raw;
  }
  if (lower.includes("signup disabled") || lower.includes("signups not allowed")) {
    return "New account creation is temporarily disabled. Please contact support.";
  }
  return raw;
}

export function NexoraApp({ initialPath }: { initialPath: string }) {
  const [path, setPath] = useState(initialPath);
  const [online, setOnline] = useState(true);
  const refCode = useReferralCode(online);

  // Keep the existing online flag synchronized with browser connectivity so
  // Section 12 can distinguish offline from a retryable live-data failure.
  useEffect(() => {
    const updateOnlineState = () => setOnline(navigator.onLine);
    const timer = window.setTimeout(updateOnlineState, 0);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);
  // Auth state has one owner: the shared @nexora/auth provider mounted at
  // the website root. Do not add a second getSession/auth-event listener
  // here; it races the provider and forks profile authorization state.
  const {
    session,
    role: providerRole,
    loading: authLoading,
    signOut: providerSignOut,
    client: authClient,
  } = useAuth();
  const authState: AuthState = {
    loading: authLoading,
    session,
    role: providerRole ?? undefined,
  };

  // One location system for Owner, Partner, Customer and Template routes.
  // The shell owns the only GPS watcher and binds it to the current global
  // auth.users.id. Nested screens only observe this same singleton. The shell
  // itself no longer renders location UI, so the result is intentionally
  // unused here — the hook is kept for its watcher/sync side effects.
  useLocation({
    client: authClient,
    userId: session?.user?.id ?? null,
    syncPrivateLocation: true,
  });

  // Re-arm GPS the moment a user signs up or logs in. A fresh account often
  // has never been asked for location, and a returning user may have granted
  // it in OS settings since the last visit — this re-triggers acquisition
  // exactly once per sign-in. If permission is refused nothing breaks: the
  // service reports "denied" and uses only this user's saved real GPS fix,
  // if one exists; otherwise distance sorting stays off with no fake point.
  const armedForUser = useRef<string | null>(null);
  useEffect(() => {
    const userId = authState.session?.user?.id ?? null;
    if (!userId) { armedForUser.current = null; return; }
    if (armedForUser.current === userId) return;
    armedForUser.current = userId;
    // Deferred so it never runs inside the auth state commit.
    const timer = window.setTimeout(() => {
      // Already have a good fix? Leave it alone rather than restarting the radio.
      if (locationService.getFix()) { locationService.start(); return; }
      locationService.retry();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authState.session?.user?.id]);

  const navigate = useCallback((target: string) => {
    window.history.pushState({}, "", target);
    setPath(new URL(target, window.location.origin).pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // pushState is paired with a popstate subscription so Section 12 routes (and
  // every existing internal route) remain reversible with browser Back/Forward.
  // Direct loads and hard refreshes continue through app/[...path]/page.tsx.
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const signOut = useCallback(async (destination = "/") => {
    await providerSignOut();
    navigate(destination);
  }, [navigate, providerSignOut]);

  let content: React.ReactNode;
  if (path === "/salons") content = <CatalogPage navigate={navigate} online={online} />;
  else if (path.startsWith("/salons/") || path.startsWith("/shops/"))
    content = <SalonPage slug={safeDecodePathSegment(path.slice(path.startsWith("/salons/") ? 8 : 7))} navigate={navigate} online={online} refCode={refCode} />;
  else if (path.startsWith("/booking/"))
    content = <LegacyBookingHandoff slug={safeDecodePathSegment(path.slice(9))} navigate={navigate} />;
  else if (path === "/terms") content = <LegalPage type="terms" />;
  else if (path === "/privacy") content = <LegalPage type="privacy" />;
  else if (path === "/cancellation-refund") content = <LegalPage type="refund" />;
  else if (path === "/auth/forgot-password" || path === "/forgot-password") content = <ForgotPasswordPage navigate={navigate} />;
  else if (path === "/auth/reset-password" || path === "/reset-password") content = <ResetPasswordPage navigate={navigate} />;
  else if (path === "/auth/callback" || path === "/auth/verify") content = <AuthCallbackPage navigate={navigate} />;
  else if (path === "/auth/logout") content = <AuthLogoutPage navigate={navigate} />;
  else if (path === "/auth/continue") content = <AuthContinuePage navigate={navigate} />;
  else if (path === "/auth/expired") content = <SessionExpiredPage navigate={navigate} />;
  else if (path === "/admin" || path.startsWith("/admin/") || path === "/app/admin" || path.startsWith("/app/admin/") || path === "/app/delivery" || path.startsWith("/app/delivery/"))
    content = <UnavailableAuthenticatedPortal path={path} navigate={navigate} />;
  else if (isPortalPath(path))
    content = <PortalGateway expectedRole={portalRoleFromPath(path) ?? undefined} navigate={navigate} signOut={signOut} />;
  else if (path.startsWith("/dashboard"))
    content = <PortalGateway expectedRole={legacyDashboardRoleFromPath(path) ?? undefined} navigate={navigate} signOut={signOut} />;
  else if (path === "/customer" || path === "/owner" || path === "/growth-partner")
    content = <RoleEntry path={path} navigate={navigate} />;
  else content = <HomePage navigate={navigate} online={online} authState={authState} refCode={refCode} />;

  const isAuthPage = path.startsWith("/auth");
  const showMainWebsiteReturn = path !== "/";
  return (
    <div className={`site-shell${isPortalPath(path) ? " portal-open" : ""}${showMainWebsiteReturn ? " with-main-website-return" : ""}`}>
      {showMainWebsiteReturn && (
        <header className="main-website-return-header" aria-label="Global navigation">
          <BackToMainWebsiteButton />
        </header>
      )}
      {!online && <div className="offline-banner">Offline — live salon and account data may be unavailable.</div>}
      {!getClient() && <div className="offline-banner" style={{ background: "#7b244a" }}>Supabase not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for project {SUPABASE_PROJECT_REF}.</div>}
      {content}
      {!isAuthPage && <Footer navigate={navigate} />}
    </div>
  );
}

/**
 * Secondary Hero CTA — scroll to the apps section ("Aap Nexora Par Kya Karna
 * Chahte Hain?", id=nexora-apps). Keeps the real `href="#nexora-apps"` for
 * keyboard/no-JS semantics, then enhances: smooth scroll when motion is
 * allowed, instant jump under prefers-reduced-motion. The section's own
 * scroll-margin keeps the heading clear of the sticky header.
 */
function scrollToAppsSection(event: { preventDefault: () => void }) {
  const target = document.getElementById("nexora-apps");
  if (!target) return;
  event.preventDefault();
  let reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    reduced = false;
  }
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  window.history.replaceState(window.history.state, "", "#nexora-apps");
}

/**
 * Header "Categories" link — smooth-scroll to the Beauty Categories section
 * (id=categories). Same reduced-motion behaviour as the apps-section jump;
 * scroll-margin keeps the heading clear of the sticky header.
 */
function scrollToCategoriesSection(event?: { preventDefault: () => void }) {
  const target = document.getElementById("categories");
  if (!target) return;
  event?.preventDefault();
  let reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    reduced = false;
  }
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  window.history.replaceState(window.history.state, "", "#categories");
}

/** Section 05 — initial visible category count (spec: desktop 8–10, mobile 6–8). */
const CATEGORIES_INITIAL_COUNT = 8;

/**
 * Section 05 — honest counts line. Real numbers only (live RPC values);
 * when a count is unavailable it is NEVER faked as 0 — the neutral copy
 * "Explore available listings" is shown instead. Grammar: 1 salon / 2 salons,
 * 1 service / 2 services.
 */
function categoryCountsCopy(salonCount: number | null | undefined, serviceCount: number | null | undefined): string {
  const salons = typeof salonCount === "number" && Number.isFinite(salonCount) ? salonCount : null;
  const services = typeof serviceCount === "number" && Number.isFinite(serviceCount) ? serviceCount : null;
  if (salons === null && services === null) return "Explore available listings";
  const parts: string[] = [];
  if (salons !== null) parts.push(`${salons} salon${salons === 1 ? "" : "s"}`);
  if (services !== null) parts.push(`${services} service${services === 1 ? "" : "s"}`);
  return parts.join(" • ");
}

function HomePage({ navigate, online, authState, refCode }: { navigate: (path: string) => void; online: boolean; authState: AuthState; refCode: string }) {
  // The catalog fetch error is surfaced by CatalogStrip's own StateCard
  // (with Retry) in the "Published salons" section; Section 06 (Nearby Shops)
  // uses it for its own honest error state.
  const { items, loading, error: catalogError } = useCatalog(online);
  const {
    statsBySalon,
    statsRows,
    loading: statsLoading,
    error: statsError,
    load: reloadMarketplaceStats,
  } = useMarketplaceStats(online);
  const { services: popularServices, loading: popularLoading, error: popularError, load: retryPopularServices } = usePopularServices(online);
  const { personalized, favorites, ready } = useCustomerSuggestions(online, authState.session, items);
  const { rows: recommendationRows, loading: recommendationsLoading, isPersonalized, load: refreshRecommendations, error: recommendationsError } = useRecommendations(online, authState.session);
  const { plans: membershipPlans, loading: membershipLoading } = useMembershipPlans(online);
  const { status: membershipStatus } = useMyMembership(online, authState.session);
  const { visible } = useHomepageSections(online);
  const { rows: recentlyViewed, consent: rvConsent, consentLoaded, loading: rvLoading, setConsentPref } = useRecentlyViewed(online, authState.session);
  const [homeQuery, setHomeQuery] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  // Section 05 — "Sabhi Categories Dekhein" expandable control: initially only
  // CATEGORIES_INITIAL_COUNT live categories render; the rest stay one click away.
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);
  const isCustomer = authState.session && authState.role === "customer";
  const { categories: adminCategories, loading: categoriesLoading, error: categoriesError, load: loadCategories } = useMarketplaceCategories(online);
  const { sponsored, loading: sponsoredLoading } = useSponsored(online);
  const { rows: topRatedRows, loading: topRatedLoading, error: topRatedError, load: loadTopRated } = useTopRated(online);
  const { rows: trendingRows, loading: trendingLoading, error: trendingError, load: retryTrending } = useTrending(online);
  const { offers: marketplaceOffers, loading: marketplaceOffersLoading, error: marketplaceOffersError, load: retryMarketplaceOffers } = useMarketplaceOffers(online);
  const { rows: nearbyRows, loading: nearbyLoading } = useNearby(online);
  // Section 06: OBSERVE only (auto:false) — the homepage never requests GPS
  // permission on page load. Acquisition starts only from the explicit
  // "Use My Current Location" action below (or the signed-in shell flow).
  const location = useLocation({ auto: false });
  const { buckets: nearbyBuckets, ranked: nearbyRanked } = useNearbySalons(nearbyRows, location.fix);
  const categories = Array.from(new Set(items.map(i=>i.business_category).filter(Boolean))) as string[];
  // Live customer signals: rating avg + review count from customer_reviews,
  // booking counts from bookings (security-definer aggregates).
  const ratingOf = (i: CatalogItem) => { const s = statsBySalon[i.id]; return s ? Number(s.rating_avg) : Number(i.rating_average); };
  const reviewsOf = (i: CatalogItem) => { const s = statsBySalon[i.id]; return s ? Number(s.review_count) : Number(i.review_count); };
  const bookingsOf = (i: CatalogItem) => { const s = statsBySalon[i.id]; return s ? Number(s.booking_count) : 0; };
  const topRated = [...items].sort((a,b)=>ratingOf(b)-ratingOf(a) || reviewsOf(b)-reviewsOf(a)).slice(0,3);
  // Section 12 Trending is exclusively the marketplace_trending RPC order;
  // do not recreate a frontend booking/rating sort here.
  const nearbyAreas = Array.from(new Set(items.map(i=>i.area).filter(Boolean))) as string[];
  const recommended = [...items].sort((a,b)=>((ratingOf(b)*reviewsOf(b))+bookingsOf(b))-((ratingOf(a)*reviewsOf(a))+bookingsOf(a))).slice(0,3);
  // Section 14: join public salon names/slugs to the existing public aggregate
  // without querying customer, booking, or auth tables. The adapter preserves
  // marketplace_salon_stats row order and each row's recent_reviews order;
  // it deliberately does not add a client-side recency, rating, or featured
  // ranking.
  const section14SalonReferences = useMemo<ReadonlyMap<string, PublicSalonReviewReference>>(() => {
    const references = new Map<string, PublicSalonReviewReference>();
    for (const item of items) references.set(item.id, { name: item.name, slug: item.website.slug });
    return references;
  }, [items]);
  const reviewFeed = useMemo(
    () => adaptMarketplaceReviews(statsRows, section14SalonReferences),
    [statsRows, section14SalonReferences],
  );
  const showForYou = isCustomer && ready && (personalized !== null || favorites.length > 0);
  // Section 12 receives only the public fields it needs from the published
  // catalog. A memoized map avoids repeated O(catalog) slug/image lookups and
  // keeps phone/address/config data outside the Section 12 component path.
  const section12SalonReferences = useMemo<ReadonlyMap<string, Section12SalonReference>>(() => {
    const references = new Map<string, Section12SalonReference>();
    for (const item of items) {
      references.set(item.id, {
        id: item.id,
        slug: item.website.slug,
        coverImagePath: item.cover_image_path,
      });
    }
    return references;
  }, [items]);

  // ---- Section 06: Nearby Shops -------------------------------------------
  // Honest defaults: Jaipur is the DEFAULT location (never presented as
  // detected). GPS starts only from the explicit "Use My Current Location"
  // action. All rows come from the live published catalog — nothing faked.
  const [nearbyArea, setNearbyArea] = useState("");
  const [nearbyCity, setNearbyCity] = useState("Jaipur");
  const [nearbyDraft, setNearbyDraft] = useState<NearbyFilters>(NEARBY_FILTERS_EMPTY);
  const [nearbyFilters, setNearbyFilters] = useState<NearbyFilters>(NEARBY_FILTERS_EMPTY);
  const [nearbyPanelOpen, setNearbyPanelOpen] = useState(false);
  const nearbyPanelRef = useRef<HTMLDivElement | null>(null);
  const nearbyFilterToggleRef = useRef<HTMLButtonElement | null>(null);
  const nearbyAreaSelectRef = useRef<HTMLSelectElement | null>(null);

  const gpsFix = location.fix;
  const insideJaipur = isInsideJaipur(gpsFix);
  const nearbyFixUsable = gpsFix != null && insideJaipur;
  const nearbyActiveFilterCount = countActiveNearbyFilters(nearbyFilters);
  const nearbyModeIsFiltered = nearbyActiveFilterCount > 0 || nearbyArea !== "";

  // Area-filtered base (real published catalog; same matching semantics as
  // the /salons client-side area filter).
  const nearbyBaseItems = useMemo(() => {
    const needle = nearbyArea.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      (item.city ?? "").toLowerCase().includes(needle) ||
      (item.area ?? "").toLowerCase().includes(needle) ||
      (item.address ?? "").toLowerCase().includes(needle),
    );
  }, [items, nearbyArea]);
  const nearbyBaseIdsKey = nearbyBaseItems.map((item) => item.id).join(",");
  const nearbyHours = useTodayHours(online && !nearbyLoading, nearbyBaseItems.map((item) => item.id), nearbyBaseIdsKey);
  // Section 07 — shared hours (salon_hours + config fallback) for the legacy
  // OpenTodayStrip, so no duplicate request runs.
  const openTodayPreloaded = useMemo(() => {
    const map: Record<string, { opens: string | null; closes: string | null; closed: boolean }> = {};
    for (const item of nearbyBaseItems) {
      const hours = nearbyHours[item.id];
      if (hours) { map[item.id] = { opens: hours.opens_at, closes: hours.closes_at, closed: Boolean(hours.is_closed) }; continue; }
      const cfg = configOpeningHours(item);
      if (cfg) map[item.id] = { opens: cfg.opens_at, closes: cfg.closes_at, closed: cfg.is_closed };
    }
    return { todayRows: map, loading: nearbyLoading };
  }, [nearbyBaseItems, nearbyHours, nearbyLoading]);

  // Pipeline for manual-area / filtered mode: real distances (approved
  // coordinates only), real rating/price/hours filters, nearest-first with
  // missing-distance rows last. Capped for the homepage.
  const nearbyPipelineRows = useMemo<NearbyShopRow[]>(() => {
    if (!nearbyModeIsFiltered) return [];
    let rows: NearbyShopRow[] = nearbyBaseItems.map((item) => ({
      item,
      distanceKm:
        nearbyFixUsable && gpsFix && item.approval_status === "approved" &&
        typeof item.latitude === "number" && typeof item.longitude === "number"
          ? haversineKm(gpsFix.latitude, gpsFix.longitude, Number(item.latitude), Number(item.longitude))
          : null,
    }));
    if (nearbyFilters.radius && nearbyFilters.radius !== "nearest" && nearbyFixUsable) {
      const maxKm = Number(nearbyFilters.radius);
      rows = rows.filter((row) => row.distanceKm != null && row.distanceKm <= maxKm);
    }
    if (nearbyFilters.rating) {
      const min = Number(nearbyFilters.rating);
      rows = rows.filter((row) => Number(row.item.rating_average ?? 0) >= min && Number(row.item.review_count ?? 0) > 0);
    }
    if (nearbyFilters.price) {
      const maxPaise = Number(nearbyFilters.price);
      rows = rows.filter((row) =>
        typeof row.item.starting_price_paise === "number" &&
        row.item.starting_price_paise > 0 &&
        row.item.starting_price_paise <= maxPaise,
      );
    }
    if (nearbyFilters.gender) {
      rows = rows.filter((row) => nearbyGenderMatches(nearbyFilters.gender, row.item.business_category));
    }
    if (nearbyFilters.openNow && online) {
      rows = rows.filter((row) => salonOpenState(row.item, nearbyHours[row.item.id]) === true);
    }
    const withDistance = rows.filter((row) => row.distanceKm != null)
      .sort((a, b) => Number(a.distanceKm) - Number(b.distanceKm));
    const withoutDistance = rows.filter((row) => row.distanceKm == null);
    return [...withDistance, ...withoutDistance].slice(0, NEARBY_DISPLAY_LIMIT);
  }, [nearbyModeIsFiltered, nearbyBaseItems, nearbyFilters, nearbyFixUsable, gpsFix, nearbyHours, online]);

  // Honest location status line (polite live region).
  let nearbyGpsState: "default" | "detecting" | "active" | "denied" | "unavailable" | "outside" = "default";
  let nearbyStatus: string;
  if (location.isImproving) {
    nearbyGpsState = "detecting";
    nearbyStatus = "Location detect ho rahi hai…";
  } else if (gpsFix && !insideJaipur) {
    nearbyGpsState = "outside";
    nearbyStatus = "Aapki current location Jaipur se bahar hai. Filhaal Jaipur ke available salons dikhaye ja rahe hain.";
  } else if (gpsFix) {
    nearbyGpsState = "active";
    nearbyStatus = `Aapki current location ke paas ke salons${nearbyArea ? ` — ${nearbyArea}` : ""} (nearest pehle). ${locationHeadline(location)}`;
  } else if (location.status === "denied") {
    nearbyGpsState = "denied";
    nearbyStatus = "Location permission nahi mili. Jaipur ke salons dikhaye ja rahe hain — aap area manually change kar sakte hain.";
  } else if (location.status === "timeout" || location.status === "unavailable" || location.status === "unsupported") {
    nearbyGpsState = "unavailable";
    nearbyStatus = "Current location detect nahi ho saki. Jaipur se results dikhaye ja rahe hain.";
  } else {
    nearbyStatus = `Jaipur (default location)${nearbyArea ? ` — ${nearbyArea}` : ""} ke salons dikhai ja rahe hain.`;
  }

  const focusNearbyAreaSelect = () => {
    nearbyAreaSelectRef.current?.focus();
    nearbyAreaSelectRef.current?.scrollIntoView({ block: "center" });
  };
  const continueWithJaipur = () => {
    setNearbyArea("");
    setNearbyDraft((f) => ({ ...f, radius: "" }));
    setNearbyFilters((f) => ({ ...f, radius: "" }));
  };
  const clearNearbyFilters = () => {
    setNearbyDraft(NEARBY_FILTERS_EMPTY);
    setNearbyFilters(NEARBY_FILTERS_EMPTY);
  };
  // Section CTA → existing /salons route with EXISTING parameter names only.
  const openAllNearbySalons = () => {
    const params = new URLSearchParams();
    if (nearbyArea) params.set("area", nearbyArea);
    if (nearbyFilters.rating) params.set("rating", nearbyFilters.rating);
    if (nearbyFilters.price) params.set("price", nearbyFilters.price);
    if (nearbyFilters.gender) params.set("gender", nearbyFilters.gender);
    if (nearbyFilters.openNow) params.set("open", "1");
    if (nearbyFixUsable && (nearbyFilters.radius === "2" || nearbyFilters.radius === "5" || nearbyFilters.radius === "10")) {
      params.set("dist", nearbyFilters.radius);
    }
    const qs = params.toString();
    navigate(qs ? `/salons?${qs}` : "/salons");
  };

  // Filter panel: focus trap + Escape-to-close + return focus to the toggle.
  useEffect(() => {
    if (!nearbyPanelOpen) return;
    const panel = nearbyPanelRef.current;
    if (!panel) return;
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>('button, select, input, [tabindex]:not([tabindex="-1"])'));
    focusables()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNearbyPanelOpen(false);
        nearbyFilterToggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [nearbyPanelOpen]);

  return (
    <main className="premium-home w-full">
      {/* A slim announcement keeps the first screen feeling like a live Jaipur
          marketplace while remaining useful on narrow screens. */}
      <div className="premium-announcement">
        <span className="premium-announcement-copy"><span aria-hidden="true">✦</span> Discover Jaipur&apos;s best salons on Nexora</span>
        <button type="button" onClick={() => navigate("/salons")} className="premium-announcement-link">Explore now <span aria-hidden="true">→</span></button>
      </div>

      {/* Marketplace header — all actions stay on the existing routes. */}
      <header className="premium-header" id="premium-header">
        <div className="premium-header-inner">
          <button type="button" onClick={() => navigate("/")} aria-label="Nexora home" className="premium-brand">
            <span className="premium-brand-mark" aria-hidden="true">N</span>
            <span className="premium-brand-name">Nexora</span>
          </button>

          <nav aria-label="Main navigation" className="premium-nav">
            <button type="button" className="premium-nav-active" onClick={() => navigate("/")}>Home</button>
            <button type="button" onClick={() => navigate("/salons")}>Salons</button>
            <button type="button" aria-label="Beauty Categories section par jaayein" onClick={() => scrollToCategoriesSection()}>Services</button>
            <button type="button" onClick={() => document.getElementById("best-offers")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Offers</button>
            <button type="button" onClick={() => document.getElementById("membership")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Membership</button>
            <button type="button" onClick={() => window.location.assign("/job-portal")}>Jobs</button>
            <button type="button" onClick={() => document.getElementById("nexora-apps")?.scrollIntoView({ behavior: "smooth", block: "start" })}>About</button>
          </nav>

          <div className="premium-header-actions">
            <div className="premium-icon-actions" aria-label="Quick actions">
              <button type="button" aria-label="Search" onClick={() => document.getElementById("home-search")?.focus()}><PremiumIcon name="search" /></button>
              <button type="button" aria-label="Choose location" onClick={() => document.getElementById("home-location")?.focus()}><PremiumIcon name="location" /></button>
            </div>
            <button type="button" onClick={() => navigate("/login")} className="premium-login">Login</button>
            <button type="button" onClick={() => navigate("/salons")} className="premium-book-button">Book now</button>
          </div>

          <div className="premium-mobile-actions">
            <button type="button" aria-label="Search" onClick={() => document.getElementById("home-search")?.focus()}><PremiumIcon name="search" /></button>
            <button type="button" aria-expanded={mobileMenuOpen} aria-controls="premium-mobile-drawer" aria-label="Toggle menu" onClick={() => setMobileMenuOpen((open) => !open)}><PremiumIcon name={mobileMenuOpen ? "close" : "menu"} /></button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="premium-drawer-backdrop" role="presentation" onClick={() => setMobileMenuOpen(false)}>
          <aside id="premium-mobile-drawer" className="premium-mobile-drawer" role="dialog" aria-modal="true" aria-label="Nexora menu" onClick={(event) => event.stopPropagation()}>
            <div className="premium-drawer-heading">
              <span className="premium-drawer-title">Menu</span>
              <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><PremiumIcon name="close" /></button>
            </div>
            <nav aria-label="Mobile navigation" className="premium-drawer-nav">
              <button type="button" className="is-active" onClick={() => { setMobileMenuOpen(false); navigate("/"); }}>Home</button>
              <button type="button" onClick={() => { setMobileMenuOpen(false); navigate("/salons"); }}>Salons</button>
              <button type="button" onClick={() => { setMobileMenuOpen(false); document.getElementById("premium-services")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Services</button>
              <button type="button" onClick={() => { setMobileMenuOpen(false); document.getElementById("best-offers")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Offers</button>
              <button type="button" onClick={() => { setMobileMenuOpen(false); document.getElementById("membership")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Membership</button>
              <button type="button" onClick={() => window.location.assign("/job-portal")}>Jobs</button>
              <button type="button" onClick={() => { setMobileMenuOpen(false); document.getElementById("nexora-apps")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>About</button>
              <span className="premium-drawer-rule" />
              <button type="button" className="premium-drawer-location" onClick={() => { setMobileMenuOpen(false); document.getElementById("home-location")?.focus(); }}><PremiumIcon name="location" /> Set location</button>
              <button type="button" className="premium-drawer-login" onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}>Login</button>
              <button type="button" className="premium-drawer-book" onClick={() => { setMobileMenuOpen(false); navigate("/salons"); }}>Book now</button>
            </nav>
          </aside>
        </div>
      )}

      {/* Mobile navigation stays visible at the thumb edge without changing
          the desktop information architecture. */}
      <nav className="premium-bottom-nav" aria-label="Mobile quick navigation">
        <button type="button" className="is-active" onClick={() => navigate("/")}><PremiumIcon name="home" /><span>Home</span></button>
        <button type="button" onClick={() => navigate("/salons")}><PremiumIcon name="store" /><span>Salons</span></button>
        <button type="button" onClick={() => navigate("/login?returnTo=%2F")}><PremiumIcon name="booking" /><span>Bookings</span></button>
        <button type="button" onClick={() => navigate("/login?returnTo=%2F")}><PremiumIcon name="person" /><span>Profile</span></button>
      </nav>

      {/*
        ── HOMEPAGE PHASE 1 · SECTION 02 — HERO ────────────────────────────
        The visual treatment follows the premium Jaipur brief: an editorial
        salon image, soft blush wash, confident serif headline and quiet glass
        panels. The existing verified claim source and route contracts remain
        intact underneath the presentation layer.
      */}
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="premium-hero hero2 relative w-full overflow-hidden"
      >
        <div className="premium-hero-backdrop" aria-hidden="true">
          {/* Local responsive LCP asset — no expiring remote image URL. */}
          <img
            src="/home/hero-salon-800.jpg"
            srcSet="/home/hero-salon-480.jpg 480w, /home/hero-salon-800.jpg 800w, /home/hero-salon-1200.jpg 1200w"
            sizes="(min-width: 1024px) 58vw, (min-width: 640px) 90vw, 100vw"
            width={1200}
            height={1600}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            alt="Interior of a modern Jaipur beauty salon with styling chairs, round mirrors and daylight from an arched window."
          />
        </div>
        <div className="premium-hero-wash" aria-hidden="true" />
        <div className="premium-hero-inner">
          <div className="premium-hero-copy">
            <p className="premium-kicker hero2-rise"><span aria-hidden="true">✦</span> Jaipur&apos;s premier beauty network</p>
            <h1 id="hero-heading" className="premium-hero-title hero2-rise hero2-d1">Elevate Your <span>Elegance.</span></h1>
            <p className="premium-hero-description hero2-rise hero2-d2">Discover top-rated salons, exclusive treatments, and seamless bookings in a unified luxury experience.</p>

            {/* The approved Phase 1 copy remains available to screen readers and
                contract consumers while the visible art direction uses the
                shorter premium headline above. */}
            <p className="sr-only">Beauty Services Se Business Growth Tak — Sab Kuch Ek Platform Par</p>
            <p className="sr-only">Salon book karein, apna business manage karein, beauty jobs paayein, distributors se connect karein aur apni website launch karein.</p>

            {/* Calls to action */}
            <div className="premium-hero-actions hero2-rise hero2-d3">
              <button
                type="button"
                onClick={() => navigate("/salons")}
                className="premium-primary-button hero2-cta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]"
              >
                Find a salon <span aria-hidden="true">→</span>
              </button>
              <a
                href="#nexora-apps"
                aria-label="Nexora Apps Dekhein"
                onClick={(event) => scrollToAppsSection(event)}
                className="premium-secondary-button hero2-cta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]"
              >
                Explore services <span aria-hidden="true">↓</span>
              </a>
            </div>

            <ul className="premium-trust-list hero2-rise hero2-d4">
              {HERO_TRUST_CLAIMS.map(({ claim }) => (
                <li key={claim}><span aria-hidden="true" className="premium-check">✓</span><span>{claim}</span></li>
              ))}
            </ul>
            {refCode && <p className="premium-referral hero2-rise hero2-d4"><span aria-hidden="true">✦</span> Partner referral applied: {refCode}</p>}
          </div>

          <div className="premium-hero-panels hero2-rise hero2-d3" aria-label="Nexora experience preview">
            <article className="premium-glass-card premium-verified-card">
              <div className="premium-panel-icon"><PremiumIcon name="verified" /></div>
              <div>
                <p className="premium-panel-label">Verified salons</p>
                <p className="premium-panel-meta">Top beauty partners in Jaipur</p>
              </div>
              <span className="premium-panel-mark" aria-hidden="true">✓</span>
              <p className="premium-panel-copy">Quality, hygiene and premium service — all in one trusted place.</p>
            </article>
            <article className="premium-glass-card premium-booking-card">
              <div className="premium-booking-heading"><p className="premium-panel-label">Upcoming booking</p><span>Preview</span></div>
              <div className="premium-booking-row">
                <span className="premium-booking-thumb" aria-hidden="true"><PremiumIcon name="sparkles" /></span>
                <div><p className="premium-panel-label">Aura Luxury Spa</p><p className="premium-panel-meta">Signature Facial <span aria-hidden="true">•</span> 60 min</p></div>
              </div>
              <div className="premium-booking-footer"><span>Tomorrow, 2 PM</span><span className="premium-booking-status">Ready</span></div>
            </article>
          </div>
        </div>
      </section>

      {/* Premium service shortcuts are a discovery aid, not a fabricated
          salon inventory. Each shortcut hands off to the existing Smart
          Search route with the service query. */}
      <PremiumServiceRail navigate={navigate} />

      {/* SMART SEARCH — the live marketplace control bar sits immediately
          after the beauty shortcuts, as in the supplied Jaipur brief. */}
      <section id="smart-search" aria-labelledby="smart-search-heading" className="premium-marketplace-section">
        <div className="premium-content-width">
          <div className="premium-marketplace-heading">
            <div>
              <p className="premium-section-eyebrow"><span aria-hidden="true" className="premium-live-dot" /> Live marketplace</p>
              <h2 id="smart-search-heading">Discover Verified Salons</h2>
              <p>Jaipur ke verified salons discover karein.</p>
            </div>
            <button type="button" className="premium-text-link" onClick={() => navigate("/salons")}>View all salons <span aria-hidden="true">→</span></button>
          </div>

          <div className="premium-marketplace-controls">
            <div className="premium-search-row">
              <label className="premium-search-field" htmlFor="home-search">
                <PremiumIcon name="search" />
                <input
                  id="home-search"
                  value={homeQuery}
                  onChange={(e) => setHomeQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") navigate(`/salons?q=${encodeURIComponent(homeQuery.trim())}`); }}
                  placeholder="Search salons..."
                  aria-label="Search salons, services and areas"
                />
              </label>
              <button type="button" className="premium-search-button" onClick={() => navigate(`/salons?q=${encodeURIComponent(homeQuery.trim())}`)}>Search</button>
            </div>
            <label className="premium-location-select" htmlFor="home-location">
              <PremiumIcon name="location" />
              <select
                id="home-location"
                value={homeLocation}
                onChange={(e) => { setHomeLocation(e.target.value); navigate(e.target.value ? `/salons?area=${encodeURIComponent(e.target.value)}` : "/salons"); }}
                aria-label="Choose your area in Jaipur"
              >
                <option value="">All Jaipur</option>
                {JAIPUR_ZONES.map((z) => <optgroup key={z.zone} label={z.zone}>{z.areas.map((a) => <option key={a} value={a}>{a}</option>)}</optgroup>)}
              </select>
              <span aria-hidden="true" className="premium-chevron">⌄</span>
            </label>
            <button
              type="button"
              className="premium-near-me-button"
              onClick={() => { locationService.start(); navigate("/salons?dist=5"); }}
            >
              <PremiumIcon name="location" /> Salons near me
            </button>
            <div className="premium-filter-row" aria-label="Salon filters">
              <button type="button" onClick={() => document.getElementById("home-location")?.focus()}>Area</button>
              <button type="button" onClick={() => navigate("/salons?rating=4.5")}>Rating 4.5+</button>
              <button type="button" onClick={() => navigate("/salons?price=100000")}>Price</button>
              <button type="button" className="is-selected" onClick={() => navigate("/salons?open=1")}>Open now</button>
              <label className="premium-sort-select">Recommended
                <select aria-label="Sort salons" onChange={(e) => navigate(`/salons?sort=${encodeURIComponent(e.target.value)}`)} defaultValue="relevance">
                  <option value="relevance">Recommended</option>
                  <option value="rating">Highest rated</option>
                  <option value="availability">Nearest</option>
                  <option value="price">Price: low to high</option>
                </select>
              </label>
            </div>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {loading ? "Published salons load ho rahe hain…" : catalogError ? "Published salons load nahi ho sake." : "Published salons are loaded from the live Nexora marketplace."}
          </p>
          <div className="premium-marketplace-results">
            <CatalogStrip navigate={navigate} online={online} statsBySalon={statsBySalon} hoursById={nearbyHours} fixUsable={nearbyFixUsable} gpsFix={gpsFix} />
          </div>
        </div>
      </section>


{/*
        ── HOMEPAGE PHASE 1 · SECTION 05 — BEAUTY CATEGORIES ──────────────
        Upgraded in place (stable id=categories, no duplicate section).
        Data source unchanged: live admin-approved categories from the
        `marketplace_categories` RPC (useMarketplaceCategories) with REAL
        salon/service counts and the admin's sort order preserved. Icons are
        resolved through the approved SVG library — raw emoji are never
        rendered. Copy is public-safe (no database/RLS internals).
      */}
{visible('category_grid') && (
<section id="categories" aria-labelledby="categories-heading" className="section scroll-mt-24" style={{background:"var(--cream)"}}>
        <div className="section-heading"><span className="eyebrow">Browse by category</span><h2 id="categories-heading">Beauty Categories Explore Karein</h2><p>Salon, spa, makeup, hair, nails aur doosri beauty services apni zaroorat ke hisaab se dhoondhein.</p></div>
        {/* Screen-reader live region: announces loading / error / empty / offline
            transitions without a visual spinner taking over the section. */}
        <p className="sr-only" role="status" aria-live="polite">
          {categoriesLoading
            ? "Beauty categories load ho rahi hain…"
            : !online
              ? "Aap offline hain. Live categories dekhne ke liye internet connection check karein."
              : categoriesError
                ? "Categories load nahi ho saki. Dobara try karein."
                : !adminCategories.length
                  ? "Categories abhi available nahi hain."
                  : `${adminCategories.length} beauty categories available.`}
        </p>
        {categoriesLoading ? (
          /* Skeleton grid mirrors the real category cards (icon + 2 lines), so
             the section keeps its shape — no single spinner, no layout jump. */
          <div className="categories-grid" aria-hidden="true">
            {Array.from({ length: CATEGORIES_INITIAL_COUNT }, (_, i) => (
              <div key={i} className="role-card category-card category-card-skeleton">
                <div className="category-skeleton-icon" />
                <div className="category-skeleton-line category-skeleton-line-long" />
                <div className="category-skeleton-line category-skeleton-line-short" />
              </div>
            ))}
          </div>
        ) : !online ? (
          /* Offline: show cached approved categories with an honest "Saved
             results" label when available; otherwise the offline message.
             Never generate fake categories. */
          adminCategories.length ? (
            <>
              <p className="saved-results-label">Saved results</p>
              <CategoriesGrid categories={adminCategories} showAll={showAllCategories} navigate={navigate} />
              <CategoriesMoreControl total={adminCategories.length} showAll={showAllCategories} onToggle={() => setShowAllCategories((v) => !v)} />
              <div className="categories-cta">
                <button type="button" className="primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]" onClick={() => navigate("/salons")}>Sabhi Salons Dekhein</button>
              </div>
            </>
          ) : (
            <div className="state-card"><span>✦</span><h3>Aap offline hain</h3><p>Aap offline hain. Live categories dekhne ke liye internet connection check karein.</p><div className="button-row"><button className="secondary" onClick={() => navigate("/salons")}>Sabhi Salons Dekhein</button></div></div>
          )
        ) : categoriesError ? (
          /* Error: public-safe message only — no internal diagnostics leak.
             Retry + discovery escape hatch. */
          <div className="state-card"><span>✦</span><h3>Categories load nahi ho saki</h3><p>Categories load nahi ho saki. Dobara try karein.</p><div className="button-row"><button className="secondary" onClick={() => void loadCategories()}>Retry</button><button className="secondary" onClick={() => navigate("/salons")}>Sabhi Salons Dekhein</button></div></div>
        ) : adminCategories.length ? (
          <>
            <CategoriesGrid categories={adminCategories} showAll={showAllCategories} navigate={navigate} />
            <CategoriesMoreControl total={adminCategories.length} showAll={showAllCategories} onToggle={() => setShowAllCategories((v) => !v)} />
            <div className="categories-cta">
              <button type="button" className="primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]" onClick={() => navigate("/salons")}>Sabhi Salons Dekhein</button>
            </div>
          </>
        ) : (
          /* Empty: public-safe copy only — no internal system instructions. */
          <div className="state-card"><span>✦</span><h3>Categories abhi available nahi hain</h3><p>Categories abhi available nahi hain.</p><div className="button-row"><button className="secondary" onClick={() => void loadCategories()}>Retry</button><button className="secondary" onClick={() => navigate("/salons")}>Sabhi Salons Dekhein</button></div></div>
        )}
      </section>)}

{/*
        ── HOMEPAGE PHASE 1 · SECTION 10 — JAIPUR'S TOP 5 SALONS ──────────
        (Renumbered from "SECTION 08" per the locked MEMORY.md order — the
        authoritative contract is PHASE1_SECTION10.md. The implementation is
        reused in place: no duplicate section, stable id=top-jaipur-salons,
        admin gate preserved, all ranking data/hooks preserved.)
        Ranking stays the backend marketplace_top_rated order (Bayesian /
        review-confidence weighted, p_min_reviews: 1); the frontend only
        applies Jaipur-city + valid-aggregate eligibility and caps at five.
        Distance reuses Section 06 location state; open/closed reuses the
        Section 07 hours contract. No sponsored data enters this section.
      */}
{visible('top_rated') && (
        <TopJaipurSection online={online} loading={topRatedLoading} error={topRatedError} onRetry={() => void loadTopRated()} rows={topRatedRows} items={items} fixUsable={nearbyFixUsable} gpsFix={gpsFix} navigate={navigate} />
      )}

{/*
        ── HOMEPAGE PHASE 1 · SECTION 06 — NEARBY SHOPS ───────────────────
        Upgraded in place (stable id=nearby-shops, no duplicate section).
        Reuses the existing live contracts only: useNearby()/useNearbySalons()
        + on-device Haversine ranking, the published catalog, salon_hours
        (Asia/Kolkata) and the /salons parameter names. GPS permission is
        requested ONLY on the explicit "Use My Current Location" action; the
        default is an honest, clearly-labelled Jaipur fallback. No fake
        salon/distance/rating/price/availability anywhere.
      */}
{visible('nearby') && (
<section id="nearby-shops" aria-labelledby="nearby-shops-heading" className="section scroll-mt-24">
        <div className="section-heading"><span className="eyebrow">Near you</span><h2 id="nearby-shops-heading">Aapke Paas Ke Salons</h2><p>Apni location ya selected area ke aas-paas available salons, services aur prices explore karein.</p></div>

        {/* Location controls — default Jaipur (clearly labelled), manual
            city/area selection, user-action GPS only. */}
        <div className="nearby-controls">
          <label>City<select value={nearbyCity} onChange={(e) => setNearbyCity(e.target.value)} aria-label="City"><option value="Jaipur">Jaipur</option></select></label>
          <label>Area<select ref={nearbyAreaSelectRef} value={nearbyArea} onChange={(e) => setNearbyArea(e.target.value)} aria-label="Jaipur area"><option value="">All Jaipur</option>{JAIPUR_ZONES.map((z) => <optgroup key={z.zone} label={z.zone}>{z.areas.map((a) => <option key={a} value={a}>{a}</option>)}</optgroup>)}</select></label>
          <button type="button" className="secondary compact focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]" disabled={location.isImproving} onClick={() => { if (!location.isImproving) location.start(); }}>
            {location.isImproving ? "Location detect ho rahi hai…" : "Use My Current Location"}
          </button>
          <button ref={nearbyFilterToggleRef} type="button" className="secondary compact focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]" aria-expanded={nearbyPanelOpen} onClick={() => setNearbyPanelOpen((v) => !v)}>
            Filters{nearbyActiveFilterCount > 0 ? ` (${nearbyActiveFilterCount})` : ""}
          </button>
        </div>
        {/* Popular-area quick chips — same single nearbyArea state + same
            select semantics; a chip never invents an area outside JAIPUR_ZONES. */}
        <div className="nx-area-chips" role="group" aria-label="Popular Jaipur areas — quick area change">
          {NEARBY_QUICK_AREAS.map((quickArea) => (
            <button
              key={quickArea}
              type="button"
              className={`nx-area-chip${nearbyArea === quickArea ? " active" : ""}`}
              aria-pressed={nearbyArea === quickArea}
              onClick={() => setNearbyArea((current) => (current === quickArea ? "" : quickArea))}
            >
              {quickArea}
            </button>
          ))}
        </div>
        <p className="nearby-gps-note">Nearby salons aur distance dikhane ke liye location access use hoga. Jaipur default location hai — bina GPS ke bhi results milte hain.</p>
        <p className="nearby-status" role="status" aria-live="polite">{nearbyStatus}{!online ? " Aap offline hain." : ""}{location.isImproving && location.candidateAccuracy != null ? ` (best so far ${formatAccuracy(location.candidateAccuracy)})` : ""}</p>

        {/* GPS fallback actions — denied / timeout / unavailable / outside Jaipur. */}
        {(nearbyGpsState === "denied" || nearbyGpsState === "unavailable" || nearbyGpsState === "outside") && (
          <div className="nearby-actions">
            {nearbyGpsState === "unavailable" && <button type="button" className="secondary compact" onClick={() => location.retry()}>Retry Location</button>}
            <button type="button" className="secondary compact" onClick={focusNearbyAreaSelect}>{nearbyGpsState === "unavailable" ? "Select Area Manually" : "Select Area"}</button>
            <button type="button" className="secondary compact" onClick={continueWithJaipur}>Continue with Jaipur</button>
          </div>
        )}
        {nearbyGpsState === "denied" && <LocationNotice location={location} />}

        {/* Filter panel: inline on desktop, bottom sheet on mobile (CSS).
            Focus trap + Escape + return-focus handled in the effect above. */}
        {nearbyPanelOpen && (
          <div className="nearby-filter-panel" ref={nearbyPanelRef} role="dialog" aria-modal="true" aria-label="Nearby salon filters">
            <div className="nearby-filter-grid">
              <label>Distance<select value={nearbyDraft.radius} onChange={(e) => setNearbyDraft({ ...nearbyDraft, radius: e.target.value })} disabled={!nearbyFixUsable}><option value="">Any distance</option><option value="nearest">Nearest</option><option value="2">Within 2 km</option><option value="5">Within 5 km</option><option value="10">Within 10 km</option></select></label>
              <label>Rating<select value={nearbyDraft.rating} onChange={(e) => setNearbyDraft({ ...nearbyDraft, rating: e.target.value })}><option value="">Any rating</option><option value="4.5">4.5+</option><option value="4">4.0+</option><option value="3.5">3.5+</option></select></label>
              <label>Price<select value={nearbyDraft.price} onChange={(e) => setNearbyDraft({ ...nearbyDraft, price: e.target.value })}><option value="">Any price</option><option value="50000">Under ₹500</option><option value="100000">Under ₹1,000</option><option value="200000">Under ₹2,000</option></select></label>
              <label>Gender<select value={nearbyDraft.gender} onChange={(e) => setNearbyDraft({ ...nearbyDraft, gender: e.target.value })}><option value="">All</option><option value="unisex">Unisex</option><option value="female">Women</option><option value="male">Men</option></select></label>
              <label className="nearby-check"><input type="checkbox" checked={nearbyDraft.openNow} disabled={!online} onChange={(e) => setNearbyDraft({ ...nearbyDraft, openNow: e.target.checked })} /> Open now</label>
              {!nearbyFixUsable && <p className="nearby-filter-note">Distance radius filter ke liye pehle “Use My Current Location” se location detect karein.</p>}
            </div>
            <div className="nearby-filter-actions">
              <button type="button" className="primary compact" onClick={() => setNearbyFilters(nearbyDraft)}>Apply Filters</button>
              <button type="button" className="secondary compact" onClick={clearNearbyFilters}>Clear All</button>
              <button type="button" className="secondary compact" onClick={() => { setNearbyPanelOpen(false); nearbyFilterToggleRef.current?.focus(); }}>Close</button>
            </div>
          </div>
        )}

        {/* Cards + honest states. */}
        {nearbyLoading ? (
          <div className="nearby-grid" aria-hidden="true">
            {Array.from({ length: NEARBY_DISPLAY_LIMIT }, (_, i) => <div key={i} className="salon-card skeleton"><div /><p /><p /><p /></div>)}
          </div>
        ) : !online ? (
          nearbyRanked.length ? (
            <>
              <p className="saved-results-label">Saved results</p>
              <div className="nearby-grid">{nearbyRanked.slice(0, NEARBY_DISPLAY_LIMIT).map((row) => <NearbyDistanceCard key={row.id} row={row} navigate={navigate} />)}</div>
            </>
          ) : (
            <div className="state-card"><span>✦</span><h3>Aap offline hain</h3><p>Aap offline hain. Live nearby results ke liye internet connection check karein.</p><div className="button-row"><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button></div></div>
          )
        ) : catalogError && !items.length ? (
          <div className="state-card"><span>✦</span><h3>Nearby salons load nahi ho sake</h3><p>Nearby salons load nahi ho sake. Dobara try karein.</p><div className="button-row"><button className="secondary" onClick={() => window.location.reload()}>Retry</button><button className="secondary" onClick={focusNearbyAreaSelect}>Select Area</button><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button></div></div>
        ) : nearbyModeIsFiltered ? (
          nearbyPipelineRows.length ? (
            <div className="nearby-grid">{nearbyPipelineRows.map((row) => <NearbyShopCard key={row.item.id} row={row} openState={salonOpenState(row.item, nearbyHours[row.item.id])} navigate={navigate} />)}</div>
          ) : (
            <div className="state-card"><span>✦</span><h3>In filters ke saath koi salon nahi mila</h3><p>In filters ke saath koi salon nahi mila.</p><div className="button-row"><button className="secondary" onClick={clearNearbyFilters}>Clear Filters</button><button className="secondary" onClick={focusNearbyAreaSelect}>Change Area</button><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button></div></div>
          )
        ) : nearbyFixUsable && nearbyRanked.length ? (
          /* GPS mode: existing distance-bucket ranking (flattened + capped) —
             nearest-first live order preserved. */
          <div className="nearby-grid">{nearbyBuckets.flatMap((bucket) => bucket.items).slice(0, NEARBY_DISPLAY_LIMIT).map((row) => <NearbyDistanceCard key={row.id} row={row} navigate={navigate} />)}</div>
        ) : nearbyRanked.length ? (
          /* No GPS yet: existing ranked list, honest "Distance unavailable". */
          <div className="nearby-grid">{nearbyRanked.slice(0, NEARBY_DISPLAY_LIMIT).map((row) => <NearbyDistanceCard key={row.id} row={row} navigate={navigate} />)}</div>
        ) : (
          <div className="state-card"><span>✦</span><h3>Is area mein abhi koi salon nahi mila</h3><p>Is area mein abhi koi salon nahi mila.</p><div className="button-row"><button className="secondary" onClick={focusNearbyAreaSelect}>Change Area</button><button className="secondary" onClick={clearNearbyFilters}>Clear Filters</button><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button></div></div>
        )}

        <div className="categories-cta">
          <button type="button" className="primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]" onClick={openAllNearbySalons}>Sabhi Nearby Salons Dekhein</button>
        </div>
      </section>)}

{/* Section 11 — Smart Picks (renumbered from "Section 09" per locked MEMORY.md
    order — PHASE1_SECTION11.md). Consolidates the two earlier "Recommended For
    You" sections into ONE section (stable id=smart-picks): the personalized
    marketplace_recommendations ranking is primary, and the legacy
    rating*reviews+bookings ranking survives as the honest "Popular Picks"
    limited-data fallback under its existing admin gate. No duplicate
    recommendation section, no parallel system, no deleted data source. */}
{(() => {
        const favLink = isPersonalized ? (
          <p className="section-hint"><button className="text-button" onClick={() => navigate(PORTAL_PATHS.customer)}>Open your favourites in the Customer app →</button></p>
        ) : null;
        return (
          <>
            <SmartPicksSection
              online={online}
              authLoading={authState.loading}
              isCustomer={Boolean(authState.session && authState.role === "customer")}
              rows={recommendationRows}
              loading={recommendationsLoading}
              error={recommendationsError}
              isPersonalized={isPersonalized}
              onRefresh={() => void refreshRecommendations()}
              fallbackItems={recommended}
              fallbackAllowed={visible('recommended')}
              area={nearbyArea}
              items={items}
              fixUsable={nearbyFixUsable}
              gpsFix={gpsFix}
              navigate={navigate}
            />
            {favLink}
          </>
        );
      })()}

      {/* Customer App CTA (mockup gradient banner) — sits with the popular
          picks content; routing is auth-aware through the canonical portal. */}
      <CustomerAppBanner
        authLoading={authState.loading}
        isAuthenticated={Boolean(authState.session && authState.role)}
        navigate={navigate}
      />

{/*
  ── HOMEPAGE PHASE 1 · SECTION 12 — TRENDING AND MOST BOOKED ─────────────
  The two existing homepage render sites are consolidated here (stable
  id=trending-most-booked). HomePage still owns exactly one useTrending() and
  one usePopularServices() request; this component receives those live rows
  unchanged and maps them in backend/RPC order. The existing `trending`
  visibility key remains the Section 12 admin gate. PHASE1_SECTION12.md.
*/}
{visible('trending') && (
  <>
    <TrendingMostBookedSection
      trendingRows={trendingRows}
      trendingLoading={trendingLoading}
      trendingError={trendingError}
      onRetryTrending={retryTrending}
      popularServices={popularServices}
      popularLoading={popularLoading}
      popularError={popularError}
      onRetryPopular={retryPopularServices}
      salonReferences={section12SalonReferences}
      online={online}
      navigate={navigate}
    />
    {/* Live marketplace pulse (mockup "Marketplace Activity" strip) — same
        live rows, same admin gate; hidden unless both sources are healthy. */}
    <MarketplaceActivityBanner
      online={online}
      trendingError={trendingError}
      popularError={popularError}
      trendingRows={trendingRows}
      popularServices={popularServices}
    />
  </>
)}

{visible('offers') && (
  <BestOffersSection
    offers={marketplaceOffers}
    loading={marketplaceOffersLoading}
    error={marketplaceOffersError}
    online={online}
    onRetry={retryMarketplaceOffers}
    navigate={navigate}
  />
)}

      {/* Section 14 — the existing homepage review feed, consolidated into a
          dedicated public-safe component immediately after Section 13. */}
      <CustomerReviewsSection
        reviews={reviewFeed}
        loading={statsLoading}
        error={statsError}
        online={online}
        onRetry={() => void reloadMarketplaceStats()}
        navigate={navigate}
      />

      {/* Partner-approved promotions — only active + approved (published) */}
      <section className="section" style={{ background: "var(--cream)" }}>
        <div className="section-heading"><span className="eyebrow">Partner promotions</span><h2>Partner Approved Offers</h2><p>Active offers from Growth Partner onboarded salons — shown only after owner approval. Commission and partner details stay private.</p></div>
        <PartnerPromosStrip navigate={navigate} />
      </section>

{/*
        ── HOMEPAGE PHASE 1 · SECTION 07 — OPEN NOW ───────────────────────
        Upgraded in place from the old "Open Today" block (stable id=open-now,
        no duplicate section). Only genuinely-open published salons render —
        real salon_hours data evaluated in Asia/Kolkata with midnight-crossing
        support; missing/invalid hours never claim open. Reuses Section 06's
        selected-area base + shared hours fetch (no duplicate requests, no new
        GPS prompt). The preserved OpenTodayStrip follows, fed the same data.
      */}
{visible('available_today') && (
<>
        <OpenNowSection online={online} baseLoading={nearbyLoading} catalogError={catalogError} baseItems={nearbyBaseItems} hoursById={nearbyHours} area={nearbyArea} fixUsable={nearbyFixUsable} gpsFix={gpsFix} navigate={navigate} />
        <div className="section" style={{ background: "var(--cream)", paddingTop: 6 }}>
          <div className="section-heading" style={{ marginBottom: 10 }}><span className="eyebrow">Hours</span><h3>Aaj ke hours</h3><p>Salons ke aaj ke published opening hours — real data only.</p></div>
          <OpenTodayStrip items={nearbyBaseItems} navigate={navigate} preloaded={openTodayPreloaded} />
        </div>
      </>)}

{visible('sponsored_shops') && (
<section className="section">
        <div className="section-heading"><span className="eyebrow">Sponsored</span><h2>Sponsored</h2><p>Admin-approved sponsored content — always labelled, never mixed into organic results without the badge. Expired or paused campaigns hide automatically.</p></div>
        {sponsoredLoading ? <SalonSkeletons count={3} /> : sponsored.shops.length || sponsored.brands.length || sponsored.videos.length ? (
          <>
            {sponsored.shops.length > 0 && (
              <div className="salon-grid">{sponsored.shops.map((sh) => <article key={sh.id} className="salon-card"><div className="salon-visual" style={sh.image?.startsWith("http") ? { backgroundImage: `url("${sh.image}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!sh.image?.startsWith("http") && <span>✦</span>}<em>{(sh.badge ?? "Sponsored").toUpperCase()}</em></div><div className="salon-body"><div className="salon-meta"><span>Sponsored</span><span>★ {Number(sh.rating).toFixed(1)} ({sh.review_count})</span></div><h3>{sh.salon_name}</h3><p>{sh.area ?? sh.city}, {sh.city}</p><div className="salon-bottom"><button onClick={() => { recordSponsoredClick("shop", sh.id); navigate(`/salons/${sh.salon_slug}`); }}>View salon</button></div></div></article>)}</div>
            )}
            {sponsored.brands.length > 0 && (
              <div className="button-row" style={{ marginTop: 12 }}>{sponsored.brands.map((b) => <button key={b.id} className="secondary compact" onClick={() => { recordSponsoredClick("brand", b.id); if (b.website) window.open(b.website, "_blank", "noopener"); }} title={b.tagline ?? b.name}>{b.name}{b.tagline ? ` — ${b.tagline}` : ""}</button>)}</div>
            )}
            {sponsored.videos.length > 0 && (
              <div className="role-grid" style={{ marginTop: 12 }}>{sponsored.videos.map((v) => <article key={v.id} className="role-card" onClick={() => recordSponsoredClick("video", v.id)} style={{ cursor: "pointer" }}><span className="role-icon">▶</span><h3>{v.title}</h3><p>Editorial video · {v.video_url ? "Watch on the platform" : "Coming soon"}</p></article>)}</div>
            )}
          </>
        ) : <StateCard title="No sponsored content yet" text="Admin-approved sponsored shops, brands and videos appear here." />}
      </section>)}

      {/* Recently viewed — logged-in + consent only */}
      {visible('recently_viewed') && (isCustomer ? (
        <section className="section">
          <div className="section-heading"><span className="eyebrow">Recently viewed</span><h2>Pick up where you left off</h2><p>Salons you viewed recently — shown only with your consent. Nothing is shared.</p></div>
          {!consentLoaded ? <SalonSkeletons count={3} /> : !rvConsent ? (
            <StateCard title="Recently viewed is off" text="Turn it on to see the salons you browsed recently — stored only for your own account." action="Enable" onAction={() => void setConsentPref(true)} />
          ) : rvLoading ? <SalonSkeletons count={3} /> : recentlyViewed.length ? (
            <div className="salon-grid">{recentlyViewed.map((row) => <article key={row.id} className="salon-card"><div className="salon-visual" style={row.cover_image_path?.startsWith("http") ? { backgroundImage: `url("${row.cover_image_path.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!row.cover_image_path?.startsWith("http") && <span>✦</span>}<em>Viewed</em></div><div className="salon-body"><div className="salon-meta"><span>Recently viewed</span><span>🕘 {new Date(row.viewed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></div><h3>{row.name}</h3><p>{row.area ?? row.city}, {row.city}</p><div className="salon-bottom"><button onClick={() => navigate(`/salons/${row.slug}`)}>View again</button></div></div></article>)}</div>
          ) : <StateCard title="Nothing viewed yet" text="Salons you visit will appear here." />}
          {rvConsent && <p className="section-hint"><button className="text-button" onClick={() => void setConsentPref(false)}>Disable recently viewed</button></p>}
        </section>
      ) : null)}

      {/* Membership — live plans + current customer status */}
{visible('membership') && (      <section id="membership" className="section" style={{ background: "var(--cream)" }}>
        <div className="section-heading"><span className="eyebrow">Membership</span><h2>Nexora Membership</h2><p>Admin-managed plans — benefits (discounts and points) are calculated server-side at booking time and can never be changed from the browser.</p></div>
        {membershipLoading ? <SalonSkeletons count={3} /> : membershipPlans.length ? <div className="role-grid">{membershipPlans.map((plan) => (
          <article className="role-card" key={plan.id}>
            <span className="role-icon">{plan.slug === "gold" ? "🥇" : plan.slug === "silver" ? "🥈" : "🥉"}</span>
            <h3>{plan.name}{membershipStatus?.plan_name === plan.name ? " · ✓ your plan" : ""}</h3>
            <p style={{ fontWeight: 700 }}>{plan.price_paise === 0 ? "Free" : `${money(plan.price_paise)} / ${plan.billing_period}`}</p>
            <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: 12, lineHeight: 1.7 }}>
              {(plan.benefits ?? []).map((b, i) => <li key={i}>{b}</li>)}
              <li>{plan.discount_percent}% off on eligible bookings</li>
              <li>{plan.reward_points_rate} point{plan.reward_points_rate === 1 ? "" : "s"} per ₹100 spent</li>
            </ul>
          </article>
        ))}</div> : <StateCard title="No membership plans yet" text="Admin-approved membership plans appear here." />}
        {membershipStatus && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff5f8", border: "1px solid #f0d3de", borderRadius: 12, fontSize: 13 }}>
            <b>Your plan: {membershipStatus.plan_name}</b> · {membershipStatus.discount_percent}% off · {membershipStatus.reward_points_rate} pts/₹100
            {membershipStatus.expires_at ? <> · renews/expires {new Date(membershipStatus.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</> : ""}
          </div>
        )}
        {isCustomer && <p className="section-hint"><button className="text-button" onClick={() => navigate(PORTAL_PATHS.customer)}>View your rewards &amp; loyalty points in the Customer app →</button></p>}
      </section>)}

      {/*
        ── HOMEPAGE PHASE 1 · SECTION 04 — APP DIRECTORY ──────────────────
        "Aap Nexora Par Kya Karna Chahte Hain?" — the scroll target of the
        Hero secondary CTA (`scroll-mt` keeps the heading clear of the sticky
        header after the jump; id=nexora-apps is STABLE for Section 02).

        Upgraded in place (no duplicate section): exactly SIX cards — the
        four role portals, the Template Builder, Distributors and the Job
        Portal. Cards are auth-aware:
          • signed out  → protected apps open through the existing login gate
                          (PortalGateway / legacy entry) with a safe returnTo;
          • loading     → protected cards pause, so no role-gated flash;
          • signed in   → apps open directly (GP continues on /app/partner).
        Public apps (Jobs, Distributors) always open. Copy is public-safe —
        RLS/commission internals stay in the backend, never in this UI.
      */}
      <section id="nexora-apps" className="section scroll-mt-24">
        <div className="section-heading"><span className="eyebrow">About Nexora</span><h2>Aap Nexora Par Kya Karna Chahte Hain?</h2><p>Choose what you want to do — book a salon, manage your business, grow brands, launch your salon website, browse wholesale distributors or find beauty jobs. One Nexora account works across every app.</p></div>

        {/* Auth-aware status line: logged-out / loading / logged-in (+offline). */}
        <p role="status" aria-live="polite" className="apps-status">
          {authState.loading
            ? "Checking your Nexora account…"
            : authState.session && authState.role
              ? `Signed in as ${ROLE_LABELS[authState.role] ?? "a Nexora member"} — protected apps open directly.`
              : "You are signed out. Protected apps will take you to secure Nexora login first — and bring you right back."}
          {!online && " You are offline — account checks and protected apps may be unavailable."}
        </p>

        <div className="role-grid">
          <RoleCard title="Customer App" icon="🧖‍♀️" text="Book published salons, pay securely, and track your bookings, payments and refunds." path={PORTAL_PATHS.customer} navigate={navigate} authLoading={authState.loading} isAuthenticated={Boolean(authState.session && authState.role)} protectedApp />
          <RoleCard title="Shop Owner App" icon="💈" text="Manage your salon — services, staff, bookings, offers, wallet and earnings." path={PORTAL_PATHS.business_user} navigate={navigate} authLoading={authState.loading} isAuthenticated={Boolean(authState.session && authState.role)} protectedApp />
          {/* Growth Partner contract route is the /growth-partner entry (safe
              login → returnTo); signed-in partners continue on the canonical
              /app/partner mount. */}
          <RoleCard title="Growth Partner App" icon="🚀" text="Onboard salons, prepare salon websites and track your commissions." path={PORTAL_PATHS.growth_partner} entryPath="/growth-partner" navigate={navigate} authLoading={authState.loading} isAuthenticated={Boolean(authState.session && authState.role)} protectedApp />
          <RoleCard title="Template Builder" icon="🎨" text="Design and launch your salon website once your Shop Owner account is verified." path={TEMPLATE_PATH} navigate={navigate} authLoading={authState.loading} isAuthenticated={Boolean(authState.session && authState.role)} protectedApp />
          <RoleCard title="Beauty Distributor" icon="🛍️" text="Browse verified wholesale distributors, brands and professional beauty products." path="/distributors-beauty-industry" navigate={navigate} external />
          <RoleCard title="Job Portal" icon="💼" text="Explore beauty-industry jobs and apply directly — across salons and brands." path="/job-portal" navigate={navigate} external />
        </div>
      </section>
    </main>
  );
}

/**
 * Section 04 app card — auth-aware upgrade of the original RoleCard (same
 * component, same canonical `path` props; no duplicate section, no deleted
 * functionality).
 *
 *  • Signed out + protected app → opens `entryPath` when set (Growth Partner:
 *    the /growth-partner entry with its safe login → returnTo flow) or the
 *    canonical /app/* route, whose PortalGateway routes through secure login
 *    and returns the visitor right back (safe same-origin returnTo).
 *  • Signed in → the canonical portal mount opens directly.
 *  • Auth still loading → protected cards pause (no role-gated flash); public
 *    apps (Job Portal, Distributors) always open.
 *  • External static mounts leave the SPA router via full navigation — no
 *    iframe, no hardcoded origin, no parallel auth.
 */
/**
 * Section 05 — live category grid. Admin order preserved (never re-sorted);
 * only CATEGORIES_INITIAL_COUNT rows render until expanded. Cards are semantic
 * articles with a real button (keyboard + screen-reader safe); counts come
 * from the live RPC only — unavailable counts are never faked as 0.
 */
type PremiumIconName = "search" | "location" | "close" | "menu" | "verified" | "sparkles" | "home" | "store" | "booking" | "person" | "phone";

/** Small inline glyphs keep the public homepage crisp without a third-party
 * icon runtime or a network dependency. They are decorative; surrounding
 * controls provide the accessible labels. */
function PremiumIcon({ name, className }: { name: PremiumIconName; className?: string }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (name) {
    case "search": return <svg {...props}><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.4 4.4" /></svg>;
    case "location": return <svg {...props}><path d="M20 10.3c0 5.1-8 10.2-8 10.2S4 15.4 4 10.3a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.4" /></svg>;
    case "close": return <svg {...props}><path d="m5 5 14 14M19 5 5 19" /></svg>;
    case "menu": return <svg {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "verified": return <svg {...props}><path d="M12 3.5 14 5l2.5-.1.9 2.3 2 1.4-.8 2.4.8 2.4-2 1.4-.9 2.3-2.5-.1-2 1.5-2-1.5-2.5.1-.9-2.3-2-1.4.8-2.4-.8-2.4 2-1.4.9-2.3L10 5l2-1.5Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
    case "sparkles": return <svg {...props}><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></svg>;
    case "home": return <svg {...props}><path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" /><path d="M9 20v-6h6v6" /></svg>;
    case "store": return <svg {...props}><path d="M4 10v10h16V10" /><path d="M3 10 5 4h14l2 6" /><path d="M3 10a3 3 0 0 0 5 2.2A3 3 0 0 0 12 10a3 3 0 0 0 4 2.2A3 3 0 0 0 21 10M9 20v-5h6v5" /></svg>;
    case "booking": return <svg {...props}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h3" /></svg>;
    case "person": return <svg {...props}><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.7-3.3 2.8-5 6.5-5s5.8 1.7 6.5 5" /></svg>;
    case "phone": return <svg {...props}><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M10.5 5.5h3M11 17.8h2" /></svg>;
  }
}

const PREMIUM_SERVICE_SHORTCUTS = [
  { label: "Haircut", icon: "scissors", query: "Haircut" },
  { label: "Hair Spa", icon: "spa", query: "Hair Spa" },
  { label: "Facial", icon: "facial", query: "Facial" },
  { label: "Makeup", icon: "makeup", query: "Makeup" },
  { label: "Manicure", icon: "nails", query: "Manicure" },
  { label: "Pedicure", icon: "nails", query: "Pedicure" },
  { label: "Bridal", icon: "bridal", query: "Bridal" },
  { label: "Grooming", icon: "salon", query: "Grooming" },
  { label: "Spa", icon: "spa", query: "Spa" },
] as const;

/** The visual service rail from the Jaipur brief. These are stable discovery
 * shortcuts; salon availability, prices and counts still come only from the
 * live /salons marketplace after the handoff. */
function PremiumServiceRail({ navigate }: { navigate: (path: string) => void }) {
  return (
    <section id="premium-services" className="premium-services" aria-labelledby="premium-services-heading">
      <div className="premium-content-width">
        <div className="premium-services-heading">
          <div>
            <h2 id="premium-services-heading">Explore Beauty Services</h2>
            <p>Apni favourite beauty service quickly discover karein.</p>
          </div>
        </div>
        <div className="premium-service-track" role="list" aria-label="Beauty service shortcuts">
          {PREMIUM_SERVICE_SHORTCUTS.map((service) => (
            <button
              type="button"
              key={service.label}
              className="premium-service-card"
              onClick={() => navigate(`/salons?q=${encodeURIComponent(service.query)}`)}
              aria-label={`Find ${service.label} salons`}
            >
              <span className="premium-service-icon"><CategoryIcon name={service.icon} /></span>
              <span className="premium-service-label">{service.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoriesGrid({ categories, showAll, navigate }: { categories: readonly CategoryRow[]; showAll: boolean; navigate: (path: string) => void }) {
  const visibleRows = showAll ? categories : categories.slice(0, CATEGORIES_INITIAL_COUNT);
  return (
    <div className="categories-grid">
      {visibleRows.map((c) => {
        const counts = categoryCountsCopy(c.salon_count, c.service_count);
        return (
          <article key={c.slug} className="role-card category-card">
            <span className="role-icon"><CategoryIcon name={c.icon} className="category-icon" /></span>
            <h3>{c.name}</h3>
            <p>{counts}</p>
            {/* Real button (keyboard + screen-reader accessible); the stretched
                hit area makes the whole card clickable. */}
            <button
              type="button"
              className="category-open focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]"
              onClick={() => navigate(`/salons?category=${encodeURIComponent(c.name)}`)}
              aria-label={`Browse ${c.name} — ${counts}`}
            >
              Explore →
            </button>
          </article>
        );
      })}
    </div>
  );
}

/**
 * Section 05 — "Sabhi Categories Dekhein" expandable control. Rendered only
 * when the live list exceeds the initial cap; admin order stays untouched.
 */
function CategoriesMoreControl({ total, showAll, onToggle }: { total: number; showAll: boolean; onToggle: () => void }) {
  if (total <= CATEGORIES_INITIAL_COUNT) return null;
  return (
    <div className="categories-more">
      <button
        type="button"
        className="secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]"
        aria-expanded={showAll}
        onClick={onToggle}
      >
        {showAll ? "Kam categories dekhein" : "Sabhi Categories Dekhein"}
      </button>
    </div>
  );
}

function RoleCard({
  title,
  text,
  icon,
  path,
  entryPath,
  navigate,
  external,
  protectedApp,
  authLoading,
  isAuthenticated,
}: {
  title: string;
  text: string;
  icon: string;
  path: string;
  entryPath?: string;
  navigate: (path: string) => void;
  external?: boolean;
  protectedApp?: boolean;
  authLoading?: boolean;
  isAuthenticated?: boolean;
}) {
  const waiting = Boolean(protectedApp) && Boolean(authLoading);
  const open = () => {
    if (waiting) return;
    const target = isAuthenticated || !protectedApp ? path : (entryPath ?? path);
    if (external) window.location.assign(target);
    else navigate(target);
  };
  const badge = !protectedApp
    ? "Open to everyone"
    : waiting
      ? "Checking your account…"
      : isAuthenticated
        ? "Signed in — opens directly"
        : "Nexora login required";
  const action = !protectedApp
    ? "Open"
    : waiting
      ? "One moment…"
      : isAuthenticated
        ? "Open app"
        : "Log in to open";
  return (
    <article className="role-card app-card">
      <span className="role-icon" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <p className="app-card-badge">{badge}</p>
      <button
        type="button"
        onClick={open}
        disabled={waiting}
        aria-label={`${action} — ${title}`}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]"
      >
        {action} →
      </button>
    </article>
  );
}

function RoleEntry({ path, navigate }: { path: string; navigate: (path: string) => void }) {
  const label = path === "/owner" ? "Shop Owner" : path === "/growth-partner" ? "Growth Partner" : "Customer";
  const platformRole = path === "/owner" ? "business_user" as const : path === "/growth-partner" ? "growth_partner" as const : "customer" as const;
  const role = roleQueryForPortalRole(platformRole);
  const portalPath = portalPathForRole(platformRole);
  return (
    <main className="center-page">
      <section className="entry-card">
        <span className="eyebrow">Nexora {label}</span>
        <h1>{label} portal</h1>
        <p>Use your permanent {label.toLowerCase()} account. Accounts automatically return to their assigned same-origin portal.</p>
        <div className="button-row">
          <button className="primary" onClick={() => navigate(`/login?role=${role}&returnTo=${encodeURIComponent(portalPath)}`)}>Log in</button>
          <button className="secondary" onClick={() => navigate(`/signup?role=${role}&returnTo=${encodeURIComponent(portalPath)}`)}>Sign up</button>
        </div>
      </section>
    </main>
  );
}

function isCatalogPrivilegeError(cause: unknown): boolean {
  const message =
    cause instanceof Error
      ? cause.message
      : cause && typeof cause === "object" && "message" in cause
        ? String((cause as { message: unknown }).message ?? "")
        : String(cause ?? "");
  const code = cause && typeof cause === "object" && "code" in cause
    ? String((cause as { code: unknown }).code ?? "")
    : "";
  return /permission denied|42501|schema cache|not find the table/i.test(`${code} ${message}`);
}

async function attachApprovedBusinessLocations(
  client: SupabaseClient,
  salonIds: string[],
): Promise<Map<string, { salon_id: string; latitude: number; longitude: number; approval_status: string }>> {
  if (!salonIds.length) return new Map();
  const { data: businessLocations, error: businessLocationError } = await client
    .from("business_locations")
    .select("salon_id,latitude,longitude,approval_status")
    .in("salon_id", salonIds)
    .eq("approval_status", "approved");
  // A missing/unavailable location table must never cause fallback to legacy or
  // invented coordinates. The catalog remains usable without distances.
  if (businessLocationError) {
    console.warn("Approved business locations are unavailable; distance sorting is disabled.");
    return new Map();
  }
  return new Map((businessLocations ?? []).map((location) => [location.salon_id, location]));
}

async function fetchCatalogFromTables(client: SupabaseClient): Promise<CatalogItem[]> {
  const { data: websites, error: websiteError } = await client
    .from("salon_public_websites")
    .select("salon_id,slug,template_key,config,published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  if (websiteError) throw websiteError;
  if (!websites?.length) return [];
  const salonIds = websites.map((item) => item.salon_id);
  const { data: salons, error: salonError } = await client
    .from("salons")
    // Legacy salons.latitude/longitude are intentionally not readable. Public
    // coordinates come only from the separate approval-gated table below.
    .select("id,slug,name,description,address,area,city,location_address,location_city,location_area,rating_average,review_count,starting_price_paise,cover_image_path,business_category,phone")
    .in("id", salonIds)
    .eq("verified", true)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (salonError) throw salonError;

  const approvedLocationBySalon = await attachApprovedBusinessLocations(client, salonIds);
  const bySalon = new Map(websites.map((website) => [website.salon_id, website as Website]));
  return (salons ?? []).filter((salon) => bySalon.has(salon.id)).map((salon) => {
    const approvedLocation = approvedLocationBySalon.get(salon.id);
    return {
      ...(salon as Salon),
      address: salon.location_address || salon.address || null,
      city: salon.location_city || salon.city || null,
      area: salon.location_area || salon.area || null,
      latitude: approvedLocation ? Number(approvedLocation.latitude) : null,
      longitude: approvedLocation ? Number(approvedLocation.longitude) : null,
      approval_status: approvedLocation?.approval_status === "approved" ? "approved" as const : null,
      website: bySalon.get(salon.id)!,
    };
  });
}

/**
 * Security-definer marketplace_search already works when PostgREST cannot see
 * column-only GRANTs on salon_public_websites. Used only after a privilege error.
 */
async function fetchCatalogFromMarketplaceRpc(client: SupabaseClient): Promise<CatalogItem[]> {
  const { data, error } = await client.rpc("marketplace_search", {
    p_query: "",
    p_category: null,
    p_area: null,
    p_min_rating: 0,
    p_max_price_paise: null,
    p_has_offer: false,
    p_gender: null,
    p_sort: "name",
    p_limit: 60,
    p_offset: 0,
  });
  if (error) throw error;
  const rows = (data ?? []) as SearchRow[];
  if (!rows.length) return [];
  const approvedLocationBySalon = await attachApprovedBusinessLocations(client, rows.map((row) => row.id));
  return rows.map((row) => {
    const approvedLocation = approvedLocationBySalon.get(row.id);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: null,
      address: [row.area, row.city].filter(Boolean).join(", "),
      area: row.area,
      city: row.city ?? "",
      rating_average: Number(row.rating_avg ?? 0),
      review_count: Number(row.review_count ?? 0),
      starting_price_paise: row.starting_price_paise,
      cover_image_path: row.cover_image_path,
      business_category: row.business_category,
      latitude: approvedLocation ? Number(approvedLocation.latitude) : null,
      longitude: approvedLocation ? Number(approvedLocation.longitude) : null,
      approval_status: approvedLocation?.approval_status === "approved" ? "approved" as const : null,
      website: {
        salon_id: row.id,
        slug: row.slug,
        template_key: "",
        config: {},
        published_at: null,
      },
    };
  });
}

// Public catalog contract: verified=true, is_active=true, is_published=true, deleted_at null.
async function fetchCatalog(): Promise<CatalogItem[]> {
  const client = getClient();
  if (!client) throw new Error(missingSupabaseConfigMessage);
  try {
    return await fetchCatalogFromTables(client);
  } catch (cause) {
    if (!isCatalogPrivilegeError(cause)) throw cause;
    return fetchCatalogFromMarketplaceRpc(client);
  }
}

function useCatalog(online: boolean) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setItems(await fetchCatalog()); } catch (cause) { setError(friendlyError(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (online) void load();
      else { setLoading(false); setError("You are offline. Reconnect to load published salons."); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, online]);
  return { items, loading, error, load };
}

/**
 * Partner-approved promotions: active offers on salons that (a) are published
 * (owner/admin approved), (b) have an active shop attribution. The RPC is
 * security definer so commission/partner identity is never exposed — only
 * public offer + salon fields.
 */
function PartnerPromosStrip({ navigate }: { navigate: (path: string) => void }) {
  const [promos, setPromos] = useState<PartnerPromo[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const client = getClient(); if (!client) { setLoading(false); return; }
        const { data, error } = await client.rpc("marketplace_partner_promos");
        if (error) throw error;
        if (active) setPromos((data ?? []) as PartnerPromo[]);
      } catch { /* strip degrades gracefully */ } finally { if (active) setLoading(false); }
    };
    const t = setTimeout(() => void load(), 0);
    return () => { active = false; clearTimeout(t); };
  }, []);
  if (loading) return <SalonSkeletons count={3} />;
  if (!promos.length) return <StateCard title="No partner promotions yet" text="When a Growth Partner onboarded salon publishes an active offer, it appears here — only after owner approval." />;
  return <div className="service-grid">{promos.map((promo) => <article className="service-card" key={promo.offer_id}><div><h3>{promo.offer_name ?? "Offer"} <em style={{ fontWeight: 400, fontSize: 10, color: "var(--primary)" }}>✦ partner approved</em></h3><p>{promo.description || ""}</p><small>{promo.salon_name} · {promo.discount_type === "percent" ? `${promo.discount_value}% off` : promo.discount_value != null ? `${money(promo.discount_value * 100)} off` : "Limited offer"}</small></div><button className="text-button" onClick={() => navigate(`/salons/${promo.salon_slug}`)}>View salon</button></article>)}</div>;
}

function CatalogStrip({ navigate, online, statsBySalon, hoursById, fixUsable, gpsFix }: { navigate: (path: string) => void; online: boolean; statsBySalon?: Record<string, SalonStats>; hoursById?: Record<string, { opens_at: string | null; closes_at: string | null; is_closed: boolean }>; fixUsable?: boolean; gpsFix?: { latitude: number; longitude: number } | null }) {
  const { items, loading, error, load } = useCatalog(online);
  if (loading) return <SalonSkeletons count={3} />;
  if (error) return <StateCard title="Could not load salons" text={error} action="Retry" onAction={load} />;
  if (!items.length) return <StateCard title="No published salons yet" text="Owner-approved salon websites will appear here when published." />;
  return (
    <div className="salon-grid nx-marketplace-grid">
      {items.slice(0, 3).map((item) => {
        // Distance only from approved salon coordinates + a usable Section 06
        // fix — never guessed. Open Now reuses the shared salon_hours fetch
        // (salonOpenState keeps its config-hours fallback).
        const distanceKm = fixUsable && gpsFix && item.approval_status === "approved" &&
          typeof item.latitude === "number" && typeof item.longitude === "number"
          ? haversineKm(gpsFix.latitude, gpsFix.longitude, Number(item.latitude), Number(item.longitude))
          : null;
        return <SalonCard key={item.id} item={item} navigate={navigate} stats={statsBySalon?.[item.id]} distanceKm={distanceKm} openState={salonOpenState(item, hoursById?.[item.id])} />;
      })}
    </div>
  );
}

/**
 * "Open Today" strip — real opening hours for the published catalog.
 * Source of truth: salon_hours table (owner managed); falls back to the
 * website config opening_hours (proposal payload) when the table is empty.
 * Shows the earliest opening salon first; never fabricates slots.
 */
function OpenTodayStrip({ items, navigate, preloaded }: {
  items: CatalogItem[];
  navigate: (path: string) => void;
  /** Shared hours data (Section 07) — when provided, no duplicate fetch runs. */
  preloaded?: { todayRows: Record<string, { opens: string | null; closes: string | null; closed: boolean }>; loading: boolean };
}) {
  const [ownRows, setOwnRows] = useState<Record<string, { opens: string | null; closes: string | null; closed: boolean }>>({});
  const [ownLoading, setOwnLoading] = useState(true);

  useEffect(() => {
    if (preloaded) return; // Shared data provided — avoid a duplicate request.
    let active = true;
    const load = async () => {
      try {
        const client = getClient();
        if (!client || !items.length) { setOwnLoading(false); return; }
        const today = dayOfWeekIST(); // Asia/Kolkata weekday — Postgres day_of_week convention
        const { data } = await client
          .from("salon_hours")
          .select("salon_id,day_of_week,opens_at,closes_at,is_closed")
          .in("salon_id", items.map((i) => i.id))
          .eq("day_of_week", today);
        if (!active) return;
        const rows = (data ?? []) as (HoursRow & { salon_id: string })[];
        const map: Record<string, { opens: string | null; closes: string | null; closed: boolean }> = {};
        for (const row of rows) {
          map[row.salon_id] = { opens: row.opens_at, closes: row.closes_at, closed: Boolean(row.is_closed) };
        }
        // Config fallback for salons with no salon_hours rows yet.
        for (const item of items) {
          if (map[item.id]) continue;
          const cfg = (item.website.config as { profile?: { opening_hours?: { opens?: string; closes?: string } } })?.profile?.opening_hours;
          if (cfg?.opens) map[item.id] = { opens: cfg.opens, closes: cfg.closes ?? null, closed: false };
        }
        setOwnRows(map);
      } catch { /* degrade to empty */ } finally { if (active) setOwnLoading(false); }
    };
    const t = setTimeout(() => void load(), 0);
    return () => { active = false; clearTimeout(t); };
  }, [items, preloaded]);

  const todayRows = preloaded ? preloaded.todayRows : ownRows;
  const loading = preloaded ? preloaded.loading : ownLoading;

  if (loading) return <SalonSkeletons count={3} />;
  const openNow = items.filter((i) => todayRows[i.id] && !todayRows[i.id].closed);
  if (!openNow.length) return <StateCard title="No opening hours yet" text="Salons ke published opening hours yahan dikhenge." />;
  return (
    <div className="button-row">
      {openNow.slice(0, 8).map((item) => (
        <button key={item.id} className="secondary compact" onClick={() => navigate(`/salons/${item.website.slug}`)}>
          {item.name} · {formatHours(todayRows[item.id].opens, todayRows[item.id].closes)}
        </button>
      ))}
    </div>
  );
}


type Offer = {
  id: string;
  salon_id: string;
  name: string | null;
  description: string | null;
  discount_type: string | null;
  discount_value: number | null;
  is_active: boolean;
};

function OfferCard({ offer, salonName, salonSlug, navigate }: { offer: Offer; salonName: string | null; salonSlug: string | null; navigate: (path: string) => void }) {
  return (
    <article className="service-card">
      <div>
        <h3>{offer.name ?? "Offer"}</h3>
        <p>{offer.description || ""}</p>
        <small>{offer.discount_type === "percent" ? `${offer.discount_value}% off` : offer.discount_value != null ? `${money(offer.discount_value * 100)} off` : "Limited offer"}{salonName ? ` · ${salonName}` : ""}</small>
      </div>
      <button className="text-button" onClick={() => navigate(salonSlug ? `/salons/${salonSlug}` : "/salons")}>View salon</button>
    </article>
  );
}

/**
 * Public Best Offers source. Reuses the existing marketplace_offers RPC
 * (p_limit: 12) that OffersStrip previously called. Response order is kept
 * exactly as returned — this repository has no frontend "best" ranking rule.
 */
/** Homepage public offer cap — matches existing marketplace_offers p_limit. */
const MARKETPLACE_OFFERS_LIMIT = 12;

function useMarketplaceOffers(online: boolean) {
  const [offers, setOffers] = useState<OfferDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(false);
    try {
      const client = getClient();
      if (!client) throw new Error("Marketplace client unavailable");
      const { data, error: rpcError } = await client.rpc("marketplace_offers", { p_limit: MARKETPLACE_OFFERS_LIMIT });
      if (rpcError) throw rpcError;
      if (version === requestVersion.current) setOffers((data ?? []) as OfferDetail[]);
    } catch {
      // Keep already-loaded public rows during a failed refresh. Raw backend
      // details never leave this hook; Section 13 receives only a boolean.
      if (version === requestVersion.current) setError(true);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (online) void load();
      else setLoading(false);
    }, 0);
    return () => {
      window.clearTimeout(t);
      requestVersion.current += 1;
    };
  }, [load, online]);
  return { offers, loading, load, error };
}

function trimPublicText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function isSafeSalonSlug(slug: string): boolean {
  return Boolean(slug) && !slug.includes("/") && slug !== "undefined" && slug !== "null";
}

function isSafePublicId(value: string): boolean {
  return Boolean(value) && value !== "undefined" && value !== "null" && !value.includes("/") && !value.includes("?");
}

/**
 * Existing Customer PWA booking handoff used by salon/nearby/smart-picks cards.
 * Only supported query keys: salon, returnTo, optional service (name).
 * No invented offer/coupon/promo parameters.
 */
function marketplaceBookingPath(salonId: string, salonSlug: string, serviceName?: string): string | null {
  if (!isSafePublicId(salonId) || !isSafeSalonSlug(salonSlug)) return null;
  const params = new URLSearchParams();
  params.set("salon", salonId);
  params.set("returnTo", `/salons/${salonSlug}`);
  const service = trimPublicText(serviceName);
  if (service) params.set("service", service);
  return `/app/customer/?${params.toString()}`;
}

const OFFER_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const OFFER_TZ = "Asia/Kolkata";

/**
 * Instant for OfferDetail.valid_from / valid_until.
 * Full ISO timestamps use Date.parse (UTC-safe). Date-only YYYY-MM-DD is
 * interpreted as the start or end of that calendar day in Asia/Kolkata so a
 * naive UTC midnight parse cannot expire an offer hours early in Jaipur.
 */
function parseOfferBoundMs(value: string | null | undefined, bound: "start" | "end"): number | null {
  const raw = trimPublicText(value);
  if (!raw) return null;
  const dateOnly = OFFER_DATE_ONLY.exec(raw);
  if (dateOnly) {
    const y = Number(dateOnly[1]);
    const mo = Number(dateOnly[2]);
    const d = Number(dateOnly[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    const utcGuess = Date.UTC(y, mo - 1, d, bound === "start" ? 0 : 23, bound === "start" ? 0 : 59, bound === "start" ? 0 : 59, bound === "start" ? 0 : 999);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: OFFER_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(utcGuess));
    const num = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const shown = Date.UTC(num("year"), num("month") - 1, num("day"), num("hour"), num("minute"), num("second"));
    if (!Number.isFinite(shown)) return null;
    return utcGuess + (utcGuess - shown);
  }
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

function formatOfferDate(value: string | null | undefined): string | null {
  const ms = parseOfferBoundMs(value, "start");
  if (ms == null) return null;
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: OFFER_TZ });
}

type OfferWindow = "open" | "scheduled" | "expired" | "undated" | "invalid";

/** Window from valid_from / valid_until only. No invented status enum. */
function offerWindowState(offer: OfferDetail, nowMs = Date.now()): OfferWindow {
  const fromRaw = trimPublicText(offer.valid_from);
  const untilRaw = trimPublicText(offer.valid_until);
  const fromMs = parseOfferBoundMs(offer.valid_from, "start");
  const untilMs = parseOfferBoundMs(offer.valid_until, "end");
  if ((fromRaw && fromMs == null) || (untilRaw && untilMs == null)) return "invalid";
  if (untilMs != null && nowMs > untilMs) return "expired";
  if (fromMs != null && nowMs < fromMs) return "scheduled";
  if (fromMs == null && untilMs == null) return "undated";
  return "open";
}

/** Trusted public remaining count only. Null means the RPC did not supply one. */
function offerRemainingGlobal(offer: OfferDetail): number | null {
  if (offer.remaining_global == null) return null;
  const remaining = Number(offer.remaining_global);
  if (!Number.isFinite(remaining)) return null;
  return remaining;
}

/** Exhausted only when remaining_global is a trusted finite count of 0. */
function offerIsExhausted(offer: OfferDetail): boolean {
  const remaining = offerRemainingGlobal(offer);
  return remaining === 0;
}

/**
 * Public homepage cards stay generic. There is no authenticated offer-eligibility
 * RPC in this repository — do not infer "eligible for you" from session, membership,
 * or booking history.
 */
function isRenderableOffer(offer: OfferDetail): boolean {
  if (!trimPublicText(offer.offer_id)) return false;
  if (offer.remaining_global != null && offerRemainingGlobal(offer) == null) return false;
  if (offerRemainingGlobal(offer) != null && offerRemainingGlobal(offer)! < 0) return false;
  const windowState = offerWindowState(offer);
  if (windowState === "expired" || windowState === "invalid") return false;
  if (offerIsExhausted(offer)) return false;
  return true;
}

/**
 * Existing production rule: percent → "{n}% OFF"; any other type with a
 * positive finite value is rupees via money(value * 100). Unknown/empty type
 * follows that same existing non-percent presentation. Invalid numbers omitted.
 */
function formatOfferDiscount(offer: OfferDetail): string | null {
  const value = Number(offer.discount_value);
  if (!Number.isFinite(value) || value <= 0) return null;
  const kind = trimPublicText(offer.discount_type).toLowerCase();
  if (kind === "percent") return `${value}% OFF`;
  return `${money(value * 100)} OFF`;
}

function formatOfferDiscountSpoken(offer: OfferDetail): string | null {
  const value = Number(offer.discount_value);
  if (!Number.isFinite(value) || value <= 0) return null;
  const kind = trimPublicText(offer.discount_type).toLowerCase();
  if (kind === "percent") return `${value} percent off`;
  return `${money(value * 100)} off`;
}

function formatOfferValidity(offer: OfferDetail, window: OfferWindow): string | null {
  const from = formatOfferDate(offer.valid_from);
  const until = formatOfferDate(offer.valid_until);
  if (window === "scheduled" && from) return `Starts ${from}`;
  if (from && until) return `Valid from ${from} till ${until}`;
  if (until) return `Valid till ${until}`;
  if (from) return `Valid from ${from}`;
  return null;
}

function offerServiceNames(offer: OfferDetail): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const service of offer.eligible_services ?? []) {
    const name = trimPublicText(service?.service_name);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    names.push(name);
  }
  return names;
}



/**
 * Section 13 — Best Offers. Consolidates the previous homepage Active Offers
 * strip (stable id=best-offers). Cards map marketplace_offers rows in backend
 * order via OfferDetail. PHASE1_SECTION13.md.
 */
const SECTION13_SKELETON_KEYS = ["one", "two", "three"] as const;

function Section13OfferSkeletons() {
  return (
    <div className="section13-offers-grid section13-skeleton-grid" aria-hidden="true">
      {SECTION13_SKELETON_KEYS.map((key) => (
        <div className="service-card section13-offer-card section13-offer-skeleton" key={`offer-skeleton-${key}`}>
          <div><span /><span /><span /><span /></div>
          <div><span /><span /></div>
        </div>
      ))}
    </div>
  );
}

function BestOffersSection({
  offers,
  loading,
  error = false,
  online = true,
  onRetry,
  navigate,
}: {
  offers: OfferDetail[];
  loading: boolean;
  error?: boolean;
  online?: boolean;
  onRetry?: () => void;
  navigate: (path: string) => void;
}) {
  const renderableOffers = useMemo(() => {
    const rows: OfferDetail[] = [];
    for (const offer of offers) {
      if (!isRenderableOffer(offer)) continue;
      rows.push(offer);
      if (rows.length >= MARKETPLACE_OFFERS_LIMIT) break;
    }
    return rows;
  }, [offers]);
  const count = renderableOffers.length;
  const status = !online
    ? count
      ? `${count} saved offer result${count === 1 ? "" : "s"} available. Live offers update nahi kiye ja sakte.`
      : "Aap offline hain. Live offers update nahi kiye ja sakte."
    : loading && !count
      ? "Best offers load ho rahe hain."
      : error && !count
        ? "Offers load nahi ho sake. Dobara try karein."
        : count
          ? error
            ? `${count} pehle load kiye gaye offer result available hain. Update nahi ho saka.`
            : loading
              ? `${count} offer result available hain. Results refresh ho rahe hain.`
              : `${count} offer result available hain.`
          : "Abhi koi active Best Offer available nahi hai.";

  return (
    <section id="best-offers" aria-labelledby="best-offers-heading" className="section section13 scroll-mt-24">
      <div className="section-heading">
        <span className="eyebrow">Offers</span>
        <h2 id="best-offers-heading">Active Offers</h2>
        <p>From offers table where is_active=true – RLS public read. Shows discount_type, discount_value.</p>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {count ? (
        <>
          {!online && <p className="saved-results-label">Saved results</p>}
          {online && error && <p className="saved-results-label">Previously loaded results</p>}
          {!online && <p className="section13-data-note">Aap offline hain. Saved results dikhaye ja rahe hain; inhe current live offers na samjhein.</p>}
          {online && error && (
            <div className="section13-inline-state" role="alert">
              <span>Offers refresh nahi ho sake. Pehle load kiye gaye results available hain.</span>
              {onRetry && (
                <button type="button" className="secondary compact" aria-label="Dobara Try Karein" onClick={() => void onRetry()}>
                  Dobara Try Karein
                </button>
              )}
            </div>
          )}
          {online && loading && <p className="section13-data-note" role="status">Results refresh ho rahe hain; available offers visible rahenge.</p>}
          <div className="section13-offers-grid">{renderableOffers.map((o) => <OfferDetailCard key={o.offer_id} offer={o} navigate={navigate} />)}</div>
        </>
      ) : !online ? (
        <div className="state-card" role="status">
          <span aria-hidden="true">✦</span>
          <h3>Aap offline hain. Live offers update nahi kiye ja sakte.</h3>
          <p>Internet reconnect hone par live Best Offers dobara load honge.</p>
          <div className="button-row">
            <button type="button" className="secondary" onClick={() => navigate("/salons")}>View All Salons</button>
          </div>
        </div>
      ) : loading ? (
        <Section13OfferSkeletons />
      ) : error ? (
        <div className="state-card" role="alert">
          <span aria-hidden="true">✦</span>
          <h3>Offers load nahi ho sake. Dobara try karein.</h3>
          <p>Live marketplace offers abhi available nahi hain.</p>
          <div className="button-row">
            {onRetry && (
              <button type="button" className="secondary" aria-label="Dobara Try Karein" onClick={() => void onRetry()}>
                Dobara Try Karein
              </button>
            )}
            <button type="button" className="secondary" onClick={() => navigate("/salons")}>View All Salons</button>
          </div>
        </div>
      ) : (
        <div className="state-card" role="status">
          <span aria-hidden="true">✦</span>
          <h3>Abhi koi active Best Offer available nahi hai.</h3>
          <p>Approved, in-date offers from published salons appear here when they are available.</p>
          <div className="button-row">
            <button type="button" className="secondary" onClick={() => navigate("/salons")}>View All Salons</button>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * The public aggregate does not expose a review status, moderation state, or
 * review id. It is therefore the only publication boundary for Section 14:
 * this adapter never queries a direct review table or attempts to recreate
 * moderation, verified-booking, or featured-review logic in the browser.
 */
function hasRenderableMarketplaceReview(review: MarketplaceRecentReview): boolean {
  // `customer_reviews.rating` is an integer constrained to the inclusive 1–5
  // range. Invalid aggregate rows fail closed instead of receiving invented
  // text/rating fallback values. Text and author remain untouched when shown.
  return typeof review.comment === "string"
    && review.comment.trim().length > 0
    && typeof review.author === "string"
    && Number.isInteger(review.rating)
    && review.rating >= 1
    && review.rating <= 5;
}

/**
 * Convert only fields explicitly present in the existing public
 * marketplace_salon_stats response into the homepage view model. The source
 * has no global-review endpoint or review id, so it is traversed exactly in
 * RPC-row order and then each source recent_reviews array order. No frontend
 * sort, synthetic identity, avatar, or verification label is added.
 */
function adaptMarketplaceReviews(
  statsRows: readonly SalonStats[],
  salonReferences: ReadonlyMap<string, PublicSalonReviewReference>,
): CustomerReviewCardData[] {
  const rows: CustomerReviewCardData[] = [];
  // No backend review ID is available. Deduplicate only byte-for-byte repeated
  // public aggregate rows caused by frontend composition; this does not rank,
  // filter sentiment, or change the first occurrence's source order.
  const seenSourceRows = new Set<string>();
  for (const stats of statsRows) {
    const salon = salonReferences.get(stats.salon_id);
    if (!salon || !trimPublicText(salon.name) || !isSafeSalonSlug(salon.slug)) continue;
    for (const review of stats.recent_reviews ?? []) {
      if (!hasRenderableMarketplaceReview(review)) continue;
      const sourceKey = [stats.salon_id, review.created_at, review.author, review.rating, review.comment].join("\u0000");
      if (seenSourceRows.has(sourceKey)) continue;
      seenSourceRows.add(sourceKey);
      rows.push({
        sourceKey,
        salonName: salon.name,
        salonSlug: salon.slug,
        rating: review.rating,
        text: review.comment,
        displayName: review.author,
        reviewDate: review.created_at,
      });
      if (rows.length >= SECTION14_REVIEW_LIMIT) return rows;
    }
  }
  return rows;
}

/**
 * Section 14 — Customer Reviews. This is the existing homepage review feed
 * extracted from HomePage, not a second review query. It consumes the
 * public-safe adapter above and never reads customer_reviews, reviews,
 * profiles, bookings, or auth.users directly.
 */
function CustomerReviewsSection({
  reviews,
  loading,
  error = false,
  online = true,
  onRetry,
  navigate,
}: {
  reviews: readonly CustomerReviewCardData[];
  loading: boolean;
  error?: boolean;
  online?: boolean;
  onRetry?: () => void;
  navigate: (path: string) => void;
}) {
  const count = reviews.length;
  const status = !online
    ? count
      ? `${count} previously loaded customer review${count === 1 ? "" : "s"} available. Live review updates are unavailable while offline.`
      : "You are offline. Live customer reviews cannot load."
    : loading && !count
      ? "Customer reviews are loading."
      : error && !count
        ? "Customer reviews could not load. Try again."
        : count
          ? `${count} customer review${count === 1 ? "" : "s"} available.`
          : "No public customer reviews are available.";

  return (
    <section id="customer-reviews" aria-labelledby="customer-reviews-heading" className="section section14 scroll-mt-24">
      <div className="section-heading section14-heading">
        <span className="eyebrow">CUSTOMER REVIEWS</span>
        <h2 id="customer-reviews-heading">Customers Nexora Ke Baare Mein Kya Kehte Hain</h2>
        <p>Real customers ke genuine experiences aur ratings dekhein.</p>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {count ? (
        <>
          {!online && <p className="saved-results-label">Previously loaded results</p>}
          {online && error && <p className="saved-results-label">Previously loaded results</p>}
          {!online && <p className="section-hint">You are offline. These review results may not be current.</p>}
          {online && error && (
            <div className="section14-inline-state" role="alert">
              <span>Customer reviews could not refresh. Previously loaded results are still shown.</span>
              {onRetry && <button type="button" className="secondary compact" onClick={() => void onRetry()}>Try again</button>}
            </div>
          )}
          <div className="section14-reviews-grid">
            {reviews.map((review) => {
              const reviewDate = formatOfferDate(review.reviewDate);
              return (
                <article className="section14-review-card" key={review.sourceKey}>
                  <div className="section14-review-card-main">
                    <div className="section14-review-meta">
                      <h3>{review.salonName}</h3>
                      <span
                        className="section14-review-rating"
                        role="img"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        <span aria-hidden="true">★</span>
                        <span aria-hidden="true">{review.rating}</span>
                      </span>
                    </div>
                    <blockquote className="section14-review-text">
                      <p>{review.text}</p>
                    </blockquote>
                    {(review.displayName || reviewDate) && (
                      <footer className="section14-review-footer">
                        {review.displayName && <span className="section14-review-author">{review.displayName}</span>}
                        {reviewDate && <time dateTime={review.reviewDate}>{reviewDate}</time>}
                      </footer>
                    )}
                  </div>
                  <button type="button" className="text-button section14-review-action" onClick={() => navigate(`/salons/${review.salonSlug}`)}>View salon</button>
                </article>
              );
            })}
          </div>
        </>
      ) : !online ? (
        <StateCard title="You are offline" text="Reconnect to load public customer reviews." />
      ) : loading ? (
        <SalonSkeletons count={3} />
      ) : error ? (
        <StateCard title="Customer reviews could not load" text="Try again to load public customer reviews." action="Try again" onAction={onRetry} />
      ) : (
        <StateCard title="No customer reviews yet" text="Public customer reviews will appear here when they are available." />
      )}
    </section>
  );
}

function OfferDetailCard({ offer, navigate }: { offer: OfferDetail; navigate: (path: string) => void }) {
  const title = trimPublicText(offer.name) || "Offer";
  const salonName = trimPublicText(offer.salon_name);
  const salonSlug = trimPublicText(offer.salon_slug);
  const canOpenSalon = isSafeSalonSlug(salonSlug);
  const description = trimPublicText(offer.description);
  const terms = trimPublicText(offer.terms);
  const coupon = trimPublicText(offer.code);
  const discountLabel = formatOfferDiscount(offer);
  const discountSpoken = formatOfferDiscountSpoken(offer);
  const maxCapPaise = Number(offer.maximum_discount_paise);
  const maxCap = Number.isFinite(maxCapPaise) && maxCapPaise > 0 ? `up to ${money(maxCapPaise)} off` : null;
  const minSpendPaise = Number(offer.minimum_booking_paise);
  const minSpend = Number.isFinite(minSpendPaise) && minSpendPaise > 0 ? `Minimum spend ${money(minSpendPaise)}` : null;
  const services = offerServiceNames(offer);
  const offerWindow = offerWindowState(offer);
  const validity = formatOfferValidity(offer, offerWindow);
  const salonId = trimPublicText(offer.salon_id);
  const bookingServiceName = services.length === 1 ? services[0] : undefined;
  const bookingPath = marketplaceBookingPath(salonId, salonSlug, bookingServiceName);
  const canBookNow = Boolean(bookingPath) && (offerWindow === "open" || offerWindow === "undated");
  const openSalon = () => { if (canOpenSalon) navigate(`/salons/${salonSlug}`); };
  const openBooking = () => { if (canBookNow && bookingPath) navigate(bookingPath); };
  const [copyNote, setCopyNote] = useState("");
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const copyCoupon = async (event?: { stopPropagation: () => void }) => {
    event?.stopPropagation();
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon);
      setCopyNote("Code copied");
    } catch {
      setCopyNote("Could not copy code");
    }
    if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopyNote(""), 2000);
  };

  return (
    <article className="service-card section13-offer-card">
      <div>
        <div className="salon-meta section13-status-row">
          {discountLabel && <span className="section13-discount" aria-label={discountSpoken ?? undefined}>{discountLabel}</span>}
          {offerWindow === "scheduled" ? <span>Starts later</span> : null}
          {offer.membership_only ? <span>Members only</span> : null}
        </div>
        <h3>{title}</h3>
        {salonName ? <p>{salonName}</p> : null}
        {description ? <p>{description}</p> : null}
        {(maxCap || minSpend) && (
          <small>
            {maxCap}
            {maxCap && minSpend ? " · " : ""}
            {minSpend}
          </small>
        )}
        {services.length > 0 && <small>On: {services.join(", ")}</small>}
        {terms ? <small>Terms: {terms}</small> : null}
        {validity ? <small>{validity}</small> : null}
        {coupon ? (
          <div className="section13-coupon">
            <small className="section13-code">Code: {coupon}</small>
            <button
              type="button"
              className="secondary compact"
              aria-label={`Copy coupon code ${coupon}`}
              onClick={() => void copyCoupon()}
            >
              Copy Code
            </button>
          </div>
        ) : null}
        <p className="sr-only">
          {offerWindow === "scheduled" ? "This offer starts later and is not available to book yet. " : ""}
          {offer.membership_only ? "This offer is restricted to members. " : ""}
          {minSpend ? `${minSpend}. ` : ""}
          {services.length > 0 ? "Valid on selected services. " : ""}
        </p>
        <p className="sr-only" role="status" aria-live="polite">{copyNote}</p>
        {copyNote ? <small className="section13-copy-note">{copyNote}</small> : null}
      </div>
      <div>
        <button
          type="button"
          className="text-button"
          disabled={!canOpenSalon}
          aria-label={salonName ? `View salon ${salonName}` : "View salon"}
          onClick={openSalon}
        >
          View Salon
        </button>
        <button
          type="button"
          className="primary section13-book"
          disabled={!canBookNow}
          aria-label={
            offerWindow === "scheduled"
              ? (salonName ? `Booking not available yet at ${salonName}` : "Booking not available yet")
              : bookingServiceName && salonName
                ? `Book ${bookingServiceName} at ${salonName}`
                : salonName
                  ? `Book at ${salonName}`
                  : "Book now"
          }
          onClick={openBooking}
        >
          Book Now
        </button>
      </div>
    </article>
  );
}


// ---------------------------------------------------------------------------
// Section 03 — Smart Search helpers.
// "Open now" is computed from REAL owner-managed opening data: salon_hours
// rows for today, with the same website-config fallback the homepage
// OpenTodayStrip already uses. Salons with no opening data at all are
// treated as unknown and never marked open. All times are Asia/Kolkata.
// ---------------------------------------------------------------------------

/** Current minutes since midnight in Asia/Kolkata. */
function minutesNowIST(): number {
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return nowIST.getHours() * 60 + nowIST.getMinutes();
}

function parseClockMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const [h, m] = String(value).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** True when `now` falls inside the opens–closes window for the day. */
function isOpenAtMinutes(opens: string | null | undefined, closes: string | null | undefined, nowMinutes: number): boolean {
  const opensAt = parseClockMinutes(opens);
  const closesAt = parseClockMinutes(closes);
  if (opensAt == null || closesAt == null) return false;
  return nowMinutes >= opensAt && nowMinutes <= closesAt;
}

/**
 * Ids of the given published salons that are open RIGHT NOW.
 * Source of truth: salon_hours (today's row); fallback: the website config
 * opening_hours published with the salon proposal. No rows + no config ⇒
 * unknown ⇒ excluded. Never invents an "open" state.
 */
async function fetchOpenNowIds(client: SupabaseClient, items: Array<{ id: string; website: Website }>): Promise<Set<string>> {
  const open = new Set<string>();
  if (!items.length) return open;
  const nowMinutes = minutesNowIST();
  const today = new Date().getDay(); // JS 0=Sunday — same as Postgres day_of_week
  const { data, error } = await client
    .from("salon_hours")
    .select("salon_id,opens_at,closes_at,is_closed")
    .in("salon_id", items.map((item) => item.id))
    .eq("day_of_week", today);
  if (error) return open; // Unknown hours ⇒ nothing is claimed to be open.
  const todayHoursBySalon = new Map<string, { opens_at: string | null; closes_at: string | null; is_closed: boolean }>();
  for (const row of (data ?? []) as Array<{ salon_id: string; opens_at: string | null; closes_at: string | null; is_closed: boolean }>) {
    todayHoursBySalon.set(row.salon_id, row);
  }
  for (const item of items) {
    const hours = todayHoursBySalon.get(item.id);
    if (hours) {
      if (!hours.is_closed && isOpenAtMinutes(hours.opens_at, hours.closes_at, nowMinutes)) open.add(item.id);
      continue;
    }
    const cfg = (item.website.config as { profile?: { opening_hours?: { opens?: string; closes?: string } } })?.profile?.opening_hours;
    if (cfg?.opens && isOpenAtMinutes(cfg.opens, cfg.closes ?? null, nowMinutes)) open.add(item.id);
  }
  return open;
}

// ---------------------------------------------------------------------------
// Section 06 — Nearby Shops helpers.
// Everything reuses the existing live contracts: published catalog data,
// salon_hours (Asia/Kolkata), on-device Haversine distances from the shared
// location singleton, and the /salons parameter names. Nothing is faked:
// missing distance/rating/price/hours always render an honest fallback.
// ---------------------------------------------------------------------------

/** Weekday window check that safely handles midnight-crossing schedules. */
function isOpenWindowActiveIST(opens: string | null | undefined, closes: string | null | undefined): boolean | null {
  const opensAt = parseClockMinutes(opens);
  const closesAt = parseClockMinutes(closes);
  if (opensAt == null || closesAt == null) return null;
  const now = minutesNowIST();
  if (closesAt >= opensAt) return now >= opensAt && now <= closesAt;
  return now >= opensAt || now <= closesAt; // crosses midnight
}

/** Section 06 homepage display cap (spec: maximum 4–6 cards). */
const NEARBY_DISPLAY_LIMIT = 4;

type NearbyFilters = {
  radius: string;   // "", "nearest", "2", "5", "10"
  rating: string;   // "", "4.5", "4", "3.5"
  price: string;    // "", "50000", "100000", "200000" (existing /salons bands)
  gender: string;   // "", "unisex", "female", "male"
  openNow: boolean;
};
const NEARBY_FILTERS_EMPTY: NearbyFilters = { radius: "", rating: "", price: "", gender: "", openNow: false };

function countActiveNearbyFilters(f: NearbyFilters): number {
  return (f.radius ? 1 : 0) + (f.rating ? 1 : 0) + (f.price ? 1 : 0) + (f.gender ? 1 : 0) + (f.openNow ? 1 : 0);
}

/**
 * Quick-pick localities shown as tappable chips (mockup "Discovery
 * Navigation"). Every entry exists verbatim in JAIPUR_ZONES, so a chip sets
 * the exact same `nearbyArea` value as the area <select> — one source of
 * truth, identical filtering semantics.
 */
const NEARBY_QUICK_AREAS = ["Jhotwara", "Vaishali Nagar", "Malviya Nagar", "Mansarovar", "Raja Park", "C-Scheme", "Jagatpura"] as const;

/**
 * Gender hint derived from the business category text — the same documented
 * heuristic the /salons client-side path uses. Unknown stays null (neutral),
 * never deleted and never guessed as a specific gender.
 */
function genderHintFromCategory(category: string | null): "female" | "male" | "unisex" | null {
  const c = (category ?? "").toLowerCase();
  if (/unisex/.test(c)) return "unisex";
  if (/women|female|ladies/.test(c)) return "female";
  if (/men|male|gents/.test(c)) return "male";
  return null;
}

function nearbyGenderMatches(filter: string, category: string | null): boolean {
  if (!filter) return true;
  return genderHintFromCategory(category) === filter;
}

/** Honest rating copy — never a fake 5.0. */
function nearbyRatingCopy(rating: number | null | undefined, reviewCount: number | null | undefined): string | null {
  const r = Number(rating ?? 0);
  const n = Number(reviewCount ?? 0);
  if (!(r > 0) || !(n > 0)) return null;
  return `★ ${r.toFixed(1)} (${n})`;
}

/** Honest price copy using the existing currency utility. */
function nearbyPriceCopy(pricePaise: number | null | undefined): string {
  const p = typeof pricePaise === "number" && Number.isFinite(pricePaise) && pricePaise > 0 ? pricePaise : null;
  return p == null ? "View services for pricing" : `Starts from ${money(p)}`;
}

/**
 * Today's salon_hours rows for a set of salons (live, owner-managed).
 * Keyed by idsKey so the effect re-runs only when the visible set changes.
 */
function useTodayHours(online: boolean, ids: string[], idsKey: string) {
  const [hoursById, setHoursById] = useState<Record<string, { opens_at: string | null; closes_at: string | null; is_closed: boolean }>>({});
  const idsRef = useRef(ids);
  useEffect(() => { idsRef.current = ids; });
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const list = idsRef.current;
      if (!online || !list.length) { setHoursById({}); return; }
      try {
        const client = getClient();
        if (!client) { setHoursById({}); return; }
        const { data } = await client
          .from("salon_hours")
          .select("salon_id,opens_at,closes_at,is_closed")
          .in("salon_id", list)
          .eq("day_of_week", dayOfWeekIST());
        if (!active) return;
        const map: Record<string, { opens_at: string | null; closes_at: string | null; is_closed: boolean }> = {};
        for (const row of (data ?? []) as Array<{ salon_id: string; opens_at: string | null; closes_at: string | null; is_closed: boolean }>) {
          map[row.salon_id] = row;
        }
        setHoursById(map);
      } catch {
        if (active) setHoursById({});
      }
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [online, idsKey]);
  return hoursById;
}

/**
 * Open/closed for one published salon right now (Asia/Kolkata).
 * salon_hours first; published website-config hours as the same fallback the
 * OpenTodayStrip uses; null when no real hours exist ("Hours unavailable").
 */
function salonOpenState(item: CatalogItem, hours: { opens_at: string | null; closes_at: string | null; is_closed: boolean } | undefined): boolean | null {
  if (hours) {
    if (hours.is_closed) return false;
    return isOpenWindowActiveIST(hours.opens_at, hours.closes_at);
  }
  const cfg = (item.website.config as { profile?: { opening_hours?: { opens?: string; closes?: string } } })?.profile?.opening_hours;
  if (cfg?.opens) return isOpenWindowActiveIST(cfg.opens, cfg.closes ?? null);
  return null;
}

/**
 * Verified badge with an accessible tooltip. Meaning is only the backend
 * truth (published/approved profile) — no licence/government claims.
 * Hover, focus, click/tap toggle; Escape and outside click close it.
 */
function VerifiedBadge({ salonName }: { salonName: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const onPointer = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onPointer); };
  }, [open]);
  return (
    <span className="verified-badge-wrap" ref={wrapRef}>
      <button
        type="button"
        className="verified-badge focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]"
        aria-expanded={open}
        aria-label={`Verified: ${salonName}. What does this mean?`}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        ✓ Verified
      </button>
      {open && (
        <span role="tooltip" className="verified-tooltip">
          This salon profile is approved for publishing on Nexora.
        </span>
      )}
    </span>
  );
}

type NearbyShopRow = { item: CatalogItem; distanceKm: number | null };

/**
 * Section 06 salon card — real published data only. Every field has an
 * honest fallback (Distance unavailable / No ratings yet / View services for
 * pricing / Hours unavailable). No coordinates are ever rendered.
 */
function NearbyShopCard({
  row,
  openState,
  navigate,
}: {
  row: NearbyShopRow;
  openState: boolean | null;
  navigate: (path: string) => void;
}) {
  const { item, distanceKm } = row;
  const cover = item.cover_image_path?.startsWith("http") ? item.cover_image_path : null;
  const rating = nearbyRatingCopy(item.rating_average, item.review_count);
  const gender = genderHintFromCategory(item.business_category);
  const openLabel = openState === null ? "Hours unavailable" : openState ? "Open now" : "Closed now";
  const ratingValue = Number(item.rating_average ?? 0);
  const reviewCount = Number(item.review_count ?? 0);
  const hasRating = ratingValue > 0 && reviewCount > 0;
  return (
    <article className="salon-card nearby-card nx-salon-card">
      <div
        className="salon-visual nx-salon-visual"
        role="img"
        aria-label={`${item.name} salon photo`}
        style={cover ? { backgroundImage: `url("${cover.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {!cover && <span aria-hidden="true">✦</span>}
        <span className="nx-verified-chip"><span aria-hidden="true">✓</span> Verified</span>
        {hasRating && (
          <span className="nx-rating-chip" aria-label={`${ratingValue.toFixed(1)} out of 5, ${reviewCount} review${reviewCount === 1 ? "" : "s"}`}>
            <span aria-hidden="true" className="nx-rating-star">★</span> {ratingValue.toFixed(1)} <span className="nx-rating-count">({reviewCount})</span>
          </span>
        )}
      </div>
      <div className="salon-body nx-salon-body">
        <h3>{item.name}</h3>
        <div className="nx-info-row">
          <span className="nx-info-item"><span aria-hidden="true" className="nx-info-icon">📍</span><span className="nx-info-text">{item.area ?? item.city}, {item.city}{gender ? ` · ${gender === "female" ? "Women" : gender === "male" ? "Men" : "Unisex"}` : ""}</span></span>
          <span className="nx-info-right">{distanceKm != null ? `📍 ${formatDistance(distanceKm)} away` : "Distance unavailable"}</span>
        </div>
        <div className="nx-info-row">
          <span className="nx-info-item"><span aria-hidden="true" className="nx-info-icon">₹</span><span className="nx-info-text">{nearbyPriceCopy(item.starting_price_paise)}</span></span>
          {openState === true
            ? <span className="nx-open-chip"><span aria-hidden="true" className="nx-pulse-dot" /> Open Now</span>
            : openState === false
              ? <span className="nx-closed-chip"><span aria-hidden="true">●</span> Closed</span>
              : <span className="nx-info-right">{openLabel}</span>}
        </div>
        <div className="salon-meta nx-rating-line">
          <span>{rating ?? "No ratings yet"}</span>
          <VerifiedBadge salonName={item.name} />
        </div>
        <div className="premium-salon-actions nx-card-actions">
          <button type="button" className="premium-view-button" disabled={!item.website.slug} onClick={() => item.website.slug && navigate(`/salons/${item.website.slug}`)}>View Salon</button>
          <button type="button" className="premium-book-now-button" disabled={!item.website.slug} onClick={() => item.website.slug && navigate(`/app/customer/?salon=${item.id}&returnTo=${encodeURIComponent(`/salons/${item.website.slug}`)}`)}>Book Now</button>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Section 07 — Open Now.
// Truth rule: a salon is shown ONLY when a valid hours record exists for the
// current Asia/Kolkata weekday, the day is not marked closed, and the current
// IST minute is inside the window (midnight-crossing safe). Missing/invalid
// hours never produce an open claim. One shared minute-level clock drives the
// whole section (never one timer per card); live results refresh as time
// passes and the timer is cleaned up on unmount.
// ---------------------------------------------------------------------------

/** Section 07 homepage display cap (spec: maximum 4–6 open salons). */
const OPEN_NOW_DISPLAY_LIMIT = 6;

/**
 * Shared Asia/Kolkata minute clock. Aligns to the next minute boundary, then
 * ticks once per minute; re-syncs when the tab becomes visible; cleans up on
 * unmount. Returns null until the first client tick so SSR/first render never
 * prints a time-dependent Open Now claim (no hydration mismatch).
 */
function useMinutesNowIST(): number | null {
  const [minutes, setMinutes] = useState<number | null>(null);
  useEffect(() => {
    let interval: number | null = null;
    const tick = () => setMinutes(minutesNowISTShared());
    tick();
    const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
    const align = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 60_000);
    }, msUntilNextMinute);
    const onVisibility = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(align);
      if (interval != null) window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return minutes;
}

/** Config-published opening hours fallback (same contract Section 06 uses). */
function configOpeningHours(item: CatalogItem): { opens_at: string | null; closes_at: string | null; is_closed: boolean } | null {
  const cfg = (item.website.config as { profile?: { opening_hours?: { opens?: string; closes?: string } } })?.profile?.opening_hours;
  if (cfg?.opens) return { opens_at: cfg.opens, closes_at: cfg.closes ?? null, is_closed: false };
  return null;
}

/** "Check Nearby Shops" — smooth-scroll to Section 06 (reduced-motion aware). */
function scrollToNearbyShops(event?: { preventDefault: () => void }) {
  const target = document.getElementById("nearby-shops");
  if (!target) return;
  event?.preventDefault();
  let reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { reduced = false; }
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  window.history.replaceState(window.history.state, "", "#nearby-shops");
}

type OpenNowEntry = {
  item: CatalogItem;
  closesLabel: string | null;
  closingSoon: boolean;
  distanceKm: number | null;
};

/**
 * Section 07 card — a genuinely-open salon. The Open Now badge is always a
 * visible text label (never color-only), the closing time is real data only,
 * and offline cached rows never claim a live status.
 */
function OpenNowCard({ entry, navigate, offline }: { entry: OpenNowEntry; navigate: (path: string) => void; offline?: boolean }) {
  const { item, closesLabel, closingSoon, distanceKm } = entry;
  const cover = item.cover_image_path?.startsWith("http") ? item.cover_image_path : null;
  const rating = nearbyRatingCopy(item.rating_average, item.review_count);
  return (
    <article className="salon-card nearby-card">
      <div
        className="salon-visual"
        role="img"
        aria-label={`${item.name} salon photo`}
        style={cover ? { backgroundImage: `url("${cover.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {!cover && <span aria-hidden="true">✦</span>}
      </div>
      <div className="salon-body">
        <div className="salon-meta">
          <span>{item.business_category ?? "Salon"}</span>
          <span>{distanceKm != null ? `📍 ${formatDistance(distanceKm)} away` : "Distance unavailable"}</span>
        </div>
        <h3>{item.name}</h3>
        <p>{item.area ?? item.city}, {item.city}</p>
        <div className="open-now-badges">
          {offline ? (
            <span className="open-badge open-badge-offline">Status unavailable offline</span>
          ) : (
            <>
              <span className="open-badge">Open Now</span>
              {closesLabel && <span className="open-until">Open until {closesLabel}</span>}
              {closingSoon && <span className="closing-soon">Closing Soon</span>}
            </>
          )}
        </div>
        <div className="salon-meta">
          <span>{rating ?? "No ratings yet"}</span>
          <span>{nearbyPriceCopy(item.starting_price_paise)}</span>
        </div>
        <div className="salon-bottom">
          <VerifiedBadge salonName={item.name} />
        </div>
        <div className="button-row" style={{ marginTop: 10 }}>
          <button className="secondary compact" disabled={!item.website.slug} onClick={() => item.website.slug && navigate(`/salons/${item.website.slug}`)}>View Salon</button>
          <button className="secondary compact" disabled={!item.website.slug} onClick={() => item.website.slug && navigate(`/app/customer/?salon=${item.id}&returnTo=${encodeURIComponent(`/salons/${item.website.slug}`)}`)}>Book Now</button>
        </div>
      </div>
    </article>
  );
}

/**
 * Section 07 — Open Now section. Reuses Section 06's selected-area base and
 * the shared salon_hours fetch (no duplicate requests, no second GPS prompt):
 * Open Now calculation never depends on location permission.
 */
function OpenNowSection({
  online,
  baseLoading,
  catalogError,
  baseItems,
  hoursById,
  area,
  fixUsable,
  gpsFix,
  navigate,
}: {
  online: boolean;
  baseLoading: boolean;
  catalogError: string;
  baseItems: CatalogItem[];
  hoursById: Record<string, { opens_at: string | null; closes_at: string | null; is_closed: boolean }>;
  area: string;
  fixUsable: boolean;
  gpsFix: { latitude: number; longitude: number } | null;
  navigate: (path: string) => void;
}) {
  const minutes = useMinutesNowIST();
  const [sortMode, setSortMode] = useState<"default" | "nearest" | "rating">("default");
  const [priceBand, setPriceBand] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  // Honest open computation over the live area base — memoized on the minute.
  const { openEntries, anyHours } = useMemo(() => {
    let sawHours = false;
    const list: OpenNowEntry[] = [];
    if (minutes == null) return { openEntries: list, anyHours: false };
    for (const item of baseItems) {
      const hours = hoursById[item.id] ?? configOpeningHours(item);
      if (hours) sawHours = true;
      const verdict: OpenNowVerdict = openNowVerdict(hours, minutes);
      if (verdict.status !== "open") continue;
      const distanceKm = fixUsable && gpsFix && item.approval_status === "approved" &&
        typeof item.latitude === "number" && typeof item.longitude === "number"
        ? haversineKm(gpsFix.latitude, gpsFix.longitude, Number(item.latitude), Number(item.longitude))
        : null;
      list.push({ item, closesLabel: verdict.closesLabel, closingSoon: verdict.closingSoon, distanceKm });
    }
    // Default order: open+nearest first, then rating, reviews, live order.
    list.sort((a, b) => {
      const ad = a.distanceKm, bd = b.distanceKm;
      if (ad != null && bd != null && ad !== bd) return ad - bd;
      if (ad != null && bd == null) return -1;
      if (ad == null && bd != null) return 1;
      const ar = Number(a.item.rating_average ?? 0), br = Number(b.item.rating_average ?? 0);
      if (ar !== br) return br - ar;
      const an = Number(a.item.review_count ?? 0), bn = Number(b.item.review_count ?? 0);
      if (an !== bn) return bn - an;
      return 0;
    });
    return { openEntries: list, anyHours: sawHours };
  }, [baseItems, hoursById, minutes, fixUsable, gpsFix]);

  const filtersActive = sortMode !== "default" || priceBand !== "" || genderFilter !== "";

  const visibleEntries = useMemo(() => {
    let list = openEntries;
    if (sortMode === "nearest") {
      list = [...list].sort((a, b) => {
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return 0;
      });
    } else if (sortMode === "rating") {
      list = [...list].sort((a, b) =>
        Number(b.item.rating_average ?? 0) - Number(a.item.rating_average ?? 0) ||
        Number(b.item.review_count ?? 0) - Number(a.item.review_count ?? 0));
    }
    if (priceBand) {
      const maxPaise = Number(priceBand);
      list = list.filter((entry) =>
        typeof entry.item.starting_price_paise === "number" &&
        entry.item.starting_price_paise > 0 &&
        entry.item.starting_price_paise <= maxPaise);
    }
    if (genderFilter) {
      list = list.filter((entry) => nearbyGenderMatches(genderFilter, entry.item.business_category));
    }
    return list.slice(0, OPEN_NOW_DISPLAY_LIMIT);
  }, [openEntries, sortMode, priceBand, genderFilter]);

  const clearFilters = () => { setSortMode("default"); setPriceBand(""); setGenderFilter(""); };

  // "Change Area" hands over to Section 06's area selector (single source of
  // truth for manual location — no second selector, no duplicate state).
  const changeArea = () => {
    const select = document.querySelector('#nearby-shops select[aria-label="Jaipur area"]') as HTMLSelectElement | null;
    if (!select) return;
    let reduced = false;
    try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { reduced = false; }
    select.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    select.focus({ preventScroll: true });
  };

  // CTA → existing /salons route; the supported Open Now param is `open=1`.
  const openAllOpenSalons = () => {
    const params = new URLSearchParams();
    params.set("open", "1");
    if (area) params.set("area", area);
    if (priceBand) params.set("price", priceBand);
    if (genderFilter) params.set("gender", genderFilter);
    if (sortMode === "rating") params.set("sort", "rating");
    const qs = params.toString();
    navigate(qs ? `/salons?${qs}` : "/salons");
  };

  const statusLine = !online
    ? "Aap offline hain. Live Open Now status verify nahi kiya ja sakta."
    : minutes == null || baseLoading
      ? "Open salons check ho rahe hain…"
      : `${visibleEntries.length || openEntries.length} salon${openEntries.length === 1 ? "" : "s"} abhi open hain${area ? ` — ${area}` : " — Jaipur"} (Asia/Kolkata time).`;

  return (
    <section id="open-now" aria-labelledby="open-now-heading" className="section scroll-mt-24" style={{ background: "var(--cream)" }}>
      <div className="section-heading"><span className="eyebrow">Available now</span><h2 id="open-now-heading">Abhi Open Salons</h2><p>Current salon timings ke hisaab se abhi available salons explore karein.</p></div>
      <p className="nearby-status" role="status" aria-live="polite">{statusLine}</p>

      {/* Compact filters — Open Now is the mandatory core rule (not clearable). */}
      <div className="open-now-filters" role="group" aria-label="Open salon filters">
        <span className="open-now-mandatory">Open Now · required</span>
        <button type="button" className={`open-now-chip${sortMode === "nearest" ? " active" : ""}`} aria-pressed={sortMode === "nearest"} disabled={!fixUsable} onClick={() => setSortMode((m) => (m === "nearest" ? "default" : "nearest"))} title={fixUsable ? undefined : "Nearest sort ke liye Section 06 me location detect karein"}>Nearest</button>
        <button type="button" className={`open-now-chip${sortMode === "rating" ? " active" : ""}`} aria-pressed={sortMode === "rating"} onClick={() => setSortMode((m) => (m === "rating" ? "default" : "rating"))}>Top Rated</button>
        <select className="open-now-select" aria-label="Price" value={priceBand} onChange={(e) => setPriceBand(e.target.value)}>
          <option value="">Any price</option>
          <option value="50000">Under ₹500</option>
          <option value="100000">Under ₹1,000</option>
          <option value="200000">Under ₹2,000</option>
        </select>
        <button type="button" className={`open-now-chip${genderFilter === "unisex" ? " active" : ""}`} aria-pressed={genderFilter === "unisex"} onClick={() => setGenderFilter((g) => (g === "unisex" ? "" : "unisex"))}>Unisex</button>
        <button type="button" className={`open-now-chip${genderFilter === "female" ? " active" : ""}`} aria-pressed={genderFilter === "female"} onClick={() => setGenderFilter((g) => (g === "female" ? "" : "female"))}>Women</button>
        <button type="button" className={`open-now-chip${genderFilter === "male" ? " active" : ""}`} aria-pressed={genderFilter === "male"} onClick={() => setGenderFilter((g) => (g === "male" ? "" : "male"))}>Men</button>
        <button type="button" className="open-now-chip open-now-clear" onClick={clearFilters} disabled={!filtersActive}>Clear All</button>
      </div>

      {baseLoading || minutes == null ? (
        <div className="nearby-grid" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="salon-card skeleton"><div /><p /><p /><p /></div>)}
        </div>
      ) : !online ? (
        baseItems.length ? (
          <>
            <p className="saved-results-label">Saved results</p>
            <div className="nearby-grid">
              {baseItems.slice(0, OPEN_NOW_DISPLAY_LIMIT).map((item) => (
                <OpenNowCard key={item.id} offline entry={{ item, closesLabel: null, closingSoon: false, distanceKm: null }} navigate={navigate} />
              ))}
            </div>
          </>
        ) : (
          <div className="state-card"><span>✦</span><h3>Aap offline hain</h3><p>Aap offline hain. Live Open Now status verify nahi kiya ja sakta.</p><div className="button-row"><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button></div></div>
        )
      ) : catalogError && !baseItems.length ? (
        <div className="state-card"><span>✦</span><h3>Open salons load nahi ho sake</h3><p>Open salons load nahi ho sake. Dobara try karein.</p><div className="button-row"><button className="secondary" onClick={() => window.location.reload()}>Retry</button><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button></div></div>
      ) : baseItems.length && !anyHours ? (
        <div className="state-card"><span>✦</span><h3>Verified salon timings abhi available nahi hain</h3><p>Verified salon timings abhi available nahi hain.</p><div className="button-row"><button className="secondary" onClick={() => navigate("/salons")}>Sabhi Salons Dekhein</button></div></div>
      ) : filtersActive && !visibleEntries.length ? (
        <div className="state-card"><span>✦</span><h3>Selected filters ke saath abhi koi open salon nahi mila</h3><p>Selected filters ke saath abhi koi open salon nahi mila.</p><div className="button-row"><button className="secondary" onClick={clearFilters}>Clear Filters</button><button className="secondary" onClick={changeArea}>Change Area</button><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button></div></div>
      ) : !visibleEntries.length ? (
        <div className="state-card"><span>✦</span><h3>Is area mein abhi koi salon open nahi hai</h3><p>Is area mein abhi koi salon open nahi hai.</p><div className="button-row"><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button><button className="secondary" onClick={changeArea}>Change Area</button><button className="secondary" onClick={() => scrollToNearbyShops()}>Check Nearby Shops</button></div></div>
      ) : (
        <div className="nearby-grid">
          {visibleEntries.map((entry) => <OpenNowCard key={entry.item.id} entry={entry} navigate={navigate} />)}
        </div>
      )}

      <div className="categories-cta">
        <button type="button" className="primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]" onClick={openAllOpenSalons}>Sabhi Open Salons Dekhein</button>
      </div>
    </section>
  );
}

/** Section 11 display cap (spec: maximum 4–6 recommendations). */
const SMART_PICKS_DISPLAY_LIMIT = 6;

/**
 * Section 11 — AI Smart Picks (INTERNAL name).
 * (Renumbered from "Section 09" per locked MEMORY.md order — PHASE1_SECTION11.md.)
 *
 * Public label honesty: the existing recommendation contract is server-side
 * rule-based scoring (`marketplace_recommendations` RPC — SQL scoring, no
 * AI/ML model exists in this codebase), so the public UI says "Smart Picks"
 * and NEVER claims AI personalization.
 *
 * Modes: (1) Personalized — authenticated customer + trusted isPersonalized;
 * (2) Location-based — selected Section 08 (Nearby Shops) area rows; (3) Popular Jaipur —
 * generic ranking, never labelled personalized; (4) Limited data — existing
 * safe marketplace ranking labelled "Popular Picks".
 *
 * Privacy: only backend-provided reasons render (never invented); user ids
 * never reach the DOM/URLs; the hook clears personalized rows on session
 * change, so nothing leaks across users.
 */
function SmartPicksSection({
  online,
  authLoading,
  isCustomer,
  rows,
  loading,
  error,
  isPersonalized,
  onRefresh,
  fallbackItems,
  fallbackAllowed,
  area,
  items,
  fixUsable,
  gpsFix,
  navigate,
}: {
  online: boolean;
  authLoading: boolean;
  isCustomer: boolean;
  rows: RecommendationRow[];
  loading: boolean;
  error: string;
  isPersonalized: boolean;
  onRefresh: () => void;
  fallbackItems: CatalogItem[];
  fallbackAllowed: boolean;
  area: string;
  items: CatalogItem[];
  fixUsable: boolean;
  gpsFix: { latitude: number; longitude: number } | null;
  navigate: (path: string) => void;
}) {
  const minutes = useMinutesNowIST();

  // Duplicate prevention: same salon never twice; invalid ids dropped;
  // backend order preserved; capped for the homepage.
  const deduped = useMemo(() => {
    const seen = new Set<string>();
    const out: RecommendationRow[] = [];
    for (const row of rows) {
      if (!row || !row.id || seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
      if (out.length >= SMART_PICKS_DISPLAY_LIMIT) break;
    }
    return out;
  }, [rows]);

  // Mode 2 candidates: recommended rows in the Section 06 selected area.
  const areaRows = useMemo(() => {
    const needle = area.trim().toLowerCase();
    if (!needle) return [] as RecommendationRow[];
    return deduped.filter((row) =>
      (row.area ?? "").toLowerCase() === needle || (row.city ?? "").toLowerCase() === needle);
  }, [deduped, area]);

  // Mode 4 (limited data): existing safe deterministic marketplace ranking,
  // mapped onto the shared card shape — real fields only, nothing invented.
  const limitedRows = useMemo<RecommendationRow[]>(() => {
    if (!fallbackAllowed) return [];
    return fallbackItems.slice(0, SMART_PICKS_DISPLAY_LIMIT).map((item) => ({
      id: item.id,
      slug: item.website.slug,
      name: item.name,
      business_category: item.business_category,
      area: item.area,
      city: item.city,
      rating_avg: Number(item.rating_average ?? 0),
      review_count: Number(item.review_count ?? 0),
      booking_count: 0,
      starting_price_paise: item.starting_price_paise,
      cover_image_path: item.cover_image_path,
      score: 0,
      reason: "",
      personalized: false,
    }));
  }, [fallbackItems, fallbackAllowed]);

  const mode: "personalized" | "location" | "popular" | "limited" =
    isCustomer && isPersonalized && deduped.length > 0 ? "personalized"
      : !isPersonalized && areaRows.length > 0 ? "location"
        : deduped.length > 0 ? "popular"
          : limitedRows.length > 0 ? "limited"
            : "popular";

  const displayRows = mode === "personalized" ? deduped
    : mode === "location" ? areaRows.slice(0, SMART_PICKS_DISPLAY_LIMIT)
      : mode === "limited" ? limitedRows
        : deduped;

  // Section 09 (Open Now) hours contract + Section 08 (Nearby Shops) location state reused.
  const displayIdsKey = displayRows.map((row) => row.id).join(",");
  const hoursById = useTodayHours(online && !loading, displayRows.map((row) => row.id), displayIdsKey);
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const distanceFor = (rowId: string): number | null => {
    if (!fixUsable || !gpsFix) return null;
    const item = itemsById.get(rowId);
    if (!item || item.approval_status !== "approved" || typeof item.latitude !== "number" || typeof item.longitude !== "number") return null;
    return haversineKm(gpsFix.latitude, gpsFix.longitude, Number(item.latitude), Number(item.longitude));
  };
  const openLabelFor = (rowId: string): string => {
    if (!online || minutes == null) return "Timings unavailable";
    const item = itemsById.get(rowId);
    const hours = hoursById[rowId] ?? (item ? configOpeningHours(item) : null);
    if (!hours) return "Timings unavailable";
    const verdict: OpenNowVerdict = openNowVerdict(hours, minutes);
    return verdict.status === "open" ? "Open now" : verdict.status === "closed" ? "Closed now" : "Timings unavailable";
  };

  const heading = mode === "personalized"
    ? { eyebrow: "Smart picks for you", title: "Aapke Liye Recommended", copy: "Aapki preferences, selected location aur Nexora activity ke आधार पर relevant salons explore करें।" }
    : mode === "location"
      ? { eyebrow: "Smart picks near you", title: "Aapke Area Ke Smart Picks", copy: "Aapke selected area ke popular published salons — real ratings aur reviews ke saath." }
      : { eyebrow: "Popular picks", title: "Nexora Par Popular Salons", copy: "Jaipur में customers द्वारा पसंद किए जा रहे published salons explore करें।" };

  const statusLine = authLoading || loading
    ? "Smart picks load ho rahe hain…"
    : !online
      ? "Aap offline hain. Live recommendations update nahi ki ja sakti."
      : displayRows.length === 0
        ? ""
        : mode === "personalized"
          ? `${displayRows.length} recommendations aapke liye ready hain.`
          : mode === "location"
            ? `${displayRows.length} popular salons ${area} mein.`
            : `${displayRows.length} popular picks — generic ranking, personalized claim nahin.`;

  const viewAll = () => navigate(mode === "personalized" ? "/salons" : "/salons?sort=popularity");

  return (
    <section id="smart-picks" aria-labelledby="smart-picks-heading" className="section scroll-mt-24">
      <div className="smart-picks-header-row">
        <div className="section-heading"><span className="eyebrow">{heading.eyebrow}</span><h2 id="smart-picks-heading">{heading.title}</h2><p>{heading.copy}</p></div>
        <div className="smart-picks-actions">
          <button type="button" className="secondary compact nx-refresh-button focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]" onClick={onRefresh} disabled={authLoading || loading}>Refresh Picks</button>
        </div>
      </div>
      {statusLine && <p className="nearby-status" role="status" aria-live="polite">{statusLine}</p>}

      {/* Curated intro (mockup "Handpicked for you" glass card) — copy only;
          every claim stays mode-honest (rule-based, never AI). */}
      <div className="nx-handpicked-card">
        <span className="nx-handpicked-icon" aria-hidden="true">♥</span>
        <div className="nx-handpicked-copy">
          <h3>{mode === "personalized" ? "Picked for you" : "Handpicked for you"}</h3>
          <p>{mode === "personalized"
            ? "Aapki Nexora activity aur preferences ke basis par selected salons — personalized picks, rule-based ranking se."
            : "Popular ratings, activity aur marketplace signals ke basis par selected salons explore karein."}</p>
        </div>
      </div>

      {authLoading || loading ? (
        displayRows.length > 0 && !authLoading ? (
          /* Refreshing: keep previous valid results visible (no unnecessary
             disappearance), skeletons only when nothing is on screen. */
          <div className="nearby-grid">
            {displayRows.map((row) => (
              <RecommendationCard key={row.id} row={row} navigate={navigate} showReason={mode === "personalized"} pickChip={mode === "personalized" ? undefined : "🔥 Popular Pick"} reasonOverride={mode === "location" ? `Popular in ${area}` : undefined} distanceKm={distanceFor(row.id)} openLabel={openLabelFor(row.id)} />
            ))}
          </div>
        ) : (
          <div className="nearby-grid" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="salon-card skeleton"><div /><p /><p /><p /></div>)}
          </div>
        )
      ) : !online ? (
        displayRows.length ? (
          <>
            <p className="saved-results-label">Saved picks</p>
            <div className="nearby-grid">
              {displayRows.map((row) => (
                <RecommendationCard key={row.id} row={row} navigate={navigate} showReason={mode === "personalized"} pickChip={mode === "personalized" ? undefined : "🔥 Popular Pick"} reasonOverride={mode === "location" ? `Popular in ${area}` : undefined} distanceKm={distanceFor(row.id)} openLabel="Timings unavailable" />
              ))}
            </div>
          </>
        ) : (
          <div className="state-card"><span>✦</span><h3>Aap offline hain</h3><p>Aap offline hain. Live recommendations update nahi ki ja sakti.</p><div className="button-row"><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button></div></div>
        )
      ) : error && !displayRows.length ? (
        <div className="state-card"><span>✦</span><h3>Smart picks load nahi ho sake</h3><p>Smart picks load nahi ho sake. Dobara try karein.</p><div className="button-row"><button className="secondary" onClick={onRefresh}>Retry</button><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button></div></div>
      ) : !displayRows.length ? (
        isCustomer ? (
          <div className="state-card"><span>✦</span><h3>Aapke liye recommendations banane ke liye abhi enough activity nahi hai</h3><p>Aapke liye recommendations banane ke liye abhi enough activity nahi hai.</p><div className="button-row"><button className="secondary" onClick={() => navigate("/salons")}>Explore Salons</button><button className="secondary" onClick={() => scrollToCategoriesSection()}>Browse Categories</button></div></div>
        ) : (
          <div className="state-card"><span>✦</span><h3>Recommended salons abhi available nahi hain</h3><p>Recommended salons abhi available nahi hain.</p><div className="button-row"><button className="secondary" onClick={() => navigate("/salons")}>View All Salons</button><button className="secondary" onClick={() => scrollToCategoriesSection()}>Explore Categories</button></div></div>
        )
      ) : (
        <>
          {isCustomer && !isPersonalized && <p className="saved-results-label">Popular Picks</p>}
          <div className="nearby-grid">
            {displayRows.map((row) => (
              <RecommendationCard key={row.id} row={row} navigate={navigate} showReason={mode === "personalized"} pickChip={mode === "personalized" ? undefined : "🔥 Popular Pick"} reasonOverride={mode === "location" ? `Popular in ${area}` : undefined} distanceKm={distanceFor(row.id)} openLabel={openLabelFor(row.id)} />
            ))}
          </div>
        </>
      )}

      <div className="categories-cta">
        <button type="button" className="primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]" onClick={viewAll}>{mode === "personalized" ? "Aur Recommendations Dekhein" : "Popular Salons Dekhein"}</button>
      </div>
    </section>
  );
}

function CatalogPage({ navigate, online }: { navigate: (path: string) => void; online: boolean }) {
  // ---- Smart search state ----
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [offerOnly, setOfferOnly] = useState(false);
  const [genderFilter, setGenderFilter] = useState("");
  const [sortBy, setSortBy] = useState<"relevance"|"rating"|"popularity"|"price"|"availability"|"name">("relevance");
  // Section 03 — manual city selection + GPS-backed distance & Open Now.
  const [cityFilter, setCityFilter] = useState("");
  const [distanceKm, setDistanceKm] = useState(""); // "", "2", "5", "10"
  const [openNow, setOpenNow] = useState(false);
  const [results, setResults] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]"); } catch { return []; }
  });

  // Section 03 GPS: OBSERVE only (`auto: false`) — the /salons page never
  // requests location permission by itself. Acquisition starts exclusively
  // from the user's click on "Use my location" (location.start() below) or
  // the homepage "Salons near me" action.
  const location = useLocation({ auto: false });
  const gpsFix = location.fix;
  const insideJaipur = isInsideJaipur(gpsFix);
  /** Distance filter is applied only with a real fix inside Jaipur. */
  const distanceUsable = distanceKm !== "" && gpsFix != null && insideJaipur;
  /** Manual city options come from the LIVE published catalog — never invented. */
  const [cities, setCities] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const catalog = await fetchCatalog();
        if (!active) return;
        setCities(Array.from(new Set(catalog.map((item) => item.city).filter(Boolean))).sort());
      } catch { /* city list stays empty; manual area selection still works */ }
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  // Rounded fix key: distance re-ranking re-runs only after a real move
  // (~110 m), never on GPS jitter. Raw coordinates stay off the URL/UI.
  const fixKey = distanceUsable && gpsFix
    ? `${Math.round(gpsFix.latitude * 1000)},${Math.round(gpsFix.longitude * 1000)}`
    : "";

  const searchParams = useMemo(() => ({
    q: debouncedQuery, category: categoryFilter, location: locationFilter,
    city: cityFilter, price: priceFilter, rating: ratingFilter, offer: offerOnly,
    gender: genderFilter, sort: sortBy, dist: distanceKm, open: openNow, fixKey,
  }), [debouncedQuery, categoryFilter, locationFilter, cityFilter, priceFilter, ratingFilter, offerOnly, genderFilter, sortBy, distanceKm, openNow, fixKey]);

  const runSearch = useCallback(async (offset: number) => {
    const client = getClient();
    if (!client) return { rows: [] as SearchRow[] };

    // Section 03: distance and Open Now are device-side / opening-hours
    // filters — the locked marketplace_search RPC has no parameters for them,
    // and shared RPCs must not change. When either is active (distance only
    // with a usable Jaipur fix), run the same safe catalog gates directly and
    // rank/filter on the device. Everything else keeps the RPC path below.
    // The rounded fixKey (from searchParams) is the only location input here,
    // so this callback's dependency list stays exact and stable — GPS jitter
    // (< ~110 m) never re-runs the search or leaks into distances.
    const distanceActive = Boolean(searchParams.dist) && Boolean(searchParams.fixKey);
    const [fixLat, fixLng] = searchParams.fixKey
      ? searchParams.fixKey.split(",").map(Number)
      : [Number.NaN, Number.NaN];
    if (searchParams.open || distanceActive) {
      const all = await fetchCatalog();
      const q = (searchParams.q || "").toLowerCase();
      const cat = (searchParams.category || "").toLowerCase();
      const loc = (searchParams.location || "").toLowerCase();
      const city = (searchParams.city || "").toLowerCase();
      let filtered = all.filter((item) => {
        if (cat && (item.business_category || "").toLowerCase() !== cat) return false;
        if (city && (item.city || "").toLowerCase() !== city) return false;
        if (loc) {
          const matchLoc = (item.city || "").toLowerCase().includes(loc) ||
                           (item.area || "").toLowerCase().includes(loc) ||
                           (item.address || "").toLowerCase().includes(loc);
          if (!matchLoc) return false;
        }
        if (q) {
          const matchQ = (item.name || "").toLowerCase().includes(q) ||
                         (item.business_category || "").toLowerCase().includes(q) ||
                         (item.city || "").toLowerCase().includes(q) ||
                         (item.area || "").toLowerCase().includes(q) ||
                         (item.address || "").toLowerCase().includes(q) ||
                         (item.description || "").toLowerCase().includes(q) ||
                         (item.website.slug || "").toLowerCase().includes(q);
          if (!matchQ) return false;
        }
        if (searchParams.rating > 0 && (item.rating_average || 0) < searchParams.rating) return false;
        if (searchParams.price && Number(searchParams.price) > 0 && (item.starting_price_paise || 0) > Number(searchParams.price)) return false;
        // Same audience heuristic the customer-suggestion ranking already uses
        // (the catalog rows carry no gender column; never invents one).
        if (searchParams.gender) {
          const category = (item.business_category ?? "").toLowerCase();
          if (searchParams.gender === "female" && !/women|female|ladies/.test(category)) return false;
          if (searchParams.gender === "male" && !/men|male|gents/.test(category)) return false;
          if (searchParams.gender === "unisex" && !/unisex/.test(category)) return false;
        }
        return true;
      });
      // Offers-only: real active offers rows (same public offers table the
      // salon pages already read) — never a fabricated has_offer flag.
      if (searchParams.offer && filtered.length) {
        const { data: activeOffers } = await client
          .from("offers")
          .select("salon_id")
          .in("salon_id", filtered.map((item) => item.id))
          .eq("is_active", true);
        const withOffer = new Set(((activeOffers ?? []) as Array<{ salon_id: string }>).map((row) => row.salon_id));
        filtered = filtered.filter((item) => withOffer.has(item.id));
      }
      // Open Now: owner-managed salon_hours (config fallback), IST clock.
      if (searchParams.open) {
        const openIds = await fetchOpenNowIds(client, filtered);
        filtered = filtered.filter((item) => openIds.has(item.id));
      }
      // Distance: approved coordinates only, Haversine on-device, then rank
      // nearest first (ties by rating). No coordinates ⇒ not rankable ⇒ out.
      const distanceBySalon = new Map<string, number>();
      if (distanceActive && Number.isFinite(fixLat) && Number.isFinite(fixLng)) {
        const maxKm = Number(searchParams.dist);
        filtered = filtered.filter((item) =>
          item.approval_status === "approved" &&
          typeof item.latitude === "number" &&
          typeof item.longitude === "number",
        );
        const ranked = filtered
          .map((item) => ({ item, d: haversineKm(fixLat, fixLng, Number(item.latitude), Number(item.longitude)) }))
          .filter((entry) => entry.d <= maxKm)
          .sort((a, b) => a.d - b.d || (b.item.rating_average ?? 0) - (a.item.rating_average ?? 0));
        filtered = ranked.map((entry) => { distanceBySalon.set(entry.item.id, entry.d); return entry.item; });
      }
      const rows: SearchRow[] = filtered.slice(offset, offset + 12).map((item) => ({
        id: item.id,
        slug: item.website.slug || item.slug || item.id,
        name: item.name,
        business_category: item.business_category || "hair",
        area: item.area,
        city: item.city,
        landmark: null,
        gender_category: null,
        rating_avg: Number(item.rating_average || 0),
        review_count: Number(item.review_count || 0),
        booking_count: 0,
        starting_price_paise: item.starting_price_paise ?? null,
        cover_image_path: item.cover_image_path ?? null,
        has_offer: false,
        score: 1,
        distanceKm: distanceBySalon.get(item.id) ?? null,
      }));
      return { rows };
    }

    try {
      const { data, error: rpcError } = await client.rpc("marketplace_search", {
        p_query: searchParams.q,
        p_category: searchParams.category || null,
        p_area: searchParams.location || null,
        p_min_rating: searchParams.rating,
        p_max_price_paise: searchParams.price ? Number(searchParams.price) : null,
        p_has_offer: searchParams.offer,
        p_gender: searchParams.gender || null,
        p_sort: searchParams.sort,
        p_limit: 12,
        p_offset: offset,
      });
      if (!rpcError && Array.isArray(data)) {
        // The locked RPC has no city parameter; apply the manual city choice
        // to the returned rows instead of touching the shared contract.
        const rows = (data as SearchRow[]).filter((row) =>
          !searchParams.city || (row.city ?? "").toLowerCase() === searchParams.city.toLowerCase(),
        );
        return { rows };
      }
    } catch {
      // fallback to direct catalog query
    }

    // Direct catalog query fallback respecting safety gates (verified=true, is_active=true, is_published=true)
    const all = await fetchCatalog();
    const q = (searchParams.q || '').toLowerCase();
    const cat = (searchParams.category || '').toLowerCase();
    const loc = (searchParams.location || '').toLowerCase();
    const city = (searchParams.city || '').toLowerCase();

    const filtered = all.filter((item) => {
      if (cat && (item.business_category || '').toLowerCase() !== cat) return false;
      if (city && (item.city || '').toLowerCase() !== city) return false;
      if (loc) {
        const matchLoc = (item.city || '').toLowerCase().includes(loc) ||
                         (item.area || '').toLowerCase().includes(loc) ||
                         (item.address || '').toLowerCase().includes(loc);
        if (!matchLoc) return false;
      }
      if (q) {
        const matchQ = (item.name || '').toLowerCase().includes(q) ||
                       (item.business_category || '').toLowerCase().includes(q) ||
                       (item.city || '').toLowerCase().includes(q) ||
                       (item.area || '').toLowerCase().includes(q) ||
                       (item.address || '').toLowerCase().includes(q) ||
                       (item.description || '').toLowerCase().includes(q) ||
                       (item.website.slug || '').toLowerCase().includes(q);
        if (!matchQ) return false;
      }
      if (searchParams.rating > 0 && (item.rating_average || 0) < searchParams.rating) return false;
      if (searchParams.price && Number(searchParams.price) > 0 && (item.starting_price_paise || 0) > Number(searchParams.price)) return false;
      return true;
    });

    const rows: SearchRow[] = filtered.slice(offset, offset + 12).map((item) => ({
      id: item.id,
      slug: item.website.slug || item.slug || item.id,
      name: item.name,
      business_category: item.business_category || 'hair',
      area: item.area,
      city: item.city,
      landmark: null,
      gender_category: null,
      rating_avg: Number(item.rating_average || 0),
      review_count: Number(item.review_count || 0),
      booking_count: 0,
      starting_price_paise: item.starting_price_paise ?? null,
      cover_image_path: item.cover_image_path ?? null,
      has_offer: false,
      score: 1,
    }));
    return { rows };
  }, [searchParams]);

  // URL sync — every SUPPORTED filter is shareable via /salons query params.
  // Hard rule: only filter values travel in the URL — never raw or rounded
  // GPS coordinates (the distance filter is just a radius choice).
  useEffect(() => {
    const url = new URL(window.location.href);
    const sync = (key: string, value: string) => {
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    };
    sync("q", debouncedQuery);
    sync("category", categoryFilter);
    sync("area", locationFilter);
    sync("city", cityFilter);
    sync("price", priceFilter);
    sync("rating", ratingFilter ? String(ratingFilter) : "");
    sync("gender", genderFilter);
    sync("offer", offerOnly ? "1" : "");
    sync("dist", distanceKm);
    sync("open", openNow ? "1" : "");
    sync("sort", sortBy === "relevance" ? "" : sortBy);
    window.history.replaceState({}, "", url.toString());
  }, [debouncedQuery, categoryFilter, locationFilter, cityFilter, priceFilter, ratingFilter, genderFilter, offerOnly, distanceKm, openNow, sortBy]);

  // Deep links + initial params (inverse of the sync above).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q"); if (q) { setQuery(q); setDebouncedQuery(q); }
      const cat = params.get("category"); if (cat) setCategoryFilter(cat);
      const area = params.get("area"); if (area) setLocationFilter(area);
      const cityParam = params.get("city");
      if (cityParam && area) setCityFilter(cityParam);
      else if (cityParam) setLocationFilter(cityParam);
      const price = params.get("price"); if (price) setPriceFilter(price);
      const rating = params.get("rating"); if (rating) setRatingFilter(Number(rating) || 0);
      const gender = params.get("gender"); if (gender) setGenderFilter(gender);
      if (params.get("offer") === "1") setOfferOnly(true);
      const dist = params.get("dist"); if (dist === "2" || dist === "5" || dist === "10") setDistanceKm(dist);
      if (params.get("open") === "1") setOpenNow(true);
      const sort = params.get("sort");
      if (sort && ["rating", "popularity", "price", "availability", "name"].includes(sort)) {
        setSortBy(sort as typeof sortBy);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Debounced search + suggestions
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);
  useEffect(() => {
    if (!online) {
      const offlineTimer = window.setTimeout(() => { setLoading(false); setError("You are offline. Reconnect to search salons."); }, 0);
      return () => window.clearTimeout(offlineTimer);
    }
    let active = true;
    const t = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const client = getClient(); if (!client) { setLoading(false); return; }
        const { rows } = await runSearch(0);
        if (!active) return;
        setResults(rows); setLoading(false);
        if (debouncedQuery) {
          const { data } = await client.rpc("marketplace_search_suggestions", { p_query: debouncedQuery, p_limit: 6 });
          if (active) setSuggestions((data ?? []) as Suggestion[]);
        } else setSuggestions([]);
      } catch (cause) { if (active) { setError(friendlyError(cause)); setLoading(false); } }
    }, 0);
    return () => { active = false; window.clearTimeout(t); };
  }, [runSearch, debouncedQuery, online]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const { rows } = await runSearch(results.length);
      setResults((prev) => [...prev, ...rows]);
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setLoadingMore(false); }
  };

  const saveRecentSearch = (term: string) => {
    const v = term.trim();
    if (!v) return;
    setRecentSearches((prev) => {
      const next = [v, ...prev.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 6);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  };

  const categories = useMemo(() => {
    const dynamic = Array.from(new Set(results.map(i=>i.business_category).filter(Boolean))) as string[];
    return Array.from(new Set([...CANONICAL_CATEGORIES, ...dynamic]));
  }, [results]);

  const priceOptions = [
    { value: "", label: "Any price" },
    { value: "50000", label: "Under ₹500" },
    { value: "100000", label: "Under ₹1,000" },
    { value: "200000", label: "Under ₹2,000" },
  ];

  return (
    <main className="section page-top">
      <div className="section-heading">
        <div><span className="eyebrow">Nexora marketplace – Smart Search</span><h1>Find your salon</h1><p>Search salons by name, service, category, city, area or landmark. Typo-tolerant, live results — only owner-approved, published salons.</p></div>
      </div>

      {/* Search box + suggestions */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <label className="search" style={{ minWidth: "auto" }}><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setShowSuggestions(true)} onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)} onKeyDown={(e) => { if (e.key === "Enter") { saveRecentSearch(query); setDebouncedQuery(query.trim()); } }} placeholder="Search salon, service, area, landmark…" /></label>
        {showSuggestions && (suggestions.length > 0 || (query.trim().length === 0 && recentSearches.length > 0)) && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 14, boxShadow: "0 12px 32px rgba(0,0,0,.12)", zIndex: 40, maxHeight: 320, overflowY: "auto" }}>
            {query.trim().length === 0 && recentSearches.length > 0 && (
              <div style={{ padding: "8px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#8c7077", textTransform: "uppercase", marginBottom: 4 }}>Recent searches</div>
                {recentSearches.map((r) => <button key={r} className="text-button" style={{ display: "block", padding: "6px 4px", fontSize: 13 }} onClick={() => { setQuery(r); setDebouncedQuery(r); saveRecentSearch(r); }}>🕘 {r}</button>)}
              </div>
            )}
            {suggestions.map((sg) => (
              <button key={sg.kind + sg.slug} className="text-button" style={{ display: "flex", gap: 8, width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #f0e6ea" }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (sg.kind === "category") { setCategoryFilter(sg.name); setQuery(""); }
                  else { setQuery(sg.name); setDebouncedQuery(sg.name); }
                  saveRecentSearch(sg.name);
                  setShowSuggestions(false);
                }}>
                <span>{sg.kind === "category" ? "🗂" : "🏬"}</span><span><strong>{sg.name}</strong> <em style={{ fontSize: 10, color: "#8c7077" }}>{sg.kind}</em></span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters + sort */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", marginBottom: 14 }}>
        <label>Category<select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <label>City<select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}><option value="">All cities</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <label>Jaipur area<select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}><option value="">All Jaipur</option>{JAIPUR_ZONES.map((z) => <optgroup key={z.zone} label={z.zone}>{z.areas.map((a) => <option key={a} value={a}>{a}</option>)}</optgroup>)}</select></label>
        <label>Distance<select value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)}><option value="">Any distance</option><option value="2">Within 2 km</option><option value="5">Within 5 km</option><option value="10">Within 10 km</option></select></label>
        <label>Price<select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>{priceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
        <label>Min rating<select value={ratingFilter} onChange={(e) => setRatingFilter(Number(e.target.value))}><option value={0}>Any rating</option><option value={4}>4+ ★</option><option value={4.5}>4.5+ ★</option></select></label>
        <label>Audience<select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}><option value="">Any</option><option value="female">Women</option><option value="male">Men</option><option value="unisex">Unisex</option></select></label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, paddingTop: 6 }}><input type="checkbox" checked={offerOnly} onChange={(e) => setOfferOnly(e.target.checked)} /> Offers only</label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, paddingTop: 6 }}><input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} /> Open now</label>
        <label>Sort by<select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="relevance">Relevance</option><option value="rating">Rating</option><option value="popularity">Popularity</option><option value="price">Price low-high</option><option value="availability">Availability</option><option value="name">Name A-Z</option></select></label>
      </div>

      {/* Section 03 GPS — user-action only. The button starts the shared
          location singleton; the page itself never requests permission. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <button
          type="button"
          className="secondary compact"
          disabled={location.isImproving}
          onClick={() => {
            if (!distanceKm) setDistanceKm("5");
            location.start();
          }}
        >
          {location.isImproving ? "Locating you…" : "📍 Use my location"}
        </button>
        <p role="status" aria-live="polite" style={{ margin: 0, fontSize: 13, color: "var(--muted, #8c7077)" }}>
          {distanceKm !== "" && location.isImproving && !gpsFix && "Getting your location — allow the permission prompt if it appears."}
          {distanceKm !== "" && !location.isImproving && !gpsFix && (location.status === "denied") && "GPS permission is denied. No problem — pick your Jaipur area manually above to filter."}
          {distanceKm !== "" && !location.isImproving && !gpsFix && (location.status === "unsupported") && "This browser cannot access GPS. Use the manual city/area selection instead."}
          {distanceKm !== "" && !location.isImproving && !gpsFix && (location.status === "unavailable" || location.status === "timeout") && "No GPS signal right now. Use the manual city/area selection, or retry in an open area."}
          {distanceKm !== "" && !location.isImproving && !gpsFix && location.status === "offline" && "You are offline — reconnect to use location, or choose an area manually."}
          {distanceKm !== "" && gpsFix && !insideJaipur && "You appear to be outside Jaipur. Nexora currently serves Jaipur, so the distance filter is paused — choose an area manually."}
          {distanceUsable && `Distance filter on: salons within ${distanceKm} km of you (approximate).`}
        </p>
      </div>

      {/* States */}
      {loading ? <SalonSkeletons count={6} /> : error ? <StateCard title="Could not search salons" text={error} action="Retry" onAction={() => { setLoading(true); void runSearch(0).then(({ rows }) => setResults(rows)).finally(() => setLoading(false)); }} /> : !results.length ? <StateCard title={query || categoryFilter || locationFilter || cityFilter || distanceKm || openNow ? "No matching salon" : "No published salons yet"} text={query || categoryFilter || locationFilter || cityFilter || distanceKm || openNow ? "Try another name, city, area or category — or widen the distance / clear Open now." : "Owner-approved salon websites will appear here when published."} /> : (
        <>
          <p style={{ fontSize: 12, color: "#8c7077", margin: "0 0 12px" }}>{results.length} result{results.length === 1 ? "" : "s"}{query ? ` for “${query}”` : ""}{categoryFilter ? ` · ${categoryFilter}` : ""}{cityFilter ? ` · ${cityFilter}` : ""}{locationFilter ? ` · ${locationFilter}` : ""}{distanceUsable ? ` · within ${distanceKm} km` : ""}{openNow ? " · open now" : ""}</p>
          <div className="salon-grid">{results.map((item) => <SearchSalonCard key={item.id} row={item} navigate={navigate} />)}</div>
          {results.length >= 12 && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button className="secondary" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Loading…" : "Load more salons"}</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function SearchSalonCard({ row, navigate }: { row: SearchRow; navigate: (path: string) => void }) {
  return (
    <article className="salon-card">
      <div className="salon-visual" style={row.cover_image_path?.startsWith("http") ? { backgroundImage: `url("${row.cover_image_path.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!row.cover_image_path?.startsWith("http") && <span>✦</span>}<em>Verified</em>{row.has_offer && <em style={{ right: 8, background: "#e6007e" }}>OFFER</em>}</div>
      <div className="salon-body"><div className="salon-meta"><span>{row.business_category ?? "Salon"}</span><span>★ {Number(row.rating_avg).toFixed(1)} ({row.review_count}){row.booking_count > 0 ? ` · ${row.booking_count} bookings` : ""}{row.distanceKm != null ? ` · 📍 ${formatDistance(row.distanceKm)}` : ""}</span></div>
      <h3>{row.name}</h3><p>{row.area ?? row.city}, {row.city}{row.landmark ? ` · ${row.landmark}` : ""}</p><div className="salon-bottom"><b>From {money(row.starting_price_paise)}</b><button onClick={() => navigate(`/salons/${row.slug}`)}>View salon</button></div></div>
    </article>
  );
}

/**
 * Section 10 Top Jaipur card — upgraded in place (single call site: the
 * top-jaipur-salons section). Optional props are additive; every field has an
 * honest fallback (Distance unavailable / Timings unavailable / No ratings
 * yet / View services for pricing). Rank comes from the preserved backend
 * order — never invented here.
 */
function TopRatedCard({
  row,
  navigate,
  rank,
  distanceKm,
  openLabel,
  featured,
}: {
  row: TopRatedRow;
  navigate: (path: string) => void;
  rank?: number;
  distanceKm?: number | null;
  openLabel?: string;
  featured?: boolean;
}) {
  const rating = Number(row.rating_avg ?? 0);
  const reviews = Number(row.review_count ?? 0);
  const hasRating = rating > 0 && reviews > 0;
  const ratingLine = hasRating ? `${rating.toFixed(1)} ★ · ${reviews} review${reviews === 1 ? "" : "s"}` : "No ratings yet";
  const cover = row.cover_image_path?.startsWith("http") ? row.cover_image_path : null;
  const bookings = Number(row.booking_count ?? 0);
  const hasBookings = Number.isFinite(bookings) && bookings > 0;
  const openState = openLabel == null ? null : openLabel === "Open now" ? true : openLabel === "Closed now" ? false : null;
  return (
    <article className={`salon-card top-jaipur-card nx-salon-card${featured ? " top-jaipur-card-featured" : ""}`}>
      {rank != null && <span className="rank-badge" aria-label={`Rank ${rank}`}>#{rank}</span>}
      <div
        className="salon-visual nx-salon-visual"
        role="img"
        aria-label={`${row.name} salon photo`}
        style={cover ? { backgroundImage: `url("${cover.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {!cover && <span aria-hidden="true">✦</span>}
        {rank != null && <span aria-hidden="true" className="nx-rank-numeral">{String(rank).padStart(2, "0")}</span>}
        <span className="nx-verified-chip"><span aria-hidden="true">✦</span> Verified</span>
        {hasRating && (
          <span className="nx-rating-chip" aria-label={`${rating.toFixed(1)} out of 5, ${reviews} review${reviews === 1 ? "" : "s"}`}>
            <span aria-hidden="true" className="nx-rating-star">★</span> {rating.toFixed(1)} <span className="nx-rating-count">({reviews})</span>
          </span>
        )}
      </div>
      <div className="salon-body nx-salon-body">
        <h3>{row.name}</h3>
        <p className="nx-bookings-line">
          <span aria-hidden="true" className="nx-trend-icon">↗</span>
          {hasBookings ? `${bookings} booking${bookings === 1 ? "" : "s"}` : ratingLine}
        </p>
        <div className="nx-info-row">
          <span className="nx-info-item"><span aria-hidden="true" className="nx-info-icon">📍</span><span className="nx-info-text">{row.area ?? row.city}, {row.city}{row.business_category ? ` · ${row.business_category}` : ""}</span></span>
          <span className="nx-info-right">{distanceKm != null ? `📍 ${formatDistance(distanceKm)} away` : "Distance unavailable"}</span>
        </div>
        <div className="nx-info-row">
          <span className="nx-info-item"><span aria-hidden="true" className="nx-info-icon">₹</span><span className="nx-info-text">{nearbyPriceCopy(row.starting_price_paise)}</span></span>
          {openState === true
            ? <span className="nx-open-chip"><span aria-hidden="true" className="nx-pulse-dot" /> Open Now</span>
            : openState === false
              ? <span className="nx-closed-chip"><span aria-hidden="true">●</span> Closed</span>
              : <span className="nx-info-right">{openLabel ?? "Timings unavailable"}</span>}
        </div>
        <div className="salon-meta nx-rating-line">
          <span aria-label={hasRating ? `${rating.toFixed(1)} out of 5, ${reviews} review${reviews === 1 ? "" : "s"}` : "No ratings yet"}>{ratingLine}</span>
          <VerifiedBadge salonName={row.name} />
        </div>
        <div className="premium-salon-actions nx-card-actions">
          <button type="button" className="premium-book-now-button" disabled={!row.slug} onClick={() => row.slug && navigate(`/app/customer/?salon=${row.id}&returnTo=${encodeURIComponent(`/salons/${row.slug}`)}`)}>Book Now</button>
          <button type="button" className="premium-view-button" disabled={!row.slug} onClick={() => row.slug && navigate(`/salons/${row.slug}`)}>View Salon</button>
        </div>
      </div>
    </article>
  );
}

/** Section 10 — exactly-five display cap (spec: maximum five rank cards). */
const TOP_JAIPUR_DISPLAY_LIMIT = 5;

/**
 * Section 10 — Jaipur's Top 5 Salons (upgraded from the old "Top Rated"
 * section; stable id=top-jaipur-salons, no duplicate section).
 *
 * Ranking method (documented per contract): the EXISTING backend
 * `marketplace_top_rated` RPC order is authoritative — a Bayesian /
 * review-confidence weighted ranking (p_min_reviews: 1). The frontend only
 * filters eligibility (real Jaipur city + valid rating/review aggregates)
 * and takes the first five; it NEVER re-sorts by raw rating, so a 5.0-from-
 * 1-review salon cannot outrank a well-reviewed salon the backend ranks
 * higher. Ranks are positions in that preserved order (unique, DOM = visual).
 * No paid-placement data feeds this section — the ranking rows carry no
 * promotion flag, so nothing can be silently injected as organic.
 */
function TopJaipurSection({
  online,
  loading,
  error,
  onRetry,
  rows,
  items,
  fixUsable,
  gpsFix,
  navigate,
}: {
  online: boolean;
  loading: boolean;
  error: string;
  onRetry: () => void;
  rows: TopRatedRow[];
  items: CatalogItem[];
  fixUsable: boolean;
  gpsFix: { latitude: number; longitude: number } | null;
  navigate: (path: string) => void;
}) {
  // Eligibility truth rules: real Jaipur city field + valid aggregates.
  // Backend order preserved (filter + slice only — no frontend ranking).
  const topFive = useMemo(
    () => rows
      .filter((row) => isJaipurCity(row.city) && Number(row.rating_avg ?? 0) > 0 && Number(row.review_count ?? 0) > 0)
      .slice(0, TOP_JAIPUR_DISPLAY_LIMIT),
    [rows],
  );

  // Section 07 hours contract reused for the five ranked salons only.
  const topIdsKey = topFive.map((row) => row.id).join(",");
  const hoursById = useTodayHours(online && !loading, topFive.map((row) => row.id), topIdsKey);
  const minutes = useMinutesNowIST();
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  // Distance only from approved salon coordinates + a usable Section 06 fix.
  const distanceById = useMemo(() => {
    const map = new Map<string, number>();
    if (!fixUsable || !gpsFix) return map;
    for (const item of items) {
      if (item.approval_status === "approved" && typeof item.latitude === "number" && typeof item.longitude === "number") {
        map.set(item.id, haversineKm(gpsFix.latitude, gpsFix.longitude, Number(item.latitude), Number(item.longitude)));
      }
    }
    return map;
  }, [items, fixUsable, gpsFix]);

  const openLabelFor = (row: TopRatedRow): string => {
    if (!online || minutes == null) return "Timings unavailable";
    const item = itemsById.get(row.id);
    const hours = hoursById[row.id] ?? (item ? configOpeningHours(item) : null);
    if (!hours) return "Timings unavailable";
    const verdict: OpenNowVerdict = openNowVerdict(hours, minutes);
    return verdict.status === "open" ? "Open now" : verdict.status === "closed" ? "Closed now" : "Timings unavailable";
  };

  // CTA → existing /salons contract (city + rating sort are supported params).
  const viewAllJaipurSalons = () => {
    const params = new URLSearchParams();
    params.set("city", "Jaipur");
    params.set("sort", "rating");
    navigate(`/salons?${params.toString()}`);
  };

  const partial = topFive.length > 0 && topFive.length < TOP_JAIPUR_DISPLAY_LIMIT;
  const statusLine = loading
    ? "Jaipur ke top-rated salons load ho rahe hain…"
    : !online
      ? "Aap offline hain. Live rankings verify nahi ki ja sakti."
      : topFive.length === 0
        ? ""
        : partial
          ? "Jaipur ke available top-rated salons dikhaye ja rahe hain."
          : "Jaipur ke top 5 salons — real customer ratings aur reviews ke आधार par ranked.";

  return (
    <section id="top-jaipur-salons" aria-labelledby="top-jaipur-heading" className="section scroll-mt-24">
      <div className="section-heading"><span className="eyebrow">Top rated in Jaipur</span><h2 id="top-jaipur-heading">Jaipur Ke Top 5 Salons</h2><p>Real ratings, customer reviews aur marketplace activity ke आधार पर Jaipur के leading salons explore करें।</p></div>
      {statusLine && <p className="nearby-status" role="status" aria-live="polite">{statusLine}</p>}

      {loading ? (
        <ol className="top-jaipur-list" aria-hidden="true">
          {Array.from({ length: TOP_JAIPUR_DISPLAY_LIMIT }, (_, i) => <li key={i} className="salon-card skeleton"><div /><p /><p /><p /></li>)}
        </ol>
      ) : !online ? (
        topFive.length ? (
          <>
            <p className="saved-results-label">Saved ranking</p>
            <ol className="top-jaipur-list">
              {topFive.map((row, index) => (
                <li key={row.id} className="top-jaipur-item">
                  <TopRatedCard row={row} navigate={navigate} rank={index + 1} distanceKm={distanceById.get(row.id) ?? null} openLabel="Timings unavailable" featured={index === 0} />
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="state-card"><span>✦</span><h3>Aap offline hain</h3><p>Aap offline hain. Live rankings verify nahi ki ja sakti.</p><div className="button-row"><button className="secondary" onClick={viewAllJaipurSalons}>View All Jaipur Salons</button></div></div>
        )
      ) : error && !topFive.length ? (
        <div className="state-card"><span>✦</span><h3>Top-rated salons load nahi ho sake</h3><p>Top-rated salons load nahi ho sake. Dobara try karein.</p><div className="button-row"><button className="secondary" onClick={onRetry}>Retry</button><button className="secondary" onClick={viewAllJaipurSalons}>View All Jaipur Salons</button></div></div>
      ) : !topFive.length ? (
        <div className="state-card"><span>✦</span><h3>Jaipur ke top-rated salons abhi available nahi hain</h3><p>Jaipur ke top-rated salons abhi available nahi hain.</p><div className="button-row"><button className="secondary" onClick={viewAllJaipurSalons}>View All Jaipur Salons</button><button className="secondary" onClick={() => scrollToCategoriesSection()}>Explore Categories</button></div></div>
      ) : (
        <>
          {partial && <p className="saved-results-label">Available top-rated Jaipur salons</p>}
          <ol className="top-jaipur-list">
            {topFive.map((row, index) => (
              <li key={row.id} className="top-jaipur-item">
                <TopRatedCard row={row} navigate={navigate} rank={index + 1} distanceKm={distanceById.get(row.id) ?? null} openLabel={openLabelFor(row)} featured={index === 0} />
              </li>
            ))}
          </ol>
        </>
      )}

      <div className="categories-cta">
        <button type="button" className="primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e004b]" onClick={viewAllJaipurSalons}>Jaipur Ke Sabhi Salons Dekhein</button>
      </div>
    </section>
  );
}

type Section12SalonReference = {
  id: string;
  slug: string;
  coverImagePath: string | null;
};

type TrendingMostBookedSectionProps = {
  trendingRows: TrendingRow[];
  trendingLoading: boolean;
  trendingError: boolean;
  onRetryTrending: () => void | Promise<void>;
  popularServices: PopularService[];
  popularLoading: boolean;
  popularError: boolean;
  onRetryPopular: () => void | Promise<void>;
  salonReferences: ReadonlyMap<string, Section12SalonReference>;
  online: boolean;
  navigate: (path: string) => void;
};

const SECTION12_TABS = [
  { key: "trending", label: "Trending Salons", tabId: "section12-tab-trending", panelId: "section12-panel-trending" },
  { key: "services", label: "Most Booked Services", tabId: "section12-tab-services", panelId: "section12-panel-services" },
  { key: "areas", label: "Trending Areas", tabId: "section12-tab-areas", panelId: "section12-panel-areas" },
] as const;

type Section12Tab = (typeof SECTION12_TABS)[number]["key"];

/** Pure roving-tab transition used by the real key handler and runtime tests. */
export function section12TabIndexForKey(key: string, currentIndex: number, tabCount = SECTION12_TABS.length): number | null {
  if (tabCount <= 0) return null;
  if (key === "ArrowRight") return (currentIndex + 1) % tabCount;
  if (key === "ArrowLeft") return (currentIndex - 1 + tabCount) % tabCount;
  if (key === "Home") return 0;
  if (key === "End") return tabCount - 1;
  return null;
}

type TrendingArea = { key: string; name: string; city: string | null; sourceSalon: string };

/** Section 12.3: the backend already returns at most six; keep a UI cap too. */
const TRENDING_SALONS_DISPLAY_LIMIT = 6;

/**
 * Reject only structurally unusable RPC rows. Publication/activity eligibility
 * remains the marketplace_trending backend's responsibility; the frontend does
 * not invent another business-status filter or ranking rule.
 */
function isRenderableTrendingSalonRow(row: TrendingRow): boolean {
  if (typeof row.id !== "string" || !row.id.trim()) return false;
  if (typeof row.name !== "string" || !row.name.trim()) return false;
  if (typeof row.slug !== "string") return false;
  const slug = row.slug.trim();
  return Boolean(slug)
    && !slug.includes("/")
    && !slug.includes("\\")
    && !slug.includes("?")
    && !slug.includes("#")
    && !/\s/.test(slug);
}

/** Section 12.4: mirror the trusted RPC limit with a defensive UI cap. */
const POPULAR_SERVICES_DISPLAY_LIMIT = 6;

/** Keep only structurally usable aggregate rows; never re-rank them. */
function isRenderablePopularService(service: PopularService): boolean {
  if (typeof service.service_id !== "string" || !service.service_id.trim()) return false;
  if (typeof service.salon_id !== "string" || !service.salon_id.trim()) return false;
  if (typeof service.service_name !== "string" || !service.service_name.trim()) return false;
  if (typeof service.salon_name !== "string" || !service.salon_name.trim()) return false;
  const bookingCount = Number(service.booking_count);
  return Number.isSafeInteger(bookingCount) && bookingCount >= 0;
}

/** Resolve only an existing canonical slug from the published catalog. */
function resolvePopularServiceSalonSlug(salonReference: Section12SalonReference | undefined, salonId: string): string | null {
  if (!salonReference || salonReference.id !== salonId) return null;
  const slug = salonReference.slug?.trim();
  if (!slug
    || slug.includes("/")
    || slug.includes("\\")
    || slug.includes("?")
    || slug.includes("#")
    || /\s/.test(slug)) return null;
  return slug;
}

/** Format a real duration value without substituting a made-up default. */
function formatPopularServiceDuration(value: number | null | undefined): string {
  const totalMinutes = Number(value);
  if (!Number.isInteger(totalMinutes) || totalMinutes <= 0) return "Duration unavailable";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

/** Section 12.5: areas come only from the six already-ranked Trending rows. */
const TRENDING_AREAS_DISPLAY_LIMIT = 6;

type NormalizedAreaPart = { display: string; key: string };

/** Trim and collapse whitespace for grouping; never rename a real locality. */
function normalizeTrendingAreaPart(value: unknown): NormalizedAreaPart | null {
  if (typeof value !== "string") return null;
  const display = value.trim().replace(/\s+/g, " ");
  return display ? { display, key: display.toLowerCase() } : null;
}

/**
 * Section 12 — Trending and Most Booked.
 *
 * HomePage owns both existing data hooks, so changing a tab only changes which
 * already-loaded panel is exposed. It never remounts a hook or starts a new
 * request. Trending Salons keeps the marketplace_trending response order and
 * Most Booked Services keeps the marketplace_popular_services response order.
 * Trending Areas is intentionally modest: it lists only real area values found
 * in the current trending salon rows and makes no separate popularity claim.
 */
export function TrendingMostBookedSection({
  trendingRows,
  trendingLoading,
  trendingError,
  onRetryTrending,
  popularServices,
  popularLoading,
  popularError,
  onRetryPopular,
  salonReferences,
  online,
  navigate,
}: TrendingMostBookedSectionProps) {
  const [selectedTab, setSelectedTab] = useState<Section12Tab>("trending");

  // Select, but never re-sort, the first six structurally valid RPC rows. The
  // bounded array is the exact collection rendered, so no hidden extra cards
  // are traversed merely to return null.
  const renderableTrendingRows = useMemo(() => {
    const rows: TrendingRow[] = [];
    for (const row of trendingRows) {
      if (!isRenderableTrendingSalonRow(row)) continue;
      rows.push(row);
      if (rows.length >= TRENDING_SALONS_DISPLAY_LIMIT) break;
    }
    return rows;
  }, [trendingRows]);

  // Preserve RPC order while rejecting malformed/duplicate service rows and
  // selecting no more than six. This does not calculate popularity locally.
  const renderablePopularServices = useMemo(() => {
    const rows: PopularService[] = [];
    const seenServiceIds = new Set<string>();
    for (const service of popularServices) {
      if (!isRenderablePopularService(service)) continue;
      const serviceId = service.service_id.trim();
      if (seenServiceIds.has(serviceId)) continue;
      seenServiceIds.add(serviceId);
      rows.push(service);
      if (rows.length >= POPULAR_SERVICES_DISPLAY_LIMIT) break;
    }
    return rows;
  }, [popularServices]);

  // No dedicated area-popularity source exists in this repository. Group only
  // areas from the valid, already-ranked Trending rows: first backend presence
  // wins, duplicate whitespace/case variants collapse, and no score is made up.
  const trendingAreas = useMemo<TrendingArea[]>(() => {
    const seen = new Set<string>();
    const areas: TrendingArea[] = [];
    for (const row of renderableTrendingRows) {
      const area = normalizeTrendingAreaPart(row.area);
      if (!area) continue;
      const city = normalizeTrendingAreaPart(row.city);
      // City remains part of the key so equal locality names in genuinely
      // different cities are never merged based on a frontend guess.
      const key = `${area.key}::${city?.key ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      areas.push({ key, name: area.display, city: city?.display ?? null, sourceSalon: row.name.trim() });
      if (areas.length >= TRENDING_AREAS_DISPLAY_LIMIT) break;
    }
    return areas;
  }, [renderableTrendingRows]);

  const trendingCount = renderableTrendingRows.length;
  const serviceCount = renderablePopularServices.length;
  const areaCount = trendingAreas.length;
  const trendingHeading = !online
    ? "Saved Trending Salons"
    : trendingError
      ? trendingCount ? "Previously Loaded Trending Salons" : "Trending Salons"
      : "Trending Now";
  const servicesHeading = !online
    ? "Saved Popular Services"
    : popularError
      ? serviceCount ? "Previously Loaded Popular Services" : "Most Booked Services"
      : "Most Booked Services";
  const areasHeading = !online
    ? "Saved Trending Areas"
    : trendingError
      ? areaCount ? "Previously Loaded Trending Areas" : "Trending Areas"
      : "Trending Areas";
  const trendingStatus = !online
    ? trendingCount
      ? `${trendingCount} saved trending salon result${trendingCount === 1 ? "" : "s"} available. Live trends update nahi kiye ja sakte.`
      : "Aap offline hain. Live trends update nahi kiye ja sakte."
    : trendingLoading && !trendingCount
      ? "Trending salons load ho rahe hain."
      : trendingError && !trendingCount
        ? "Trending data load nahi ho saka. Dobara try karein."
        : trendingCount
          ? trendingError
            ? `${trendingCount} pehle load kiye gaye trending salon result available hain. Update nahi ho saka.`
            : trendingLoading
              ? `${trendingCount} trending salon result available hain. Results refresh ho rahe hain.`
              : trendingCount < TRENDING_SALONS_DISPLAY_LIMIT
                ? `${trendingCount} reliable trending salon result available hain.`
                : `${trendingCount} trending salon results available hain.`
          : "Abhi enough trending activity available nahi hai.";
  const servicesStatus = !online
    ? serviceCount
      ? `${serviceCount} saved popular service result${serviceCount === 1 ? "" : "s"} available. Live results update nahi kiye ja sakte.`
      : "Aap offline hain. Most-booked services update nahi ki ja sakti."
    : popularLoading && !serviceCount
      ? "Most-booked services load ho rahi hain."
      : popularError && !serviceCount
        ? "Most-booked services load nahi ho saki. Dobara try karein."
        : serviceCount
          ? popularError
            ? `${serviceCount} pehle load kiye gaye service result available hain. Update nahi ho saka.`
            : popularLoading
              ? `${serviceCount} service result available hain. Results refresh ho rahe hain.`
              : serviceCount < POPULAR_SERVICES_DISPLAY_LIMIT
                ? `${serviceCount} reliable most-booked service result available hain.`
                : `${serviceCount} most-booked service results available hain.`
          : "Most-booked services abhi available nahi hain.";
  const areasStatus = !online
    ? areaCount
      ? `${areaCount} saved trending area result${areaCount === 1 ? "" : "s"} available. Live trends update nahi kiye ja sakte.`
      : "Aap offline hain. Trending areas update nahi kiye ja sakte."
    : trendingLoading && !areaCount
      ? "Trending areas derive kiye ja rahe hain."
      : trendingError && !areaCount
        ? "Trending areas load nahi ho sake. Dobara try karein."
        : areaCount
          ? trendingError
            ? `${areaCount} pehle load kiye gaye area result available hain. Update nahi ho saka.`
            : trendingLoading
              ? `${areaCount} area result available hain. Results refresh ho rahe hain.`
              : areaCount < TRENDING_AREAS_DISPLAY_LIMIT
                ? `${areaCount} reliable trending area result available hain.`
                : `${areaCount} trending area results available hain.`
          : "Trending area data abhi available nahi hai.";

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const nextIndex = section12TabIndexForKey(event.key, currentIndex);
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = SECTION12_TABS[nextIndex];
    setSelectedTab(nextTab.key);
    document.getElementById(nextTab.tabId)?.focus();
  };

  return (
    <section
      id="trending-most-booked"
      aria-labelledby="trending-most-booked-heading"
      className="section section12 scroll-mt-24"
      style={{ background: "var(--cream)" }}
    >
      <div className="section-heading">
        <span className="eyebrow">TRENDING ON NEXORA</span>
        <h2 id="trending-most-booked-heading">Abhi Kya Trending Hai</h2>
        <p>Real customer activity ke basis par popular salons, services aur Jaipur areas explore karein.</p>
      </div>

      <div className="section12-tabs-scroll">
        <div className="section12-tablist" role="tablist" aria-label="Trending and most booked views" aria-orientation="horizontal">
          {SECTION12_TABS.map((tab, index) => (
            <button
              key={tab.key}
              type="button"
              id={tab.tabId}
              className="section12-tab"
              role="tab"
              aria-selected={selectedTab === tab.key}
              aria-controls={tab.panelId}
              tabIndex={selectedTab === tab.key ? 0 : -1}
              onClick={() => setSelectedTab(tab.key)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        id="section12-panel-trending"
        className="section12-panel"
        role="tabpanel"
        aria-labelledby="section12-tab-trending"
        tabIndex={0}
        hidden={selectedTab !== "trending"}
      >
        <div className="section-heading section12-panel-heading">
          <span className="eyebrow">{online && !trendingError ? "Trending" : trendingCount ? "Saved results" : "Trending salons"}</span>
          <h3 id="trending-salons-heading">{trendingHeading}</h3>
          <p>{online && !trendingError ? "Live marketplace ranking from recent bookings, views and reviews." : trendingCount ? "Pehle load kiye gaye results dikhaye ja rahe hain." : "Marketplace trending results abhi available nahi hain."}</p>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{trendingStatus}</p>
        {!online && !trendingCount ? (
          <Section12StateCard
            kind="status"
            title="Aap offline hain. Live trends update nahi kiye ja sakte."
            text="Internet reconnect hone par live trending salons dobara load honge."
            fallbackLabel="View All Salons"
            onFallback={() => navigate("/salons")}
          />
        ) : trendingCount ? (
          <>
            {!online && <p className="saved-results-label">Saved results</p>}
            {online && trendingError && <p className="saved-results-label">Previously loaded results</p>}
            {!online && <p className="section12-data-note">Aap offline hain. Saved results dikhaye ja rahe hain; inhe current live trends na samjhein.</p>}
            {online && trendingError && (
              <div className="section12-inline-state section12-inline-error" role="alert">
                <span>Trending data refresh nahi ho saka. Pehle load kiye gaye results available hain.</span>
                <button type="button" className="secondary compact" aria-label="Retry trending salons" onClick={() => void onRetryTrending()}>Dobara Try Karein</button>
              </div>
            )}
            {online && trendingLoading && <p className="section12-data-note" role="status">Results refresh ho rahe hain; available salons visible rahenge.</p>}
            {online && !trendingLoading && !trendingError && trendingCount < TRENDING_SALONS_DISPLAY_LIMIT && (
              <p className="section12-partial-status">{trendingCount} reliable trending salon result{trendingCount === 1 ? "" : "s"} available.</p>
            )}
            <div className="salon-grid">
              {renderableTrendingRows.map((row) => (
                <TrendingCard
                  key={row.id}
                  row={row}
                  salonReference={salonReferences.get(row.id)}
                  saved={!online || trendingError}
                  navigate={navigate}
                />
              ))}
            </div>
          </>
        ) : trendingLoading ? (
          <Section12SalonSkeletons count={3} />
        ) : trendingError ? (
          <Section12StateCard
            kind="error"
            title="Trending data load nahi ho saka. Dobara try karein."
            text="Live marketplace results abhi available nahi hain."
            actionLabel="Dobara Try Karein"
            onAction={() => void onRetryTrending()}
            fallbackLabel="View All Salons"
            onFallback={() => navigate("/salons")}
          />
        ) : (
          <Section12StateCard
            kind="status"
            title="Abhi enough trending activity available nahi hai."
            text="Jaise hi reliable marketplace activity available hogi, salons yahan dikhenge."
            fallbackLabel="View All Salons"
            onFallback={() => navigate("/salons")}
          />
        )}
        <div className="section12-panel-cta">
          <button type="button" className="primary" onClick={() => navigate("/salons")}>Sabhi Trending Salons Dekhein</button>
        </div>
      </div>

      <div
        id="section12-panel-services"
        className="section12-panel"
        role="tabpanel"
        aria-labelledby="section12-tab-services"
        tabIndex={0}
        hidden={selectedTab !== "services"}
      >
        <div className="section-heading section12-panel-heading">
          <span className="eyebrow">{online && !popularError ? "Popular services" : serviceCount ? "Saved results" : "Popular services"}</span>
          <h3 id="most-booked-services-heading">{servicesHeading}</h3>
          <p>{online && !popularError ? "Services customers book the most — live from aggregate booking activity." : serviceCount ? "Pehle load kiye gaye aggregate service results dikhaye ja rahe hain." : "Aggregate service results abhi available nahi hain."}</p>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{servicesStatus}</p>
        {!online && !serviceCount ? (
          <Section12StateCard
            kind="status"
            title="Aap offline hain. Live trends update nahi kiye ja sakte."
            text="Internet reconnect hone par most-booked services dobara load hongi."
            fallbackLabel="Explore Categories"
            onFallback={() => scrollToCategoriesSection()}
          />
        ) : serviceCount ? (
          <>
            {!online && <p className="saved-results-label">Saved results</p>}
            {online && popularError && <p className="saved-results-label">Previously loaded results</p>}
            {!online && <p className="section12-data-note">Aap offline hain. Saved aggregate results dikhaye ja rahe hain; ye current live ranking nahi hai.</p>}
            {online && popularError && (
              <div className="section12-inline-state section12-inline-error" role="alert">
                <span>Most-booked services refresh nahi ho saki. Pehle load kiye gaye results available hain.</span>
                <button type="button" className="secondary compact" aria-label="Retry most-booked services" onClick={() => void onRetryPopular()}>Dobara Try Karein</button>
              </div>
            )}
            {online && popularLoading && <p className="section12-data-note" role="status">Results refresh ho rahe hain; available services visible rahengi.</p>}
            {online && !popularLoading && !popularError && serviceCount < POPULAR_SERVICES_DISPLAY_LIMIT && (
              <p className="section12-partial-status">{serviceCount} reliable most-booked service result{serviceCount === 1 ? "" : "s"} available.</p>
            )}
            <div className="service-grid">
              {renderablePopularServices.map((service) => (
                <PopularServiceCard
                  key={service.service_id}
                  service={service}
                  salonReference={salonReferences.get(service.salon_id)}
                  navigate={navigate}
                />
              ))}
            </div>
          </>
        ) : popularLoading ? (
          <Section12ServiceSkeletons count={4} />
        ) : popularError ? (
          <Section12StateCard
            kind="error"
            title="Most-booked services load nahi ho saki. Dobara try karein."
            text="Public aggregate booking results abhi available nahi hain."
            actionLabel="Dobara Try Karein"
            onAction={() => void onRetryPopular()}
            fallbackLabel="Explore Categories"
            onFallback={() => scrollToCategoriesSection()}
          />
        ) : (
          <Section12StateCard
            kind="status"
            title="Most-booked services abhi available nahi hain."
            text="Reliable aggregate booking activity available hone par services yahan dikhengi."
            fallbackLabel="Explore Categories"
            onFallback={() => scrollToCategoriesSection()}
          />
        )}
        <div className="section12-panel-cta">
          <button type="button" className="primary" onClick={() => navigate("/salons")}>Popular Services Explore Karein</button>
        </div>
      </div>

      <div
        id="section12-panel-areas"
        className="section12-panel"
        role="tabpanel"
        aria-labelledby="section12-tab-areas"
        tabIndex={0}
        hidden={selectedTab !== "areas"}
      >
        <div className="section-heading section12-panel-heading">
          <span className="eyebrow">{online && !trendingError ? "From trending results" : areaCount ? "Saved results" : "Trending areas"}</span>
          <h3 id="trending-areas-heading">{areasHeading}</h3>
          <p>{online && !trendingError ? "Ye areas live trending salon results se derive kiye gaye hain." : areaCount ? "Pehle load kiye gaye trending salon results se derived areas dikhaye ja rahe hain." : "Reliable trending area results abhi available nahi hain."}</p>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{areasStatus}</p>
        {!online && !areaCount ? (
          <Section12StateCard
            kind="status"
            title="Aap offline hain. Live trends update nahi kiye ja sakte."
            text="Saved area results available nahi hain. Internet reconnect hone par trending areas dobara derive honge."
            fallbackLabel="View All Salons"
            onFallback={() => navigate("/salons")}
          />
        ) : areaCount ? (
          <>
            {!online && <p className="saved-results-label">Saved results</p>}
            {online && trendingError && <p className="saved-results-label">Previously loaded results</p>}
            {!online && <p className="section12-data-note">Aap offline hain. Saved area results dikhaye ja rahe hain; ye current live trends nahi hain.</p>}
            {online && trendingError && (
              <div className="section12-inline-state section12-inline-error" role="alert">
                <span>Trending areas refresh nahi ho sake. Pehle load kiye gaye results available hain.</span>
                <button type="button" className="secondary compact" aria-label="Retry trending areas" onClick={() => void onRetryTrending()}>Dobara Try Karein</button>
              </div>
            )}
            {online && trendingLoading && <p className="section12-data-note" role="status">Area results refresh ho rahe hain; available areas visible rahenge.</p>}
            {online && !trendingLoading && !trendingError && areaCount < TRENDING_AREAS_DISPLAY_LIMIT && (
              <p className="section12-partial-status">{areaCount} reliable trending area result{areaCount === 1 ? "" : "s"} available.</p>
            )}
            <ul className="section12-area-grid" aria-label={online && !trendingError ? "Areas represented in live trending salon results" : "Saved areas from previously loaded trending salon results"}>
              {trendingAreas.map((area) => (
                <li className="section12-area-card" key={area.key}>
                  <span className="eyebrow">{online && !trendingError ? "Trending presence" : "Saved result"}</span>
                  <h3>{area.name}</h3>
                  <p>{area.sourceSalon} {online && !trendingError ? "live trending salon results mein dikh raha hai" : "ke pehle load kiye gaye result se"}{area.city ? ` · ${area.city}` : ""}.</p>
                  <button
                    type="button"
                    className="secondary compact"
                    aria-label={`View salons in ${area.name}`}
                    onClick={() => navigate(`/salons?area=${encodeURIComponent(area.name)}`)}
                  >
                    Area Ke Salons Dekhein
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : trendingLoading ? (
          <Section12AreaSkeletons count={3} />
        ) : trendingError ? (
          <Section12StateCard
            kind="error"
            title="Trending areas load nahi ho sake. Dobara try karein."
            text="Reliable area data derive karne ke liye trending salon results abhi available nahi hain."
            actionLabel="Dobara Try Karein"
            onAction={() => void onRetryTrending()}
            fallbackLabel="View All Salons"
            onFallback={() => navigate("/salons")}
          />
        ) : (
          <Section12StateCard
            kind="status"
            title="Trending area data abhi available nahi hai."
            text="Reliable trending salon rows mein area details aane par yahan dikhengi."
            fallbackLabel="View All Salons"
            onFallback={() => navigate("/salons")}
          />
        )}
      </div>
    </section>
  );
}

function TrendingCard({
  row,
  salonReference,
  saved = false,
  navigate,
}: {
  row: TrendingRow;
  salonReference?: Section12SalonReference;
  saved?: boolean;
  navigate: (path: string) => void;
}) {
  const name = row.name.trim();
  const slug = row.slug.trim();
  const category = row.business_category?.trim() || "Salon";
  const area = row.area?.trim() || "";
  const city = row.city?.trim() || "";
  const location = area && city && area.toLowerCase() !== city.toLowerCase()
    ? `${area}, ${city}`
    : area || city || "Location unavailable";
  const rating = Number(row.rating_avg);
  const reviews = Number(row.review_count);
  const hasRating = Number.isFinite(rating) && rating > 0 && rating <= 5 && Number.isFinite(reviews) && reviews >= 0;
  const ratingText = hasRating ? `${rating.toFixed(1)} ★ · ${reviews} review${reviews === 1 ? "" : "s"}` : "No ratings yet";
  const bookingCount = Number(row.booking_count);
  const hasBookingActivity = Number.isFinite(bookingCount) && bookingCount > 0;
  // Images are resolved only from the already-loaded, verified and published
  // catalog. A missing/non-public URL uses the shared salon-card fallback.
  const cover = salonReference?.coverImagePath?.startsWith("http") ? salonReference.coverImagePath : null;

  return (
    <article className="salon-card trending-salon-card">
      <div className="salon-visual">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic public salon media uses the existing catalog URL contract.
          <img src={cover} alt={`${name} salon photo`} width={640} height={380} loading="lazy" decoding="async" />
        ) : (
          <span aria-hidden="true">✦</span>
        )}
        <em>{saved ? (row.overridden ? "Saved featured" : "Saved") : row.overridden ? "Featured" : "Trending"}</em>
      </div>
      <div className="salon-body">
        <div className="salon-meta">
          <span>{category}</span>
          <span aria-label={hasRating ? `${rating.toFixed(1)} out of 5, ${reviews} review${reviews === 1 ? "" : "s"}` : "No ratings yet"}>{ratingText}</span>
        </div>
        <h3>{name}</h3>
        <p>{location}</p>
        {hasBookingActivity && (
          <div className="salon-meta">
            <span>Booking activity</span>
            <span>{bookingCount} booking{bookingCount === 1 ? "" : "s"}</span>
          </div>
        )}
        <div className="salon-bottom">
          <button type="button" aria-label={`View ${name}`} onClick={() => navigate(`/salons/${slug}`)}>View Salon</button>
        </div>
      </div>
    </article>
  );
}

/**
 * Section 11 Smart Picks card — upgraded in place (single call site: the
 * smart-picks section). Optional props are additive; every field keeps an
 * honest fallback. The reason chip renders ONLY the backend-provided reason
 * for personalized rows — never a frontend-invented one.
 */
function PopularServiceCard({
  service,
  salonReference,
  navigate,
}: {
  service: PopularService;
  salonReference?: Section12SalonReference;
  navigate: (path: string) => void;
}) {
  const serviceName = service.service_name.trim();
  const salonName = service.salon_name.trim();
  const durationText = formatPopularServiceDuration(service.duration_minutes);
  const bookingCount = Number(service.booking_count);
  const rawPrice = service.price_paise;
  const pricePaise = Number(rawPrice);
  const hasPrice = rawPrice != null && Number.isFinite(pricePaise) && pricePaise >= 0;
  const priceText = hasPrice ? money(pricePaise) : "Price unavailable";
  const salonSlug = resolvePopularServiceSalonSlug(salonReference, service.salon_id);

  return (
    <article className="service-card section12-service-card">
      <div>
        <h3>{serviceName}</h3>
        <p>{salonName}</p>
        <small>
          {durationText} · <span aria-label={`${bookingCount} bookings from aggregate marketplace activity`}>{bookingCount} booking{bookingCount === 1 ? "" : "s"}</span>
        </small>
      </div>
      <div>
        <b>{priceText}</b>
        <button
          type="button"
          className="text-button"
          disabled={!salonSlug}
          aria-label={`View ${salonName} for ${serviceName}`}
          title={salonSlug ? `View ${salonName}` : "Salon page unavailable"}
          onClick={() => salonSlug && navigate(`/salons/${salonSlug}`)}
        >
          View Salon
        </button>
      </div>
    </article>
  );
}

type Section12StateCardProps = {
  kind: "status" | "error";
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  fallbackLabel: string;
  onFallback: () => void;
};

/** Tab-specific copy/actions with shared Nexora state-card presentation. */
function Section12StateCard({
  kind,
  title,
  text,
  actionLabel,
  onAction,
  fallbackLabel,
  onFallback,
}: Section12StateCardProps) {
  return (
    <div className="state-card section12-state-card" role={kind === "error" ? "alert" : "status"}>
      <span aria-hidden="true">✦</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="button-row">
        {actionLabel && onAction && <button type="button" className="secondary" aria-label={`${actionLabel}: ${title}`} onClick={onAction}>{actionLabel}</button>}
        <button type="button" className="secondary" aria-label={`${fallbackLabel}: ${title}`} onClick={onFallback}>{fallbackLabel}</button>
      </div>
    </div>
  );
}

const SECTION12_SKELETON_KEYS = ["one", "two", "three", "four", "five", "six"] as const;

function Section12SalonSkeletons({ count }: { count: number }) {
  return (
    <div className="salon-grid section12-skeleton-grid" aria-hidden="true">
      {SECTION12_SKELETON_KEYS.slice(0, count).map((key) => (
        <div className="salon-card skeleton" key={`salon-skeleton-${key}`}><div /><p /><p /><p /></div>
      ))}
    </div>
  );
}

function Section12ServiceSkeletons({ count }: { count: number }) {
  return (
    <div className="service-grid section12-skeleton-grid" aria-hidden="true">
      {SECTION12_SKELETON_KEYS.slice(0, count).map((key) => (
        <div className="service-card section12-service-card section12-service-skeleton" key={`service-skeleton-${key}`}>
          <div><span /><span /><span /></div><div><span /><span /></div>
        </div>
      ))}
    </div>
  );
}

function Section12AreaSkeletons({ count }: { count: number }) {
  return (
    <div className="section12-area-grid section12-skeleton-grid" aria-hidden="true">
      {SECTION12_SKELETON_KEYS.slice(0, count).map((key) => (
        <div className="section12-area-card section12-area-skeleton" key={`area-skeleton-${key}`}><span /><span /><span /></div>
      ))}
    </div>
  );
}

function RecommendationCard({
  row,
  navigate,
  showReason,
  reasonOverride,
  distanceKm,
  openLabel,
  pickChip,
}: {
  row: RecommendationRow;
  navigate: (path: string) => void;
  showReason?: boolean;
  reasonOverride?: string;
  distanceKm?: number | null;
  openLabel?: string;
  /** Display-only popularity marker for the backend "popular" modes. Never
      shown for personalized rows (those carry the backend reason instead). */
  pickChip?: string;
}) {
  const rating = Number(row.rating_avg ?? 0);
  const reviews = Number(row.review_count ?? 0);
  const hasRating = rating > 0 && reviews > 0;
  const ratingLine = hasRating ? `${rating.toFixed(1)} ★ · ${reviews} review${reviews === 1 ? "" : "s"}` : "No ratings yet";
  const cover = row.cover_image_path?.startsWith("http") ? row.cover_image_path : null;
  const reason = showReason && row.personalized && row.reason ? row.reason : reasonOverride ?? null;
  return (
    <article className="salon-card smart-picks-card nx-salon-card">
      <div
        className="salon-visual"
        role="img"
        aria-label={`${row.name} salon photo`}
        style={cover ? { backgroundImage: `url("${cover.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {!cover && <span aria-hidden="true">✦</span>}
        {pickChip && <span className="nx-pick-chip">{pickChip}</span>}
        {hasRating && (
          <span className="nx-rating-chip" aria-label={`${rating.toFixed(1)} out of 5, ${reviews} review${reviews === 1 ? "" : "s"}`}>
            <span aria-hidden="true" className="nx-rating-star">★</span> {rating.toFixed(1)} <span className="nx-rating-count">({reviews})</span>
          </span>
        )}
      </div>
      <div className="salon-body">
        <div className="salon-meta">
          <span>{row.business_category ?? "Salon"}</span>
          <span aria-label={hasRating ? `${rating.toFixed(1)} out of 5, ${reviews} review${reviews === 1 ? "" : "s"}` : "No ratings yet"}>{ratingLine}</span>
        </div>
        <h3>{row.name}</h3>
        <p>{row.area ?? row.city}, {row.city}</p>
        <div className="salon-meta">
          <span>{distanceKm != null ? `📍 ${formatDistance(distanceKm)} away` : "Distance unavailable"}</span>
          <span>{openLabel ?? "Timings unavailable"}</span>
        </div>
        <div className="salon-bottom">
          <b>{nearbyPriceCopy(row.starting_price_paise)}</b>
          <VerifiedBadge salonName={row.name} />
        </div>
        {reason && <p className="smart-picks-reason">{reason}</p>}
        <div className="button-row" style={{ marginTop: 10 }}>
          <button className="secondary compact" disabled={!row.slug} onClick={() => row.slug && navigate(`/salons/${row.slug}`)}>View Salon</button>
          <button className="secondary compact" disabled={!row.slug} onClick={() => row.slug && navigate(`/app/customer/?salon=${row.id}&returnTo=${encodeURIComponent(`/salons/${row.slug}`)}`)}>Book Now</button>
        </div>
      </div>
    </article>
  );
}

function SalonCard({ item, navigate, stats, distanceKm, openState }: { item: CatalogItem; navigate: (path: string) => void; stats?: SalonStats; distanceKm?: number | null; openState?: boolean | null }) {
  const rating = stats ? Number(stats.rating_avg) : Number(item.rating_average);
  const reviews = stats ? Number(stats.review_count) : Number(item.review_count);
  const bookings = stats ? Number(stats.booking_count) : 0;
  const cover = item.cover_image_path?.startsWith("http") ? item.cover_image_path : null;
  const hasRating = rating > 0 && reviews > 0;
  // Booking counts are the all-time marketplace aggregate — the UI never
  // invents a time window ("this week") the data does not carry.
  return (
    <article className="salon-card nx-salon-card">
      <div
        className="salon-visual nx-salon-visual"
        role="img"
        aria-label={`${item.name} salon photo`}
        style={cover ? { backgroundImage: `url("${cover.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {!cover && <span aria-hidden="true">✦</span>}
        <span className="nx-verified-chip"><span aria-hidden="true">✓</span> Verified</span>
        {hasRating && (
          <span className="nx-rating-chip" aria-label={`${rating.toFixed(1)} out of 5, ${reviews} review${reviews === 1 ? "" : "s"}`}>
            <span aria-hidden="true" className="nx-rating-star">★</span> {rating.toFixed(1)} <span className="nx-rating-count">({reviews})</span>
          </span>
        )}
      </div>
      <div className="salon-body nx-salon-body">
        <h3>{item.name}</h3>
        <p className="nx-bookings-line">
          <span aria-hidden="true" className="nx-trend-icon">↗</span>
          {bookings > 0
            ? `${bookings} booking${bookings === 1 ? "" : "s"}`
            : `${item.business_category ?? "Salon"} in ${item.city ?? "Jaipur"}`}
        </p>
        <div className="nx-info-row">
          <span className="nx-info-item"><span aria-hidden="true" className="nx-info-icon">📍</span><span className="nx-info-text">{item.area ?? item.city}, {item.city}</span></span>
          <span className="nx-info-right">{distanceKm != null ? formatDistance(distanceKm) : "Distance unavailable"}</span>
        </div>
        <div className="nx-info-row">
          <span className="nx-info-item"><span aria-hidden="true" className="nx-info-icon">₹</span><span className="nx-info-text">From {money(item.starting_price_paise)}</span></span>
          {openState === true
            ? <span className="nx-open-chip"><span aria-hidden="true" className="nx-pulse-dot" /> Open Now</span>
            : openState === false
              ? <span className="nx-closed-chip"><span aria-hidden="true">●</span> Closed</span>
              : <span className="nx-info-right">Hours unavailable</span>}
        </div>
        <div className="premium-salon-actions nx-card-actions">
          <button type="button" className="premium-view-button" onClick={() => navigate(`/salons/${item.website.slug}`)}>View Salon</button>
          <button type="button" className="premium-book-now-button" onClick={() => navigate(`/app/customer/?salon=${item.id}&returnTo=${encodeURIComponent(`/salons/${item.website.slug}`)}`)}>Book Now</button>
        </div>
      </div>
    </article>
  );
}


const EMPTY_MARKETPLACE: SalonMarketplace = { services: [], staff: [], hours: [], offers: [] };


function useMarketplaceStats(online: boolean) {
  const [statsBySalon, setStatsBySalon] = useState<Record<string, SalonStats>>({});
  // Keep the RPC array as well as the existing lookup map. Section 14 uses the
  // array so its source order remains intact instead of reconstructing a new
  // client-side ranking from the per-salon aggregates.
  const [statsRows, setStatsRows] = useState<SalonStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const client = getClient();
      if (!client) return;
      const { data, error: rpcError } = await client.rpc("marketplace_salon_stats");
      if (rpcError) throw rpcError;
      const rows = (data ?? []) as SalonStats[];
      const map: Record<string, SalonStats> = {};
      for (const row of rows) map[row.salon_id] = row;
      setStatsRows(rows);
      setStatsBySalon(map);
    } catch {
      // Salon cards retain their existing catalog-column fallback. The review
      // section separately reports that its public aggregate could not load.
      setError(true);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  return { statsBySalon, statsRows, loading, error, load };
}

/** Most-booked services across the published catalog. */
function usePopularServices(online: boolean) {
  const [services, setServices] = useState<PopularService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(false);
    try {
      const client = getClient();
      if (!client) throw new Error("Marketplace client unavailable");
      const { data, error: rpcError } = await client.rpc("marketplace_popular_services", { p_limit: 6 });
      if (rpcError) throw rpcError;
      if (version === requestVersion.current) setServices((data ?? []) as PopularService[]);
    } catch {
      // Keep already-loaded aggregate rows during a failed refresh. Raw backend
      // details never leave this hook; Section 12 receives only a boolean.
      if (version === requestVersion.current) setError(true);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => {
      window.clearTimeout(t);
      requestVersion.current += 1;
    };
  }, [load, online]);
  return { services, loading, load, error };
}

/** Admin-configurable homepage section order + visibility. */
function useHomepageSections(online: boolean) {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const t = window.setTimeout(async () => {
      try {
        const client = getClient();
        if (!client) { setReady(true); return; }
        const { data, error } = await client.rpc("marketplace_homepage_sections");
        if (error) throw error;
        if (active) setSections((data ?? []) as HomepageSection[]);
      } catch { /* default: show everything */ } finally { if (active) setReady(true); }
    }, 0);
    return () => { active = false; window.clearTimeout(t); };
  }, [online]);
  const visible = (key: string) => {
    const row = sections.find((s) => s.section_key === key);
    return row ? row.visible : true;
  };
  return { sections, ready, visible };
}

/** Recently viewed (logged-in + consent only). */
function useRecentlyViewed(online: boolean, session: Session | null) {
  const [rows, setRows] = useState<RecentlyViewedRow[]>([]);
  const [consent, setConsent] = useState(false);
  const [consentLoaded, setConsentLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const t = window.setTimeout(async () => {
      try {
        const client = getClient();
        if (!client || !session?.user) { setConsentLoaded(true); return; }
        const { data } = await client.from("profiles").select("allow_recently_viewed").eq("id", session.user.id).maybeSingle();
        if (active) { setConsent(Boolean((data as { allow_recently_viewed?: boolean } | null)?.allow_recently_viewed)); setConsentLoaded(true); }
      } catch { if (active) setConsentLoaded(true); }
    }, 0);
    return () => { active = false; window.clearTimeout(t); };
  }, [online, session]);

  const load = useCallback(async () => {
    const client = getClient();
    if (!client) { setRows([]); return; }
    setLoading(true);
    try {
      const { data, error } = await client.rpc("my_recently_viewed", { p_limit: 6 });
      if (error) throw error;
      setRows((data ?? []) as RecentlyViewedRow[]);
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!online || !session?.user || !consent) setRows([]);
      else void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [online, session, consent, load]);

  const setConsentPref = async (value: boolean) => {
    const client = getClient();
    if (!client || !session?.user) return;
    const { error } = await client.from("profiles").update({ allow_recently_viewed: value }).eq("id", session.user.id);
    if (!error) { setConsent(value); if (value) void load(); else setRows([]); }
  };
  return { rows, consent, consentLoaded, loading, setConsentPref };
}

/** Membership plans (active only, no payment details). */
function useMembershipPlans(online: boolean) {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = getClient(); if (!client) return;
      const { data, error } = await client.rpc("marketplace_membership_plans");
      if (error) throw error;
      setPlans((data ?? []) as MembershipPlan[]);
    } catch { setPlans([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  return { plans, loading };
}

/** Current customer membership status (own row; server decides eligibility). */
function useMyMembership(online: boolean, session: Session | null) {
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const t = window.setTimeout(async () => {
      try {
        const client = getClient();
        if (!client || !session?.user) { setLoading(false); return; }
        const { data, error } = await client.rpc("my_membership_status");
        if (error) throw error;
        if (active) setStatus(((data ?? [])[0] as MembershipStatus) ?? null);
      } catch { /* no membership */ } finally { if (active) setLoading(false); }
    }, 0);
    return () => { active = false; window.clearTimeout(t); };
  }, [online, session]);
  return { status, loading };
}

/** Admin-managed categories (approved + active, admin order). */
function useMarketplaceCategories(online: boolean) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Section 05: surface the live failure (friendly text) so the section can
  // offer a real Retry instead of silently looking empty. Data source stays
  // the same `marketplace_categories` RPC.
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const client = getClient(); if (!client) return;
      const { data, error } = await client.rpc("marketplace_categories");
      if (error) throw error;
      setCategories((data ?? []) as CategoryRow[]);
    } catch (cause) { setCategories([]); setError(friendlyError(cause)); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  return { categories, loading, load, error };
}

/** Admin-sponsored shops/brands/videos (active + in window, published salons). */
function useSponsored(online: boolean) {
  const [sponsored, setSponsored] = useState<SponsoredData>({ shops: [], brands: [], videos: [] });
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = getClient(); if (!client) return;
      const { data, error } = await client.rpc("marketplace_sponsored");
      if (error) throw error;
      setSponsored((data ?? { shops: [], brands: [], videos: [] }) as SponsoredData);
    } catch { /* keep empty */ } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  useEffect(() => {
    if (!loading && online) {
      for (const sh of sponsored.shops) clientRpcSafe("record_sponsored_event", { p_content_type: "shop", p_content_id: sh.id, p_event_type: "impression" });
      for (const b of sponsored.brands) clientRpcSafe("record_sponsored_event", { p_content_type: "brand", p_content_id: b.id, p_event_type: "impression" });
      for (const v of sponsored.videos) clientRpcSafe("record_sponsored_event", { p_content_type: "video", p_content_id: v.id, p_event_type: "impression" });
    }
  }, [loading, online, sponsored]);
  return { sponsored, loading, load };
}

/** Fire-and-forget RPC (non-critical tracking). */
function clientRpcSafe(name: string, args: Record<string, unknown>) {
  const client = getClient();
  if (!client) return;
  void client.rpc(name, args).then(() => {});
}

/** Record a sponsored click — no personal data (content + date counters only). */
function recordSponsoredClick(kind: "shop" | "brand" | "video", id: string) {
  clientRpcSafe("record_sponsored_event", { p_content_type: kind, p_content_id: id, p_event_type: "click" });
}

/** Top rated — Bayesian weighted rating, min-review threshold. */
function useTopRated(online: boolean) {
  const [rows, setRows] = useState<TopRatedRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Section 10: surface a friendly failure flag so the section can offer a
  // real Retry (raw error text never reaches the public UI).
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const client = getClient(); if (!client) return;
      // Backend ranking contract preserved: marketplace_top_rated with the
      // existing minimum-review rule (p_min_reviews: 1). The candidate pool is
      // widened (frontend parameter only) so the Jaipur eligibility filter can
      // still surface up to five real salons.
      const { data, error } = await client.rpc("marketplace_top_rated", { p_min_reviews: 1, p_limit: 20 });
      if (error) throw error;
      setRows((data ?? []) as TopRatedRow[]);
    } catch (cause) { setRows([]); setError(friendlyError(cause)); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  return { rows, loading, load, error };
}

/** Trending — time-decayed score (bookings/events/reviews) + admin overrides. */
function useTrending(online: boolean) {
  const [rows, setRows] = useState<TrendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(false);
    try {
      const client = getClient(); if (!client) throw new Error("Marketplace client unavailable");
      const { data, error: rpcError } = await client.rpc("marketplace_trending", { p_limit: 6 });
      if (rpcError) throw rpcError;
      if (version === requestVersion.current) setRows((data ?? []) as TrendingRow[]);
    } catch {
      // Preserve trusted rows during retry failure; never expose RPC/SQL text.
      if (version === requestVersion.current) setError(true);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => {
      window.clearTimeout(t);
      requestVersion.current += 1;
    };
  }, [load, online]);
  return { rows, loading, load, error };
}

/** Record public-marketplace interaction events (auth required, deduped server-side). */
function recordMarketplaceEvent(salonId: string, eventType: "view" | "search_click") {
  const client = getClient();
  if (!client) return;
  void client.rpc("record_marketplace_event", { p_salon_id: salonId, p_event_type: eventType }).then(() => {});
}

type NearbyRow = {
  id: string; slug: string; name: string; business_category: string | null;
  area: string | null; city: string | null; latitude: number; longitude: number;
  approval_status: "approved";
  rating_avg: number; review_count: number;
  starting_price_paise: number | null; cover_image_path: string | null;
};

/**
 * Nearby salons use only `business_locations.approval_status = 'approved'`.
 * Private device coordinates come from navigator.geolocation.watchPosition()
 * (or the same user's labelled saved GPS fallback), and every distance is
 * computed locally. Pending and legacy salon coordinates are never ranked.
 *
 * The list re-ranks automatically whenever the customer moves more than 100 m —
 * no page refresh required.
 */
function useNearby(online: boolean) {
  const [rows, setRows] = useState<NearbyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const catalog = await fetchCatalog();
      const approvedRows = catalog
        .filter((item) =>
          item.approval_status === "approved" &&
          typeof item.latitude === "number" &&
          typeof item.longitude === "number",
        )
        .slice(0, 60)
        .map((item): NearbyRow => ({
          id: item.id,
          slug: item.website.slug,
          name: item.name,
          business_category: item.business_category ?? null,
          area: item.area ?? null,
          city: item.city ?? null,
          latitude: item.latitude as number,
          longitude: item.longitude as number,
          approval_status: "approved",
          rating_avg: Number(item.rating_average),
          review_count: Number(item.review_count),
          starting_price_paise: item.starting_price_paise ?? null,
          cover_image_path: item.cover_image_path ?? null,
        }));
      setRows(approvedRows);
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  return { rows, loading, load };
}

/** Short status line that never calls a saved reading "live". */
function locationHeadline(location: UseLocationResult): string {
  const freshness = locationFreshness(location.fix);
  if (freshness === "saved" || freshness === "stale") {
    return `Sorted from your clearly labelled saved GPS reading (${formatAccuracy(location.fix?.accuracy)} accuracy) while Nexora refreshes it.`;
  }
  switch (location.status) {
    case "ready":
      return `Sorted by fresh device GPS (${formatAccuracy(location.fix?.accuracy)} accuracy). Your signed-in location is privately reused across Nexora apps.`;
    case "improving":
      return "Improving your location…";
    case "acquiring":
    case "prompting":
      return "Locating you… allow location to see the closest approved salons first.";
    case "denied":
      return "GPS permission is denied. A saved real reading is used only if your account has one; otherwise distance sorting is off.";
    case "offline":
      return "You are offline — reconnect to refresh salons near you.";
    case "timeout":
      return "GPS is taking longer than usual. Keep this screen open or retry.";
    case "unsupported":
      return "This browser cannot access GPS. Nexora does not guess coordinates.";
    case "unavailable":
      return "No GPS signal is available. Nexora does not substitute fake coordinates.";
    default:
      return "Allow location to sort salons by real distance.";
  }
}

/** Permission/error fallback panel. It never manufactures a location. */
function LocationNotice({ location }: { location: UseLocationResult }) {
  const showNotice =
    location.status === "denied" || location.status === "unsupported" ||
    location.status === "unavailable" || location.status === "timeout" ||
    location.status === "saved" || location.status === "offline";
  if (!showNotice && !location.error) return null;
  return (
    <div className="state-card" style={{ textAlign: "left", padding: 20, marginBottom: 18 }} role="status" aria-live="polite">
      <p style={{ margin: 0, fontWeight: 600, color: "var(--primary)" }}>
        {location.error?.message ?? location.message}
      </p>
      {location.fix?.source === "saved" && (
        <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 13 }}>
          Saved GPS from {new Date(location.fix.timestamp).toLocaleString()} is not a live reading.
        </p>
      )}
      {!location.fix && (
        <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 13 }}>
          No saved GPS is available for this account, so no distance is shown.
        </p>
      )}
      <div className="button-row" style={{ marginTop: 12 }}>
        <button className="secondary" onClick={location.retry}>Retry location</button>
      </div>
    </div>
  );
}

/** One salon card inside a distance section. */
function NearbyDistanceCard({ row, navigate }: { row: RankedItem<NearbyRow>; navigate: (path: string) => void }) {
  const cover = row.cover_image_path?.startsWith("http") ? row.cover_image_path : null;
  return (
    <article className="salon-card">
      <div className="salon-visual" style={cover ? { backgroundImage: `url("${cover.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        {!cover && <span>✦</span>}<em>Verified</em>
      </div>
      <div className="salon-body">
        <div className="salon-meta">
          <span>{row.business_category ?? "Salon"}</span>
          <span>📍 {row.distanceKm != null ? formatDistance(row.distanceKm) : "Distance unavailable"}</span>
        </div>
        <h3>{row.name}</h3>
        <p>{row.area ?? row.city}, {row.city}</p>
        <div className="salon-meta"><span>★ {Number(row.rating_avg ?? 0).toFixed(1)} ({Number(row.review_count ?? 0)})</span></div>
        <div className="salon-bottom">
          <b>From {money(row.starting_price_paise)}</b>
          <button onClick={() => navigate(`/salons/${row.slug}`)}>View salon</button>
        </div>
      </div>
    </article>
  );
}

type RecommendationRow = {
  id: string; slug: string; name: string; business_category: string | null;
  area: string | null; city: string | null; rating_avg: number; review_count: number;
  booking_count: number; starting_price_paise: number | null; cover_image_path: string | null;
  score: number; reason: string; personalized: boolean;
};

/**
 * Recommended — logged-in customers get personalized signals (bookings,
 * favourites, preferred city/area/category, price band, browsing clicks,
 * review activity, membership) computed server-side on auth.uid(); guests get
 * the deterministic fallback (popular + top rated + active offers). Only
 * published/verified/active salons are ever returned; reasons are public-safe.
 */
function useRecommendations(online: boolean, session: Session | null) {
  const [rows, setRows] = useState<RecommendationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);
  // Section 11: friendly failure flag for the section's honest error state
  // (raw error text never reaches the public UI).
  const [error, setError] = useState("");
  // Cross-user protection: the user id the current in-memory rows belong to.
  // On login/logout/user-switch the previous (possibly personalized) rows are
  // cleared immediately, so User A's signals can never leak to User B or to a
  // logged-out visitor.
  const rowsOwnerIdRef = useRef<string | null | undefined>(undefined);
  // Race guard: a stale response (previous session/refetch) can never
  // overwrite the result of a newer request.
  const fetchTokenRef = useRef(0);
  const load = useCallback(async () => {
    const token = ++fetchTokenRef.current;
    setLoading(true); setError("");
    try {
      const client = getClient(); if (!client) { if (token === fetchTokenRef.current) setLoading(false); return; }
      const { data, error } = await client.rpc("marketplace_recommendations", { p_limit: 6 });
      if (error) throw error;
      if (token !== fetchTokenRef.current) return; // stale response — ignore
      const list = (data ?? []) as RecommendationRow[];
      setRows(list);
      setIsPersonalized(list.some((r) => r.personalized));
      rowsOwnerIdRef.current = session?.user?.id ?? null;
    } catch (cause) {
      if (token === fetchTokenRef.current) { setRows([]); setIsPersonalized(false); setError(friendlyError(cause)); }
    } finally {
      if (token === fetchTokenRef.current) setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    const uid = session?.user?.id ?? null;
    if (rowsOwnerIdRef.current !== undefined && rowsOwnerIdRef.current !== uid) {
      // Session changed (logout/switch): wipe personalized in-memory state
      // before the fresh fetch resolves.
      setRows([]);
      setIsPersonalized(false);
    }
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online, session]);
  return { rows, loading, isPersonalized, load, error };
}

/**
 * Customer-specific suggestions when a customer is logged in: rank the
 * catalog by the customer's preferred city/area/gender (profiles row — own
 * read allowed by RLS) and surface favorited salons (favorite_salons —
 * own rows). Falls back to a generic top-rated list for everyone else.
 */
function useCustomerSuggestions(online: boolean, session: Session | null, items: CatalogItem[]) {
  const [prefs, setPrefs] = useState<{ city: string | null; area: string | null; gender: string | null }>({ city: null, area: null, gender: null });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const client = getClient();
        if (!client || !session?.user) { setReady(true); return; }
        const [profileRes, favRes] = await Promise.all([
          client.from("profiles").select("preferred_city,preferred_area,gender").eq("id", session.user.id).maybeSingle(),
          client.from("favorite_salons").select("salon_id").eq("user_id", session.user.id),
        ]);
        if (!active) return;
        const row = profileRes.data as { preferred_city?: string | null; preferred_area?: string | null; gender?: string | null } | null;
        setPrefs({ city: row?.preferred_city ?? null, area: row?.preferred_area ?? null, gender: row?.gender ?? null });
        setFavorites(((favRes.data ?? []) as { salon_id: string }[]).map((f) => f.salon_id).filter((id) => items.some((i) => i.id === id)));
      } catch { /* suggestions are best-effort */ } finally { if (active) setReady(true); }
    };
    const t = window.setTimeout(() => { if (online) void load(); else setReady(true); }, 0);
    return () => { active = false; window.clearTimeout(t); };
  }, [online, session, items]);

  const personalized = useMemo(() => {
    const hasPrefs = Boolean(prefs.city || prefs.area || prefs.gender);
    if (!hasPrefs && !favorites.length) return null;
    const score = (item: CatalogItem) => {
      let s = 0;
      if (prefs.city && item.city?.toLowerCase() === prefs.city.toLowerCase()) s += 3;
      if (prefs.area && item.area?.toLowerCase() === prefs.area.toLowerCase()) s += 2;
      const category = (item.business_category ?? "").toLowerCase();
      if (prefs.gender === "female" && /women|female|ladies/.test(category)) s += 2;
      if (prefs.gender === "male" && /men|male|gents/.test(category)) s += 2;
      if (favorites.includes(item.id)) s += 4;
      return s;
    };
    const scored = items.map((i) => ({ item: i, score: score(i) })).filter((x) => x.score > 0);
    if (!scored.length) return null;
    return scored.sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.item);
  }, [prefs, favorites, items]);

  return { prefs, favorites, personalized, ready };
}

/**
 * Fetches Owner PWA managed data for one salon from the canonical DB tables
 * (services, staff, salon_hours, offers) — all anon-readable via RLS.
 * Each read is isolated so a missing/empty table never blocks the page.
 */
async function fetchSalonMarketplace(client: SupabaseClient, salonId: string): Promise<SalonMarketplace> {
  const [servicesRes, staffRes, hoursRes, offersRes] = await Promise.all([
    client
      .from("services")
      .select("id,name,description,duration_minutes,price_paise,image_path")
      .eq("salon_id", salonId)
      .eq("is_active", true)
      .eq("is_bookable_online", true)
      .is("deleted_at", null)
      .order("name"),
    client
      .from("staff")
      .select("id,name,role,specialty,avatar_path")
      .eq("salon_id", salonId)
      .is("deleted_at", null)
      .order("name"),
    client
      .from("salon_hours")
      .select("day_of_week,opens_at,closes_at,is_closed")
      .eq("salon_id", salonId)
      .order("day_of_week"),
    client
      .from("offers")
      .select("id,salon_id,name,description,discount_type,discount_value,valid_until")
      .eq("salon_id", salonId)
      .eq("is_active", true),
  ]);
  return {
    services: (servicesRes.data ?? []) as ServiceRow[],
    staff: (staffRes.data ?? []) as StaffRow[],
    hours: (hoursRes.data ?? []) as HoursRow[],
    offers: (offersRes.data ?? []) as OfferRow[],
  };
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatHours(opens: string | null, closes: string | null): string {
  if (!opens || !closes) return "Hours unavailable";
  const to12 = (v: string) => {
    const [h, m] = v.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
  };
  return `${to12(opens)} – ${to12(closes)}`;
}

function SalonPage({
  slug,
  navigate,
  online,
  refCode,
}: {
  slug: string;
  navigate: (path: string) => void;
  online: boolean;
  refCode: string;
}) {
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [marketplace, setMarketplace] = useState<SalonMarketplace>(EMPTY_MARKETPLACE);
  const [stats, setStats] = useState<SalonStats | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [slotsDate, setSlotsDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Live GPS distance from the shared LocationService (watchPosition only).
  const location = useLocation();
  const [isFavourite, setIsFavourite] = useState(false);
  // Haversine, computed on-device — no Distance Matrix, no external call.
  const distanceKm = useMemo(() => {
    if (
      !location.fix || item?.approval_status !== "approved" ||
      item.latitude == null || item.longitude == null
    ) return null;
    return haversineKm(location.fix.latitude, location.fix.longitude, Number(item.latitude), Number(item.longitude));
  }, [location.fix, item?.approval_status, item?.latitude, item?.longitude]);
  const [nextSlot, setNextSlot] = useState<string | null>(null);
  const [similar, setSimilar] = useState<NearbyRow[]>([]);
  const [shareToast, setShareToast] = useState(false);
  const { session: mySession } = useAuth();
  const myUserId = mySession?.user?.id ?? null;
  const { plans: membershipPlans } = useMembershipPlans(online);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const client = getClient();
      const catalog = await fetchCatalog();
      const match = catalog.find((entry) => entry.website.slug === slug);
      if (!match) throw new Error("This salon website is not published or is unavailable.");
      setItem(match);
      if (client) {
        // Canonical owner data from DB tables; page still renders on failure.
        setMarketplace(await fetchSalonMarketplace(client, match.id));
        const { data: statsRows } = await client.rpc("marketplace_salon_stats");
        const row = ((statsRows ?? []) as SalonStats[]).find((r) => r.salon_id === match.id);
        if (row) setStats(row);
        // Trending signal: record an authenticated view (deduped per day).
        recordMarketplaceEvent(match.id, "view");
        // Next available slot + similar shops (public RPCs).
        const { data: ns } = await client.rpc("marketplace_next_slots", { p_salon_ids: [match.id], p_tz: "Asia/Kolkata" });
        if ((ns ?? [])[0]?.next_slot_iso) setNextSlot(String((ns ?? [])[0].next_slot_iso));
        const sim = catalog
          .filter((candidate) =>
            candidate.id !== match.id &&
            candidate.approval_status === "approved" &&
            (candidate.area === match.area || candidate.city === match.city),
          )
          .slice(0, 3)
          .map((candidate): NearbyRow => ({
            id: candidate.id,
            slug: candidate.website.slug,
            name: candidate.name,
            business_category: candidate.business_category ?? null,
            area: candidate.area ?? null,
            city: candidate.city ?? null,
            latitude: candidate.latitude as number,
            longitude: candidate.longitude as number,
            approval_status: "approved",
            rating_avg: Number(candidate.rating_average),
            review_count: Number(candidate.review_count),
            starting_price_paise: candidate.starting_price_paise ?? null,
            cover_image_path: candidate.cover_image_path ?? null,
          }));
        setSimilar(sim);
        // Favourite state (own rows only). Session comes from the shared provider.
        if (myUserId) {
          const { data: fav } = await client.from("favorite_salons").select("salon_id").eq("user_id", myUserId).eq("salon_id", match.id).maybeSingle();
          setIsFavourite(Boolean(fav));
        }
      }
    } catch (cause) { setError(friendlyError(cause)); } finally { setLoading(false); }
  }, [myUserId, slug]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (online) void load();
      else { setLoading(false); setError("You are offline. Reconnect and retry."); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, online]);
  const loadSlots = useCallback(async (dateStr: string, serviceId?: string) => {
    const client = getClient();
    const firstService = serviceId ?? marketplace.services[0]?.id;
    if (!client || !firstService) { setSlots([]); return; }
    setSlotsLoading(true);
    try {
      const { data, error } = await client.rpc("marketplace_slots", {
        p_salon_id: item?.id,
        p_service_ids: [firstService],
        p_date: dateStr,
        p_tz: "Asia/Kolkata",
      });
      if (error) throw error;
      setSlots((data ?? []) as SlotRow[]);
    } catch { setSlots([]); } finally { setSlotsLoading(false); }
  }, [item, marketplace.services]);
  useEffect(() => {
    if (!item) return;
    const t = window.setTimeout(() => void loadSlots(slotsDate), 0);
    return () => window.clearTimeout(t);
  }, [item, slotsDate, loadSlots]);

  if (loading) return <main className="section page-top"><SalonSkeletons count={1} /></main>;
  if (error || !item) return <main className="center-page"><StateCard title="Salon unavailable" text={error || "This website is not public."} action="Back to salons" onAction={() => navigate("/salons")} /></main>;
  const config = item.website.config as { profile?: Record<string, unknown>; services?: Array<Record<string, unknown>>; staff?: Array<Record<string, unknown>>; photos?: unknown; amenities?: unknown };
  const configServices = Array.isArray(config.services) ? config.services : [];
  const configStaff = Array.isArray(config.staff) ? config.staff : [];
  const configProfile = (config.profile ?? {}) as { opening_hours?: { opens?: string; closes?: string } };
  // DB is the source of truth; website config is the fallback (owner may
  // still be publishing via the proposal payload before using the PWA CRUD).
  const services = marketplace.services.length
    ? marketplace.services.map((s) => ({ id: s.id, name: s.name, description: s.description ?? "Professional salon service", duration_minutes: s.duration_minutes ?? 0, price_paise: s.price_paise ?? 0 }))
    : configServices;
  const staffRows = marketplace.staff.length
    ? marketplace.staff.map((s) => ({ id: s.id, name: s.name, role: s.role ?? "Stylist", specialty: s.specialty ?? null }))
    : configStaff.map((s) => ({ id: String(s.id ?? ""), name: String(s.name ?? "Professional"), role: String(s.role ?? "Stylist"), specialty: s.specialty != null ? String(s.specialty) : null }));
  const configOpening = configProfile.opening_hours;
  const openingSummary = marketplace.hours.length
    ? marketplace.hours
    : configOpening?.opens
      ? [{ day_of_week: -1, opens_at: configOpening.opens, closes_at: configOpening.closes ?? null, is_closed: false }]
      : [];
  const customerPortalBookingPath = (serviceName?: string) => {
    const params = new URLSearchParams();
    // Pass only the public salon id and a safe return path; never tokens.
    params.set("salon", item.id);
    params.set("returnTo", `/salons/${encodeURIComponent(slug)}`);
    if (serviceName) params.set("service", serviceName);
    // Preserve partner attribution into the booking handoff.
    if (refCode) params.set("ref", refCode);
    return `/app/customer/?${params.toString()}`;
  };
  const customerPortalBookingPathForSlot = (slotStart: string) => {
    const params = new URLSearchParams();
    params.set("salon", item.id);
    params.set("returnTo", `/salons/${encodeURIComponent(slug)}`);
    params.set("slot", slotStart);
    if (refCode) params.set("ref", refCode);
    return `/app/customer/?${params.toString()}`;
  };
  // open/closed NOW (Asia/Kolkata)
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const nowMinutes = nowIST.getHours() * 60 + nowIST.getMinutes();
  const todayHours = openingSummary.find((h) => h.day_of_week === nowIST.getDay()) ?? openingSummary[0];
  const isOpenNow = Boolean(todayHours && !todayHours.is_closed && todayHours.opens_at && todayHours.closes_at
    && nowMinutes >= Number(String(todayHours.opens_at).split(":").slice(0, 2).join(".").split(".")[0]) * 60 + Number(String(todayHours.opens_at).split(":")[1] ?? 0)
    && nowMinutes <= Number(String(todayHours.closes_at).split(":")[0]) * 60 + Number(String(todayHours.closes_at).split(":")[1] ?? 0));
  const gallery = (() => {
    const photos = Array.isArray(config.photos) ? (config.photos as string[]).filter((p) => typeof p === "string" && p.startsWith("http")) : [];
    const cover = item.cover_image_path?.startsWith("http") ? item.cover_image_path : null;
    return Array.from(new Set([...(cover ? [cover] : []), ...photos])).slice(0, 6);
  })();
  const amenities = Array.isArray(config.amenities) ? (config.amenities as string[]).filter((a) => typeof a === "string") : [];
  const maxMemberDiscount = membershipPlans.length ? Math.max(...membershipPlans.map((p) => Number(p.discount_percent))) : 0;
  const mapsUrl = item.approval_status === "approved" && item.latitude != null && item.longitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.address} ${item.city}`)}`;
  const toggleFavourite = async () => {
    const client = getClient();
    if (!client || !mySession?.user) { navigate("/auth/login"); return; }
    if (isFavourite) {
      const { error } = await client.from("favorite_salons").delete().eq("user_id", mySession.user.id).eq("salon_id", item.id);
      if (!error) setIsFavourite(false);
    } else {
      const { error } = await client.from("favorite_salons").insert({ user_id: mySession.user.id, salon_id: item.id });
      if (!error) setIsFavourite(true);
    }
  };
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: item.name, text: `Check out ${item.name} on Nexora`, url }); return; }
      await navigator.clipboard.writeText(url);
      setShareToast(true); window.setTimeout(() => setShareToast(false), 2000);
    } catch { /* user cancelled */ }
  };
  return (
    <main>
      <section className="store-hero" style={item.cover_image_path?.startsWith("http") ? { backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.55)), url("${item.cover_image_path.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center", color: "#fff" } : undefined}><span className="verified-pill">✓ Nexora verified</span>{stats?.partner_onboarded && <span className="verified-pill" style={{ background: "var(--cream)", color: "var(--primary)" }}>✦ Partner onboarded</span>}<h1>{item.name}</h1><p style={{ color: "inherit" }}>{String(config.profile?.description ?? item.description ?? "Professional beauty services.")}</p><div className="store-facts"><span>★ {stats ? Number(stats.rating_avg).toFixed(1) : Number(item.rating_average).toFixed(1)} ({stats ? Number(stats.review_count) : Number(item.review_count)} reviews)</span><span>⌖ {item.area ?? item.city}, {item.city}</span>{stats && Number(stats.booking_count) > 0 && <span>📅 {Number(stats.booking_count)} bookings</span>}{openingSummary.length > 0 && <span>🕑 {formatHours(String(openingSummary[0].opens_at ?? ""), String(openingSummary[0].closes_at ?? ""))}</span>}{todayHours && <span>{isOpenNow ? "🟢 Open now" : "🔴 Closed now"}</span>}{distanceKm != null && <span>📍 {formatDistance(distanceKm)} away</span>}{distanceKm == null && location.status === "denied" && <span>📍 location off</span>}{nextSlot && <span>⏭ next {new Date(nextSlot).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</span>}</div>
      <div className="button-row" style={{ marginTop: 8 }}><button className="primary" onClick={() => navigate(customerPortalBookingPath())}>Book Now</button><button className="secondary" onClick={() => window.open(mapsUrl, "_blank", "noopener")}>Directions ↗</button><button className="secondary" onClick={() => void toggleFavourite()}>{isFavourite ? "♥ Saved" : "♡ Save"}</button><button className="secondary" onClick={() => void handleShare()}>Share</button></div>
      {shareToast && <p style={{ fontSize: 12, color: "#2e7d32" }}>Link copied to clipboard.</p>}
      {maxMemberDiscount > 0 && <p className="preview-note" style={{ color: "inherit" }}>✦ Nexora members save up to {maxMemberDiscount}% here — benefits apply automatically at booking.</p>}
      <p className="preview-note" style={{ color: "inherit" }}>Bookings, payment, history, reviews, and support are owned by the Customer PWA.</p></section>
      {gallery.length > 1 && (
        <section className="section" style={{ paddingTop: 8 }}>
          <div className="button-row" style={{ overflowX: "auto", flexWrap: "nowrap" }}>{gallery.map((g, i) => <img key={i} src={g} alt={`${item.name} photo ${i + 1}`} style={{ width: 160, height: 100, objectFit: "cover", borderRadius: 12, flexShrink: 0 }} loading="lazy" referrerPolicy="no-referrer" />)}</div>
        </section>
      )}
      <section className="section"><div className="section-heading"><span className="eyebrow">Services</span><h2>Choose your service</h2><p>Browse the owner-published catalog, then continue to the Customer PWA to book.</p></div>
      {!services.length ? <StateCard title="No services published yet" text="This salon has not published bookable services." /> : <div className="service-grid">{services.map((service, index) => <article className="service-card" key={String(service.id ?? index)}><div><h3>{String(service.name ?? "Salon service")}</h3><p>{String(service.description ?? "Professional salon service")}</p><small>{Number(service.duration_minutes ?? 0)} minutes</small></div><div><b>{money(Number(service.price_paise ?? 0))}</b><button className="text-button" onClick={() => navigate(customerPortalBookingPath(String(service.name ?? "")))}>Continue in Customer app</button></div></article>)}</div>}</section>
      {staffRows.length > 0 && (
        <section className="section" style={{ background: "var(--cream)" }}>
          <div className="section-heading"><span className="eyebrow">Team</span><h2>Meet the team</h2><p>Staff managed by the shop owner — live from the shared Supabase project.</p></div>
          <div className="role-grid">{staffRows.map((staff) => <article className="role-card" key={staff.id || staff.name}><span className="role-icon">✦</span><h3>{staff.name}</h3><p>{staff.role}{staff.specialty ? ` · ${staff.specialty}` : ""}</p></article>)}</div>
        </section>
      )}
      {amenities.length > 0 && (
        <section className="section">
          <div className="section-heading"><span className="eyebrow">Amenities</span><h2>What you get</h2><p>Facilities and comforts offered by the shop.</p></div>
          <div className="button-row">{amenities.map((a) => <span key={a} className="secondary compact" style={{ padding: "6px 12px", fontSize: 12 }}>✓ {a}</span>)}</div>
        </section>
      )}
      {openingSummary.length > 0 && (
        <section className="section">
          <div className="section-heading"><span className="eyebrow">Opening hours</span><h2>When to visit</h2><p>Weekly opening hours set by the shop owner.</p></div>
          <div className="role-grid">{openingSummary.map((hours, index) => <article className="role-card" key={hours.day_of_week === -1 ? "default" : hours.day_of_week}><span className="role-icon">🕑</span><h3>{hours.day_of_week === -1 ? "Open daily" : DAY_NAMES[hours.day_of_week]}</h3><p>{hours.is_closed ? "Closed" : formatHours(hours.opens_at, hours.closes_at)}</p></article>)}</div>
        </section>
      )}
      {marketplace.offers.length > 0 && (
        <section className="section" style={{ background: "var(--cream)" }}>
          <div className="section-heading"><span className="eyebrow">Offers</span><h2>Active offers</h2><p>Live offers published by the shop owner.</p></div>
          <div className="service-grid">{marketplace.offers.map((offer) => <article className="service-card" key={offer.id}><div><h3>{offer.name ?? "Offer"}</h3><p>{offer.description || ""}</p><small>{offer.discount_type === "percent" ? `${offer.discount_value}% off` : offer.discount_value != null ? `${money(offer.discount_value * 100)} off` : "Limited offer"}</small></div><button className="text-button" onClick={() => navigate(customerPortalBookingPath())}>Book now</button></article>)}</div>
        </section>
      )}
      <section className="section" style={{ background: "var(--cream)" }}>
        <div className="section-heading"><span className="eyebrow">Availability</span><h2>Available slots</h2><p>Live server-verified slots — opening hours, staff schedules, buffers and existing bookings are all checked before anything is shown.</p></div>
        <label style={{ marginBottom: 10, display: "inline-block" }}>Date <input type="date" value={slotsDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setSlotsDate(e.target.value)} /></label>
        {slotsLoading ? <SalonSkeletons count={3} /> : slots.length ? (
          <div className="button-row">{slots.slice(0, 12).map((slot, i) => (
            <button key={i} className="secondary compact" onClick={() => navigate(customerPortalBookingPathForSlot(slot.slot_start))}>
              {new Date(slot.slot_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} {slot.staff_name ? `· ${slot.staff_name}` : ""}
            </button>
          ))}</div>
        ) : <StateCard title="No slots available" text="This salon has no bookable slot for the selected date — try another date." />}
        <p className="section-hint" style={{ marginTop: 8 }}><small>Slots revalidate at booking time in the Customer app — double-booking is blocked server-side.</small></p>
      </section>

      {(stats?.recent_reviews?.length ?? 0) > 0 && (
        <section className="section">
          <div className="section-heading"><span className="eyebrow">Reviews</span><h2>Customer reviews</h2><p>What customers say about {item.name} — {Number(stats?.review_count ?? 0)} review{Number(stats?.review_count ?? 0) === 1 ? "" : "s"}.</p></div>
          <div className="service-grid">{(stats?.recent_reviews ?? []).slice(0, 4).map((r, i) => <article className="service-card" key={i}><div><h3>★ {Number(r.rating).toFixed(1)}</h3><p>“{r.comment}”</p><small>{r.author}{r.verified_booking ? " · ✓ verified booking" : ""}</small></div></article>)}</div>
        </section>
      )}
      {similar.length > 0 && (
        <section className="section">
          <div className="section-heading"><span className="eyebrow">You may also like</span><h2>Similar salons nearby</h2><p>Other published salons in the same area or city.</p></div>
          <div className="salon-grid">{similar.map((row) => <article key={row.id} className="salon-card"><div className="salon-visual" style={row.cover_image_path?.startsWith("http") ? { backgroundImage: `url("${row.cover_image_path.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!row.cover_image_path?.startsWith("http") && <span>✦</span>}<em>Verified</em></div><div className="salon-body"><div className="salon-meta"><span>{row.business_category ?? "Salon"}</span><span>📍 Approved location</span></div><h3>{row.name}</h3><p>{row.area ?? row.city}, {row.city}</p><div className="salon-bottom"><b>From {money(row.starting_price_paise)}</b><button onClick={() => { window.scrollTo({ top: 0 }); navigate(`/salons/${row.slug}`); }}>View salon</button></div></div></article>)}</div>
        </section>
      )}
      <section className="section salon-info"><div><span className="eyebrow">Visit</span><h2>{item.name}</h2><p>{item.address}, {item.city}{item.area ? ` · ${item.area}` : ""}</p>{item.phone && <p>📞 {item.phone}</p>}</div><div className="button-row"><button className="secondary" onClick={() => window.open(mapsUrl, "_blank", "noopener")}>Get directions ↗</button><button className="secondary" onClick={() => navigate("/cancellation-refund")}>Cancellation policy</button></div></section>
    </main>
  );
}

function LegacyBookingHandoff({ slug, navigate }: { slug: string; navigate: (path: string) => void }) {
  useEffect(() => {
    const params = new URLSearchParams({ salonSlug: slug, returnTo: `/salons/${encodeURIComponent(slug)}` });
    navigate(`/app/customer/?${params.toString()}`);
  }, [navigate, slug]);
  return <main className="center-page"><section className="entry-card"><span className="eyebrow">Customer PWA</span><h1>Opening secure booking</h1><p>Booking, payment, and booking history are owned by the Customer PWA.</p></section></main>;
}

function readAuthQueryParams() {
  if (typeof window === "undefined") {
    return { requested: null, returnTo: null, reason: null } as const;
  }
  const params = new URLSearchParams(window.location.search);
  const requestedReturnTo = params.get("returnTo");
  return {
    requested: params.get("role"),
    returnTo:
      requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//")
        ? requestedReturnTo
        : null,
    reason: params.get("reason"),
  } as const;
}

function mapRequestedRoleToPlatformRole(requested: string | null): Role {
  if (requested === "owner" || requested === "business_user") return "business_user";
  if (requested === "growth-partner" || requested === "growth_partner") return "growth_partner";
  if (requested === "delivery" || requested === "delivery_partner") return "delivery_partner";
  if (requested === "admin" || requested === "administrator") return "admin";
  if (requested === "customer") return "customer";
  return "customer";
}

// destinationForVerifiedRole lives in @nexora/auth (packages/auth/src/redirects.ts).
// Every verified role may resume any safe same-origin shell; role-home is only
// the fallback when returnTo is missing or unsafe. RLS still authorizes data.

function AuthPage({ mode, navigate, refCode }: { mode: "login" | "signup"; navigate: (path: string) => void; refCode: string }) {
  const [role, setRole] = useState<Role>("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("error");
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const googleOauthConfigured = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
  const [googleOauthFailed, setGoogleOauthFailed] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const {
    signIn,
    signUp,
    signInWithGoogle,
    resendVerification,
    requireAuth,
    configError,
  } = useAuth();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const { requested, reason } = readAuthQueryParams();
      if (requested) {
        const mapped = mapRequestedRoleToPlatformRole(requested);
        setRole(mode === "signup" && mapped === "admin" ? "customer" : mapped);
      }
      if (reason === "session-expired") {
        setMessage("Your session expired. Log in again to continue.");
        setMessageType("info");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mode]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    if (!trimmedEmail || !password) {
      setMessage("Email and password are required.");
      setMessageType("error");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setMessageType("error");
      return;
    }
    if (mode === "signup" && !trimmedName) {
      setMessage("Full name is required for new accounts.");
      setMessageType("error");
      return;
    }

    setBusy(true);
    setMessage("");
    setMessageType("error");
    try {
      if (mode === "signup") {
        const signupRole = normalizeSignupRole(role);
        const result = await signUp({
          email: trimmedEmail,
          password,
          fullName: trimmedName,
          role: signupRole,
          refCode: refCode || null,
          returnTo: readAuthQueryParams().returnTo,
        });
        if (result.needsEmailConfirmation || !result.session) {
          setNeedsVerification(true);
          setMessage("Account created. Check your email for a confirmation link before signing in.");
          setMessageType("success");
          return;
        }
      } else {
        await signIn({ email: trimmedEmail, password });
      }

      const { profile } = await requireAuth();
      const { returnTo } = readAuthQueryParams();
      navigate(destinationForVerifiedRole(profile.role, returnTo));
    } catch (cause) {
      const parsed = authErrorMessage(cause);
      setMessage(parsed);
      setMessageType(parsed.startsWith("Account created") || parsed.includes("check your email") ? "success" : "error");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    try {
      await resendVerification(email.trim().toLowerCase());
      setMessage("If that address still needs confirming, we have sent a new link. Check your inbox and spam folder.");
      setMessageType("success");
    } catch (cause) {
      setMessage(authErrorMessage(cause));
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  };

  const continueWithGoogle = async () => {
    setGoogleBusy(true);
    try {
      const { returnTo } = readAuthQueryParams();
      await signInWithGoogle({ returnTo, role: isSignupRole(role) ? role : undefined });
    } catch (cause) {
      console.warn("[Nexora] Google OAuth unavailable:", authErrorMessage(cause));
      setGoogleOauthFailed(true);
    } finally {
      setGoogleBusy(false);
    }
  };

  const roleLabel = ROLE_LABELS[role] ?? "Customer";
  const configDiagnostics = configError || (typeof window !== "undefined" && !getClient() ? getDetailedConfigError() : "");

  const roles: Array<{value: Role, label: string, desc: string, icon: string}> = [
    {value: "customer", label: "Customer", desc: "Book services", icon: "🧑"},
    {value: "business_user", label: "Shop Owner", desc: "Manage salon", icon: "💈"},
    {value: "growth_partner", label: "Growth Partner", desc: "Grow brands", icon: "🚀"},
    {value: "delivery_partner", label: "Delivery Partner", desc: "Deliver", icon: "🛵"},
  ];

  return (
    <div className="min-h-screen w-full bg-[#fff8f8] text-[#26181c] relative overflow-hidden font-[Inter] -mt-[76px]">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
      <div className="absolute top-[-20%] left-[-10%] w-[45%] h-[45%] bg-[#fce2e7]/50 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-[#ffd9e2]/30 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Header - matches provided HTML */}
      <header className="fixed top-0 w-full z-50 bg-[#fff8f8]/80 backdrop-blur-xl border-b border-[#f6dce2]/60">
        <div className="h-16 max-w-[1280px] mx-auto px-5 lg:px-6 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-[#e2007c] to-[#b90064] grid place-items-center text-white shadow-[0_8px_20px_rgba(185,0,100,0.25)]">N</div>
            <span className="font-[500] text-[18px] tracking-tight text-[#8e004b]">Nexora SalonoS</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate("/salons")} className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#594047] hover:text-[#26181c]">Explore</button>
            <button onClick={() => navigate("/salons")} className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#594047] hover:text-[#26181c]">Services</button>
            <button onClick={() => navigate("/")} className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#594047] hover:text-[#26181c]">Concierge</button>
            <div className="w-8 h-8 rounded-full bg-[#8e004b] flex items-center justify-center shadow-[0_0_12px_rgba(185,0,100,0.2)]">
              <span className="text-white text-[16px]">👤</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-screen pt-16">
        {/* Left - Brand showcase */}
        <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-[#fff8f8] p-8">
          <div className="absolute inset-0">
            <div className="absolute top-[8%] left-[8%] w-[70%] h-[60%] bg-[#fce2e7] rounded-[2.5rem] rotate-[-2deg]"></div>
            <div className="absolute top-[10%] left-[10%] w-[72%] h-[62%] bg-[#ffd9e2]/60 rounded-[2.5rem] rotate-[1deg]"></div>
          </div>
          <div className="relative w-full h-full rounded-[2.2rem] overflow-hidden shadow-[0_24px_60px_rgba(60,20,40,0.15)] min-h-[650px]">
            <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida/AP1WRLuZJGt2jU-aVd8g9Bx6JZT2TilncGqAQMAyueOmggwdsR0-md5_cgcmFZRzdb0OMUIWFhwAwEVmuAhnYDVTbCOaH6H8spZH7K-NrD8l3bpf_V3_mGYWYLMjSKgX-4G3rC6qAG3IeRvY8fXL4hBGlJqDfUJvl77VOOBNpp8ZlrB596kQJeFl3-4o1ZCEYdw9Y37jKWuaHgwAm5ihppW9hQCp0174FbpfV_HU1DL3UN2GeZfBzGYoIMxCJfRs')"}}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#3c2c31]/85 via-[#3c2c31]/10 to-transparent"></div>
            
            <div className="absolute top-8 left-8 right-8">
              <div className="flex items-center gap-3">
                <img alt="logo" className="h-9 w-auto mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTXSM1uXL6IZPG2d5vJrZHTp3meZp3ugCNqDfmM7XSBsqTiBEoB65raTIgfM87Q2-Nycckxt2jvImXTu8qIEq3irPWeRIpQcZNxA4R0JaTlBwKqvBvcc-Go9UAWl5bVcwWmbbqlBTIK2-NJT9uA6x1Y3iGKNV8Fot_Z4oI5bt0ftITdQR9jr2ggS1Gi8h5RWL06dUsqs_AdG7E2j9RVLMYR7_A2uBY63Kav7vuNUajTreWXFazOVDuCuv5FTdEwPxqmoM"/>
                <span className="text-white/90 text-[11px] font-semibold tracking-[0.12em] uppercase">Est. Jaipur 2024</span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="inline-flex px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-semibold tracking-[0.1em] uppercase mb-4 border border-white/20">
                Jaipur Ki Beauty Industry
              </div>
              <h2 className="text-[36px] leading-[0.98] tracking-[-0.02em] font-[600] mb-3">
                Ab Ek Smart<br/>Network Par
              </h2>
              <p className="text-[15px] leading-[1.5] text-white/75 max-w-[320px] mb-6">Salon book karein, business grow karein, jobs paayein — 25k+ active salons across Jaipur.</p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#ffb0c8] border-2 border-white grid place-items-center text-[12px]">P</div>
                  <div className="w-8 h-8 rounded-full bg-[#f6dce2] border-2 border-white grid place-items-center text-[12px]">A</div>
                  <div className="w-8 h-8 rounded-full bg-[#e2007c] border-2 border-white grid place-items-center text-[12px] text-white">+2k</div>
                </div>
                <span className="text-[12px] text-white/80">Loved by 12k+ customers</span>
              </div>
            </div>

            {/* Floating cards over image */}
            <div className="absolute top-[42%] -right-2 bg-white px-4 py-3 rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-3 animate-[float_6s_ease-in-out_infinite]">
              <div className="w-9 h-9 rounded-full bg-[#fff0f2] flex items-center justify-center text-[#8e004b] text-[16px]">↗</div>
              <div>
                <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#8c7077]">Growth</div>
                <div className="text-[13px] font-[600] text-[#26181c]">+34% this month</div>
              </div>
            </div>
            <div className="absolute bottom-[26%] -left-2 bg-white/90 backdrop-blur-md p-3.5 rounded-[14px] shadow-lg border border-white/30 max-w-[220px]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-[#8e004b] rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold tracking-[0.07em] uppercase">Live Booking</span>
              </div>
              <div className="text-[12px] text-[#594047]"><strong className="text-[#26181c]">Priya M.</strong> booked in C-Scheme</div>
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="w-full lg:w-[54%] flex items-center justify-center p-5 lg:p-10 lg:pl-8">
          <div className="w-full max-w-[440px] bg-white lg:bg-white rounded-[24px] lg:rounded-[28px] shadow-[0_24px_64px_rgba(60,20,40,0.08)] lg:shadow-[0_20px_60px_rgba(60,20,40,0.06)] border border-[#f6dce2]/60 p-7 lg:p-9">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center mb-6">
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#e2007c] to-[#b90064] grid place-items-center text-white font-bold">N</div>
            </div>

            <div className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 bg-[#fff0f2] rounded-full text-[10px] font-bold tracking-[0.08em] uppercase text-[#8e004b] border border-[#ffd9e2]">
                  {mode === "login" ? "Welcome back" : "Join Nexora"}
                </div>
                {refCode && <div className="px-2.5 py-1 bg-[#b90064] text-white rounded-full text-[10px] font-bold">REF {refCode}</div>}
              </div>
              <h1 className="text-[28px] leading-[1.15] tracking-[-0.02em] font-[600] text-[#26181c]">
                {mode === "login" ? "Log in to your" : "Create your"} <br/><span className="text-[#8e004b] italic font-light">{mode === "login" ? "salon account." : "Nexora account."}</span>
              </h1>
              <p className="text-[14px] leading-[1.5] text-[#594047] mt-3">
                {mode === "login" ? "Secure PKCE login — same account across Customer, Owner & Partner apps." : `Start as ${roleLabel} · Shared project ${SUPABASE_PROJECT_REF} · RLS protected.`}
              </p>
            </div>

            {/* Role pills - only for signup or role switch allowed */}
            <div className="mb-6">
              <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#8c7077] mb-2.5">Choose your role</div>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(r => (
                  <button key={r.value} type="button" onClick={() => mode==="signup" && setRole(r.value)} disabled={mode==="login" && role!==r.value} className={`text-left p-3 rounded-[14px] border transition-all ${role===r.value ? "bg-[#26181c] border-[#26181c] text-white shadow-[0_6px_20px_rgba(38,24,28,0.18)]" : "bg-[#fff8f8] border-[#f6dce2] text-[#594047] hover:border-[#e0bec6] hover:bg-white"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[16px]">{r.icon}</span>
                      <span className={`text-[13px] font-[600] ${role===r.value ? "text-white" : "text-[#26181c]"}`}>{r.label}</span>
                    </div>
                    <div className={`text-[11px] mt-1 ${role===r.value ? "text-white/70" : "text-[#8c7077]"}`}>{r.desc}</div>
                  </button>
                ))}
              </div>
              {mode==="login" && <p className="text-[11px] text-[#8c7077] mt-2">Role is locked to your existing profile. System will auto-route.</p>}
            </div>

            <form onSubmit={submit} noValidate className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#594047] mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7077] text-[16px]">👤</span>
                    <input required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Your full name" className="w-full h-[48px] pl-10 pr-4 bg-[#fff8f8] border border-[#f6dce2] rounded-[14px] text-[14px] outline-none focus:border-[#8e004b] focus:ring-[3px] focus:ring-[#8e004b]/10 transition-all" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#594047] mb-1.5 block">Email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7077] text-[16px]">✉️</span>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="name@domain.com" className="w-full h-[48px] pl-10 pr-4 bg-[#fff8f8] border border-[#f6dce2] rounded-[14px] text-[14px] outline-none focus:border-[#8e004b] focus:ring-[3px] focus:ring-[#8e004b]/10 transition-all" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#594047]">Password</label>
                  {mode==="login" && <button type="button" onClick={() => navigate("/auth/forgot-password")} className="text-[11px] font-[600] text-[#8e004b] hover:underline">Forgot?</button>}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7077] text-[16px]">🔒</span>
                  <input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode==="login" ? "current-password" : "new-password"} placeholder="At least 8 characters" className="w-full h-[48px] pl-10 pr-[44px] bg-[#fff8f8] border border-[#f6dce2] rounded-[14px] text-[14px] outline-none focus:border-[#8e004b] focus:ring-[3px] focus:ring-[#8e004b]/10 transition-all" />
                  <button type="button" onClick={() => setShowPassword(s=>!s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full bg-white border border-[#f6dce2] text-[12px] text-[#594047] hover:border-[#8e004b] hover:text-[#8e004b] transition-colors">
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <div className="mt-2 h-1 w-full bg-[#f6dce2] rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${password.length===0 ? "w-0" : password.length<8 ? "w-[35%] bg-[#ba1a1a]" : password.length<12 ? "w-[70%] bg-[#b45309]" : "w-full bg-[#005314]"}`}></div>
                </div>
              </div>

              {configDiagnostics && <div className="bg-[#fff4cc] border border-[#ead39b] text-[#7d540b] text-[12px] p-3 rounded-[12px]">{configDiagnostics}</div>}
              {message && (
                <div className={`p-3 rounded-[12px] text-[13px] leading-[1.4] border ${messageType==="success" ? "bg-[#e9f8f1] border-[#bfe3d3] text-[#12704c]" : messageType==="info" ? "bg-[#eef4ff] border-[#c5d6ff] text-[#2f6fed]" : "bg-[#ffdad6] border-[#ffb4ab] text-[#93000a]"}`}>
                  {message}
                </div>
              )}

              <button disabled={busy} className="w-full h-[52px] bg-[#8e004b] text-white rounded-[14px] text-[12px] font-semibold tracking-[0.08em] uppercase shadow-[0_8px_24px_rgba(185,0,100,0.28)] hover:bg-[#b90064] hover:shadow-[0_12px_32px_rgba(185,0,100,0.35)] hover:-translate-y-[1px] disabled:opacity-60 disabled:translate-y-0 transition-all relative overflow-hidden group">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {busy && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  {busy ? "Please wait…" : mode==="login" ? "Log in securely →" : `Create ${roleLabel} account →`}
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              {googleOauthConfigured && !googleOauthFailed && (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-[1px] flex-1 bg-[#f6dce2]"></div>
                    <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#8c7077]">or continue with</span>
                    <div className="h-[1px] flex-1 bg-[#f6dce2]"></div>
                  </div>
                  <button type="button" disabled={googleBusy} onClick={() => void continueWithGoogle()} className="w-full h-[48px] bg-white border border-[#e0bec6] rounded-[14px] text-[13px] font-[600] text-[#26181c] hover:bg-[#fff8f8] hover:border-[#8c7077] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#4285F4] grid place-items-center text-white text-[12px] font-bold">G</span>
                    {googleBusy ? "Redirecting to Google…" : "Continue with Google"}
                  </button>
                </>
              )}
              {googleOauthConfigured && googleOauthFailed && <p className="text-[11px] text-[#8c7077] text-center">Google sign-in temporarily unavailable. Please use email & password.</p>}
            </form>

            <div className="mt-7 pt-6 border-t border-[#f6dce2] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => navigate(mode==="login" ? "/signup" : "/login")} className="text-[12px] font-[600] text-[#26181c] hover:text-[#8e004b] transition-colors">
                  {mode==="login" ? "Need an account? Sign up →" : "Already have an account? Log in →"}
                </button>
                {mode==="login" && <button type="button" onClick={() => navigate("/")} className="text-[11px] text-[#8c7077] hover:text-[#26181c]">Back to home</button>}
              </div>

              {needsVerification && mode==="signup" && (
                <button type="button" disabled={busy} onClick={() => void resend()} className="w-full h-[44px] bg-[#fff0f2] border border-[#ffd9e2] rounded-[12px] text-[12px] font-semibold text-[#8e004b] hover:bg-[#ffe8ed] transition-colors">
                  {busy ? "Sending…" : "Resend confirmation email"}
                </button>
              )}
              {messageType==="success" && mode==="signup" && (
                <button type="button" onClick={() => navigate(`${AUTH_ROUTES.login}?role=${role === "business_user" ? "owner" : role === "growth_partner" ? "growth-partner" : role === "delivery_partner" ? "delivery" : "customer"}`)} className="w-full h-[44px] bg-[#26181c] text-white rounded-[12px] text-[12px] font-semibold tracking-[0.05em] uppercase">
                  Go to login →
                </button>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] px-2.5 py-1 bg-[#fff8f8] border border-[#f6dce2] rounded-full text-[#8c7077]">✓ RLS protected</span>
                <span className="text-[10px] px-2.5 py-1 bg-[#fff8f8] border border-[#f6dce2] rounded-full text-[#8c7077]">✓ PKCE secure</span>
                <span className="text-[10px] px-2.5 py-1 bg-[#fff8f8] border border-[#f6dce2] rounded-full text-[#8c7077]">✓ Jaipur verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Section 10.1 — Real Supabase auth routes: /auth/callback,
// /auth/forgot-password, /auth/reset-password, /auth/expired. No mock auth anywhere: every flow goes
// through supabase-js against the shared project, PKCE only.
// ---------------------------------------------------------------------------

/** Same-origin-only redirect target; blocks protocol-relative and absolute URLs. */
function safeSameOriginPath(candidate: string | null, fallback: string): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback;
  if (/[?#]/.test(candidate)) return fallback;
  return candidate;
}

function AuthCallbackPage({ navigate }: { navigate: (path: string) => void }) {
  const { handleAuthCallback } = useAuth();
  const [state, setState] = useState<{ status: "working" | "error"; message: string }>({
    status: "working",
    message: "Completing secure sign-in…",
  });

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const url = new URL(window.location.href);
        // Canonical PKCE + active-profile verification. Roles never come from
        // the URL or localStorage — handleAuthCallback fails closed.
        const profile = await handleAuthCallback(url.toString());
        // Cross-origin handoff: a PWA on another origin may have started this
        // login. `safeRedirectUrl` accepts ONLY allowlisted Nexora origins, so
        // an attacker-supplied returnTo cannot capture the authenticated user.
        // No tokens travel in the URL — the destination origin runs its own
        // PKCE exchange against the shared project.
        const rawReturnTo = url.searchParams.get("returnTo");
        const crossOrigin = rawReturnTo && /^https?:\/\//i.test(rawReturnTo.trim())
          ? safeRedirectUrl(rawReturnTo)
          : null;
        // Strip the one-time code from the URL before continuing.
        window.history.replaceState({}, "", AUTH_ROUTES.callback);
        if (crossOrigin) {
          window.location.assign(crossOrigin);
          return;
        }
        navigate(destinationForVerifiedRole(profile.role, rawReturnTo));
      } catch (cause) {
        setState({ status: "error", message: authErrorMessage(cause) });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [handleAuthCallback, navigate]);

  if (state.status === "working") {
    return (
      <main className="center-page">
        <section className="entry-card">
          <span className="eyebrow">Secure sign-in</span>
          <h1>{state.message}</h1>
          <div className="loader" aria-label="Completing sign-in" />
        </section>
      </main>
    );
  }
  return (
    <main className="center-page">
      <StateCard title="Sign-in could not be completed" text={state.message} action="Back to login" onAction={() => navigate("/auth/login")} />
    </main>
  );
}

/** End the shared-provider session, then continue only to a local safe path. */
function AuthLogoutPage({ navigate }: { navigate: (path: string) => void }) {
  const { signOut } = useAuth();

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams(window.location.search);
      const returnTo = safeSameOriginPath(params.get("returnTo"), "/");
      await signOut();
      if (active) navigate(returnTo);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [navigate, signOut]);

  return (
    <main className="center-page">
      <section className="entry-card">
        <span className="eyebrow">Nexora account</span>
        <h1>Signing you out…</h1>
        <div className="loader" aria-label="Signing out" />
      </section>
    </main>
  );
}

/**
 * Resume an auth handoff from the provider's authoritative profile state.
 * Any verified role may resume a validated local path (including every
 * mounted shell). Role-home is only the fallback when returnTo is absent.
 */
function AuthContinuePage({ navigate }: { navigate: (path: string) => void }) {
  const { status, loading, isAuthenticated, role, configError, error } = useAuth();

  useEffect(() => {
    if (loading || configError || (status === "authenticated" && !role)) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const requestedReturnTo = safeSameOriginPath(params.get("returnTo"), "");

      if (!isAuthenticated || !role) {
        const query = requestedReturnTo
          ? `?returnTo=${encodeURIComponent(requestedReturnTo)}`
          : "";
        navigate(`/auth/login${query}`);
        return;
      }

      navigate(destinationForVerifiedRole(role, requestedReturnTo || null));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [configError, isAuthenticated, loading, navigate, role, status]);

  if (configError) {
    return <main className="center-page"><StateCard title="Authentication unavailable" text={configError} /></main>;
  }
  if (status === "authenticated" && !role) {
    return <main className="center-page"><StateCard title="Account could not be verified" text={error?.message ?? "Nexora could not verify an active profile for this session."} /></main>;
  }
  return (
    <main className="center-page">
      <section className="entry-card">
        <span className="eyebrow">Nexora account</span>
        <h1>Opening your portal…</h1>
        <div className="loader" aria-label="Continuing authentication" />
      </section>
    </main>
  );
}

function ForgotPasswordPage({ navigate }: { navigate: (path: string) => void }) {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setMessage("Enter the email address you registered with.");
      setMessageType("error");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await sendPasswordReset(trimmedEmail);
      setMessage(neutralRecoveryMessage(trimmedEmail));
      setMessageType("success");
    } catch (cause) {
      setMessage(authErrorMessage(cause));
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fff8f8] flex flex-col lg:flex-row -mt-[76px] font-[Inter]">
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden p-8 bg-[#fff8f8]">
        <div className="relative w-full h-full rounded-[2.2rem] overflow-hidden shadow-[0_24px_60px_rgba(60,20,40,0.15)] min-h-[650px]">
          <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida/AP1WRLuZJGt2jU-aVd8g9Bx6JZT2TilncGqAQMAyueOmggwdsR0-md5_cgcmFZRzdb0OMUIWFhwAwEVmuAhnYDVTbCOaH6H8spZH7K-NrD8l3bpf_V3_mGYWYLMjSKgX-4G3rC6qAG3IeRvY8fXL4hBGlJqDfUJvl77VOOBNpp8ZlrB596kQJeFl3-4o1ZCEYdw9Y37jKWuaHgwAm5ihppW9hQCp0174FbpfV_HU1DL3UN2GeZfBzGYoIMxCJfRs')"}}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#3c2c31]/85 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h2 className="text-[34px] leading-[1] font-[600] mb-3">Don't worry,<br/>we've got you.</h2>
            <p className="text-[14px] text-white/70">Reset securely with PKCE — link expires after first use.</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 pt-24">
        <div className="w-full max-w-[420px] bg-white rounded-[24px] border border-[#f6dce2] shadow-[0_20px_60px_rgba(60,20,40,0.08)] p-8">
          <div className="px-3 py-1 bg-[#fff0f2] rounded-full text-[10px] font-bold tracking-[0.08em] uppercase text-[#8e004b] inline-block mb-4">Account recovery</div>
          <h1 className="text-[26px] leading-[1.15] font-[600] tracking-[-0.02em] text-[#26181c] mb-2">Reset your password</h1>
          <p className="text-[13px] leading-[1.5] text-[#594047] mb-6">We will email you a secure link. The link signs you in once, then you choose a new password.</p>
          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#594047] mb-1.5 block">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="name@domain.com" className="w-full h-[48px] px-4 bg-[#fff8f8] border border-[#f6dce2] rounded-[14px] text-[14px] outline-none focus:border-[#8e004b] focus:ring-[3px] focus:ring-[#8e004b]/10" />
            </div>
            {message && <div className={`p-3 rounded-[12px] text-[13px] border ${messageType==="success" ? "bg-[#e9f8f1] border-[#bfe3d3] text-[#12704c]" : "bg-[#ffdad6] border-[#ffb4ab] text-[#93000a]"}`}>{message}</div>}
            <button disabled={busy} className="w-full h-[52px] bg-[#8e004b] text-white rounded-[14px] text-[12px] font-semibold uppercase tracking-[0.08em] shadow-[0_8px_24px_rgba(185,0,100,0.28)] hover:bg-[#b90064] transition-colors">{busy ? "Sending…" : "Email me a reset link →"}</button>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => navigate("/auth/login")} className="text-[12px] font-semibold text-[#26181c] hover:text-[#8e004b]">Back to login</button>
              <button type="button" onClick={() => navigate("/auth/signup")} className="text-[12px] text-[#8c7077] hover:text-[#26181c]">Create account</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


function ResetPasswordPage({ navigate }: { navigate: (path: string) => void }) {
  const { session, loading, configError, updatePassword, requireAuth, handleAuthCallback } = useAuth();
  const [ready, setReady] = useState<"waiting" | "ready" | "failed">("waiting");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      if (configError) {
        if (active) { setReady("failed"); setMessage(configError); }
        return;
      }
      if (loading) { if (active) setReady("waiting"); return; }
      if (session) { if (active) setReady("ready"); return; }
      try {
        const href = typeof window !== "undefined" ? window.location.href : "";
        if (href && new URL(href).searchParams.get("code")) {
          await handleAuthCallback(href);
          if (active) setReady("ready");
          return;
        }
      } catch (cause) {
        if (active) { setReady("failed"); setMessage(authErrorMessage(cause)); }
        return;
      }
      if (active) { setReady("failed"); setMessage("This password reset link is invalid or has expired. Request a new one."); }
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [configError, handleAuthCallback, loading, session]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) { setMessage("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setMessage("Passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      await updatePassword(password);
      const { profile } = await requireAuth();
      navigate(homePathForRole(profile.role));
    } catch (cause) { setMessage(authErrorMessage(cause)); } finally { setBusy(false); }
  };

  if (ready === "waiting") {
    return <main className="min-h-[70vh] grid place-items-center p-6 bg-[#fff8f8]"><div className="w-11 h-11 border-4 border-[#f6dce2] border-t-[#8e004b] rounded-full animate-spin"></div></main>;
  }
  if (ready === "failed") {
    return <main className="min-h-[70vh] grid place-items-center p-6 bg-[#fff8f8]"><div className="bg-white border border-[#f6dce2] rounded-[20px] p-8 max-w-[420px] text-center shadow-[0_16px_40px_rgba(60,20,40,0.08)]"><h3 className="text-[20px] font-[600] text-[#26181c] mb-2">Reset link unavailable</h3><p className="text-[13px] text-[#594047] mb-4">{message}</p><button onClick={() => navigate("/auth/forgot-password")} className="px-6 h-11 bg-[#8e004b] text-white rounded-[12px] text-[12px] font-semibold uppercase">Request new link</button></div></main>;
  }
  return (
    <div className="min-h-screen w-full bg-[#fff8f8] flex items-center justify-center p-6 -mt-[76px] font-[Inter]">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] border border-[#f6dce2] shadow-[0_20px_60px_rgba(60,20,40,0.08)] p-8">
        <div className="px-3 py-1 bg-[#fff0f2] rounded-full text-[10px] font-bold uppercase text-[#8e004b] inline-block mb-4">Account recovery</div>
        <h1 className="text-[24px] font-[600] tracking-[-0.02em] text-[#26181c] mb-6">Choose a new password</h1>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#594047] mb-1.5 block">New password</label>
            <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" className="w-full h-[48px] px-4 bg-[#fff8f8] border border-[#f6dce2] rounded-[14px] text-[14px] outline-none focus:border-[#8e004b] focus:ring-[3px] focus:ring-[#8e004b]/10" />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#594047] mb-1.5 block">Confirm new password</label>
            <input required minLength={8} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Repeat the new password" className="w-full h-[48px] px-4 bg-[#fff8f8] border border-[#f6dce2] rounded-[14px] text-[14px] outline-none focus:border-[#8e004b] focus:ring-[3px] focus:ring-[#8e004b]/10" />
          </div>
          {message && <div className="p-3 rounded-[12px] bg-[#ffdad6] border border-[#ffb4ab] text-[#93000a] text-[13px]">{message}</div>}
          <button disabled={busy} className="w-full h-[52px] bg-[#8e004b] text-white rounded-[14px] text-[12px] font-semibold uppercase tracking-[0.08em] shadow-[0_8px_24px_rgba(185,0,100,0.28)]">{busy ? "Saving…" : "Update password →"}</button>
        </form>
      </div>
    </div>
  );
}


function SessionExpiredPage({ navigate }: { navigate: (path: string) => void }) {
  const { signOut } = useAuth();
  useEffect(() => {
    void signOut();
  }, [signOut]);
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const returnTo = safeSameOriginPath(params.get("returnTo"), AUTH_ROUTES.login);
  return (
    <main className="center-page">
      <section className="entry-card">
        <span className="eyebrow">Session expired</span>
        <h1>Please log in again</h1>
        <p>Your session expired or could not be verified. For security, Nexora never keeps an unverified session signed in.</p>
        <div className="button-row">
          <button className="primary" onClick={() => navigate(returnTo)}>Log in</button>
          <button className="secondary" onClick={() => navigate("/")}>Go home</button>
        </div>
      </section>
    </main>
  );
}

/**
 * Precise, actionable configuration error. The shared validator distinguishes
 * a missing URL, a missing key, a malformed URL, a foreign Supabase project
 * and a service-role key that must never be in a browser bundle.
 */
function getDetailedConfigError(): string {
  return supabaseConfigErrorMessage({ url: supabaseUrl, anonKey: supabaseKey });
}

function portalLabel(key: PortalKey): string {
  if (key === "owner") return "Shop Owner";
  if (key === "partner") return "Growth Partner";
  if (key === "template") return "Template";
  return "Customer";
}

/**
 * Hand client-side navigation back to the canonical same-origin mount. The
 * server owns the validated external origin, so client code cannot bypass a
 * missing or invalid routing configuration.
 */
function PortalHandoff({ mountKey, path }: { mountKey: PortalKey; path: string }) {
  const [routingError, setRoutingError] = useState(false);
  useEffect(() => {
    const base = portalPathForMountKey(mountKey);
    const suffix = path === base ? "" : path.startsWith(`${base}/`) ? path.slice(base.length) : "";
    const target = `${base}${suffix}${window.location.search}`;
    const guardKey = `nexora:portal-handoff:${target}`;
    const previousAttempt = Number(window.sessionStorage.getItem(guardKey) ?? "0");
    if (Date.now() - previousAttempt < 10_000) {
      const timer = window.setTimeout(() => setRoutingError(true), 0);
      return () => window.clearTimeout(timer);
    }
    window.sessionStorage.setItem(guardKey, String(Date.now()));
    window.location.replace(target);
  }, [mountKey, path]);
  if (routingError) {
    return (
      <main className="center-page">
        <StateCard title="Portal unavailable" text="The portal routing configuration did not hand off this request." />
      </main>
    );
  }
  return (
    <main className="center-page">
      <div className="loader" aria-label={`Opening ${portalLabel(mountKey)} app`} />
    </main>
  );
}

function PortalGateway({
  expectedRole,
  navigate,
  signOut,
}: {
  expectedRole?: "customer" | "business_user" | "growth_partner";
  navigate: (path: string) => void;
  signOut: (destination?: string) => Promise<void>;
}) {
  const { requireAuth, client } = useAuth();
  const [state, setState] = useState<{ loading: boolean; error?: string; role?: Role }>({ loading: true });
  const [workspace, setWorkspace] = useState<{ userId?: string; salonIds: string[] }>({ salonIds: [] });
  const load = useCallback(async () => {
    const currentPath = window.location.pathname;
    const requestedRole = expectedRole ?? portalRoleFromPath(currentPath) ?? legacyDashboardRoleFromPath(currentPath);
    const loginRole = requestedRole ?? "customer";
    const returnTo = isPortalPath(currentPath)
      ? `${currentPath}${window.location.search}`
      : portalPathForRole(loginRole);
    try {
      // requireAuth verifies the user AND the active profile. A raw session
      // is not enough; missing/inactive profiles are signed out.
      const access = await requireAuth();
      const profile = { platform_role: access.profile.role, is_active: access.profile.isActive };
      if (profile.is_active !== true) {
        await signOut(`/auth/login?role=${roleQueryForPortalRole(loginRole)}&returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      const profileRole = profile.platform_role;
      // Phase 2 — no role-home redirects. Every authenticated active profile
      // may open any mounted shell. RLS and the PWA's own gates authorize data.
      // Workspace checks stay best-effort so Template can list salon ids.

      if (!client) throw new Error(missingSupabaseConfigMessage);
      let salonIds: string[] = [];
      const mountKey = portalMountKeyFromPath(currentPath)
        ?? (requestedRole === "business_user" ? "owner"
          : requestedRole === "growth_partner" ? "partner"
          : "customer");
      try {
        if (mountKey === "owner" || mountKey === "template") {
          const workspace = await requireOwnerWorkspace(client);
          salonIds = workspace.salonIds;
        } else if (mountKey === "partner") {
          await requirePartnerMembership(client);
        } else {
          await requireCustomerAccount(client);
        }
      } catch {
        // Shell still mounts. PWA + RLS decide what the caller can see.
      }

      if (!isPortalPath(currentPath)) {
        const dest = requestedRole ? portalPathForRole(requestedRole) : portalPathForRole(
          isMountedPortalRole(profileRole) ? profileRole : "customer",
        );
        navigate(dest);
        return;
      }
      setState({ loading: false, role: profileRole });
      setWorkspace({ userId: access.user.id, salonIds });
    } catch (cause) {
      const code = cause && typeof cause === "object" && "code" in cause ? String((cause as { code: unknown }).code) : "";
      if (code === "session_expired" || code === "profile_inactive" || code === "not_configured") {
        if (code === "not_configured") {
          setState({ loading: false, error: missingSupabaseConfigMessage });
          return;
        }
        navigate(`/auth/login?role=${roleQueryForPortalRole(loginRole)}&returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      setState({ loading: false, error: authErrorMessage(cause) });
    }
  }, [client, expectedRole, navigate, requireAuth, signOut]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (state.loading) return <main className="center-page"><div className="loader" aria-label="Loading portal gateway" /></main>;
  if (state.error) return <main className="center-page"><StateCard title="Portal unavailable" text={state.error} action="Retry" onAction={load} /></main>;
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const mountKey = portalMountKeyFromPath(currentPath) ?? (expectedRole === "business_user" ? "owner" : expectedRole === "growth_partner" ? "partner" : "customer");
  // Template App is an external PWA on its own Vercel origin
  // (https://final-new-app-templete.vercel.app). Use PortalHandoff to trigger the
  // server-side 307 redirect — same mechanism used by Customer, Owner and
  // Partner portals. This fixes the bug where clicking "Template" in the nav
  // rendered an inline status page instead of redirecting to the builder.
  return <PortalHandoff mountKey={mountKey} path={currentPath} />;
}

function UnavailableAuthenticatedPortal({ path, navigate }: { path: string; navigate: (path: string) => void }) {
  const { loading, isAuthenticated, role, configError } = useAuth();
  const isAdmin = path === "/admin" || path.startsWith("/admin/") || path === "/app/admin" || path.startsWith("/app/admin/");
  const expectedRole = isAdmin ? "admin" : "delivery_partner";

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(`/auth/login?role=${isAdmin ? "admin" : "delivery"}&returnTo=${encodeURIComponent(path)}`);
    }
  }, [isAdmin, isAuthenticated, loading, navigate, path]);

  if (loading) return <main className="center-page"><div className="loader" aria-label="Checking portal access" /></main>;
  if (configError) return <main className="center-page"><StateCard title="Portal unavailable" text={configError} /></main>;
  if (!isAuthenticated) return null;
  if (role !== expectedRole) {
    return <main className="center-page"><StateCard title="Portal access denied" text="Your Nexora account is authenticated, but it does not have access to this portal." action="Open my portal" onAction={() => navigate(
      role === "customer" || role === "business_user" || role === "growth_partner" ? portalPathForRole(role) : "/"
    )} /></main>;
  }
  return <main className="center-page"><section className="entry-card"><span className="eyebrow">Nexora portal gateway</span><h1>{isAdmin ? "Administrator" : "Delivery Partner"} portal is not mounted</h1><p>Your account is authenticated and role-verified. This portal mount has not been deployed yet, so Nexora cannot render a duplicate dashboard here.</p></section></main>;
}

function AdminUnavailable() {
  return <main className="center-page"><section className="entry-card"><span className="eyebrow">Nexora administration</span><h1>Admin surface is restricted</h1><p>Moderation, sponsored content, disputes, and payout operations are provisioned by administrators only. There is no public admin signup.</p></section></main>;
}

function LegalPage({ type }: { type: "terms" | "privacy" | "refund" }) {
  const copy = {
    terms: { title: "Terms & Conditions", intro: "These terms govern use of the Nexora marketplace, role-based apps, salon storefronts, and booking services.", sections: [["Accounts and roles", "Each email is assigned one permanent platform role. Keep your login secure and provide accurate information."], ["Salon content", "Public salon information is shown only after owner approval and publication. Availability and service delivery remain the salon’s responsibility."], ["Payments", "Payment success, refunds, earnings, commission, settlement, and payout status are confirmed only by trusted server records."], ["Acceptable use", "Do not misuse the platform, impersonate another role, interfere with security, or submit unlawful content."]] },
    privacy: { title: "Privacy Policy", intro: "Nexora uses only the information needed to provide accounts, salon discovery, bookings, payments, support, and platform safety.", sections: [["Information collected", "Account details, booking information, salon records, payment references, device/session details, and support messages may be processed."], ["How information is used", "Information supports authentication, booking operations, payment verification, fraud prevention, service updates, and customer support."], ["Access controls", "Role checks and Row Level Security restrict records to the customer, salon team, Growth Partner, or administrator entitled to access them."], ["Security", "Frontend apps use only the public Supabase key. Payment and privileged credentials remain server-only."]] },
    refund: { title: "Cancellation & Refund Policy", intro: "Refund eligibility is decided by trusted booking and payment state, never by the frontend.", sections: [["Customer cancellation", "Same-day customer cancellation and no-show are not refundable."], ["Salon cancellation", "A salon or Shop Owner cancellation qualifies the customer for a full advance refund through the verified server flow."], ["Service started", "A booking cannot be cancelled after service starts. The customer may open a dispute instead."], ["Refund timing", "Approved refunds are recorded against the original payment and remain pending until the payment provider confirms processing."]] },
  }[type];
  return <main className="legal page-top"><span className="eyebrow">Nexora legal</span><h1>{copy.title}</h1><p className="legal-intro">{copy.intro}</p>{copy.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}<p className="legal-date">Effective: 28 July 2026</p></main>;
}

/**
 * Marketplace Activity strip (mockup "TRENDING ON NEXORA" footer banner).
 * Every claim is taken verbatim from the live aggregates the homepage already
 * loads: the top Most Booked Services row (backend booking order) and the
 * first area present in the live Trending rows (same normalization Section 12
 * uses). Rendered only when both live sources are online and error-free —
 * otherwise the strip simply does not exist (nothing is ever guessed).
 */
function MarketplaceActivityBanner({
  online,
  trendingError,
  popularError,
  trendingRows,
  popularServices,
}: {
  online: boolean;
  trendingError: boolean;
  popularError: boolean;
  trendingRows: TrendingRow[];
  popularServices: PopularService[];
}) {
  const topService = useMemo(() => {
    for (const service of popularServices) {
      if (isRenderablePopularService(service)) return service;
    }
    return null;
  }, [popularServices]);
  const topArea = useMemo(() => {
    const seen = new Set<string>();
    for (const row of trendingRows) {
      if (!isRenderableTrendingSalonRow(row)) continue;
      const area = normalizeTrendingAreaPart(row.area);
      if (!area || seen.has(area.key)) continue;
      seen.add(area.key);
      return area.display;
    }
    return null;
  }, [trendingRows]);
  if (!online || trendingError || popularError || !topService || !topArea) return null;
  return (
    <div className="nx-marketplace-activity" role="status">
      <span aria-hidden="true" className="nx-activity-dot">●</span>
      <p>
        Marketplace Activity: <b>{topService.service_name.trim()}</b> is the most-booked service on Nexora right now
        {" · "}
        <b>{topArea}</b> is appearing in live trending salon results.
      </p>
    </div>
  );
}

/**
 * Customer App banner (mockup gradient CTA) — a navigation card, not a data
 * section. Always routes to the canonical Customer portal mount; signed-out
 * visitors continue through the existing secure login gate and return here.
 */
function CustomerAppBanner({
  authLoading,
  isAuthenticated,
  navigate,
}: {
  authLoading: boolean;
  isAuthenticated: boolean;
  navigate: (path: string) => void;
}) {
  return (
    <section id="customer-app-banner" aria-labelledby="customer-app-banner-heading" className="nx-customer-app-banner">
      <div className="nx-banner-icon" aria-hidden="true"><PremiumIcon name="phone" /></div>
      <div className="nx-banner-copy">
        <h2 id="customer-app-banner-heading">Apne favourites ko Customer App mein dekhein</h2>
        <p>Salons save karein, bookings manage karein aur apne favourite beauty experiences ko ek jagah access karein.</p>
      </div>
      <button
        type="button"
        className="nx-banner-cta"
        disabled={authLoading}
        aria-label={isAuthenticated ? "Open Customer App" : "Open Customer App — secure Nexora login first"}
        onClick={() => navigate(PORTAL_PATHS.customer)}
      >
        {authLoading ? "Checking your account…" : "Open Customer App"}{" "}<span aria-hidden="true">→</span>
      </button>
    </section>
  );
}

function StateCard({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className="state-card"><span>✦</span><h3>{title}</h3><p>{text}</p>{action && onAction && <button className="secondary" onClick={onAction}>{action}</button>}</div>;
}

function SalonSkeletons({ count }: { count: number }) {
  return <div className="salon-grid" aria-label="Loading salons">{Array.from({ length: count }, (_, index) => <div className="salon-card skeleton" key={index}><div /><p /><p /><p /></div>)}</div>;
}

function Footer({ navigate }: { navigate: (path: string) => void }) {
  return <footer><div><div className="brand"><span className="brand-mark">N</span><span>Nexora</span></div><p>One connected platform for salons, customers, owners, growth partners, and beauty careers.</p></div><div><b>Explore</b><button onClick={() => navigate("/salons")}>Published salons</button><button onClick={() => window.location.assign("/job-portal")}>Job Portal</button><button onClick={() => navigate("/login")}>Log in</button><button onClick={() => navigate("/signup")}>Sign up</button></div><div><b>Legal</b><button onClick={() => navigate("/terms")}>Terms & Conditions</button><button onClick={() => navigate("/privacy")}>Privacy Policy</button><button onClick={() => navigate("/cancellation-refund")}>Cancellation & Refund</button></div></footer>;
}
