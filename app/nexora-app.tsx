"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Session, SupabaseClient } from "@supabase/supabase-js";
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
  safeReturnPath,
  supabaseConfigErrorMessage,
  useAuth,
  type PlatformRole,
} from "./lib/auth";
import {
  PORTAL_PATHS,
  TEMPLATE_PATH,
  isPortalPath,
  isTemplatePath,
  legacyDashboardRoleFromPath,
  portalMountKeyFromPath,
  portalPathForMountKey,
  portalPathForRole,
  portalRoleFromPath,
  roleQueryForPortalRole,
  type PortalKey,
} from "./lib/portalRoutes";
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
import { LocationBadge } from "./lib/location/LocationBadge";

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
type SalonStats = {
  salon_id: string;
  rating_avg: number;
  review_count: number;
  booking_count: number;
  recent_reviews: Array<{ author: string; rating: number; comment: string; verified_booking: boolean; created_at: string }>;
  partner_onboarded: boolean;
};
type PopularService = {
  service_id: string;
  salon_id: string;
  salon_name: string;
  service_name: string;
  price_paise: number;
  duration_minutes: number;
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
  // auth.users.id. Nested screens only observe this same singleton.
  const location = useLocation({
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
  else if (path === "/auth/login" || path === "/login" || path === "/auth/signup" || path === "/signup")
    content = <AuthPage mode={path === "/auth/signup" || path === "/signup" ? "signup" : "login"} navigate={navigate} refCode={refCode} />;
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

  return (
    <div className={`site-shell${isPortalPath(path) ? " portal-open" : ""}`}>
      {!online && <div className="offline-banner">Offline — live salon and account data may be unavailable.</div>}
      {!getClient() && <div className="offline-banner" style={{ background: "#7b244a" }}>Supabase not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for project {SUPABASE_PROJECT_REF}.</div>}
      <Header navigate={navigate} authState={authState} location={location} />
      {content}
      <Footer navigate={navigate} />
    </div>
  );
}

function Header({
  navigate,
  authState,
  location,
}: {
  navigate: (path: string) => void;
  authState: AuthState;
  location: UseLocationResult;
}) {
  const dashboardLabel = authState.role
    ? `${ROLE_LABELS[authState.role]} app`
    : "Account";
  // Canonical same-origin portal paths keep all PWAs on one browser origin.
  // Delivery/Admin homes resolve to the authenticated "portal not mounted" screens.
  const dashboardPath = authState.role ? homePathForRole(authState.role) : "/dashboard";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const go = (target: string) => { setMobileMenuOpen(false); navigate(target); };
  const openJobPortal = () => {
    setMobileMenuOpen(false);
    window.location.assign("/job-portal");
  };

  return (
    <header className="topbar">
      <button className="brand" onClick={() => go("/")} aria-label="Nexora home">
        <span className="brand-mark">N</span>
        <span>Nexora</span>
      </button>
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileMenuOpen}
        aria-controls="main-navigation"
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        <span /> <span /> <span />
      </button>
      <nav id="main-navigation" aria-label="Main navigation" className={mobileMenuOpen ? "mobile-open" : ""}>
        <LocationBadge location={location} />
        <button onClick={() => go("/salons")}>Find salons</button>
        <button onClick={() => { setMobileMenuOpen(false); navigate(PORTAL_PATHS.customer); }}>Customer</button>
        <button onClick={() => { setMobileMenuOpen(false); navigate(PORTAL_PATHS.business_user); }}>Shop Owner</button>
        <button onClick={() => { setMobileMenuOpen(false); navigate(PORTAL_PATHS.growth_partner); }}>Growth Partner</button>
        <button onClick={() => { setMobileMenuOpen(false); navigate(TEMPLATE_PATH); }}>Template</button>
        <button className="job-portal-link" onClick={openJobPortal}>Job Portal</button>
        {authState.session ? (
          <>
            <button className="nav-cta" onClick={() => go(dashboardPath)}>{dashboardLabel}</button>
            <button onClick={() => go("/auth/logout")}>Sign out</button>
          </>
        ) : (
          !authState.loading && <button className="nav-cta" onClick={() => go("/auth/login")}>Log in</button>
        )}
      </nav>
    </header>
  );
}

function HomePage({ navigate, online, authState, refCode }: { navigate: (path: string) => void; online: boolean; authState: AuthState; refCode: string }) {
  const { items, loading, error } = useCatalog(online);
  const { statsBySalon } = useMarketplaceStats(online);
  const { services: popularServices, loading: popularLoading } = usePopularServices(online);
  const { personalized, favorites, ready } = useCustomerSuggestions(online, authState.session, items);
  const { rows: recommendationRows, loading: recommendationsLoading, isPersonalized } = useRecommendations(online, authState.session);
  const { plans: membershipPlans, loading: membershipLoading } = useMembershipPlans(online);
  const { status: membershipStatus } = useMyMembership(online, authState.session);
  const { visible } = useHomepageSections(online);
  const { rows: recentlyViewed, consent: rvConsent, consentLoaded, loading: rvLoading, setConsentPref } = useRecentlyViewed(online, authState.session);
  const [homeQuery, setHomeQuery] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const isCustomer = authState.session && authState.role === "customer";
  const { categories: adminCategories, loading: categoriesLoading } = useMarketplaceCategories(online);
  const { sponsored, loading: sponsoredLoading } = useSponsored(online);
  const { rows: topRatedRows, loading: topRatedLoading } = useTopRated(online);
  const { rows: trendingRows, loading: trendingLoading } = useTrending(online);
  const { rows: nearbyRows, loading: nearbyLoading } = useNearby(online);
  // Live GPS (watchPosition) + on-device Haversine ranking.
  const location = useLocation();
  const { buckets: nearbyBuckets, ranked: nearbyRanked } = useNearbySalons(nearbyRows, location.fix);
  const categories = Array.from(new Set(items.map(i=>i.business_category).filter(Boolean))) as string[];
  // Live customer signals: rating avg + review count from customer_reviews,
  // booking counts from bookings (security-definer aggregates).
  const ratingOf = (i: CatalogItem) => { const s = statsBySalon[i.id]; return s ? Number(s.rating_avg) : Number(i.rating_average); };
  const reviewsOf = (i: CatalogItem) => { const s = statsBySalon[i.id]; return s ? Number(s.review_count) : Number(i.review_count); };
  const bookingsOf = (i: CatalogItem) => { const s = statsBySalon[i.id]; return s ? Number(s.booking_count) : 0; };
  const topRated = [...items].sort((a,b)=>ratingOf(b)-ratingOf(a) || reviewsOf(b)-reviewsOf(a)).slice(0,3);
  const trending = [...items].sort((a,b)=>bookingsOf(b)-bookingsOf(a) || reviewsOf(b)-reviewsOf(a)).slice(0,3);
  const nearbyAreas = Array.from(new Set(items.map(i=>i.area).filter(Boolean))) as string[];
  const recommended = [...items].sort((a,b)=>((ratingOf(b)*reviewsOf(b))+bookingsOf(b))-((ratingOf(a)*reviewsOf(a))+bookingsOf(a))).slice(0,3);
  // Recent public reviews across the catalog (Customer PWA content).
  const reviewFeed = useMemo(() => {
    const rows: Array<SalonStats["recent_reviews"][number] & { salonId: string; salonName: string; salonSlug: string }> = [];
    for (const item of items) {
      const s = statsBySalon[item.id];
      for (const r of s?.recent_reviews ?? []) rows.push({ ...r, salonId: item.id, salonName: item.name, salonSlug: item.website.slug });
    }
    return rows.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).slice(0, 3);
  }, [items, statsBySalon]);
  const showForYou = isCustomer && ready && (personalized !== null || favorites.length > 0);

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Beauty services, made dependable</span>
          <h1>Discover verified salons and book with confidence.</h1>
          <p>
            Explore published salon websites, compare real services, and manage every appointment through one secure Nexora account. Phase 1 homepage now includes Categories, Top Rated, Trending, Nearby, Recommended, Offers, Slots, Sponsored, Membership, About.
          </p>
          <div className="button-row" style={{ flexWrap: "wrap" }}>
            <input value={homeQuery} onChange={(e) => setHomeQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") navigate(`/salons?q=${encodeURIComponent(homeQuery.trim())}`); }} placeholder="Search salon, service, area…" style={{ minWidth: 220, padding: "10px 14px", borderRadius: 12, border: "1px solid #e8e8e8", fontSize: 14 }} />
            <button className="primary" onClick={() => navigate(`/salons?q=${encodeURIComponent(homeQuery.trim())}`)}>Search</button>
            <select value={homeLocation} onChange={(e) => navigate(e.target.value ? `/salons?area=${encodeURIComponent(e.target.value)}` : "/salons")} style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #e8e8e8", fontSize: 13, maxWidth: 220 }}>
              <option value="">📍 All Jaipur</option>
              {JAIPUR_ZONES.map((z) => <optgroup key={z.zone} label={z.zone}>{z.areas.map((a) => <option key={a} value={a}>{a}</option>)}</optgroup>)}
            </select>
            <button className="secondary" onClick={() => navigate("/auth/signup")}>Create account</button>
          </div>
          <div className="trust-row">
            <span>✓ Published salons only</span><span>✓ Secure role access</span><span>✓ Clear payment status</span><span>✓ Phase 1 Connected</span>{refCode && <span style={{ borderColor: "var(--primary)" }}>✦ Partner referral active</span>}
          </div>
        </div>
        <div className="hero-card" aria-label="Nexora platform overview">
          <div className="glow-orb">✦</div>
          <h2>Your salon journey, connected</h2>
          <div className="journey-step"><b>01</b><span>Growth Partner prepares the salon website</span></div>
          <div className="journey-step"><b>02</b><span>Shop Owner reviews and publishes it</span></div>
          <div className="journey-step"><b>03</b><span>Customers discover and book safely</span></div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">Live marketplace</span>
          <h2>Published salons</h2>
          <p>Only owner-approved, active salon websites appear here. Verified=true, is_active=true, is_published=true, deleted_at null.</p>
        </div>
        <CatalogStrip navigate={navigate} online={online} statsBySalon={statsBySalon} />
      </section>

{visible('category_grid') && (
<section className="section" style={{background:"var(--cream)"}}>
        <div className="section-heading"><span className="eyebrow">Browse by category</span><h2>Categories</h2><p>Business categories from salons.business_category – smart search filter.</p></div>
        {categoriesLoading ? <div className="loader" /> : adminCategories.length ? <div className="salon-grid">{adminCategories.map((c) => <article key={c.slug} className="role-card" onClick={() => navigate(`/salons?category=${encodeURIComponent(c.name)}`)} style={{ cursor: "pointer" }}><span className="role-icon">{(c.icon && c.icon !== "star") ? c.icon : "🗂"}</span><h3>{c.name}</h3><p>{c.salon_count} salon{c.salon_count === 1 ? "" : "s"} · {c.service_count} services</p></article>)}</div> : <StateCard title="No categories yet" text="Approved categories will appear here when set by the admin panel." />}
        {error && <div className="form-message">{error}</div>}
      </section>)}

{visible('top_rated') && (
<section className="section">
        <div className="section-heading"><span className="eyebrow">Top rated</span><h2>Top Rated Salons</h2><p>Sorted by rating_average desc – highest rated first.</p></div>
        {topRatedLoading ? <SalonSkeletons count={3} /> : topRatedRows.length ? <div className="salon-grid">{topRatedRows.map((r) => <TopRatedCard key={r.id} row={r} navigate={navigate} />)}</div> : <StateCard title="Not enough reviews yet" text="Salons with at least 1 approved review appear here, ranked by a weighted rating." />}
      </section>)}

{visible('trending') && (
<section className="section" style={{background:"var(--cream)"}}>
        <div className="section-heading"><span className="eyebrow">Trending</span><h2>Trending Now</h2><p>Sorted by review_count desc – most reviewed.</p></div>
        {trendingLoading ? <SalonSkeletons count={3} /> : trendingRows.length ? <div className="salon-grid">{trendingRows.map((r) => <TrendingCard key={r.id} row={r} navigate={navigate} />)}</div> : <StateCard title="No trending activity yet" text="Salons rise here from recent bookings, views and reviews (time-decayed). Admin overrides can boost any salon." />}
      </section>)}

{visible('nearby') && (
<section className="section">
        <div className="section-heading"><span className="eyebrow">Nearby</span><h2>Salons near you</h2><p>{locationHeadline(location)}</p></div>
        <LocationNotice location={location} />
        {location.isImproving && !location.fix && (
          <div className="state-card" style={{ padding: 20, marginBottom: 18 }} role="status" aria-live="polite">
            <p style={{ margin: 0 }}>{location.status === "improving" ? "Improving your location…" : "Locating you…"}{location.candidateAccuracy != null ? ` (best so far ${formatAccuracy(location.candidateAccuracy)})` : ""}</p>
          </div>
        )}
        {nearbyLoading ? <SalonSkeletons count={3} /> : !nearbyRanked.length ? (
          <StateCard title="No salons nearby yet" text="Salons with location coordinates set by their owner appear here, sorted by distance calculated on your device." />
        ) : !location.fix ? (
          <div className="salon-grid">{nearbyRanked.slice(0, 6).map((row) => <NearbyDistanceCard key={row.id} row={row} navigate={navigate} />)}</div>
        ) : (
          nearbyBuckets.map((bucket) => (
            <div key={bucket.key} style={{ marginBottom: 26 }}>
              <div className="section-heading" style={{ marginBottom: 16 }}><h3 style={{ fontSize: 22, marginBottom: 4 }}>{bucket.title}</h3><p style={{ margin: 0, fontSize: 13 }}>{bucket.subtitle} · {bucket.items.length} salon{bucket.items.length === 1 ? "" : "s"}</p></div>
              <div className="salon-grid">{bucket.items.slice(0, 6).map((row) => <NearbyDistanceCard key={row.id} row={row} navigate={navigate} />)}</div>
            </div>
          ))
        )}
        <p className="section-hint" style={{ marginTop: 10 }}><button className="text-button" onClick={() => navigate("/salons")}>Open full search →</button></p>
      </section>)}

{visible('recommended') && (
<section className="section" style={{background:"var(--cream)"}}>
        <div className="section-heading"><span className="eyebrow">Recommended</span><h2>Recommended For You</h2><p>Sorted by rating_average * review_count – recommended ranking.</p></div>
        {recommended.length ? <div className="salon-grid">{recommended.map(item=><SalonCard key={item.id} item={item} navigate={navigate} stats={statsBySalon[item.id]} />)}</div> : <SalonSkeletons count={3} />}
      </section>)}

      {/* Recommended — personalized for logged-in customers; deterministic
          fallback (popular + top rated + active offers) for guests */}
      <section className="section">
        <div className="section-heading"><span className="eyebrow">Recommended</span><h2>Recommended For You</h2><p>{isPersonalized ? "Picked from your bookings, favourites and preferences." : "Popular, top-rated and trending salons — plus active offers."}</p></div>
        {recommendationsLoading ? <SalonSkeletons count={3} /> : recommendationRows.length ? <div className="salon-grid">{recommendationRows.map((row) => <RecommendationCard key={row.id} row={row} navigate={navigate} />)}</div> : <StateCard title="No recommendations yet" text="Salons will appear here as they get bookings, reviews and offers." />}
        {isPersonalized && (
          <p className="section-hint"><button className="text-button" onClick={() => navigate(PORTAL_PATHS.customer)}>Open your favourites in the Customer app →</button></p>
        )}
      </section>

{visible('offers') && (
<section className="section">
        <div className="section-heading"><span className="eyebrow">Offers</span><h2>Active Offers</h2><p>From offers table where is_active=true – RLS public read. Shows discount_type, discount_value.</p></div>
        <OffersStrip navigate={navigate} />
      </section>)}

      {/* Partner-approved promotions — only active + approved (published) */}
      <section className="section" style={{ background: "var(--cream)" }}>
        <div className="section-heading"><span className="eyebrow">Partner promotions</span><h2>Partner Approved Offers</h2><p>Active offers from Growth Partner onboarded salons — shown only after owner approval. Commission and partner details stay private.</p></div>
        <PartnerPromosStrip navigate={navigate} />
      </section>

{visible('available_today') && (
<section className="section" style={{background:"var(--cream)"}}>
        <div className="section-heading"><span className="eyebrow">Slots</span><h2>Open Today</h2><p>Real opening hours from salon_hours (owner managed) with config fallback — no mock slots.</p></div>
        <OpenTodayStrip items={items} navigate={navigate} />
      </section>)}

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

      {/* What customers say — public review content from the Customer PWA */}
      <section className="section">
        <div className="section-heading"><span className="eyebrow">Reviews</span><h2>What customers say</h2><p>Real reviews left by customers after their visits — public, verified bookings marked.</p></div>
        {reviewFeed.length ? <div className="service-grid">{reviewFeed.map((r, i) => <article className="service-card" key={i}><div><h3>{r.salonName}</h3><p>“{r.comment}”</p><small>★ {Number(r.rating).toFixed(1)} · {r.author}{r.verified_booking ? " · ✓ verified booking" : ""}</small></div><button className="text-button" onClick={() => navigate(`/salons/${r.salonSlug}`)}>View salon</button></article>)}</div> : <StateCard title="No reviews yet" text="Reviews customers leave in the Customer PWA appear here once published." />}
      </section>

      {/* Popular services — most-booked services across the catalog */}
      <section className="section" style={{ background: "var(--cream)" }}>
        <div className="section-heading"><span className="eyebrow">Popular services</span><h2>Most Booked Services</h2><p>Services customers book the most — live from booking activity.</p></div>
        {popularLoading ? <SalonSkeletons count={3} /> : popularServices.length ? <div className="service-grid">{popularServices.map((svc) => <article className="service-card" key={svc.service_id}><div><h3>{svc.service_name}</h3><p>{svc.salon_name}</p><small>{svc.duration_minutes} minutes · {svc.booking_count} bookings</small></div><div><b>{money(svc.price_paise)}</b><button className="text-button" onClick={() => navigate(`/salons/${items.find(i=>i.id===svc.salon_id)?.website.slug ?? ""}`)}>View salon</button></div></article>)}</div> : <StateCard title="No booking activity yet" text="Once customers start booking, the most popular services appear here." />}
      </section>

      {/* Membership — live plans + current customer status */}
{visible('membership') && (      <section className="section" style={{ background: "var(--cream)" }}>
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

      {/* About */}
      <section className="section">
        <div className="section-heading"><span className="eyebrow">About Nexora</span><h2>One connected platform</h2><p>Customers discover published salons, Shop Owners manage own shop data under RLS, Growth Partners submit proposals, commissions 10% of platform fee held 7 days, owner payout daily 22:00 IST. All 6 locked business rules verifiable via verify_business_rules().</p></div>
        <div className="role-grid">
          <RoleCard title="For Customers" text="Find published salons, book services, and follow payment or refund status." path={PORTAL_PATHS.customer} navigate={navigate} />
          <RoleCard title="For Shop Owners" text="Review website proposals, publish your storefront, manage bookings, services, staff, offers, wallet and earnings under RLS own only." path={PORTAL_PATHS.business_user} navigate={navigate} />
          <RoleCard title="For Growth Partners" text="Prepare salon websites, track attribution, and view commission hold status – 10% of platform fee, held 7 days." path={PORTAL_PATHS.growth_partner} navigate={navigate} />
          <RoleCard title="For Website Templates" text="Open the Owner website builder after the same Shop Owner identity and salon workspace are verified." path={TEMPLATE_PATH} navigate={navigate} />
        </div>
      </section>
    </main>
  );
}

function RoleCard({ title, text, path, navigate }: { title: string; text: string; path: string; navigate: (path: string) => void }) {
  return <article className="role-card"><span className="role-icon">✦</span><h3>{title}</h3><p>{text}</p><button onClick={() => navigate(path)}>Open portal →</button></article>;
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
          <button className="primary" onClick={() => navigate(`/auth/login?role=${role}&returnTo=${encodeURIComponent(portalPath)}`)}>Log in</button>
          <button className="secondary" onClick={() => navigate(`/auth/signup?role=${role}&returnTo=${encodeURIComponent(portalPath)}`)}>Sign up</button>
        </div>
      </section>
    </main>
  );
}

// Public catalog contract: verified=true, is_active=true, is_published=true, deleted_at null.
async function fetchCatalog(): Promise<CatalogItem[]> {
  const client = getClient();
  if (!client) throw new Error(missingSupabaseConfigMessage);
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

  const { data: businessLocations, error: businessLocationError } = await client
    .from("business_locations")
    .select("salon_id,latitude,longitude,approval_status")
    .in("salon_id", salonIds)
    .eq("approval_status", "approved");
  // A missing/unavailable location table must never cause fallback to legacy or
  // invented coordinates. The catalog remains usable without distances.
  if (businessLocationError) {
    console.warn("Approved business locations are unavailable; distance sorting is disabled.");
  }
  const approvedLocationBySalon = new Map(
    (businessLocations ?? []).map((location) => [location.salon_id, location]),
  );
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

function CatalogStrip({ navigate, online, statsBySalon }: { navigate: (path: string) => void; online: boolean; statsBySalon?: Record<string, SalonStats> }) {
  const { items, loading, error, load } = useCatalog(online);
  if (loading) return <SalonSkeletons count={3} />;
  if (error) return <StateCard title="Could not load salons" text={error} action="Retry" onAction={load} />;
  if (!items.length) return <StateCard title="No published salons yet" text="Owner-approved salon websites will appear here when published." />;
  return <div className="salon-grid">{items.slice(0, 3).map((item) => <SalonCard key={item.id} item={item} navigate={navigate} stats={statsBySalon?.[item.id]} />)}</div>;
}

/**
 * "Open Today" strip — real opening hours for the published catalog.
 * Source of truth: salon_hours table (owner managed); falls back to the
 * website config opening_hours (proposal payload) when the table is empty.
 * Shows the earliest opening salon first; never fabricates slots.
 */
function OpenTodayStrip({ items, navigate }: { items: CatalogItem[]; navigate: (path: string) => void }) {
  const [todayRows, setTodayRows] = useState<Record<string, { opens: string | null; closes: string | null; closed: boolean }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const client = getClient();
        if (!client || !items.length) { setLoading(false); return; }
        const today = new Date().getDay(); // JS: 0=Sunday — same as Postgres day_of_week
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
        setTodayRows(map);
      } catch { /* degrade to empty */ } finally { if (active) setLoading(false); }
    };
    const t = setTimeout(() => void load(), 0);
    return () => { active = false; clearTimeout(t); };
  }, [items]);

  if (loading) return <SalonSkeletons count={3} />;
  const openNow = items.filter((i) => todayRows[i.id] && !todayRows[i.id].closed);
  if (!openNow.length) return <StateCard title="No opening hours yet" text="Shop owners set weekly hours in the Owner PWA (salon_hours table). They appear here as soon as they are published." />;
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

