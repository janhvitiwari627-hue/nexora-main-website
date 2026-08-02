"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient, Session, SupabaseClient } from "@supabase/supabase-js";

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
type BookableService = {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_paise: number;
};
type BookingResult = string | { id?: string; booking_id?: string };
type RazorpayOrder = {
  key?: string;
  key_id?: string;
  order_id?: string;
  id?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
};

const viteEnv =
  (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env ?? {};
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  viteEnv.VITE_SUPABASE_URL ??
  "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  viteEnv.VITE_SUPABASE_ANON_KEY ??
  "";
const missingSupabaseConfigMessage =
  "Nexora login service is not configured for this deployment.";
let singleton: SupabaseClient | null = null;

function getClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  singleton ??= createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return singleton;
}

function money(paise: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((paise ?? 0) / 100);
}

// crypto.randomUUID is only available in secure contexts (HTTPS/localhost).
// Fall back to a random id so plain-HTTP previews never crash with
// "crypto.randomUUID is not a function".
function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}${Math.random()
    .toString(16)
    .slice(2)}`;
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
  if (!navigator.onLine) return "You appear to be offline. Reconnect and try again.";
  const message = error instanceof Error ? error.message : "Something went wrong.";
  if (/failed to fetch|network/i.test(message)) return "We could not reach Nexora. Please retry.";
  return message;
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
    if (!client) return;

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
      const { data: profile } = await client
        .from("profiles")
        .select("platform_role,is_active")
        .eq("id", session.user.id)
        .single();

      if (!active || revision !== sessionRevision) return;
      setAuthState({
        loading: false,
        session,
        role: profile?.is_active ? profile.platform_role : undefined,
      });
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

  const navigate = (target: string) => {
    window.history.pushState({}, "", target);
    setPath(new URL(target, window.location.origin).pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const signOut = async (destination = "/") => {
    setAuthState({ loading: false, session: null });
    await getClient()?.auth.signOut();
    navigate(destination);
  };

  let content: React.ReactNode;
  if (path === "/salons") content = <CatalogPage navigate={navigate} online={online} />;
  else if (path.startsWith("/salons/"))
    content = <SalonPage slug={safeDecodePathSegment(path.slice(8))} navigate={navigate} online={online} authState={authState} signOut={signOut} />;
  else if (path.startsWith("/booking/"))
    content = <BookingPage slug={safeDecodePathSegment(path.slice(9))} navigate={navigate} online={online} authState={authState} signOut={signOut} />;
  else if (path === "/terms") content = <LegalPage type="terms" />;
  else if (path === "/privacy") content = <LegalPage type="privacy" />;
  else if (path === "/cancellation-refund") content = <LegalPage type="refund" />;
  else if (path === "/login" || path === "/signup")
    content = <AuthPage mode={path === "/login" ? "login" : "signup"} navigate={navigate} />;
  else if (path.startsWith("/dashboard"))
    content = <DashboardPage navigate={navigate} signOut={signOut} />;
  else if (path === "/customer" || path === "/owner" || path === "/growth-partner")
    content = <RoleEntry path={path} navigate={navigate} />;
  else content = <HomePage navigate={navigate} online={online} />;

  const portal = portalFromContext(authState.role, path);

  return (
    <div className="site-shell">
      {!online && <div className="offline-banner">Offline — live salon and account data may be unavailable.</div>}
      <Header navigate={navigate} authState={authState} signOut={signOut} />
      {content}
      <Footer navigate={navigate} />
      <PwaInstallPrompt portal={portal} />
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
      ? "Shop Owner dashboard"
      : authState.role === "growth_partner"
        ? "Growth Partner dashboard"
        : authState.role === "customer"
          ? "Customer dashboard"
          : "Account";
  const dashboardPath = authState.role ? `/dashboard/${authState.role}` : "/dashboard";

  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate("/")} aria-label="Nexora home">
        <span className="brand-mark">N</span>
        <span>Nexora</span>
      </button>
      <nav aria-label="Main navigation">
        <button onClick={() => navigate("/salons")}>Find salons</button>
        <button onClick={() => navigate("/customer")}>Customer</button>
        <button onClick={() => navigate("/owner")}>Shop Owner</button>
        <button onClick={() => navigate("/growth-partner")}>Growth Partner</button>
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
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Beauty services, made dependable</span>
          <h1>Discover verified salons and book with confidence.</h1>
          <p>
            Explore published salon websites, compare real services, and manage every appointment
            through one secure Nexora account.
          </p>
          <div className="button-row">
            <button className="primary" onClick={() => navigate("/salons")}>Explore salons</button>
            <button className="secondary" onClick={() => navigate("/signup")}>Create account</button>
          </div>
          <div className="trust-row">
            <span>✓ Published salons only</span><span>✓ Secure role access</span><span>✓ Clear payment status</span>
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
          <p>Only owner-approved, active salon websites appear here.</p>
        </div>
        <CatalogStrip navigate={navigate} online={online} />
      </section>
      <section className="role-grid section">
        <RoleCard title="For Customers" text="Find published salons, book services, and follow payment or refund status." path="/customer" navigate={navigate} />
        <RoleCard title="For Shop Owners" text="Review website proposals, publish your storefront, and manage bookings and earnings." path="/owner" navigate={navigate} />
        <RoleCard title="For Growth Partners" text="Prepare salon websites, track attribution, and view commission hold status." path="/growth-partner" navigate={navigate} />
      </section>
    </main>
  );
}

function RoleCard({ title, text, path, navigate }: { title: string; text: string; path: string; navigate: (path: string) => void }) {
  return <article className="role-card"><span className="role-icon">✦</span><h3>{title}</h3><p>{text}</p><button onClick={() => navigate(path)}>Open portal →</button></article>;
}

function RoleEntry({ path, navigate }: { path: string; navigate: (path: string) => void }) {
  const label = path === "/owner" ? "Shop Owner" : path === "/growth-partner" ? "Growth Partner" : "Customer";
  const role = path === "/owner" ? "owner" : path === "/growth-partner" ? "growth-partner" : "customer";
  return (
    <main className="center-page">
      <section className="entry-card">
        <span className="eyebrow">Nexora {label}</span>
        <h1>{label} portal</h1>
        <p>Use your permanent {label.toLowerCase()} account. Accounts automatically return to their assigned dashboard.</p>
        <div className="button-row">
          <button className="primary" onClick={() => navigate(`/login?role=${role}`)}>Log in</button>
          <button className="secondary" onClick={() => navigate(`/signup?role=${role}`)}>Sign up</button>
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

function CatalogPage({ navigate, online }: { navigate: (path: string) => void; online: boolean }) {
  const { items, loading, error, load } = useCatalog(online);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => items.filter((item) => `${item.name} ${item.area} ${item.city} ${item.business_category}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  return (
    <main className="section page-top">
      <div className="section-heading split"><div><span className="eyebrow">Nexora marketplace</span><h1>Find your salon</h1><p>Every listing below is active, verified, and owner-published.</p></div>
      <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search salon, area or city" /></label></div>
      {loading ? <SalonSkeletons count={6} /> : error ? <StateCard title="Could not load salons" text={error} action="Retry" onAction={load} /> : !filtered.length ? <StateCard title={items.length ? "No matching salon" : "No published salons yet"} text={items.length ? "Try another salon name, area or city." : "Draft and unpublished websites are kept private."} /> : <div className="salon-grid">{filtered.map((item) => <SalonCard key={item.id} item={item} navigate={navigate} />)}</div>}
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
  authState,
  signOut,
}: {
  slug: string;
  navigate: (path: string) => void;
  online: boolean;
  authState: AuthState;
  signOut: (destination?: string) => Promise<void>;
}) {
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleMismatch, setRoleMismatch] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
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
  const config = item.website.config as { profile?: Record<string, unknown>; services?: Array<Record<string, unknown>>; staff?: Array<Record<string, unknown>>; offers?: Array<Record<string, unknown>> };
  const services = Array.isArray(config.services) ? config.services : [];
  const openingHours = config.profile?.opening_hours as Record<string, unknown> | undefined;
  const bookingReturnPath = `/booking/${encodeURIComponent(slug)}`;
  const customerLoginPath = `/login?role=customer&returnTo=${encodeURIComponent(bookingReturnPath)}`;
  const startBooking = (serviceName?: string) => {
    if (authState.loading) return;
    const destination = serviceName
      ? `${bookingReturnPath}?service=${encodeURIComponent(serviceName)}`
      : bookingReturnPath;
    if (!authState.session) {
      navigate(`/login?role=customer&returnTo=${encodeURIComponent(destination)}`);
      return;
    }
    if (authState.role === "customer") {
      navigate(destination);
      return;
    }
    setRoleMismatch(true);
  };
  const switchToCustomer = async () => {
    setSwitchingAccount(true);
    await signOut(customerLoginPath);
  };
  return (
    <main>
      <section className="store-hero"><span className="verified-pill">✓ Nexora verified</span><h1>{item.name}</h1><p>{String(config.profile?.description ?? item.description ?? "Professional beauty services with easy online booking.")}</p><div className="store-facts"><span>★ {Number(item.rating_average).toFixed(1)} rating</span><span>⌖ {item.area ?? item.city}, {item.city}</span></div><button className="primary" disabled={authState.loading} onClick={() => startBooking()}>{authState.loading ? "Checking account…" : "Book appointment"}</button></section>
      {roleMismatch && <section className="role-mismatch" role="alert" aria-labelledby="booking-role-title"><div className="role-mismatch-card"><span className="eyebrow">Switch account</span><h2 id="booking-role-title">Customer account required</h2><p>Booking is only available for Customer accounts. Please sign out and log in with a Customer account.</p><div className="button-row"><button className="primary" disabled={switchingAccount} onClick={() => void switchToCustomer()}>{switchingAccount ? "Signing out…" : "Sign out and continue as Customer"}</button><button className="secondary" onClick={() => setRoleMismatch(false)}>Back to salon</button><button className="text-button" onClick={() => navigate(authState.role ? `/dashboard/${authState.role}` : "/dashboard")}>Go to my dashboard</button></div></div></section>}
      <section className="section"><div className="section-heading"><span className="eyebrow">Services</span><h2>Choose your service</h2></div>
      {!services.length ? <StateCard title="Services are being updated" text="Please check back soon." /> : <div className="service-grid">{services.map((service, index) => <article className="service-card" key={String(service.id ?? index)}><div><h3>{String(service.name ?? "Salon service")}</h3><p>{String(service.description ?? "Professional salon service")}</p><small>{Number(service.duration_minutes ?? 0)} minutes</small></div><div><b>{money(Number(service.price_paise ?? 0))}</b><button className="text-button" onClick={() => startBooking(String(service.name ?? ""))}>Book</button></div></article>)}</div>}</section>
      <section className="section salon-info"><div><span className="eyebrow">Visit</span><h2>{item.name}</h2><p>{item.address}, {item.city}</p>{openingHours && <p>Open {String(openingHours.opens ?? "—")}–{String(openingHours.closes ?? "—")}</p>}</div><button className="secondary" onClick={() => navigate("/cancellation-refund")}>Cancellation policy</button></section>
    </main>
  );
}

