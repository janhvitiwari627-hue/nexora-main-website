> SUPERSEDED: Correct specification is PHASE1_SECTION11.md
>
> NUMBERING CORRECTION: Locked MEMORY.md order ke अनुसार "AI Smart Picks" Section 11 hai.
> Yeh PHASE1_SECTION09.md incorrect numbering ke saath create hua tha; isey delete NAHIN kiya gaya.
> Existing implementation (stable id `smart-picks`, useRecommendations()/useCustomerSuggestions() contracts, modes, consent behavior) as-is reused aur preserved hai — koi duplicate section nahin.

# NEXORA HOMEPAGE — PHASE 1 + SECTION 09

## SECTION 09: AI SMART PICKS

### Goal

User को existing consented marketplace signals के आधार पर relevant salon recommendations दिखानी हैं।

Personalized recommendations केवल logged-in customer और available preference/history data पर दिखाई जाएँ।

Logged-out visitor को generic popular, nearby या top-rated picks दिखाए जाएँ और उन्हें falsely personalized न कहा जाए।

Fake AI claim, fake recommendation reason, cross-user data leakage या sensitive personal inference नहीं करनी है।

### Section Position

1. Header
2. Hero
3. Smart Search
4. Aap Nexora Par Kya Karna Chahte Hain?
5. Beauty Categories
6. Nearby Shops
7. Open Now
8. Jaipur’s Top 5 Salons
9. AI Smart Picks

### Stable Section ID

`smart-picks`

### Logged-In Heading

Eyebrow:

SMART PICKS FOR YOU

Heading:

Aapke Liye Recommended

Supporting Copy:

Aapki पसंद, location aur Nexora activity ke आधार पर relevant salons explore करें।

### Logged-Out Heading

Eyebrow:

POPULAR PICKS

Heading:

Nexora Par Popular Salons

Supporting Copy:

Jaipur में customers द्वारा पसंद किए जा रहे published salons explore करें।

### AI Naming Honesty

पहले existing recommendation system inspect करो।

अगर existing system:

- AI/ML model use करता है, तभी `AI Smart Picks` label दिखाओ।
- Rule-based ranking, SQL scoring या preference matching use करता है, तो public label `Smart Picks` रखो।
- केवल top-rated sorting use करता है, तो इसे personalized AI मत कहो।

Internal section/document name `AI Smart Picks` रह सकता है, लेकिन public UI misleading नहीं होनी चाहिए।

### Existing Data Contracts

Current repository inspect करके reuse करो:

- `useRecommendations()`
- `recommendationRows`
- `recommendationsLoading`
- `isPersonalized`
- `useCustomerSuggestions()`
- `personalized`
- `favorites`
- `ready`
- Existing customer session
- Existing recently viewed consent
- Existing customer preferences
- Existing published salon data
- Existing ratings/reviews/bookings aggregates
- Existing location state
- Existing recommendation RPC/functions
- Existing salon details route

नया parallel recommendation database या external AI provider मत जोड़ो।

### Allowed Recommendation Signals

केवल existing, consented और available signals use करो:

- Selected city/area
- Valid approximate location
- Preferred category
- Preferred services
- Supported gender preference
- Supported price preference
- Favourite salons
- Recently viewed salons, consent enabled होने पर
- Previous bookings, existing authorization allow करे तो
- Real ratings/reviews
- Real popularity/booking aggregates
- Published salon availability

### Prohibited Recommendation Signals

इनका अनुमान या उपयोग मत करो:

- Religion
- Caste
- Health condition
- Exact income
- Sexual orientation
- Private messages
- Other users’ private records
- Precise location history without consent
- Hidden cross-app activity outside existing approved contract
- Any sensitive trait inferred from service searches

### Cross-User Data Protection

- User A की favourites, bookings या browsing history User B को कभी न दिखे।
- Logged-out session को previous authenticated user की recommendations cache से न मिलें।
- Logout पर personalized in-memory state safely clear हो।
- Existing RLS/auth guards preserve करो।
- Frontend में service-role key use मत करो।
- User ID URL या public DOM metadata में expose मत करो।

### Recommendation Modes

#### Mode 1: Personalized

Conditions:

- Valid authenticated customer session
- Recommendation data successfully loaded
- Existing personalized signal available
- `isPersonalized` or equivalent trusted state true

Heading:

Aapke Liye Recommended

#### Mode 2: Location-Based

Conditions:

- Personalized data unavailable
- Valid selected/detected location available

Heading:

Aapke Area Ke Smart Picks

Reason examples:

- Near your selected area
- Popular in Malviya Nagar
- Highly rated near you

Reason केवल real data से हो।

#### Mode 3: Popular Jaipur Picks

Conditions:

- Logged-out user
- No personal signals
- Default Jaipur fallback

Heading:

Nexora Par Popular Salons

Generic ranking only। Personalized claim मत करो।

#### Mode 4: Limited Data

अगर recommendation service unavailable है लेकिन published salons available हैं:

- Existing safe marketplace ranking use करो।
- Label:

  `Popular Picks`

- AI/personalized label hide करो।

### Recommendation Reasons

हर personalized card पर optional explainable reason दिखाओ।

Allowed examples:

- `Because you viewed similar salons`
- `Matches your preferred category`
- `Popular in your selected area`
- `Similar to your favourites`
- `Within your preferred price range`
- `Highly rated near you`

Rules:

- Reason तभी दिखाओ जब supporting signal real हो।
- Random reason assign मत करो।
- Sensitive inference मत दिखाओ।
- Internal score, SQL/RPC name या private activity detail expose मत करो।
- One concise reason पर्याप्त है।

### Recommendation Cards

हर card में available live data के अनुसार:

- Real salon cover image
- Salon name
- Category
- Jaipur area/locality
- Recommendation reason
- Real rating
- Real review count
- Starting price, अगर available हो
- Distance, अगर valid हो
- Open/Closed status, अगर real hours available हों
- Verified badge, existing verification contract के अनुसार
- `View Salon` CTA
- Optional `Book Now`, केवल existing route verified हो तो

### Rating and Price Rules

- Fake rating fallback मत लगाओ।
- Missing rating:

  `No ratings yet`

- Missing price:

  `View services for pricing`

- Price/rating reason तभी दिखाओ जब values मौजूद हों।
- Unsupported data से recommendation score invent मत करो।

### Distance and Location

- Section 06 का selected/detected location state reuse करो।
- GPS दोबारा automatically request मत करो।
- Valid coordinates होने पर distance दिखाओ।
- Missing coordinates पर:

  `Distance unavailable`

- Raw coordinates URL, analytics payload या public UI में expose मत करो।

### Open/Closed Status

- Section 07 का verified salon-hours calculation reuse करो।
- Missing hours पर:

  `Timings unavailable`

- Open Now reason तभी use करो जब current verified status वास्तव में open हो।

### Verified Badge

Existing verification contract follow करो।

Safe tooltip:

`This salon profile is approved for publishing on Nexora.`

Unsupported identity, licence, document या government verification claim मत करो।

### Duplicate Prevention

- Same salon एक Smart Picks list में दो बार न दिखे।
- Invalid/missing salon IDs safely filter करो।
- Archived/unpublished salon recommendations exclude करो।
- User के blocked/hidden salon data का existing contract हो तो respect करो।
- Section 08 Top 5 से overlap allowed है, लेकिन Smart Picks का reason अलग और genuine होना चाहिए।

### Display Limit

- Homepage पर maximum 4–6 recommendations।
- Existing backend order preserve करो।
- More results के लिए CTA दो।
- Fake cards से section मत भरो।

### Main CTA

Personalized mode:

`Aur Recommendations Dekhein`

Generic mode:

`Popular Salons Dekhein`

Destination:

Existing `/salons` route और supported query/sort parameters use करो।

Unknown `recommended=true` जैसा parameter invent मत करो यदि results route support नहीं करता।

### Refresh Action

Optional action:

`Refresh Picks`

Rules:

- Existing recommendation endpoint safely refetch करे।
- Random reshuffle को AI refresh मत कहो।
- Excessive requests prevent करो।
- Loading only this section पर दिखे।
- Previous valid results loading के दौरान unnecessarily disappear न हों।

### Feedback Controls

`Not Interested`, `Hide` या thumbs feedback केवल तभी add करो जब:

- Existing backend/preferences contract support करता हो।
- User authenticated हो।
- RLS and ownership verified हों।

Backend support नहीं है तो visual-only feedback control मत बनाओ।

### Loading State

- 4 recommendation-card skeletons।
- Correct personalized/generic heading auth state resolve होने के बाद दिखे।
- Auth loading के दौरान personalized data flash मत करो।
- Whole homepage blank spinner मत बनाओ।
- Layout shift कम हो।

### Auth Loading State

Neutral copy:

`Smart picks load ho rahe hain…`

Rules:

- Logged-out generic results prematurely flash न हों।
- Previous user की cached personalized cards न दिखें।
- Session resolve होने पर correct mode render हो।

### Empty Personalized State

Message:

Aapke liye recommendations banane ke liye abhi enough activity nahi hai.

Actions:

- Explore Salons
- Browse Categories

Generic popular picks safe fallback के रूप में दिखा सकते हो, लेकिन clearly `Popular Picks` label करो।

### Empty Marketplace State

Message:

Recommended salons abhi available nahi hain.

Actions:

- View All Salons
- Explore Categories

Fake recommendations मत बनाओ।

### Error State

Message:

Smart picks load nahi ho sake. Dobara try karein.

Actions:

- Retry
- View All Salons

Raw Supabase error, RPC name, internal score या stack trace public UI में मत दिखाओ।

### Offline State

Message:

Aap offline hain. Live recommendations update nahi ki ja sakti.

Cached recommendations available हों तो:

- `Saved picks` label दिखाओ।
- Cached results को current/live recommendations मत बताओ।
- Live availability status hide या mark unavailable करो।
- Previous user का cache current user को न मिले।

### Image Rules

- Existing real salon cover images use करो।
- Missing image पर approved local fallback asset।
- Random remote/hotlinked image मत लगाओ।
- Broken image fallback handle करो।
- Meaningful alt text दो।
- Project-compatible image optimization use करो।
- Same generic image सभी recommendation cards पर मत दिखाओ।

### Responsive Layout

Desktop:

- 3 या 4-card grid।
- Recommendation reason readable हो।
- Section heading और CTA aligned हों।

Tablet:

- 2-card grid।
- Reason and metadata clip न हों।

Mobile:

- 1-column cards preferred।
- Horizontal carousel use हो तो accessible controls जरूरी हैं।
- Recommendation reason, rating और CTA readable हों।
- Minimum 44×44px targets।
- Horizontal page overflow नहीं।
- Sticky Header के लिए correct scroll margin।

Sections 01–08 के existing design tokens, typography, spacing, radii और components reuse करो।

नया unrelated visual system मत बनाओ।

### Accessibility

- Semantic section और `<h2>` heading।
- Personalized status understandable text में हो।
- Card reason screen reader को available हो।
- Salon cards keyboard accessible हों।
- Visible focus ring हो।
- Rating accessible label हो।
- Loading/error status live region में announce हो।
- Tooltip keyboard accessible हो।
- Color contrast WCAG AA target करे।
- Reduced-motion preference respect हो।
- Carousel use हो तो Previous/Next labelled controls हों।

### Performance

- Existing recommendation hooks reuse करो।
- Duplicate network requests avoid करो।
- Search typing या unrelated state पर recommendations refetch मत करो।
- Stable card keys use करो।
- Recommendation sorting memoize हो जहाँ useful हो।
- Images lazy-load हों।
- User/session change पर stale request cancellation या ignore logic हो।
- Race condition से previous session result overwrite न करे।

### Analytics

Existing consented analytics system हो तभी safe events use करो:

- Section viewed
- Recommendation clicked
- CTA clicked

Rules:

- Raw user ID मत भेजो।
- Exact coordinates मत भेजो।
- Sensitive preference label मत भेजो।
- नया analytics vendor या tracker add मत करो।
- Analytics failure UI/navigation block न करे।

### No-Data-Loss Migration

Current homepage में recommendations, For You, favourites या personalized sections पहले से मौजूद हो सकते हैं।

Mandatory rules:

1. Existing recommendation section को upgrade/consolidate करो।
2. Duplicate Smart Picks section मत बनाओ।
3. Existing `useRecommendations()` preserve करो।
4. Existing `useCustomerSuggestions()` preserve करो।
5. Existing `recommendationRows`, `personalized`, `favorites`, `ready` और `isPersonalized` behavior preserve करो।
6. Existing recently-viewed consent behavior preserve करो।
7. Existing customer session and RLS boundaries preserve करो।
8. Existing shared SalonCard edit करने से पहले all call sites inspect करो।
9. Duplicate Published/Recommended sections safely identify करो, लेकिन बिना dependency inspection delete मत करो।
10. किसी file, hook, route, test, consent state, data source या feature को delete मत करो।
11. Database, RPC, RLS या migration change मत करो।

### Do Not Change

- Sections 01–08
- Sections 10–18
- Salon detail page design
- Six app dashboards
- Supabase auth
- Database schema
- RLS policies
- RPC definitions
- Migrations
- PWA redirects/rewrites
- Back to Main Website behavior
- Footer

### Implementation Process

1. Current branch और full working tree inspect करो।
2. Existing recommendation/For You sections locate करो।
3. `useRecommendations()` and `useCustomerSuggestions()` inspect करो।
4. Recommendation RPC, response fields and ranking order inspect करो।
5. Auth/session loading and logout behavior inspect करो।
6. Recently-viewed consent contract inspect करो।
7. `/salons` supported recommendation/popularity parameters verify करो।
8. Existing section को stable `smart-picks` ID के साथ upgrade/consolidate करो।
9. Personalized and generic modes implement करो।
10. Truthful recommendation reasons implement करो।
11. Duplicate salon and stale-session protection implement करो।
12. Loading, auth-loading, empty, error and offline states implement करो।
13. Desktop, tablet and mobile layouts verify करो।
14. Keyboard and screen-reader behavior verify करो।
15. Recommendation isolation, fallback and route tests add/update करो।
16. Existing failures और new failures अलग report करो।

### Required Tests

Run:

- `npm run typecheck`
- `npm run lint`
- `npm run test:security`
- `npm run test:back-to-main`
- `npm run test:contracts`

Relevant targeted tests:

- Logged-out generic picks
- Logged-in personalized picks
- Auth loading neutral state
- No cross-user recommendation leakage
- Logout clears personalized state
- Recently viewed used only with consent
- Published salons only
- Duplicate salons removed
- Truthful recommendation reasons
- Stale request does not overwrite new session
- Correct salon route
- Correct View All route
- Offline cached-state honesty

Production build केवल real configured public Supabase environment variables के साथ run करो।

Fake anon key, placeholder credential, service-role key या external AI API key use मत करो।

### Manual Verification

- Logged-out visitor
- Auth loading
- Logged-in customer with preferences
- Logged-in customer without enough activity
- User switch/logout
- Location-based fallback
- Popular Jaipur fallback
- Recommendation reasons
- Duplicate prevention
- Published-only results
- Rating and reviews
- Price and missing price
- Distance and missing distance
- Open/Closed and missing hours
- Verified tooltip
- View Salon route
- View All route
- Refresh action, if supported
- Loading skeleton
- Empty personalized state
- Empty marketplace state
- Error and Retry
- Offline state
- Desktop layout
- Tablet layout
- Mobile layout
- Keyboard navigation
- Screen-reader labels
- Sections 01–08 unchanged

### Acceptance Criteria

- Section correct order पर है।
- Stable ID `smart-picks` है।
- Public AI label actual technology से match करता है।
- Logged-out results falsely personalized नहीं हैं।
- Logged-in recommendations existing consented data use करती हैं।
- No cross-user data leakage है।
- Recently viewed consent respected है।
- Recommendation reasons truthful हैं।
- Only published salons दिखते हैं।
- Duplicate recommendations नहीं हैं।
- Main CTA correct route खोलता है।
- Loading and auth-loading states सही हैं।
- Empty states मौजूद हैं।
- Error/Retry state मौजूद है।
- Offline state honest है।
- Desktop/tablet/mobile pass है।
- Accessibility pass है।
- Existing recommendation hooks/data preserved हैं।
- Existing Sections 01–08 preserved हैं।
- No auth/database/RLS/app regression है।
- No file, route, consent state, data source या feature deleted है।
- No new test failure introduced हुआ।