function OffersStrip({ navigate }: { navigate: (path: string) => void }) {
  const [offers, setOffers] = useState<OfferDetail[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const client = getClient(); if (!client) { setLoading(false); return; }
        const { data, error } = await client.rpc("marketplace_offers", { p_limit: 12 });
        if (error) throw error;
        if (active) setOffers((data ?? []) as OfferDetail[]);
      } catch { /* strip degrades gracefully */ } finally { if (active) setLoading(false); }
    };
    const t = setTimeout(() => void load(), 0);
    return () => { active = false; clearTimeout(t); };
  }, []);
  if (loading) return <SalonSkeletons count={3} />;
  if (!offers.length) return <StateCard title="No active offers yet" text="Approved, in-date offers from published salons appear here — usage limits and eligibility enforced server-side." />;
  return <div className="service-grid">{offers.map((o) => <OfferDetailCard key={o.offer_id} offer={o} navigate={navigate} />)}</div>;
}

function OfferDetailCard({ offer, navigate }: { offer: OfferDetail; navigate: (path: string) => void }) {
  const pct = offer.discount_type === "percent";
  const discountLabel = pct ? `${offer.discount_value}% off` : offer.discount_value != null ? `${money(offer.discount_value * 100)} off` : "Limited offer";
  const maxCap = offer.maximum_discount_paise != null && offer.maximum_discount_paise > 0 ? ` · up to ${money(offer.maximum_discount_paise)} off` : "";
  const minSpend = offer.minimum_booking_paise != null && offer.minimum_booking_paise > 0 ? `Min. spend ${money(offer.minimum_booking_paise)}` : null;
  const validity = offer.valid_from || offer.valid_until
    ? `Valid ${offer.valid_from ? "from " + new Date(offer.valid_from).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}${offer.valid_until ? " till " + new Date(offer.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}`
    : null;
  return (
    <article className="service-card">
      <div>
        <h3>{offer.name ?? "Offer"} <em style={{ fontSize: 10, color: "#e6007e" }}>{offer.membership_only ? "· members" : ""}</em></h3>
        <p>{offer.description || ""}</p>
        <small style={{ display: "block", marginBottom: 4 }}><b>{discountLabel}</b>{maxCap}{minSpend ? ` · ${minSpend}` : ""}</small>
        {offer.eligible_services.length > 0 && <small style={{ display: "block" }}>On: {offer.eligible_services.map((sv) => sv.service_name).join(", ")}</small>}
        {offer.terms && <small style={{ display: "block", color: "#8c7077" }}>Terms: {offer.terms}</small>}
        {validity && <small style={{ display: "block", color: "#8c7077" }}>🕑 {validity}</small>}
        {offer.code && <small style={{ display: "block", fontWeight: 700, color: "#8e004b" }}>Coupon: {offer.code}</small>}
        {offer.remaining_global != null && offer.remaining_global <= 10 && <small style={{ display: "block", color: "#b45309" }}>Only {Math.max(offer.remaining_global, 0)} left</small>}
      </div>
      <div>
        <button className="text-button" onClick={() => navigate(`/salons/${offer.salon_slug}`)}>{offer.salon_name} →</button>
        <button className="primary" style={{ marginTop: 6, fontSize: 12, padding: "8px 12px" }} onClick={() => navigate(`/salons/${offer.salon_slug}`)}>Book Now</button>
      </div>
    </article>
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
  const [results, setResults] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]"); } catch { return []; }
  });

  const searchParams = useMemo(() => ({ q: debouncedQuery, category: categoryFilter, location: locationFilter, price: priceFilter, rating: ratingFilter, offer: offerOnly, gender: genderFilter, sort: sortBy }), [debouncedQuery, categoryFilter, locationFilter, priceFilter, ratingFilter, offerOnly, genderFilter, sortBy]);

  const runSearch = useCallback(async (offset: number) => {
    const client = getClient();
    if (!client) return { rows: [] as SearchRow[] };
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
        return { rows: data as SearchRow[] };
      }
    } catch {
      // fallback to direct catalog query
    }

    // Direct catalog query fallback respecting safety gates (verified=true, is_active=true, is_published=true)
    const all = await fetchCatalog();
    const q = (searchParams.q || '').toLowerCase();
    const cat = (searchParams.category || '').toLowerCase();
    const loc = (searchParams.location || '').toLowerCase();

    const filtered = all.filter((item) => {
      if (cat && (item.business_category || '').toLowerCase() !== cat) return false;
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

  // URL sync (q, category, area) — reflect search in the URL.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (debouncedQuery) url.searchParams.set("q", debouncedQuery); else url.searchParams.delete("q");
    if (categoryFilter) url.searchParams.set("category", categoryFilter); else url.searchParams.delete("category");
    if (locationFilter) url.searchParams.set("area", locationFilter); else url.searchParams.delete("area");
    window.history.replaceState({}, "", url.toString());
  }, [debouncedQuery, categoryFilter, locationFilter]);

  // Deep links + initial params
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q"); if (q) { setQuery(q); setDebouncedQuery(q); }
      const cat = params.get("category"); if (cat) setCategoryFilter(cat);
      const area = params.get("area"); if (area) setLocationFilter(area);
      const city = params.get("city"); if (city && !area) setLocationFilter(city);
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
        <label>Location<select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}><option value="">All Jaipur</option>{JAIPUR_ZONES.map((z) => <optgroup key={z.zone} label={z.zone}>{z.areas.map((a) => <option key={a} value={a}>{a}</option>)}</optgroup>)}</select></label>
        <label>Price<select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>{priceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
        <label>Min rating<select value={ratingFilter} onChange={(e) => setRatingFilter(Number(e.target.value))}><option value={0}>Any rating</option><option value={4}>4+ ★</option><option value={4.5}>4.5+ ★</option></select></label>
        <label>Audience<select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}><option value="">Any</option><option value="female">Women</option><option value="male">Men</option><option value="unisex">Unisex</option></select></label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, paddingTop: 6 }}><input type="checkbox" checked={offerOnly} onChange={(e) => setOfferOnly(e.target.checked)} /> Offers only</label>
        <label>Sort by<select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="relevance">Relevance</option><option value="rating">Rating</option><option value="popularity">Popularity</option><option value="price">Price low-high</option><option value="availability">Availability</option><option value="name">Name A-Z</option></select></label>
      </div>

      {/* States */}
      {loading ? <SalonSkeletons count={6} /> : error ? <StateCard title="Could not search salons" text={error} action="Retry" onAction={() => { setLoading(true); void runSearch(0).then(({ rows }) => setResults(rows)).finally(() => setLoading(false)); }} /> : !results.length ? <StateCard title={query || categoryFilter || locationFilter ? "No matching salon" : "No published salons yet"} text={query || categoryFilter || locationFilter ? "Try another name, area, category or clear some filters." : "Owner-approved salon websites will appear here when published."} /> : (
        <>
          <p style={{ fontSize: 12, color: "#8c7077", margin: "0 0 12px" }}>{results.length} result{results.length === 1 ? "" : "s"}{query ? ` for “${query}”` : ""}{categoryFilter ? ` · ${categoryFilter}` : ""}{locationFilter ? ` · ${locationFilter}` : ""}</p>
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
      <div className="salon-body"><div className="salon-meta"><span>{row.business_category ?? "Salon"}</span><span>★ {Number(row.rating_avg).toFixed(1)} ({row.review_count}) · {row.booking_count} bookings</span></div>
      <h3>{row.name}</h3><p>{row.area ?? row.city}, {row.city}{row.landmark ? ` · ${row.landmark}` : ""}</p><div className="salon-bottom"><b>From {money(row.starting_price_paise)}</b><button onClick={() => navigate(`/salons/${row.slug}`)}>View salon</button></div></div>
    </article>
  );
}

