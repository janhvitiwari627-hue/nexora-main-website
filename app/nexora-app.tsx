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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
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

      setAuthState({ loading: false, session });
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

  const signOut = () => {
    setAuthState({ loading: false, session: null });
    navigate("/");
    void getClient()?.auth.signOut();
  };

  let content: React.ReactNode;
  if (path === "/salons") content = <CatalogPage navigate={navigate} online={online} />;
  else if (path.startsWith("/salons/"))
    content = <SalonPage slug={decodeURIComponent(path.slice(8))} navigate={navigate} online={online} />;
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

  return (
    <div className="site-shell">
      {!online && <div className="offline-banner">Offline — live salon and account data may be unavailable.</div>}
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
  signOut: () => void;
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
            <button onClick={signOut}>Sign out</button>
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
  if (!client) throw new Error("Staging connection is not configured.");
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

function SalonPage({ slug, navigate, online }: { slug: string; navigate: (path: string) => void; online: boolean }) {
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
  const config = item.website.config as { profile?: Record<string, unknown>; services?: Array<Record<string, unknown>>; staff?: Array<Record<string, unknown>>; offers?: Array<Record<string, unknown>> };
  const services = Array.isArray(config.services) ? config.services : [];
  return (
    <main>
      <section className="store-hero"><span className="verified-pill">✓ Nexora verified</span><h1>{item.name}</h1><p>{String(config.profile?.description ?? item.description ?? "Professional beauty services with easy online booking.")}</p><div className="store-facts"><span>★ {Number(item.rating_average).toFixed(1)} rating</span><span>⌖ {item.area ?? item.city}, {item.city}</span></div><button className="primary" onClick={() => navigate("/login?role=customer")}>Book appointment</button></section>
      <section className="section"><div className="section-heading"><span className="eyebrow">Services</span><h2>Choose your service</h2></div>
      {!services.length ? <StateCard title="Services are being updated" text="Please check back soon." /> : <div className="service-grid">{services.map((service, index) => <article className="service-card" key={String(service.id ?? index)}><div><h3>{String(service.name ?? "Salon service")}</h3><p>{String(service.description ?? "Professional salon service")}</p><small>{Number(service.duration_minutes ?? 0)} minutes</small></div><b>{money(Number(service.price_paise ?? 0))}</b></article>)}</div>}</section>
      <section className="section salon-info"><div><span className="eyebrow">Visit</span><h2>{item.name}</h2><p>{item.address}, {item.city}</p></div><button className="secondary" onClick={() => navigate("/cancellation-refund")}>Cancellation policy</button></section>
    </main>
  );
}

function AuthPage({ mode, navigate }: { mode: "login" | "signup"; navigate: (path: string) => void }) {
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const requested = params.get("role");
  const [role, setRole] = useState<Role>(requested === "owner" ? "business_user" : requested === "growth-partner" ? "growth_partner" : "customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const client = getClient();
      if (!client) throw new Error("Staging connection is not configured.");
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
      navigate(`/dashboard/${profile.platform_role}`);
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
  signOut: () => void;
}) {
  const [state, setState] = useState<{ loading: boolean; role?: Role; name?: string; error?: string }>({ loading: true });
  const load = useCallback(async () => {
    setState({ loading: true });
    try {
      const client = getClient(); if (!client) throw new Error("Staging connection is not configured.");
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
  return <main className="section page-top"><div className="dashboard-hero"><span className="eyebrow">{label} dashboard</span><h1>Welcome, {state.name}</h1><p>Your session is protected by the assigned Nexora role. Data access remains limited by staging RLS.</p></div><RoleWorkspace role={state.role!} navigate={navigate} /><button className="secondary signout" onClick={signOut}>Sign out</button></main>;
}

type Proposal = {
  id: string;
  salon_id: string | null;
  owner_email: string | null;
  status: string;
  payload: Record<string, unknown>;
  version: number;
  updated_at: string;
};

function RoleWorkspace({ role, navigate }: { role: Role; navigate: (path: string) => void }) {
  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(role !== "customer");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const load = useCallback(async () => {
    if (role === "customer") return;
    setLoading(true); setError("");
    try {
      const client = getClient(); if (!client) throw new Error("Staging connection is not configured.");
      const { data, error: queryError } = await client.from("salon_setup_proposals")
        .select("id,salon_id,owner_email,status,payload,version,updated_at")
        .order("updated_at", { ascending: false });
      if (queryError) throw queryError;
      setItems((data ?? []) as Proposal[]);
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
  if (error) return <StateCard title="Could not load website data" text={error} action="Retry" onAction={load} />;
  if (!items.length) return <StateCard title="No website proposals yet" text={role === "business_user" ? "Submitted Growth Partner website proposals will appear here for review." : "Create or submit a salon setup in the Growth Partner app to see its preview here."} />;

  const review = async (proposal: Proposal, action: "approve" | "publish" | "request_changes") => {
    setBusyId(proposal.id); setError("");
    try {
      const client = getClient(); if (!client) throw new Error("Staging connection is not configured.");
      const { error: rpcError } = await client.rpc("review_salon_setup", {
        p_proposal_id: proposal.id,
        p_action: action,
        p_notes: action === "request_changes" ? "Changes requested from the Nexora dashboard." : null,
      });
      if (rpcError) throw rpcError;
      await load();
    } catch (cause) { setError(friendlyError(cause)); } finally { setBusyId(""); }
  };

  return <div className="proposal-list">{error && <div className="form-message">{error}</div>}{items.map((proposal) => {
    const payload = proposal.payload as { profile?: Record<string, unknown>; services?: unknown[]; staff?: unknown[]; template?: Record<string, unknown> };
    return <article className="proposal-card" key={proposal.id}><div className="proposal-head"><div><span className={`status status-${proposal.status}`}>{proposal.status.replaceAll("_", " ")}</span><h2>{String(payload.profile?.name ?? "Salon website proposal")}</h2><p>{proposal.owner_email ?? "Linked Shop Owner"} · Revision {proposal.version}</p></div><span className="template-badge">{String(payload.template?.key ?? "modern-salon")}</span></div>
      <div className="proposal-preview"><div><small>Public profile</small><p>{String(payload.profile?.description ?? "No description added yet.")}</p></div><div><b>{Array.isArray(payload.services) ? payload.services.length : 0}</b><small>services</small></div><div><b>{Array.isArray(payload.staff) ? payload.staff.length : 0}</b><small>staff</small></div></div>
      {role === "business_user" ? <div className="button-row">{proposal.status === "submitted" && <button className="secondary" disabled={busyId === proposal.id} onClick={() => void review(proposal, "approve")}>Approve</button>}{["submitted","approved"].includes(proposal.status) && <button className="primary" disabled={busyId === proposal.id} onClick={() => void review(proposal, "publish")}>Approve & publish</button>}{["submitted","approved"].includes(proposal.status) && <button className="text-button" disabled={busyId === proposal.id} onClick={() => void review(proposal, "request_changes")}>Request changes</button>}</div> : <p className="preview-note">Preview is private to the attributed Growth Partner until the Shop Owner publishes it.</p>}
    </article>;
  })}</div>;
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
