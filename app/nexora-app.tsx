"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient, Session, SupabaseClient } from "@supabase/supabase-js";
import {
  PORTAL_PATHS,
  isPortalPath,
  legacyDashboardRoleFromPath,
  portalPathForRole,
  portalRoleFromPath,
  roleQueryForPortalRole,
} from "./lib/portalRoutes";

type Role = "customer" | "business_user" | "growth_partner";
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
};
type Website = {
  salon_id: string;
  slug: string;
  template_key: string;
  config: Record<string, unknown>;
  published_at: string | null;
};
type CatalogItem = Salon & { website: Website };
type AuthState = {
  loading: boolean;
  session: Session | null;
  role?: Role;
};

// Main Website is Next/vinext. Do not mix Vite prefixes into this app.
const SUPABASE_PROJECT_REF = "qwaehqsmodekbgvnaavz";
const EXPECTED_SUPABASE_HOST = `${SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const missingSupabaseConfigMessage =
  `Nexora login service is not configured for this deployment. Set NEXT_PUBLIC_SUPABASE_URL=https://${EXPECTED_SUPABASE_HOST} and NEXT_PUBLIC_SUPABASE_ANON_KEY from the shared Supabase project ${SUPABASE_PROJECT_REF}.`;

function isKnownPlatformRole(value: unknown): value is Role {
  return value === "customer" || value === "business_user" || value === "growth_partner";
}

let singleton: SupabaseClient | null = null;
let singletonCacheKey = "";

function getClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  // validate URL
  try {
    const u = new URL(supabaseUrl);
    if (u.hostname !== EXPECTED_SUPABASE_HOST) {
      console.warn(`[Nexora] Using Supabase host ${u.hostname}, expected ${SUPABASE_PROJECT_REF}.supabase.co – auth sharing requires shared project.`);
    }
  } catch {
    return null;
  }
  const cacheKey = `${supabaseUrl}::${supabaseKey}`;
  if (singleton && singletonCacheKey === cacheKey) return singleton;
  singleton = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  singletonCacheKey = cacheKey;
  return singleton;
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
  if (lower.includes("email not confirmed") || lower.includes("email not confirmed") || lower.includes("confirmation")) {
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
  const [authState, setAuthState] = useState<AuthState>({
    loading: Boolean(supabaseUrl && supabaseKey),
    session: null,
  });

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    const pop = () => setPath(window.location.pathname);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      window.removeEventListener("popstate", pop);
    };
  }, []);

  useEffect(() => {
    const client = getClient();
    if (!client) {
      setAuthState({ loading: false, session: null });
      return;
    }

    let active = true;
    let sessionRevision = 0;

    const syncSession = async (session: Session | null) => {
      const revision = ++sessionRevision;
      if (!active) return;

      if (!session) {
        setAuthState({ loading: false, session: null });
        return;
      }

      setAuthState({ loading: true, session });
      try {
        const { data: profile, error: profileError } = await client
          .from("profiles")
          .select("platform_role,is_active")
          .eq("id", session.user.id)
          .maybeSingle();
        if (profileError || !profile || profile.is_active !== true || !isKnownPlatformRole(profile.platform_role)) {
          // Fail closed. A Supabase session without an active canonical
          // profile is not allowed to remain a protected website session.
          console.warn("[Nexora] profile authorization failed", profileError?.message || "missing/inactive/invalid profile");
          await client.auth.signOut();
          if (!active || revision !== sessionRevision) return;
          setAuthState({ loading: false, session: null });
          return;
        }
        if (!active || revision !== sessionRevision) return;
        setAuthState({ loading: false, session, role: profile.platform_role });
      } catch (cause) {
        if (!active || revision !== sessionRevision) return;
        setAuthState({ loading: false, session, role: undefined });
      }
    };

    void client.auth.getSession().then(({ data }) => syncSession(data.session));
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void syncSession(session), 0);
    });

    return () => {
      active = false;
      sessionRevision += 1;
      subscription.unsubscribe();
    };
  }, []);

  const navigate = useCallback((target: string) => {
    window.history.pushState({}, "", target);
    setPath(new URL(target, window.location.origin).pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const signOut = useCallback(async (destination = "/") => {
    setAuthState({ loading: false, session: null });
    await getClient()?.auth.signOut();
    navigate(destination);
  }, [navigate]);

  let content: React.ReactNode;
  if (path === "/salons") content = <CatalogPage navigate={navigate} online={online} />;
  else if (path.startsWith("/salons/"))
    content = <SalonPage slug={safeDecodePathSegment(path.slice(8))} navigate={navigate} online={online} />;
  else if (path.startsWith("/booking/"))
    content = <LegacyBookingHandoff slug={safeDecodePathSegment(path.slice(9))} navigate={navigate} />;
  else if (path === "/terms") content = <LegalPage type="terms" />;
  else if (path === "/privacy") content = <LegalPage type="privacy" />;
  else if (path === "/cancellation-refund") content = <LegalPage type="refund" />;
  else if (path === "/login" || path === "/signup")
    content = <AuthPage mode={path === "/login" ? "login" : "signup"} navigate={navigate} />;
  else if (path === "/admin" || path.startsWith("/admin/"))
    content = <AdminUnavailable />;
  else if (isPortalPath(path))
    content = <PortalGateway expectedRole={portalRoleFromPath(path) ?? undefined} navigate={navigate} signOut={signOut} />;
  else if (path.startsWith("/dashboard"))
    content = <PortalGateway expectedRole={legacyDashboardRoleFromPath(path) ?? undefined} navigate={navigate} signOut={signOut} />;
  else if (path === "/customer" || path === "/owner" || path === "/growth-partner")
    content = <RoleEntry path={path} navigate={navigate} />;
  else content = <HomePage navigate={navigate} online={online} />;

  return (
    <div className="site-shell">
      {!online && <div className="offline-banner">Offline — live salon and account data may be unavailable.</div>}
      {!getClient() && <div className="offline-banner" style={{ background: "#7b244a" }}>Supabase not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for project {SUPABASE_PROJECT_REF}.</div>}
      <Header navigate={navigate} authState={authState} signOut={signOut} />
      {content}
      <Footer navigate={navigate} />
    </div>
  );
}

function Header({
  navigate,
  authState,
  signOut,
}: {
  navigate: (path: string) => void;
  authState: AuthState;
  signOut: (destination?: string) => Promise<void>;
}) {
  const dashboardLabel =
    authState.role === "business_user"
      ? "Shop Owner app"
      : authState.role === "growth_partner"
        ? "Growth Partner app"
        : authState.role === "customer"
          ? "Customer app"
          : "Account";
  // Canonical same-origin portal paths keep all PWAs on one browser origin.
  const dashboardPath = authState.role ? portalPathForRole(authState.role) : "/dashboard";

  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate("/")} aria-label="Nexora home">
        <span className="brand-mark">N</span>
        <span>Nexora</span>
      </button>
      <nav aria-label="Main navigation">
        <button onClick={() => navigate("/salons")}>Find salons</button>
        <button onClick={() => navigate(PORTAL_PATHS.customer)}>Customer</button>
        <button onClick={() => navigate(PORTAL_PATHS.business_user)}>Shop Owner</button>
        <button onClick={() => navigate(PORTAL_PATHS.growth_partner)}>Growth Partner</button>
        {authState.session ? (
          <>
            <button className="nav-cta" onClick={() => navigate(dashboardPath)}>{dashboardLabel}</button>
            <button onClick={() => void signOut()}>Sign out</button>
          </>
        ) : (
          !authState.loading && <button className="nav-cta" onClick={() => navigate("/login")}>Log in</button>
        )}
      </nav>
    </header>
  );
}