function TopRatedCard({ row, navigate }: { row: TopRatedRow; navigate: (path: string) => void }) {
  return (
    <article className="salon-card">
      <div className="salon-visual" style={row.cover_image_path?.startsWith("http") ? { backgroundImage: `url("${row.cover_image_path.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!row.cover_image_path?.startsWith("http") && <span>✦</span>}<em>Verified</em></div>
      <div className="salon-body"><div className="salon-meta"><span>{row.business_category ?? "Salon"}</span><span>★ {Number(row.bayesian_rating).toFixed(1)} ({row.review_count} reviews)</span></div>
      <h3>{row.name}</h3><p>{row.area ?? row.city}, {row.city}</p><div className="salon-bottom"><b>From {money(row.starting_price_paise)}</b><button onClick={() => navigate(`/salons/${row.slug}`)}>View salon</button></div></div>
    </article>
  );
}

function TrendingCard({ row, navigate }: { row: TrendingRow; navigate: (path: string) => void }) {
  return (
    <article className="salon-card">
      <div className="salon-visual"><span>🔥</span><em>{row.overridden ? "ADMIN FEATURED" : "TRENDING"}</em></div>
      <div className="salon-body"><div className="salon-meta"><span>{row.business_category ?? "Salon"}</span><span>★ {Number(row.rating_avg).toFixed(1)} ({row.review_count})</span></div>
      <h3>{row.name}</h3><p>{row.area ?? row.city}, {row.city} · {row.booking_count} recent bookings</p><div className="salon-bottom"><button onClick={() => navigate(`/salons/${row.slug}`)}>View salon</button></div></div>
    </article>
  );
}

function RecommendationCard({ row, navigate }: { row: RecommendationRow; navigate: (path: string) => void }) {
  return (
    <article className="salon-card">
      <div className="salon-visual" style={row.cover_image_path?.startsWith("http") ? { backgroundImage: `url("${row.cover_image_path.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!row.cover_image_path?.startsWith("http") && <span>✦</span>}<em>Verified</em></div>
      <div className="salon-body"><div className="salon-meta"><span>{row.business_category ?? "Salon"}</span><span>★ {Number(row.rating_avg).toFixed(1)} ({row.review_count})</span></div>
      <h3>{row.name}</h3><p>{row.area ?? row.city}, {row.city}</p><div className="salon-bottom"><b>From {money(row.starting_price_paise)}</b><button onClick={() => navigate(`/salons/${row.slug}`)}>View salon</button></div>
      <div style={{ marginTop: 8 }}><em style={{ fontSize: 11, color: "#8c7077", background: "var(--cream,#fff5f8)", padding: "3px 8px", borderRadius: 999 }}>{row.reason}{row.personalized ? " · for you" : ""}</em></div></div>
    </article>
  );
}

function SalonCard({ item, navigate, stats }: { item: CatalogItem; navigate: (path: string) => void; stats?: SalonStats }) {
  const rating = stats ? Number(stats.rating_avg) : Number(item.rating_average);
  const reviews = stats ? Number(stats.review_count) : Number(item.review_count);
  const bookings = stats ? Number(stats.booking_count) : 0;
  return (
    <article className="salon-card">
      <div className="salon-visual" style={item.cover_image_path?.startsWith("http") ? { backgroundImage: `url("${item.cover_image_path.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!item.cover_image_path?.startsWith("http") && <span>✦</span>}<em>Verified</em></div>
      <div className="salon-body"><div className="salon-meta"><span>{item.business_category ?? "Salon"}</span><span>★ {rating.toFixed(1)} ({reviews}){bookings > 0 ? ` · ${bookings} bookings` : ""}</span></div>
      <h3>{item.name}</h3><p>{item.area ?? item.city}, {item.city}</p><div className="salon-bottom"><b>From {money(item.starting_price_paise)}</b><button onClick={() => navigate(`/salons/${item.website.slug}`)}>View salon</button></div></div>
    </article>
  );
}


const EMPTY_MARKETPLACE: SalonMarketplace = { services: [], staff: [], hours: [], offers: [] };


function useMarketplaceStats(online: boolean) {
  const [statsBySalon, setStatsBySalon] = useState<Record<string, SalonStats>>({});
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = getClient();
      if (!client) return;
      const { data, error } = await client.rpc("marketplace_salon_stats");
      if (error) throw error;
      const map: Record<string, SalonStats> = {};
      for (const row of (data ?? []) as SalonStats[]) map[row.salon_id] = row;
      setStatsBySalon(map);
    } catch { /* sections fall back to salons columns */ } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  return { statsBySalon, loading, load };
}

/** Most-booked services across the published catalog. */
function usePopularServices(online: boolean) {
  const [services, setServices] = useState<PopularService[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = getClient();
      if (!client) return;
      const { data, error } = await client.rpc("marketplace_popular_services", { p_limit: 6 });
      if (error) throw error;
      setServices((data ?? []) as PopularService[]);
    } catch { setServices([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  return { services, loading, load };
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
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = getClient(); if (!client) return;
      const { data, error } = await client.rpc("marketplace_categories");
      if (error) throw error;
      setCategories((data ?? []) as CategoryRow[]);
    } catch { setCategories([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  return { categories, loading, load };
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
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = getClient(); if (!client) return;
      const { data, error } = await client.rpc("marketplace_top_rated", { p_min_reviews: 1, p_limit: 6 });
      if (error) throw error;
      setRows((data ?? []) as TopRatedRow[]);
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  return { rows, loading, load };
}

/** Trending — time-decayed score (bookings/events/reviews) + admin overrides. */
function useTrending(online: boolean) {
  const [rows, setRows] = useState<TrendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = getClient(); if (!client) return;
      const { data, error } = await client.rpc("marketplace_trending", { p_limit: 6 });
      if (error) throw error;
      setRows((data ?? []) as TrendingRow[]);
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online]);
  return { rows, loading, load };
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
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = getClient(); if (!client) { setLoading(false); return; }
      const { data, error } = await client.rpc("marketplace_recommendations", { p_limit: 6 });
      if (error) throw error;
      const list = (data ?? []) as RecommendationRow[];
      setRows(list);
      setIsPersonalized(list.some((r) => r.personalized));
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => { if (online) void load(); else setLoading(false); }, 0);
    return () => window.clearTimeout(t);
  }, [load, online, session]);
  return { rows, loading, isPersonalized, load };
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

function destinationForVerifiedRole(role: PlatformRole, requestedReturnTo: string | null): string {
  const home = homePathForRole(role);
  // Customers may resume only a validated local path. Every other role —
  // including Delivery Partner and Admin — continues to its server-profile home
  // unless the return path is that role's own same-origin portal.
  if (role !== "customer") {
    const safe = safeReturnPath(requestedReturnTo, home);
    const path = safe.split("?", 1)[0];
    if (role === "business_user" && (path === PORTAL_PATHS.business_user || path.startsWith(`${PORTAL_PATHS.business_user}/`) || isTemplatePath(path))) {
      return safe;
    }
    if (role === "growth_partner" && (path === PORTAL_PATHS.growth_partner || path.startsWith(`${PORTAL_PATHS.growth_partner}/`))) {
      return safe;
    }
    return home;
  }
  return safeReturnPath(requestedReturnTo, home);
}

function AuthPage({ mode, navigate, refCode }: { mode: "login" | "signup"; navigate: (path: string) => void; refCode: string }) {
  // Keep the first render identical on server and client (hydration-safe);
  // query params are applied only after mount.
  const [role, setRole] = useState<Role>("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("error");
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  // Section 10.2 — Google OAuth is fail-safe OFF unless the deployment opts in.
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
        // Admin is never a public self-service signup choice.
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

  // Section 10.2 — Google OAuth via the shared Auth Service. The client
  // flowType is "pkce", so signInWithGoogle generates and verifies the code
  // challenge through buildCallbackUrl(). Fail-safe: any provider error hides
  // the button entirely.
  const continueWithGoogle = async () => {
    setGoogleBusy(true);
    try {
      const { returnTo } = readAuthQueryParams();
      await signInWithGoogle({ returnTo, role: isSignupRole(role) ? role : undefined });
    } catch (cause) {
      // Unverified provider, missing keys, or blocked redirect → hide button.
      console.warn("[Nexora] Google OAuth unavailable:", authErrorMessage(cause));
      setGoogleOauthFailed(true);
    } finally {
      setGoogleBusy(false);
    }
  };

  const roleLabel = ROLE_LABELS[role] ?? "Customer";
  const configDiagnostics = configError || (typeof window !== "undefined" && !getClient() ? getDetailedConfigError() : "");

  return (
    <main className="center-page auth-bg">
      <form className="auth-card" onSubmit={submit} noValidate>
        <span className="eyebrow">{mode === "login" ? "Welcome back" : `Join Nexora as ${roleLabel}`}</span>
        <h1>{mode === "login" ? "Log in" : "Create your account"}</h1>
        <p className="preview-note" style={{ marginTop: -8 }}>
          {mode === "login"
            ? "Accounts are permanent – Nexora routes you to your assigned dashboard automatically."
            : `Creating a ${roleLabel} account on the shared Supabase project ${SUPABASE_PROJECT_REF}. Same account works across website, customer app, owner app and partner app.`}
        </p>
        <label>
          Account role
          <select value={role} onChange={(event) => setRole(event.target.value as Role)} disabled={mode === "login"}>
            <option value="customer">Customer</option>
            <option value="business_user">Shop Owner</option>
            <option value="growth_partner">Growth Partner</option>
            <option value="delivery_partner">Delivery Partner</option>
            {mode === "login" && <option value="admin">Administrator</option>}
          </select>
          {mode === "login" && <small className="preview-note">Role is fixed to your existing profile. You will be routed automatically.</small>}
        </label>
        {mode === "signup" && (
          <label>
            Full name
            <input required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Your full name" />
          </label>
        )}
        <label>
          Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@domain.com" />
        </label>
        <label>
          Password
          <div style={{ position: "relative" }}>
            <input
              required
              minLength={8}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="At least 8 characters"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((s) => !s)}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, color: "#705a64", fontSize: 12, fontWeight: 800 }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {configDiagnostics && <div className="form-message" role="alert" style={{ background: "#fff1d8", color: "#7d540b" }}>{configDiagnostics}</div>}
        {message && (
          <div className={`form-message ${messageType}`} role="status" style={messageType === "success" ? { background: "#e9f8f1", color: "#12704c" } : messageType === "info" ? { background: "#eef4ff", color: "#2f6fed" } : undefined}>
            {message}
          </div>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Log in securely" : `Create ${roleLabel} account`}
        </button>
        {googleOauthConfigured && !googleOauthFailed && (
          <button type="button" className="secondary" disabled={googleBusy} onClick={() => void continueWithGoogle()}>
            {googleBusy ? "Redirecting to Google…" : "Continue with Google"}
          </button>
        )}
        {googleOauthConfigured && googleOauthFailed && (
          <p className="preview-note">Google sign-in is temporarily unavailable. Please use email and password.</p>
        )}
        <div className="button-row" style={{ justifyContent: "space-between", marginTop: 6 }}>
          <button type="button" className="text-button" onClick={() => navigate(mode === "login" ? "/auth/signup" : "/auth/login")}>
            {mode === "login" ? "Need an account? Sign up" : "Already registered? Log in"}
          </button>
          {mode === "login" && (
            <button type="button" className="text-button" onClick={() => navigate("/auth/forgot-password")}>
              Forgot password?
            </button>
          )}
          {needsVerification && mode === "signup" && (
            <button type="button" className="secondary compact" disabled={busy} onClick={() => void resend()}>
              {busy ? "Sending…" : "Resend confirmation email"}
            </button>
          )}
          {messageType === "success" && mode === "signup" && (
            <button type="button" className="secondary compact" onClick={() => navigate(`${AUTH_ROUTES.login}?role=${role === "business_user" ? "owner" : role === "growth_partner" ? "growth-partner" : role === "delivery_partner" ? "delivery" : "customer"}`)}>
              Go to login →
            </button>
          )}
        </div>
        <div className="trust-row" style={{ marginTop: 18 }}>
          <span>✓ Shared Supabase {SUPABASE_PROJECT_REF}</span><span>✓ RLS protected</span><span>✓ Role locked</span>
        </div>
      </form>
    </main>
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
 * Customers may resume a validated local deep link; every other role lands on
 * its own canonical portal, including the delivery/admin mount fallbacks.
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

      const roleHome = homePathForRole(role);
      const destination = role === "customer" && requestedReturnTo
        ? requestedReturnTo
        : roleHome;
      navigate(destination);
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
      // Neutral recovery: never reveal whether the email exists. The shared
      // service sends a PKCE recovery link to AUTH_ROUTES.resetPassword.
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
    <main className="center-page auth-bg">
      <form className="auth-card" onSubmit={submit} noValidate>
        <span className="eyebrow">Account recovery</span>
        <h1>Reset your password</h1>
        <p className="preview-note" style={{ marginTop: -8 }}>
          We will email you a secure link. The link signs you in once, then you choose a new password. Links expire and can only be used on this website.
        </p>
        <label>
          Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@domain.com" />
        </label>
        {message && (
          <div className={`form-message ${messageType}`} role="status" style={messageType === "success" ? { background: "#e9f8f1", color: "#12704c" } : undefined}>
            {message}
          </div>
        )}
        <button className="primary" disabled={busy}>{busy ? "Sending…" : "Email me a reset link"}</button>
        <div className="button-row" style={{ justifyContent: "space-between", marginTop: 6 }}>
          <button type="button" className="text-button" onClick={() => navigate("/auth/login")}>Back to login</button>
          <button type="button" className="text-button" onClick={() => navigate("/auth/signup")}>Need an account? Sign up</button>
        </div>
      </form>
    </main>
  );
}

function ResetPasswordPage({ navigate }: { navigate: (path: string) => void }) {
  const { session, loading, configError, updatePassword, requireAuth, handleAuthCallback } = useAuth();
  const [ready, setReady] = useState<"waiting" | "ready" | "failed">("waiting");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // The recovery link lands with ?code=…&type=recovery. The shared provider
  // already owns the single root session listener; this page only consumes
  // provider state and, if a PKCE code is present, the canonical callback.
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      if (configError) {
        if (active) {
          setReady("failed");
          setMessage(configError);
        }
        return;
      }
      if (loading) {
        if (active) setReady("waiting");
        return;
      }
      if (session) {
        if (active) setReady("ready");
        return;
      }
      try {
        const href = typeof window !== "undefined" ? window.location.href : "";
        if (href && new URL(href).searchParams.get("code")) {
          await handleAuthCallback(href);
          if (active) setReady("ready");
          return;
        }
      } catch (cause) {
        if (active) {
          setReady("failed");
          setMessage(authErrorMessage(cause));
        }
        return;
      }
      if (active) {
        setReady("failed");
        setMessage("This password reset link is invalid or has expired. Request a new one.");
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [configError, handleAuthCallback, loading, session]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await updatePassword(password);
      const { profile } = await requireAuth();
      navigate(homePathForRole(profile.role));
    } catch (cause) {
      setMessage(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  if (ready === "waiting") {
    return (
      <main className="center-page">
        <section className="entry-card">
          <span className="eyebrow">Account recovery</span>
          <h1>Verifying reset link…</h1>
          <div className="loader" aria-label="Verifying reset link" />
        </section>
      </main>
    );
  }
  if (ready === "failed") {
    return (
      <main className="center-page">
        <StateCard title="Reset link unavailable" text={message || "Request a new password reset link."} action="Request new link" onAction={() => navigate("/auth/forgot-password")} />
      </main>
    );
  }
  return (
    <main className="center-page auth-bg">
      <form className="auth-card" onSubmit={submit} noValidate>
        <span className="eyebrow">Account recovery</span>
        <h1>Choose a new password</h1>
        <label>
          New password
          <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
        </label>
        <label>
          Confirm new password
          <input required minLength={8} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" placeholder="Repeat the new password" />
        </label>
        {message && <div className="form-message" role="alert">{message}</div>}
        <button className="primary" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
      </form>
    </main>
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

function isPortalMounted(key: PortalKey): boolean {
  if (key === "customer") return process.env.NEXT_PUBLIC_NEXORA_CUSTOMER_PORTAL_MOUNTED === "true";
  if (key === "owner") return process.env.NEXT_PUBLIC_NEXORA_OWNER_PORTAL_MOUNTED === "true";
  if (key === "partner") return process.env.NEXT_PUBLIC_NEXORA_PARTNER_PORTAL_MOUNTED === "true";
  if (key === "template") return process.env.NEXT_PUBLIC_NEXORA_TEMPLATE_PORTAL_MOUNTED === "true";
  return false;
}

function portalLabel(key: PortalKey): string {
  if (key === "owner") return "Shop Owner";
  if (key === "partner") return "Growth Partner";
  if (key === "template") return "Template";
  return "Customer";
}

function MountedPortalFrame({ mountKey }: { mountKey: PortalKey }) {
  const src = `${portalPathForMountKey(mountKey)}/`;
  return (
    <main className="portal-mount">
      <iframe
        title={`${portalLabel(mountKey)} app`}
        src={src}
        className="portal-frame"
        allow="geolocation; clipboard-write"
      />
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
    const returnTo = isPortalPath(currentPath) ? currentPath : portalPathForRole(loginRole);
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
      if (!isMountedPortalRole(profileRole)) {
        navigate(homePathForRole(profileRole));
        return;
      }
      if (requestedRole && requestedRole !== profileRole) {
        navigate(portalPathForRole(profileRole));
        return;
      }

      // Role alone does not grant an app workspace. Verify the app-specific
      // server membership before handing the browser to the mounted PWA.
      // These gates re-verify auth.getUser() and never accept client-side ids.
      if (!client) throw new Error(missingSupabaseConfigMessage);
      let salonIds: string[] = [];
      if (profileRole === "business_user") {
        const workspace = await requireOwnerWorkspace(client);
        salonIds = workspace.salonIds;
      } else if (profileRole === "growth_partner") await requirePartnerMembership(client);
      else await requireCustomerAccount(client);

      if (!isPortalPath(currentPath)) {
        navigate(portalPathForRole(profileRole));
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
  if (mountKey === "template" && !isPortalMounted("template")) {
    return (
      <TemplateWorkspaceHost
        userId={workspace.userId}
        salonIds={workspace.salonIds}
        navigate={navigate}
        signOut={signOut}
      />
    );
  }
  if (!isPortalMounted(mountKey)) return <main className="center-page"><section className="entry-card"><span className="eyebrow">Nexora portal gateway</span><h1>{portalLabel(mountKey)} app is not mounted</h1><p>This path is reserved for the separately deployed PWA. Configure its reverse-proxy origin before enabling production traffic. The Main Website does not render a duplicate dashboard here.</p></section></main>;
  return <MountedPortalFrame mountKey={mountKey} />;
}

function TemplateWorkspaceHost({
  userId,
  salonIds,
  navigate,
  signOut,
}: {
  userId?: string;
  salonIds: string[];
  navigate: (path: string) => void;
  signOut: (destination?: string) => Promise<void>;
}) {
  return (
    <main className="center-page">
      <section className="entry-card">
        <span className="eyebrow">Template App</span>
        <h1>Website builder connected</h1>
        <p>
          This surface uses the same Nexora account as the Shop Owner app. Identity comes from
          Supabase Auth project {SUPABASE_PROJECT_REF}; salon access comes from owner_salon_ids().
          No local or fake login is used here.
        </p>
        <p className="preview-note">Signed-in user: {userId || "unknown"}</p>
        <p className="preview-note">
          Authorized salon{salonIds.length === 1 ? "" : "s"}: {salonIds.length ? salonIds.join(", ") : "none"}
        </p>
        <div className="button-row">
          <button className="primary" onClick={() => navigate(PORTAL_PATHS.business_user)}>Open Shop Owner app</button>
          <button className="secondary" onClick={() => void signOut("/")}>Sign out</button>
        </div>
      </section>
    </main>
  );
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

function StateCard({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className="state-card"><span>✦</span><h3>{title}</h3><p>{text}</p>{action && onAction && <button className="secondary" onClick={onAction}>{action}</button>}</div>;
}

function SalonSkeletons({ count }: { count: number }) {
  return <div className="salon-grid" aria-label="Loading salons">{Array.from({ length: count }, (_, index) => <div className="salon-card skeleton" key={index}><div /><p /><p /><p /></div>)}</div>;
}

function Footer({ navigate }: { navigate: (path: string) => void }) {
  return <footer><div><div className="brand"><span className="brand-mark">N</span><span>Nexora</span></div><p>One connected platform for salons, customers, owners, growth partners, and beauty careers.</p></div><div><b>Explore</b><button onClick={() => navigate("/salons")}>Published salons</button><button onClick={() => window.location.assign("/job-portal")}>Job Portal</button><button onClick={() => navigate("/auth/login")}>Log in</button></div><div><b>Legal</b><button onClick={() => navigate("/terms")}>Terms & Conditions</button><button onClick={() => navigate("/privacy")}>Privacy Policy</button><button onClick={() => navigate("/cancellation-refund")}>Cancellation & Refund</button></div></footer>;
}