function bookingIdFrom(result: BookingResult | BookingResult[] | null): string | null {
  const value = Array.isArray(result) ? result[0] : result;
  if (typeof value === "string") return value;
  return value?.booking_id ?? value?.id ?? null;
}

async function loadRazorpayCheckout() {
  if ("Razorpay" in window) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Payment checkout could not be loaded.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Payment checkout could not be loaded."));
    document.head.appendChild(script);
  });
}

function BookingPage({
  slug,
  navigate,
  online,
  authState,
  signOut,
}: {
  slug: string;
  navigate: (path: string) => void;
  online: boolean;
  authState: AuthState;
  signOut: (destination?: string) => Promise<void>;
}) {
  const [salon, setSalon] = useState<CatalogItem | null>(null);
  const [services, setServices] = useState<BookableService[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const bookingPath = `/booking/${encodeURIComponent(slug)}`;
  const customerLoginPath = `/login?role=customer&returnTo=${encodeURIComponent(bookingPath)}`;

  const load = useCallback(async () => {
    if (authState.loading) return;
    if (!authState.session) {
      navigate(customerLoginPath);
      return;
    }
    if (authState.role !== "customer") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const client = getClient();
      if (!client) throw new Error(missingSupabaseConfigMessage);
      const match = (await fetchCatalog()).find((entry) => entry.website.slug === slug);
      if (!match) throw new Error("This salon website is not published or is unavailable.");
      const { data, error } = await client
        .from("services")
        .select("id,salon_id,name,description,duration_minutes,price_paise")
        .eq("salon_id", match.id)
        .eq("is_active", true)
        .eq("is_bookable_online", true)
        .order("name");
      if (error) throw error;
      const available = (data ?? []) as BookableService[];
      setSalon(match);
      setServices(available);
      const requested = new URLSearchParams(window.location.search).get("service");
      const requestedService = available.find((service) => service.name === requested);
      if (requestedService) setSelectedServiceIds([requestedService.id]);
    } catch (cause) {
      setMessage(friendlyError(cause));
    } finally {
      setLoading(false);
    }
  }, [authState.loading, authState.role, authState.session, customerLoginPath, navigate, slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (online) void load();
      else {
        setLoading(false);
        setMessage("You are offline. Reconnect and retry.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, online]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!salon || !selectedServiceIds.length || !date || !time) return;
    setBusy(true);
    setMessage("");
    try {
      const client = getClient();
      if (!client) throw new Error(missingSupabaseConfigMessage);
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError || !session?.access_token) {
        setMessage("Your Customer session expired. Please log in again to continue booking.");
        navigate(`${customerLoginPath}&reason=session-expired`);
        return;
      }
      const appointmentStart = new Date(`${date}T${time}:00`);
      if (Number.isNaN(appointmentStart.valueOf()) || appointmentStart <= new Date()) {
        throw new Error("Choose a future appointment date and time.");
      }
      const { data, error } = await client.rpc("create_customer_booking", {
        p_salon_id: salon.id,
        p_service_ids: selectedServiceIds,
        p_staff_id: null,
        p_appointment_start: appointmentStart.toISOString(),
        p_customer_note: note.trim() || null,
        p_idempotency_key: randomId(),
      });
      if (error) throw error;
      const bookingId = bookingIdFrom(data as BookingResult | BookingResult[] | null);
      if (!bookingId) throw new Error("Booking was created, but its payment reference was not returned.");

      const { data: orderData, error: orderError } = await client.functions.invoke<RazorpayOrder>("razorpay-create-order", {
        body: { booking_id: bookingId, stage: "advance" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (orderError) throw orderError;
      const order = orderData ?? {};
      const key = order.key_id ?? order.key;
      const orderId = order.order_id ?? order.id;
      if (!key || !orderId || !order.amount) throw new Error("The secure advance checkout could not be prepared.");
      await loadRazorpayCheckout();
      const Razorpay = (window as typeof window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      if (!Razorpay) throw new Error("Payment checkout could not be loaded.");
      new Razorpay({
        key,
        order_id: orderId,
        amount: order.amount,
        currency: order.currency ?? "INR",
        name: order.name ?? salon.name,
        description: order.description ?? "25% booking advance",
        prefill: { email: authState.session?.user.email ?? "" },
        theme: { color: "#2f6fed" },
      }).open();
      setMessage("Booking created. Complete the 25% advance in the secure checkout.");
    } catch (cause) {
      setMessage(friendlyError(cause));
    } finally {
      setBusy(false);
    }
  };

  if (authState.loading || loading) return <main className="center-page"><div className="loader" aria-label="Loading booking" /></main>;
  if (authState.session && authState.role !== "customer") {
    return <main className="center-page"><section className="role-mismatch-card" role="alert"><span className="eyebrow">Switch account</span><h1>Customer account required</h1><p>Booking is only available for Customer accounts. Please sign out and log in with a Customer account.</p><div className="button-row"><button className="primary" disabled={switchingAccount} onClick={() => { setSwitchingAccount(true); void signOut(customerLoginPath); }}>{switchingAccount ? "Signing out…" : "Sign out and continue as Customer"}</button><button className="secondary" onClick={() => navigate(`/salons/${encodeURIComponent(slug)}`)}>Back to salon</button><button className="text-button" onClick={() => navigate(authState.role ? `/dashboard/${authState.role}` : "/dashboard")}>Go to my dashboard</button></div></section></main>;
  }
  if (message && !salon) return <main className="center-page"><StateCard title="Booking unavailable" text={message} action="Back to salon" onAction={() => navigate(`/salons/${encodeURIComponent(slug)}`)} /></main>;
  if (!salon) return null;

  return (
    <main className="section page-top booking-page">
      <div className="section-heading"><span className="eyebrow">Customer booking</span><h1>Book {salon.name}</h1><p>Select services and a preferred appointment time. Nexora collects the server-calculated 25% advance in Razorpay TEST checkout.</p></div>
      <form className="booking-card" onSubmit={submit}>
        <fieldset><legend>1. Choose services</legend><div className="booking-services">{services.map((service) => <label key={service.id} className={selectedServiceIds.includes(service.id) ? "selected" : ""}><input type="checkbox" checked={selectedServiceIds.includes(service.id)} onChange={() => setSelectedServiceIds((current) => current.includes(service.id) ? current.filter((id) => id !== service.id) : [...current, service.id])} /><span><b>{service.name}</b><small>{service.duration_minutes} minutes</small></span><strong>{money(service.price_paise)}</strong></label>)}</div>{!services.length && <p>No online services are currently available.</p>}</fieldset>
        <fieldset><legend>2. Choose date and time</legend><div className="form-grid"><label>Date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Time<input required type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label><label className="wide-field">Note for salon (optional)<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label></div></fieldset>
        {message && <div className="form-message" role="status">{message}</div>}
        <div className="button-row"><button className="primary" disabled={busy || !selectedServiceIds.length}>{busy ? "Preparing secure checkout…" : "Create booking & pay 25% advance"}</button><button type="button" className="secondary" onClick={() => navigate(`/salons/${encodeURIComponent(slug)}`)}>Back to salon</button></div>
      </form>
    </main>
  );
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

function AuthPage({ mode, navigate }: { mode: "login" | "signup"; navigate: (path: string) => void }) {
  // Keep the first render identical on server and client (hydration-safe);
  // query params are applied only after mount.
  const [role, setRole] = useState<Role>("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const { requested, reason } = readAuthQueryParams();
      if (requested === "owner") setRole("business_user");
      else if (requested === "growth-partner") setRole("growth_partner");
      if (reason === "session-expired") {
        setMessage("Your Customer session expired. Log in again to continue booking.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const client = getClient();
      if (!client) throw new Error(missingSupabaseConfigMessage);
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({ email, password, options: { data: { full_name: fullName.trim() || email.split("@")[0], signup_role: role } } });
        if (error) throw error;
        if (!data.session) { setMessage("Check your email to confirm the account, then log in."); return; }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error("We could not verify this session.");
      const { data: profile, error: profileError } = await client.from("profiles").select("platform_role,is_active").eq("id", user.id).single();
      if (profileError) throw profileError;
      if (!profile.is_active) { await client.auth.signOut(); throw new Error("This account is inactive. Contact Nexora support."); }
      const { returnTo } = readAuthQueryParams();
      navigate(profile.platform_role === "customer" && returnTo ? returnTo : `/dashboard/${profile.platform_role}`);
    } catch (cause) { setMessage(friendlyError(cause)); } finally { setBusy(false); }
  };
  return (
    <main className="center-page auth-bg"><form className="auth-card" onSubmit={submit}><span className="eyebrow">{mode === "login" ? "Welcome back" : "Join Nexora"}</span><h1>{mode === "login" ? "Log in" : "Create your account"}</h1>
    <label>Account role<select value={role} onChange={(event) => setRole(event.target.value as Role)} disabled={mode === "login"}><option value="customer">Customer</option><option value="business_user">Shop Owner</option><option value="growth_partner">Growth Partner</option></select></label>
    {mode === "signup" && <label>Full name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" /></label>}
    <label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
    <label>Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
    {message && <div className="form-message" role="status">{message}</div>}<button className="primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in securely" : "Create account"}</button>
    <button type="button" className="text-button" onClick={() => navigate(mode === "login" ? "/signup" : "/login")}>{mode === "login" ? "Need an account? Sign up" : "Already registered? Log in"}</button></form></main>
  );
}

function DashboardPage({
  navigate,
  signOut,
}: {
  navigate: (path: string) => void;
  signOut: (destination?: string) => Promise<void>;
}) {
  const [state, setState] = useState<{ loading: boolean; role?: Role; name?: string; error?: string }>({ loading: true });
  const load = useCallback(async () => {
    setState({ loading: true });
    try {
      const client = getClient(); if (!client) throw new Error(missingSupabaseConfigMessage);
      const { data: { user } } = await client.auth.getUser(); if (!user) { navigate("/login"); return; }
      const { data, error } = await client.from("profiles").select("platform_role,full_name,is_active").eq("id", user.id).single();
      if (error) throw error; if (!data.is_active) throw new Error("This account is inactive.");
      const expected = window.location.pathname.split("/")[2];
      if (expected && expected !== data.platform_role) { window.history.replaceState({}, "", `/dashboard/${data.platform_role}`); }
      setState({ loading: false, role: data.platform_role, name: data.full_name });
    } catch (cause) { setState({ loading: false, error: friendlyError(cause) }); }
  }, [navigate]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  if (state.loading) return <main className="center-page"><div className="loader" aria-label="Loading dashboard" /></main>;
  if (state.error) return <main className="center-page"><StateCard title="Dashboard unavailable" text={state.error} action="Retry" onAction={load} /></main>;
  const label = state.role === "business_user" ? "Shop Owner" : state.role === "growth_partner" ? "Growth Partner" : "Customer";
  return <main className="section page-top"><div className="dashboard-hero"><span className="eyebrow">{label} dashboard</span><h1>Welcome, {state.name}</h1><p>Your session is protected by the assigned Nexora role. Data access remains limited by staging RLS.</p></div><RoleWorkspace role={state.role!} navigate={navigate} /><button className="secondary signout" onClick={() => void signOut()}>Sign out</button></main>;
}

type Proposal = {
  id: string;
  onboarding_application_id: string;
  salon_id: string | null;
  owner_user_id: string | null;
  owner_email: string | null;
  status: string;
  payload: Record<string, unknown>;
  version: number;
  owner_notes: string | null;
  submitted_at: string | null;
  published_at: string | null;
  updated_at: string;
};

type ServiceDraft = {
  key: string;
  name: string;
  description: string;
  price: string;
  duration: string;
};

type PartnerState = {
  id: string;
  status: string;
  partner_code: string;
};

const emptyService = (): ServiceDraft => ({
  key: randomId(),
  name: "",
  description: "",
  price: "",
  duration: "30",
});

function GrowthPartnerProposalForm({ onSubmitted }: { onSubmitted: () => Promise<void> }) {
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("20:00");
  const [templateKey, setTemplateKey] = useState("modern-salon");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [services, setServices] = useState<ServiceDraft[]>(() => [emptyService()]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const ensurePartner = async (client: SupabaseClient, userId: string): Promise<PartnerState> => {
    const { data: existing, error: readError } = await client
      .from("growth_partners")
      .select("id,status,partner_code")
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) throw readError;
    if (existing) return existing as PartnerState;

    const suffix = randomId().replaceAll("-", "").slice(0, 12).toUpperCase();
    const { data: created, error: createError } = await client
      .from("growth_partners")
      .insert({
        user_id: userId,
        partner_code: `NXR${suffix}`,
        referral_code: `REF${suffix}`,
        status: "applied",
      })
      .select("id,status,partner_code")
      .single();
    if (createError) throw createError;
    return created as PartnerState;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const client = getClient();
      if (!client) throw new Error(missingSupabaseConfigMessage);
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error("Your session expired. Log in again.");
      if (!services.length || services.some((service) => !service.name.trim() || Number(service.price) < 0 || Number(service.duration) < 1)) {
        throw new Error("Add at least one service with a name, valid price, and duration.");
      }

      const partner = await ensurePartner(client, user.id);
      const lowestPrice = Math.min(...services.map((service) => Math.round(Number(service.price) * 100)));
      const { data: application, error: applicationError } = await client
        .from("shop_onboarding_applications")
        .insert({
          submitted_by_partner_id: partner.id,
          status: "draft",
          current_step: 6,
          owner_email: ownerEmail.trim().toLowerCase(),
          owner_phone: phone.trim(),
          shop_name: businessName.trim(),
          city: city.trim(),
          locality: area.trim(),
          full_address: address.trim(),
          opening_time: openingTime,
          closing_time: closingTime,
          starting_price_paise: lowestPrice,
          about_shop: description.trim(),
          website_template: templateKey,
        })
        .select("id")
        .single();
      if (applicationError) throw applicationError;

      const payload = {
        profile: {
          name: businessName.trim(),
          description: description.trim(),
          phone: phone.trim(),
          email: ownerEmail.trim().toLowerCase(),
          address: address.trim(),
          area: area.trim(),
          city: city.trim(),
          logo_url: logoUrl.trim(),
          cover_url: coverUrl.trim(),
          starting_price_paise: lowestPrice,
          opening_hours: { opens: openingTime, closes: closingTime },
        },
        services: services.map((service) => ({
          name: service.name.trim(),
          description: service.description.trim(),
          price_paise: Math.round(Number(service.price) * 100),
          duration_minutes: Number(service.duration),
        })),
        staff: [],
        photos: coverUrl.trim() ? [{ url: coverUrl.trim(), title: `${businessName.trim()} cover`, is_cover: true }] : [],
        offers: [],
        template: { key: templateKey },
      };
      const { error: proposalError } = await client.rpc("save_growth_partner_salon_setup", {
        p_application_id: application.id,
        p_payload: payload,
        p_submit: true,
      });
      if (proposalError) throw proposalError;

      setBusinessName("");
      setOwnerEmail("");
      setPhone("");
      setCity("");
      setArea("");
      setAddress("");
      setDescription("");
      setLogoUrl("");
      setCoverUrl("");
      setServices([emptyService()]);
      setMessage("Proposal submitted privately for Shop Owner review.");
      await onSubmitted();
    } catch (cause) {
      setMessage(friendlyError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="workspace-card">
      <div className="workspace-heading">
        <div><span className="eyebrow">Salon setup</span><h2>Create website proposal</h2></div>
        <span className="private-pill">Private until Owner publishes</span>
      </div>
      <form className="proposal-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Salon / business name<input required maxLength={160} value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></label>
          <label>Shop Owner email<input required type="email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} /></label>
          <label>Phone / contact<input required maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <label>City<input required maxLength={100} value={city} onChange={(event) => setCity(event.target.value)} /></label>
          <label>Area / locality<input required maxLength={160} value={area} onChange={(event) => setArea(event.target.value)} /></label>
          <label className="wide-field">Full address<textarea required rows={3} value={address} onChange={(event) => setAddress(event.target.value)} /></label>
          <label className="wide-field">Salon description<textarea required rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label>Opening time<input required type="time" value={openingTime} onChange={(event) => setOpeningTime(event.target.value)} /></label>
          <label>Closing time<input required type="time" value={closingTime} onChange={(event) => setClosingTime(event.target.value)} /></label>
          <label>Website theme<select value={templateKey} onChange={(event) => setTemplateKey(event.target.value)}><option value="modern-salon">Modern salon</option><option value="minimal-studio">Minimal studio</option><option value="luxury-beauty">Luxury beauty</option></select></label>
          <label>Logo URL (optional)<input type="url" placeholder="https://…" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} /></label>
          <label className="wide-field">Cover photo URL (optional)<input type="url" placeholder="https://…" value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} /></label>
        </div>
        <div className="service-editor">
          <div className="workspace-heading"><div><h3>Services</h3><p>Prices are stored securely and published only after Owner approval.</p></div><button type="button" className="secondary compact" onClick={() => setServices((current) => [...current, emptyService()])}>Add service</button></div>
          {services.map((service, index) => (
            <div className="service-row" key={service.key}>
              <label>Service name<input required value={service.name} onChange={(event) => setServices((current) => current.map((item) => item.key === service.key ? { ...item, name: event.target.value } : item))} /></label>
              <label>Price (₹)<input required type="number" min="0" step="1" value={service.price} onChange={(event) => setServices((current) => current.map((item) => item.key === service.key ? { ...item, price: event.target.value } : item))} /></label>
              <label>Duration (minutes)<input required type="number" min="1" step="1" value={service.duration} onChange={(event) => setServices((current) => current.map((item) => item.key === service.key ? { ...item, duration: event.target.value } : item))} /></label>
              <label className="service-description">Description<input value={service.description} onChange={(event) => setServices((current) => current.map((item) => item.key === service.key ? { ...item, description: event.target.value } : item))} /></label>
              {services.length > 1 && <button type="button" className="text-button remove-service" aria-label={`Remove service ${index + 1}`} onClick={() => setServices((current) => current.filter((item) => item.key !== service.key))}>Remove</button>}
            </div>
          ))}
        </div>
        {message && <div className="form-message" role="status">{message}</div>}
        <button className="primary" disabled={busy}>{busy ? "Submitting…" : "Submit proposal for Owner review"}</button>
      </form>
    </section>
  );
}

function OwnerBusinessSetup({ onReady }: { onReady: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Salon");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const client = getClient();
      if (!client) throw new Error(missingSupabaseConfigMessage);
      const { error } = await client.rpc("bootstrap_shop_owner", {
        p_business_name: name.trim(),
        p_business_category: category.trim(),
        p_contact_number: phone.trim() || null,
      });
      if (error) throw error;
      setMessage("Owner workspace connected. Assigned proposals are now available.");
      await onReady();
    } catch (cause) {
      setMessage(friendlyError(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="workspace-card">
      <span className="eyebrow">Owner setup</span>
      <h2>Connect your salon workspace</h2>
      <p className="preview-note">This uses Nexora&apos;s existing secure owner setup. Proposals addressed to your account are linked automatically.</p>
      <form className="proposal-form inline-setup" onSubmit={submit}>
        <label>Business name<input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Business category<input required value={category} onChange={(event) => setCategory(event.target.value)} /></label>
        <label>Contact number<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        {message && <div className="form-message" role="status">{message}</div>}
        <button className="primary" disabled={busy}>{busy ? "Connecting…" : "Connect owner workspace"}</button>
      </form>
    </section>
  );
}

function RoleWorkspace({ role, navigate }: { role: Role; navigate: (path: string) => void }) {
  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(role !== "customer");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [ownerReady, setOwnerReady] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [websiteSlugs, setWebsiteSlugs] = useState<Record<string, string>>({});
  const [attributions, setAttributions] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    if (role === "customer") return;
    setLoading(true); setError("");
    try {
      const client = getClient(); if (!client) throw new Error(missingSupabaseConfigMessage);
      if (role === "business_user") {
        const { data: salons, error: salonError } = await client.from("salons").select("id").limit(1);
        if (salonError) throw salonError;
        setOwnerReady(Boolean(salons?.length));
      }
      const { data, error: queryError } = await client.from("salon_setup_proposals")
        .select("id,onboarding_application_id,salon_id,owner_user_id,owner_email,status,payload,version,owner_notes,submitted_at,published_at,updated_at")
        .order("updated_at", { ascending: false });
      if (queryError) throw queryError;
      const proposals = (data ?? []) as Proposal[];
      setItems(proposals);
      const salonIds = proposals.flatMap((proposal) => proposal.salon_id ? [proposal.salon_id] : []);
      if (salonIds.length) {
        const websiteQuery = client.from("salon_public_websites").select("salon_id,slug").in("salon_id", salonIds).eq("is_published", true);
        const attributionQuery = role === "growth_partner"
          ? client.from("shop_attributions").select("salon_id,status").in("salon_id", salonIds)
          : Promise.resolve({ data: [], error: null });
        const [{ data: websites, error: websiteError }, { data: attributionRows, error: attributionError }] = await Promise.all([websiteQuery, attributionQuery]);
        if (websiteError) throw websiteError;
        if (attributionError) throw attributionError;
        setWebsiteSlugs(Object.fromEntries((websites ?? []).map((website) => [website.salon_id, website.slug])));
        setAttributions(Object.fromEntries((attributionRows ?? []).map((attribution) => [attribution.salon_id, attribution.status])));
      } else {
        setWebsiteSlugs({});
        setAttributions({});
      }
    } catch (cause) { setError(friendlyError(cause)); } finally { setLoading(false); }
  }, [role]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (role === "customer") {
    return <div className="role-grid"><RoleCard title="Published salons" text="Browse only verified, active, owner-published salon websites." path="/salons" navigate={navigate} /><RoleCard title="Payments and refunds" text="Advance, final payment, cancellation, dispute, and refund status is server-verified." path="/cancellation-refund" navigate={navigate} /></div>;
  }
  if (loading) return <div className="loader" aria-label="Loading website proposals" />;

  const review = async (proposal: Proposal, action: "approve" | "publish" | "request_changes" | "reject") => {
    setBusyId(proposal.id); setError("");
    try {
      const client = getClient(); if (!client) throw new Error(missingSupabaseConfigMessage);
      const { error: rpcError } = await client.rpc("review_salon_setup", {
        p_proposal_id: proposal.id,
        p_action: action,
        p_notes: action === "request_changes" ? "Changes requested from the Nexora dashboard." : action === "reject" ? "Proposal rejected from the Nexora dashboard." : null,
      });
      if (rpcError) throw rpcError;
      await load();
    } catch (cause) { setError(friendlyError(cause)); } finally { setBusyId(""); }
  };

  return <div className="workspace-stack">
    {role === "growth_partner" && <GrowthPartnerProposalForm onSubmitted={load} />}
    {role === "business_user" && !ownerReady && <OwnerBusinessSetup onReady={load} />}
    {error && <StateCard title="Could not load website data" text={error} action="Retry" onAction={load} />}
    {!items.length && !error && <StateCard title="No website proposals yet" text={role === "business_user" ? "Submitted Growth Partner website proposals assigned to your email will appear here for review." : "Complete the salon setup form above to submit your first private proposal."} />}
    <div className="proposal-list">{items.map((proposal) => {
      const payload = proposal.payload as { profile?: Record<string, unknown>; services?: unknown[]; staff?: unknown[]; template?: Record<string, unknown> };
      const slug = proposal.salon_id ? websiteSlugs[proposal.salon_id] : undefined;
      const attribution = proposal.salon_id ? attributions[proposal.salon_id] : undefined;
      const hours = payload.profile?.opening_hours as Record<string, unknown> | undefined;
      return <article className="proposal-card" key={proposal.id}><div className="proposal-head"><div><span className={`status status-${proposal.status}`}>{proposal.status.replaceAll("_", " ")}</span><h2>{String(payload.profile?.name ?? "Salon website proposal")}</h2><p>{proposal.owner_email ?? "Linked Shop Owner"} · Revision {proposal.version}</p></div><span className="template-badge">{String(payload.template?.key ?? "modern-salon")}</span></div>
        <div className="proposal-preview"><div><small>Public profile</small><p>{String(payload.profile?.description ?? "No description added yet.")}</p></div><div><b>{Array.isArray(payload.services) ? payload.services.length : 0}</b><small>services</small></div><div><b>{Array.isArray(payload.staff) ? payload.staff.length : 0}</b><small>staff</small></div></div>
        {expanded[proposal.id] && <div className="proposal-details"><p><b>Address:</b> {String(payload.profile?.address ?? "Not supplied")}, {String(payload.profile?.area ?? "")} {String(payload.profile?.city ?? "")}</p><p><b>Contact:</b> {String(payload.profile?.phone ?? "Not supplied")}</p><p><b>Opening hours:</b> {String(hours?.opens ?? "—")}–{String(hours?.closes ?? "—")}</p>{proposal.owner_notes && <p><b>Owner notes:</b> {proposal.owner_notes}</p>}</div>}
        <div className="button-row"><button className="secondary compact" onClick={() => setExpanded((current) => ({ ...current, [proposal.id]: !current[proposal.id] }))}>{expanded[proposal.id] ? "Hide preview" : "Preview details"}</button>{slug && <button className="secondary compact" onClick={() => navigate(`/salons/${slug}`)}>Open public listing</button>}</div>
        {role === "business_user" ? <div className="button-row">{proposal.status === "submitted" && <button className="secondary" disabled={busyId === proposal.id} onClick={() => void review(proposal, "approve")}>Approve</button>}{["submitted","approved"].includes(proposal.status) && <button className="primary" disabled={busyId === proposal.id} onClick={() => void review(proposal, "publish")}>Approve & publish</button>}{["submitted","approved"].includes(proposal.status) && <button className="text-button" disabled={busyId === proposal.id} onClick={() => void review(proposal, "request_changes")}>Request changes</button>}{proposal.status === "submitted" && <button className="text-button danger-link" disabled={busyId === proposal.id} onClick={() => void review(proposal, "reject")}>Reject</button>}</div> : <div className="gp-status"><p className="preview-note">Owner approval: <b>{proposal.status === "published" ? "Published" : proposal.status.replaceAll("_", " ")}</b>. Unpublished previews remain private.</p><p className="preview-note">GP attribution / commission: <b>{attribution ? attribution.replaceAll("_", " ") : proposal.status === "published" ? "Attribution pending" : "Preserved on publish"}</b></p></div>}
      </article>;
    })}</div>
  </div>;
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

type PortalKey = "customer" | "owner" | "growth-partner";

type PwaInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const PWA_APPS: Record<PortalKey, { name: string; manifest: string; theme: string; icon: string; blurb: string }> = {
  customer: {
    name: "Nexora Customer",
    manifest: "/manifest-customer.webmanifest",
    theme: "#e6007e",
    icon: "/icons/customer-192.png",
    blurb: "Book salons faster, track payments, and reopen your bookings in one tap.",
  },
  owner: {
    name: "Nexora Shop Owner",
    manifest: "/manifest-owner.webmanifest",
    theme: "#6d28d9",
    icon: "/icons/owner-192.png",
    blurb: "Review proposals, publish your storefront, and manage bookings anywhere.",
  },
  "growth-partner": {
    name: "Nexora Growth Partner",
    manifest: "/manifest-growth-partner.webmanifest",
    theme: "#16845b",
    icon: "/icons/growth-partner-192.png",
    blurb: "Submit salon websites and follow approval and commission status on the go.",
  },
};

const PWA_DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// Web storage APIs are unavailable in sandboxed embeds, so dismissal is
// remembered with a short-lived cookie plus an in-memory fallback.
const pwaDismissedInMemory = new Set<string>();

function pwaDismissCookieKey(portal: PortalKey) {
  return `nexora-pwa-dismissed-${portal}`;
}

function isPwaDismissed(portal: PortalKey) {
  const key = pwaDismissCookieKey(portal);
  if (pwaDismissedInMemory.has(key)) return true;
  const prefix = `${key}=`;
  return document.cookie.split(";").some((entry) => entry.trim().startsWith(prefix));
}

function rememberPwaDismissed(portal: PortalKey) {
  const key = pwaDismissCookieKey(portal);
  pwaDismissedInMemory.add(key);
  try {
    document.cookie = `${key}=1; max-age=${Math.floor(PWA_DISMISS_COOLDOWN_MS / 1000)}; path=/; samesite=lax`;
  } catch {
    // Cookie writes can be blocked in sandboxed contexts; in-memory fallback covers the session.
  }
}

function portalFromContext(role: Role | undefined, path: string): PortalKey {
  if (role === "business_user") return "owner";
  if (role === "growth_partner") return "growth-partner";
  if (role === "customer") return "customer";
  if (path === "/owner" || path.startsWith("/dashboard/business_user")) return "owner";
  if (path === "/growth-partner" || path.startsWith("/dashboard/growth_partner")) return "growth-partner";
  return "customer";
}

function setHeadLink(rel: string, href: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

// Swaps the web app manifest to the role-specific Nexora app so the browser
// install prompt installs the correct PWA for the signed-in (or browsing) role.
function useRolePwaManifest(app: (typeof PWA_APPS)[PortalKey]) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeadLink("manifest", app.manifest);
      setHeadLink("apple-touch-icon", app.icon);
      let theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!theme) {
        theme = document.createElement("meta");
        theme.name = "theme-color";
        document.head.appendChild(theme);
      }
      theme.content = app.theme;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [app]);
}

function PwaInstallPrompt({ portal }: { portal: PortalKey }) {
  const app = PWA_APPS[portal];
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<PwaInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  useRolePwaManifest(app);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const timer = window.setTimeout(() => {
      if (isStandalone) {
        setInstalled(true);
      } else if (isPwaDismissed(portal)) {
        setDismissed(true);
      }
      setMounted(true);
    }, 0);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as PwaInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [portal]);

  const isIos =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(navigator as Navigator & { standalone?: boolean }).standalone;

  if (!mounted || installed || dismissed || (!deferredPrompt && !isIos)) return null;

  const dismiss = () => {
    rememberPwaDismissed(portal);
    setDismissed(true);
  };
  const install = async () => {
    if (!deferredPrompt || busy) return;
    setBusy(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        return;
      }
      dismiss();
    } catch {
      dismiss();
    } finally {
      setBusy(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <aside className="pwa-install" role="dialog" aria-label={`Install ${app.name} app`}>
      {/* 46px local PWA icon — next/image optimization adds no value here */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pwa-install-icon" src={app.icon} alt="" width={46} height={46} />
      <div className="pwa-install-copy">
        <b>Install {app.name}</b>
        <p>{app.blurb}</p>
        {isIos && !deferredPrompt && (
          <p className="pwa-install-hint">Tap Share, then “Add to Home Screen”.</p>
        )}
      </div>
      <div className="pwa-install-actions">
        {deferredPrompt && (
          <button className="primary compact" disabled={busy} onClick={() => void install()}>
            {busy ? "Opening…" : "Install app"}
          </button>
        )}
        <button className="text-button" onClick={dismiss}>Not now</button>
      </div>
    </aside>
  );
}