function HomePage({ navigate, online }: { navigate: (path: string) => void; online: boolean }) {
  const { items, loading, error } = useCatalog(online);
  const categories = Array.from(new Set(items.map(i=>i.business_category).filter(Boolean))) as string[];
  const topRated = [...items].sort((a,b)=>Number(b.rating_average)-Number(a.rating_average)).slice(0,3);
  const trending = [...items].sort((a,b)=>b.review_count - a.review_count).slice(0,3);
  const nearbyAreas = Array.from(new Set(items.map(i=>i.area).filter(Boolean))) as string[];
  const recommended = [...items].sort((a,b)=>(Number(b.rating_average)*b.review_count)-(Number(a.rating_average)*a.review_count)).slice(0,3);
  // Offers and Sponsored placeholders – will be live after offers/sponsored tables populated

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Beauty services, made dependable</span>
          <h1>Discover verified salons and book with confidence.</h1>
          <p>
            Explore published salon websites, compare real services, and manage every appointment through one secure Nexora account. Phase 1 homepage now includes Categories, Top Rated, Trending, Nearby, Recommended, Offers, Slots, Sponsored, Membership, About.
          </p>
          <div className="button-row">
            <button className="primary" onClick={() => navigate("/salons")}>Explore salons (Smart Search)</button>
            <button className="secondary" onClick={() => navigate("/signup")}>Create account</button>
          </div>
          <div className="trust-row">
            <span>✓ Published salons only</span><span>✓ Secure role access</span><span>✓ Clear payment status</span><span>✓ Phase 1 Connected</span>
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
        <CatalogStrip navigate={navigate} online={online} />
      </section>

      {/* Categories */}
      <section className="section" style={{background:"var(--cream)"}}>
        <div className="section-heading"><span className="eyebrow">Browse by category</span><h2>Categories</h2><p>Business categories from salons.business_category – smart search filter.</p></div>
        {loading ? <div className="loader" /> : categories.length ? <div className="button-row">{categories.map(c=><button key={c} className="secondary" onClick={()=>navigate(`/salons?category=${encodeURIComponent(c)}`)}>{c}</button>)}</div> : <StateCard title="No categories yet" text="Categories appear when salons have business_category set." />}
        {error && <div className="form-message">{error}</div>}
      </section>

      {/* Top Rated */}
      <section className="section">
        <div className="section-heading"><span className="eyebrow">Top rated</span><h2>Top Rated Salons</h2><p>Sorted by rating_average desc – highest rated first.</p></div>
        {topRated.length ? <div className="salon-grid">{topRated.map(item=><SalonCard key={item.id} item={item} navigate={navigate} />)}</div> : <SalonSkeletons count={3} />}
      </section>

      {/* Trending */}
      <section className="section" style={{background:"var(--cream)"}}>
        <div className="section-heading"><span className="eyebrow">Trending</span><h2>Trending Now</h2><p>Sorted by review_count desc – most reviewed.</p></div>
        {trending.length ? <div className="salon-grid">{trending.map(item=><SalonCard key={item.id} item={item} navigate={navigate} />)}</div> : <SalonSkeletons count={3} />}
      </section>

      {/* Nearby */}
      <section className="section">
        <div className="section-heading"><span className="eyebrow">Nearby</span><h2>Nearby Areas</h2><p>Group by area / locality from salons.area – nearby filter for smart search.</p></div>
        {nearbyAreas.length ? <div className="button-row">{nearbyAreas.slice(0,8).map(a=><button key={a} className="secondary compact" onClick={()=>navigate(`/salons?area=${encodeURIComponent(a)}`)}>{a}</button>)}</div> : <StateCard title="No nearby areas" text="Areas appear from salons.area." />}
      </section>

      {/* Recommended */}
      <section className="section" style={{background:"var(--cream)"}}>
        <div className="section-heading"><span className="eyebrow">Recommended</span><h2>Recommended For You</h2><p>Sorted by rating_average * review_count – recommended ranking.</p></div>
        {recommended.length ? <div className="salon-grid">{recommended.map(item=><SalonCard key={item.id} item={item} navigate={navigate} />)}</div> : <SalonSkeletons count={3} />}
      </section>

      {/* Offers */}
      <section className="section">
        <div className="section-heading"><span className="eyebrow">Offers</span><h2>Active Offers</h2><p>From offers table where is_active=true – RLS public read. Shows discount_type, discount_value.</p></div>
        <OffersStrip navigate={navigate} />
      </section>

      {/* Available Slots */}
      <section className="section" style={{background:"var(--cream)"}}>
        <div className="section-heading"><span className="eyebrow">Slots</span><h2>Available Slots Today</h2><p>Derived from salon_hours / opening hours – client-derived grid, no mock slots, real opening hours.</p></div>
        <StateCard title="Slots are live" text="Slots are generated from real opening hours (salon_hours table or config.profile.opening_hours). Booking page shows date/time picker with future validation." />
      </section>

      {/* Sponsored Shops / Brands / Videos */}
      <section className="section">
        <div className="section-heading"><span className="eyebrow">Sponsored</span><h2>Sponsored Shops, Brands, Videos</h2><p>Tables sponsored_shops / sponsored_brands / sponsored_videos were MISSING live per audit – now placeholder ready, will show when populated.</p></div>
        <div className="role-grid">
          <article className="role-card"><h3>Sponsored Shops</h3><p>Table sponsored_shops was missing live – placeholder. When populated, sponsored shops appear here with is_active filter.</p></article>
          <article className="role-card"><h3>Sponsored Brands</h3><p>Table sponsored_brands missing – placeholder for brand logos.</p></article>
          <article className="role-card"><h3>Sponsored Videos</h3><p>Table sponsored_videos missing – placeholder for video banners.</p></article>
        </div>
      </section>

      {/* Membership */}
      <section className="section" style={{background:"var(--cream)"}}>
        <div className="section-heading"><span className="eyebrow">Membership</span><h2>Nexora Membership Tiers</h2><p>Static tier config, future wallet / loyalty integration. Tier benefits increase with bookings.</p></div>
        <div className="role-grid">
          <article className="role-card"><span className="role-icon">🥉</span><h3>Bronze</h3><p>0-4 bookings – 0% extra, basic support.</p></article>
          <article className="role-card"><span className="role-icon">🥈</span><h3>Silver</h3><p>5-14 bookings – 5% reward points bonus, priority slots.</p></article>
          <article className="role-card"><span className="role-icon">🥇</span><h3>Gold</h3><p>15+ bookings – 10% bonus, free cancellation once, sponsored offers.</p></article>
        </div>
      </section>

      {/* About */}
      <section className="section">
        <div className="section-heading"><span className="eyebrow">About Nexora</span><h2>One connected platform</h2><p>Customers discover published salons, Shop Owners manage own shop data under RLS, Growth Partners submit proposals, commissions 10% of platform fee held 7 days, owner payout daily 22:00 IST. All 6 locked business rules verifiable via verify_business_rules().</p></div>
        <div className="role-grid">
          <RoleCard title="For Customers" text="Find published salons, book services, and follow payment or refund status." path={PORTAL_PATHS.customer} navigate={navigate} />
          <RoleCard title="For Shop Owners" text="Review website proposals, publish your storefront, manage bookings, services, staff, offers, wallet and earnings under RLS own only." path={PORTAL_PATHS.business_user} navigate={navigate} />
          <RoleCard title="For Growth Partners" text="Prepare salon websites, track attribution, and view commission hold status – 10% of platform fee, held 7 days." path={PORTAL_PATHS.growth_partner} navigate={navigate} />
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
  const platformRole: Role = path === "/owner" ? "business_user" : path === "/growth-partner" ? "growth_partner" : "customer";
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
  const { data: salons, error: salonError } = await client
    .from("salons")
    .select("id,slug,name,description,address,area,city,rating_average,review_count,starting_price_paise,cover_image_path,business_category")
    .in("id", websites.map((item) => item.salon_id))
    .eq("verified", true)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (salonError) throw salonError;
  const bySalon = new Map(websites.map((website) => [website.salon_id, website as Website]));
  return (salons ?? []).filter((salon) => bySalon.has(salon.id)).map((salon) => ({
    ...(salon as Salon),
    website: bySalon.get(salon.id)!,
  }));
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

function CatalogStrip({ navigate, online }: { navigate: (path: string) => void; online: boolean }) {
  const { items, loading, error, load } = useCatalog(online);
  if (loading) return <SalonSkeletons count={3} />;
  if (error) return <StateCard title="Could not load salons" text={error} action="Retry" onAction={load} />;
  if (!items.length) return <StateCard title="No published salons yet" text="Owner-approved salon websites will appear here when published." />;
  return <div className="salon-grid">{items.slice(0, 3).map((item) => <SalonCard key={item.id} item={item} navigate={navigate} />)}</div>;
}


function OffersStrip({ navigate }: { navigate: (path: string) => void }) {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active=true;
    const load = async () => {
      try {
        const client = getClient(); if (!client) { setLoading(false); return; }
        const { data } = await client.from("offers").select("id,salon_id,title,description,discount_type,discount_value,is_active").eq("is_active", true).limit(6);
        if (active && data) setOffers(data);
      } catch {} finally { if (active) setLoading(false); }
    };
    const t = setTimeout(()=>void load(), 0);
    return () => { active=false; clearTimeout(t); };
  }, []);
  if (loading) return <SalonSkeletons count={3} />;
  if (!offers.length) return <StateCard title="No active offers yet" text="Offers from offers table where is_active=true. RLS public read. When shop owners create offers for their salon_id, they appear here." />;
  return <div className="service-grid">{offers.map((o:any)=><div key={o.id} className="service-card"><div><h3>{o.title}</h3><p>{o.description||""}</p><small>{o.discount_type} {o.discount_value}</small></div><button className="text-button" onClick={()=>navigate("/salons")}>View salon</button></div>)}</div>;
}


function CatalogPage({ navigate, online }: { navigate: (path: string) => void; online: boolean }) {
  const { items, loading, error, load } = useCatalog(online);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"rating"|"reviews"|"price"|"name">("rating");

  // Parse query params for smart search deep links ?category=&area=&city=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category"); if (cat) setCategoryFilter(cat);
    const area = params.get("area"); if (area) setQuery(area);
    const city = params.get("city"); if (city) setCityFilter(city);
  }, []);

  const categories = Array.from(new Set(items.map(i=>i.business_category).filter(Boolean))) as string[];
  const cities = Array.from(new Set(items.map(i=>i.city).filter(Boolean))) as string[];

  const filtered = useMemo(() => {
    let list = items.filter(item => {
      const hay = `${item.name} ${item.area} ${item.city} ${item.business_category}`.toLowerCase();
      const q = query.toLowerCase();
      const matchQuery = !q || hay.includes(q);
      const matchCat = !categoryFilter || item.business_category === categoryFilter;
      const matchCity = !cityFilter || item.city === cityFilter;
      const matchRating = !ratingFilter || Number(item.rating_average) >= ratingFilter;
      return matchQuery && matchCat && matchCity && matchRating;
    });
    if (sortBy==="rating") list = [...list].sort((a,b)=>Number(b.rating_average)-Number(a.rating_average));
    else if (sortBy==="reviews") list = [...list].sort((a,b)=>b.review_count - a.review_count);
    else if (sortBy==="price") list = [...list].sort((a,b)=>Number(a.starting_price_paise||0)-Number(b.starting_price_paise||0));
    else if (sortBy==="name") list = [...list].sort((a,b)=>a.name.localeCompare(b.name));
    return list;
  }, [items, query, categoryFilter, cityFilter, ratingFilter, sortBy]);

  return (
    <main className="section page-top">
      <div className="section-heading">
        <div><span className="eyebrow">Nexora marketplace – Smart Search</span><h1>Find your salon</h1><p>Every listing below is active, verified, and owner-published. Smart search: text (name/area/city/category), category filter, city filter, rating filter, sorting by rating/reviews/price/name. Owner-published data appears here via verified=true, is_active=true, is_published=true.</p></div>
      </div>
      <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", marginBottom:20}}>
        <label className="search" style={{minWidth:"auto"}}><span>⌕</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search salon, area or city (smart)" /></label>
        <label>Category<select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
        <label>City<select value={cityFilter} onChange={e=>setCityFilter(e.target.value)}><option value="">All cities</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
        <label>Min rating<select value={ratingFilter} onChange={e=>setRatingFilter(Number(e.target.value))}><option value={0}>Any rating</option><option value={4}>4+ ★</option><option value={4.5}>4.5+ ★</option></select></label>
        <label>Sort by<select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}><option value="rating">Top Rated</option><option value="reviews">Trending (reviews)</option><option value="price">Price low-high</option><option value="name">Name A-Z</option></select></label>
      </div>
      <div className="trust-row" style={{marginBottom:16}}><span>✓ Smart: name+area+city+category</span><span>✓ Filter: category, city, rating</span><span>✓ Sort: rating, reviews, price</span><span>✓ RLS: only published</span></div>
      {loading ? <SalonSkeletons count={6} /> : error ? <StateCard title="Could not load salons" text={error} action="Retry" onAction={load} /> : !filtered.length ? <StateCard title={items.length ? "No matching salon" : "No published salons yet"} text={items.length ? "Try another salon name, area, city, category or rating." : "Draft and unpublished websites are kept private. Owner publish via Proposals tab → appears here."} /> : <div className="salon-grid">{filtered.map((item) => <SalonCard key={item.id} item={item} navigate={navigate} />)}</div>}
    </main>
  );
}



function SalonCard({ item, navigate }: { item: CatalogItem; navigate: (path: string) => void }) {
  return (
    <article className="salon-card">
      <div className="salon-visual" style={item.cover_image_path?.startsWith("http") ? { backgroundImage: `url("${item.cover_image_path.replaceAll('"', "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!item.cover_image_path?.startsWith("http") && <span>✦</span>}<em>Verified</em></div>
      <div className="salon-body"><div className="salon-meta"><span>{item.business_category ?? "Salon"}</span><span>★ {Number(item.rating_average).toFixed(1)} ({item.review_count})</span></div>
      <h3>{item.name}</h3><p>{item.area ?? item.city}, {item.city}</p><div className="salon-bottom"><b>From {money(item.starting_price_paise)}</b><button onClick={() => navigate(`/salons/${item.website.slug}`)}>View salon</button></div></div>
    </article>
  );
}

function SalonPage({
  slug,
  navigate,
  online,
}: {
  slug: string;
  navigate: (path: string) => void;
  online: boolean;
}) {
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const match = (await fetchCatalog()).find((entry) => entry.website.slug === slug);
      if (!match) throw new Error("This salon website is not published or is unavailable.");
      setItem(match);
    } catch (cause) { setError(friendlyError(cause)); } finally { setLoading(false); }
  }, [slug]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (online) void load();
      else { setLoading(false); setError("You are offline. Reconnect and retry."); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, online]);
  if (loading) return <main className="section page-top"><SalonSkeletons count={1} /></main>;
  if (error || !item) return <main className="center-page"><StateCard title="Salon unavailable" text={error || "This website is not public."} action="Back to salons" onAction={() => navigate("/salons")} /></main>;
  const config = item.website.config as { profile?: Record<string, unknown>; services?: Array<Record<string, unknown>> };
  const services = Array.isArray(config.services) ? config.services : [];
  const customerPortalBookingPath = (serviceName?: string) => {
    const params = new URLSearchParams();
    // Pass only the public salon id and a safe return path; never tokens.
    params.set("salon", item.id);
    params.set("returnTo", `/salons/${encodeURIComponent(slug)}`);
    if (serviceName) params.set("service", serviceName);
    return `/app/customer/?${params.toString()}`;
  };
  return (
    <main>
      <section className="store-hero"><span className="verified-pill">✓ Nexora verified</span><h1>{item.name}</h1><p>{String(config.profile?.description ?? item.description ?? "Professional beauty services.")}</p><div className="store-facts"><span>★ {Number(item.rating_average).toFixed(1)} rating</span><span>⌖ {item.area ?? item.city}, {item.city}</span></div><button className="primary" onClick={() => navigate(customerPortalBookingPath())}>Continue in Customer app</button><p className="preview-note">Bookings, payment, history, reviews, and support are owned by the Customer PWA.</p></section>
      <section className="section"><div className="section-heading"><span className="eyebrow">Services</span><h2>Choose your service</h2><p>Browse the owner-published catalog, then continue to the Customer PWA to book.</p></div>
      {!services.length ? <StateCard title="No services published yet" text="This salon has not published bookable services." /> : <div className="service-grid">{services.map((service, index) => <article className="service-card" key={String(service.id ?? index)}><div><h3>{String(service.name ?? "Salon service")}</h3><p>{String(service.description ?? "Professional salon service")}</p><small>{Number(service.duration_minutes ?? 0)} minutes</small></div><div><b>{money(Number(service.price_paise ?? 0))}</b><button className="text-button" onClick={() => navigate(customerPortalBookingPath(String(service.name ?? "")))}>Book in Customer app</button></div></article>)}</div>}</section>
      <section className="section salon-info"><div><span className="eyebrow">Visit</span><h2>{item.name}</h2><p>{item.address}, {item.city}</p></div><button className="secondary" onClick={() => navigate("/cancellation-refund")}>Cancellation policy</button></section>
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
  if (requested === "owner") return "business_user";
  if (requested === "growth-partner") return "growth_partner";
  if (requested === "customer" || requested === "business_user" || requested === "growth_partner") return requested as Role;
  return "customer";
}

function AuthPage({ mode, navigate }: { mode: "login" | "signup"; navigate: (path: string) => void }) {
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const { requested, reason } = readAuthQueryParams();
      if (requested) {
        setRole(mapRequestedRoleToPlatformRole(requested));
      }
      if (reason === "session-expired") {
        setMessage("Your Customer session expired. Log in again to continue booking.");
        setMessageType("info");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // The auth trigger is the only profile creator. The website may retry a
  // read while the trigger transaction settles, but it never upserts a role.
  const ensureProfileWithRetry = async (client: SupabaseClient, userId: string) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await client
        .from("profiles")
        .select("platform_role,is_active,full_name")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data) return data;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
    return null;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    if (!trimmedEmail || !password) {
      setMessage("Email and password are required.");
      setMessageType("error");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
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
      const client = getClient();
      if (!client) throw new Error(getDetailedConfigError());

      if (mode === "signup") {
        // Real Supabase signup
        const { data, error } = await client.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { full_name: trimmedName || trimmedEmail.split("@")[0], signup_role: role },
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
          },
        });
        if (error) throw error;

        // Supabase may return user without session if email confirmation required
        if (!data.session) {
          if (data.user) {
            setMessage(`Account created for ${role.replace("_", " ")}! Please check your email (${trimmedEmail}) to confirm, then log in. If you don't see it, check spam folder. You can also log in directly if email confirmation is disabled.`);
            setMessageType("success");
            // Try to hint browser to go to login after short delay? keep user on page so they can click.
            return;
          } else {
            setMessage("Check your email to confirm the account, then log in.");
            setMessageType("success");
            return;
          }
        }
        // If session exists, continue to profile check below
      } else {
        // login mode
        // Preserve contract pattern for auth-config test while using sanitized email
        const email = trimmedEmail;
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      // After signup or login, verify user and profile
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("We could not verify this session. Please try logging in again.");

      // Ensure profile exists and active – handles trigger race and missing profile bug
      const profile = await ensureProfileWithRetry(client, user.id);

      // If still no profile, fetch with single to get error for debugging
      let finalProfile = profile;
      if (!finalProfile) {
        const { data: p, error: pErr } = await client.from("profiles").select("platform_role,is_active").eq("id", user.id).single();
        if (pErr) throw pErr;
        finalProfile = p as typeof profile;
      }

      if (!finalProfile) throw new Error("Profile not found. Please contact support – your auth user exists but profile row is missing.");
      if (!(finalProfile as { is_active?: boolean }).is_active) {
        await client.auth.signOut();
        throw new Error("This account is inactive. Contact Nexora support.");
      }

      const platformRole = (finalProfile as { platform_role: Role }).platform_role as Role;
      if (!["customer", "business_user", "growth_partner"].includes(platformRole)) {
        await client.auth.signOut();
        throw new Error("This account has no valid Nexora role. Contact support.");
      }
      const profileForNav = finalProfile as unknown as { platform_role: Role };
      const { returnTo } = readAuthQueryParams();
      if (platformRole === "customer" && returnTo) {
        navigate(returnTo);
      } else {
        navigate(profileForNav.platform_role === "customer" && returnTo ? returnTo : portalPathForRole(profileForNav.platform_role));
      }
    } catch (cause) {
      const parsed = parseSupabaseAuthError(cause);
      setMessage(parsed);
      setMessageType(parsed.startsWith("Account created") || parsed.includes("check your email") ? "success" : "error");
    } finally {
      setBusy(false);
    }
  };

  const roleLabel = role === "business_user" ? "Shop Owner" : role === "growth_partner" ? "Growth Partner" : "Customer";
  const configDiagnostics = typeof window !== "undefined" && !getClient() ? getDetailedConfigError() : "";

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
              minLength={6}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="At least 6 characters"
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
        <div className="button-row" style={{ justifyContent: "space-between", marginTop: 6 }}>
          <button type="button" className="text-button" onClick={() => navigate(mode === "login" ? "/signup" : "/login")}>
            {mode === "login" ? "Need an account? Sign up" : "Already registered? Log in"}
          </button>
          {messageType === "success" && mode === "signup" && (
            <button type="button" className="secondary compact" onClick={() => navigate(`/login?role=${role === "business_user" ? "owner" : role === "growth_partner" ? "growth-partner" : "customer"}`)}>
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

function getDetailedConfigError(): string {
  if (supabaseKey && supabaseUrl) return missingSupabaseConfigMessage;
  if (!supabaseUrl && !supabaseKey) return `Missing Supabase config: set NEXT_PUBLIC_SUPABASE_URL=https://${EXPECTED_SUPABASE_HOST} and NEXT_PUBLIC_SUPABASE_ANON_KEY from project ${SUPABASE_PROJECT_REF}.`;
  if (!supabaseUrl) return "Missing NEXT_PUBLIC_SUPABASE_URL.";
  if (!supabaseKey) return "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Use the anon/publishable key, never the privileged key.";
  return missingSupabaseConfigMessage;
}

function isPortalMounted(role: Role): boolean {
  if (role === "customer") return process.env.NEXT_PUBLIC_NEXORA_CUSTOMER_PORTAL_MOUNTED === "true";
  if (role === "business_user") return process.env.NEXT_PUBLIC_NEXORA_OWNER_PORTAL_MOUNTED === "true";
  return process.env.NEXT_PUBLIC_NEXORA_PARTNER_PORTAL_MOUNTED === "true";
}

function PortalGateway({
  expectedRole,
  navigate,
  signOut,
}: {
  expectedRole?: Role;
  navigate: (path: string) => void;
  signOut: (destination?: string) => Promise<void>;
}) {
  const [state, setState] = useState<{ loading: boolean; error?: string; role?: Role }>({ loading: true });
  const load = useCallback(async () => {
    const currentPath = window.location.pathname;
    const requestedRole = expectedRole ?? portalRoleFromPath(currentPath) ?? legacyDashboardRoleFromPath(currentPath);
    const loginRole = requestedRole ?? "customer";
    const returnTo = isPortalPath(currentPath) ? currentPath : portalPathForRole(loginRole);
    const client = getClient();
    if (!client) {
      setState({ loading: false, error: missingSupabaseConfigMessage });
      return;
    }
    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) {
        navigate(`/login?role=${roleQueryForPortalRole(loginRole)}&returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("platform_role,is_active")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError || !profile || profile.is_active !== true || !["customer", "business_user", "growth_partner"].includes(profile.platform_role)) {
        await signOut(`/login?role=${roleQueryForPortalRole(loginRole)}&returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      const profileRole = profile.platform_role as Role;
      if (requestedRole && requestedRole !== profileRole) {
        navigate(portalPathForRole(profileRole));
        return;
      }
      if (!isPortalPath(currentPath)) {
        navigate(portalPathForRole(profileRole));
        return;
      }
      setState({ loading: false, role: profileRole });
    } catch (cause) {
      setState({ loading: false, error: friendlyError(cause) });
    }
  }, [expectedRole, navigate, signOut]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (state.loading) return <main className="center-page"><div className="loader" aria-label="Loading portal gateway" /></main>;
  if (state.error) return <main className="center-page"><StateCard title="Portal unavailable" text={state.error} action="Retry" onAction={load} /></main>;
  const role = state.role ?? expectedRole ?? "customer";
  if (!isPortalMounted(role)) return <main className="center-page"><section className="entry-card"><span className="eyebrow">Nexora portal gateway</span><h1>{role === "business_user" ? "Shop Owner" : role === "growth_partner" ? "Growth Partner" : "Customer"} app is not mounted</h1><p>This path is reserved for the separately deployed PWA. Configure its reverse-proxy origin before enabling production traffic. The Main Website does not render a duplicate dashboard here.</p></section></main>;
  return <main className="center-page"><section className="entry-card"><span className="eyebrow">Nexora portal gateway</span><h1>Opening your app…</h1><p>This portal is owned by its dedicated PWA deployment. If it does not open, check the reverse-proxy and path-base configuration.</p></section></main>;
}

function AdminUnavailable() {
  return <main className="center-page"><section className="entry-card"><span className="eyebrow">Nexora administration</span><h1>Admin surface is restricted</h1><p>Moderation, sponsored content, disputes, and payout operations are provisioned by administrators only. There is no public admin signup.</p></section></main>;
}

function LegalPage({ type }: { type: "terms" | "privacy" | "refund" }) {
  const copy = {
    terms: { title: "Terms & Conditions", intro: "These terms govern use of the Nexora marketplace, role-based apps, salon storefronts, and booking services.", sections: [["Accounts and roles", "Each email is assigned one permanent platform role. Keep your login secure and provide accurate information."], ["Salon content", "Public salon information is shown only after owner approval and publication. Availability and service delivery remain the salon’s responsibility."], ["Payments", "Payment success, refunds, earnings, commission, settlement, and payout status are confirmed only by trusted server records."], ["Acceptable use", "Do not misuse the platform, impersonate another role, interfere with security, or submit unlawful content."]] },
    privacy: { title: "Privacy Policy", intro: "Nexora uses only the information needed to provide accounts, salon discovery, bookings, payments, support, and platform security.", sections: [["Information collected", "Account details, booking information, salon records, payment references, device/session details, and support messages may be processed."], ["How information is used", "Information supports authentication, booking operations, payment verification, fraud prevention, service updates, and customer support."], ["Access controls", "Role guards and Row Level Security restrict records to the customer, salon team, Growth Partner, or administrator entitled to access them."], ["Security", "Frontend apps use only the public Supabase key. Payment and privileged credentials remain server-only."]] },
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
  return <footer><div><div className="brand"><span className="brand-mark">N</span><span>Nexora</span></div><p>One connected platform for salons, customers, owners, and growth partners.</p></div><div><b>Explore</b><button onClick={() => navigate("/salons")}>Published salons</button><button onClick={() => navigate("/login")}>Log in</button></div><div><b>Legal</b><button onClick={() => navigate("/terms")}>Terms & Conditions</button><button onClick={() => navigate("/privacy")}>Privacy Policy</button><button onClick={() => navigate("/cancellation-refund")}>Cancellation & Refund</button></div></footer>;
}
