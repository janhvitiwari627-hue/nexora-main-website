# NEXORA HOMEPAGE — PHASE 1 + SECTION 11

> NUMBERING CORRECTION: Locked MEMORY.md order ke अनुसार "AI Smart Picks"
> Section 11 hai (earlier incorrect numbering PHASE1_SECTION09.md supersede karti hai —
> woh file delete nahin ki gayi, sirf SUPERSEDED note ke saath preserved hai).
> Existing implementation (stable id `smart-picks`, `useRecommendations()` /
> `useCustomerSuggestions()` contracts, modes, consent behavior, tests) as-is
> reused hai — koi duplicate section nahin banaya gaya.

## SECTION 11: AI SMART PICKS

### Goal

User को existing consented marketplace signals के आधार पर useful और explainable salon recommendations दिखानी हैं।

Logged-in customer को available preference/activity के अनुसार personalized picks मिलें।

Logged-out visitor को generic popular, nearby या top-rated picks मिलें—उन्हें falsely personalized नहीं बताना है।

Fake AI claim, fake recommendation reason, cross-user data leakage या sensitive personal inference नहीं करनी है।

### Section Position

1. Header
2. Hero
3. Smart Search
4. Location and Trust
5. Aap Nexora Par Kya Karna Chahte Hain?
6. Six Nexora Apps
7. Categories
8. Nearby Shops
9. Open Now
10. Jaipur’s Top 5 Salons
11. AI Smart Picks

### Stable ID

`smart-picks`

### Personalized Content

Eyebrow:

SMART PICKS FOR YOU

Heading:

Aapke Liye Recommended

Supporting Copy:

Aapki preferences, selected location aur Nexora activity ke आधार पर relevant salons explore करें।

### Logged-Out Content

Eyebrow:

POPULAR PICKS

Heading:

Nexora Par Popular Salons

Supporting Copy:

Jaipur में customers द्वारा पसंद किए जा रहे published salons explore करें।

### AI Label Honesty

पहले existing recommendation implementation inspect करो।

अगर system:

- Real AI/ML model use करता है → `AI Smart Picks` public label allowed है।
- SQL scoring, rule-based ranking या preference matching use करता है → public label `Smart Picks` रखो।
- केवल rating/popularity sorting करता है → `Popular Picks` रखो।

Technology verify किए बिना “AI-powered” मत लिखो।

Internal document/section name `AI Smart Picks` रह सकता है, लेकिन public UI misleading नहीं होनी चाहिए।

### Existing Contracts

Inspect and reuse:

- `useRecommendations()`
- `recommendationRows`
- `recommendationsLoading`
- `isPersonalized`
- `useCustomerSuggestions()`
- `personalized`
- `favorites`
- `ready`
- Existing customer session
- Existing recently-viewed consent
- Existing customer preferences
- Existing published salon data
- Existing location state
- Existing ratings/reviews aggregates
- Existing recommendation RPC
- Existing salon detail routes

नया parallel recommendation system या external AI provider मत जोड़ो।

### Allowed Signals

केवल existing, available और consented signals use करो:

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

### Prohibited Signals

इनका अनुमान या उपयोग मत करो:

- Religion
- Caste
- Health condition
- Exact income
- Sexual orientation
- Private messages
- Other users’ private records
- Precise location history without consent
- Hidden cross-app activity outside existing contract
- Sensitive traits inferred from searches

### Cross-User Protection

- User A की favourites/history/bookings User B को न दिखें।
- Logout के बाद previous user की personalized cards clear हों।
- New user login पर stale previous-user response render न हो।
- Logged-out session को authenticated cache data न मिले।
- Existing RLS और session isolation preserve हो।
- Service-role key frontend में न हो।
- User ID URL या public metadata में expose न हो।

### Recommendation Modes

#### Mode 1: Personalized

Conditions:

- Valid authenticated customer session
- Recommendation data loaded
- Existing personalized signal available
- Trusted `isPersonalized` state true

Heading:

Aapke Liye Recommended

#### Mode 2: Location-Based

Conditions:

- Personalized data unavailable
- Valid selected/detected location available

Heading:

Aapke Area Ke Smart Picks

Reasons:

- Near your selected area
- Popular in Malviya Nagar
- Highly rated near you

Reason real supporting data से हो।

#### Mode 3: Popular Jaipur Picks

Conditions:

- Logged-out visitor
- No personal signals
- Default Jaipur state

Heading:

Nexora Par Popular Salons

Personalized या AI claim मत करो।

#### Mode 4: Limited Data

Recommendation service unavailable हो लेकिन published salons available हों:

- Existing safe marketplace ranking use करो।
- Label `Popular Picks` हो।
- Personalized/AI label hide हो।

### Recommendation Reasons

Allowed truthful reasons:

- `Because you viewed similar salons`
- `Matches your preferred category`
- `Popular in your selected area`
- `Similar to your favourites`
- `Within your preferred price range`
- `Highly rated near you`

Rules:

- Reason तभी दिखाओ जब supporting signal मौजूद हो।
- Random reason assign मत करो।
- Sensitive inference मत दिखाओ।
- Internal score, SQL/RPC name या private activity expose मत करो।
- एक concise reason पर्याप्त है।

### Recommendation Cards

हर card में available live data:

- Real salon cover image
- Salon name
- Category
- Area/locality
- Recommendation reason
- Real rating
- Real review count
- Starting price, अगर available हो
- Distance, अगर valid हो
- Open/Closed status, verified hours से
- Verified badge, existing verification contract से
- `View Salon` CTA
- Optional `Book Now`, verified route available हो तो

### Published-Only Rule

- केवल published और publicly discoverable salons दिखाओ।
- Archived, rejected और unpublished salons exclude हों।
- Missing salon reference safely filter हो।
- Test/demo records existing metadata से identifiable हों तो exclude हों।

### Rating and Price

Missing rating:

`No ratings yet`

Missing price:

`View services for pricing`

Fake rating, review count या price मत बनाओ।

Recommendation reason में price/rating तभी mention हो जब real value available हो।

### Location and Distance

- Section 08 का selected/detected location state reuse करो।
- GPS दोबारा automatically request मत करो।
- Valid coordinates पर distance दिखाओ।
- Missing coordinates:

  `Distance unavailable`

- Raw coordinates URL या public UI में expose मत करो।

### Open/Closed Status

- Section 09 का verified hours calculation reuse करो।
- Missing hours:

  `Timings unavailable`

- `Open Now` reason तभी दिखाओ जब salon वास्तव में open हो।

### Verified Badge

Safe tooltip:

`This salon profile is approved for publishing on Nexora.`

Backend evidence के बिना licence, identity, documents या government verification claim मत करो।

### Duplicate Prevention

- Same recommendation list में salon दो बार न आए।
- Stable salon ID/slug से deduplicate करो।
- Invalid salon references safely ignore करो।
- Section 10 Top 5 से overlap allowed है, लेकिन Smart Picks reason real और अलग होना चाहिए।

### Display Limit

- Homepage पर maximum 4–6 recommendation cards।
- Existing backend recommendation order preserve करो।
- Fake cards से section पूरा मत करो।
- Remaining discovery के लिए CTA दो।

### Main CTA

Personalized mode:

`Aur Recommendations Dekhein`

Generic mode:

`Popular Salons Dekhein`

Existing supported `/salons` route और query parameters use करो।

Unsupported `recommended=true` parameter invent मत करो।

### Refresh Picks

Optional action:

`Refresh Picks`

Rules:

- Existing endpoint safely refetch करे।
- Random reshuffle को AI refresh मत कहो।
- Excessive requests prevent करो।
- Loading केवल section पर हो।
- Previous valid results loading में unnecessarily disappear न हों।

### Feedback Controls

`Not Interested`, `Hide` या feedback control तभी add करो जब:

- Existing backend preference contract support करता हो।
- User authenticated हो।
- Ownership/RLS verified हो।

Backend support नहीं है तो fake visual-only feedback मत बनाओ।

### Loading State

- Four recommendation-card skeletons।
- Whole homepage blank spinner मत बनाओ।
- Layout shift कम हो।
- Old user की personalized cards loading में न दिखें।

### Auth Loading State

Message:

`Smart picks load ho rahe hain…`

Rules:

- Session resolve होने से पहले logged-out generic results flash न हों।
- Previous authenticated user का data flash न हो।
- Correct mode resolve होने पर render हो।

### Empty Personalized State

`Aapke liye recommendations banane ke liye abhi enough activity nahi hai.`

Actions:

- Explore Salons
- Browse Categories

Generic fallback दिखे तो clearly `Popular Picks` label हो।

### Empty Marketplace State

`Recommended salons abhi available nahi hain.`

Actions:

- View All Salons
- Explore Categories

Fake recommendations मत बनाओ।

### Error State

`Smart picks load nahi ho sake. Dobara try karein.`

Actions:

- Retry
- View All Salons

Raw Supabase error, RPC name, internal score या stack trace public UI में मत दिखाओ।

### Offline State

`Aap offline hain. Live recommendations update nahi ki ja sakti.`

Cached recommendations available हों तो:

- `Saved picks` label दिखाओ।
- Cached results को current/live recommendations मत बताओ।
- Live availability status unavailable mark करो।
- User-specific cache isolation preserve करो।

### Images

- Existing real salon cover images use करो।
- Missing image पर approved local fallback।
- Random remote/hotlinked image मत लगाओ।
- Broken-image fallback handle करो।
- Meaningful alt text हो।
- Project-compatible image optimization use करो।

### Responsive Layout

Desktop:

- 3 या 4-card grid।
- Recommendation reason readable हो।

Tablet:

- 2-card grid।
- Metadata clip न हो।

Mobile:

- 1-column cards preferred।
- Carousel use हो तो labelled accessible controls हों।
- Recommendation reason, rating और CTA readable हों।
- Horizontal overflow नहीं।
- Minimum 44×44px targets।

Sections 01–10 के existing design tokens और components reuse करो।

### Accessibility

- Semantic section और `<h2>`।
- Personalized/generic mode understandable text में हो।
- Recommendation reason screen reader को available हो।
- Cards keyboard accessible हों।
- Focus visible हो।
- Rating accessible label हो।
- Loading/error state live region में announce हो।
- Tooltip accessible हो।
- WCAG AA contrast target हो।
- Reduced motion respect हो।

### Performance

- Existing recommendation hooks reuse करो।
- Duplicate requests avoid करो।
- Unrelated state changes पर refetch मत करो।
- Stable keys use करो।
- Sorting/mapping memoize हो जहाँ useful हो।
- Images lazy-load हों।
- User/session change पर stale requests ignore/cancel हों।
- Previous session response current session को overwrite न करे।

### Analytics

Existing consented analytics system हो तभी limited events use करो:

- Section viewed
- Recommendation clicked
- CTA clicked

Raw user ID, exact coordinates या sensitive preference labels मत भेजो।

नया analytics vendor मत जोड़ो।

### No-Data-Loss Migration

1. Existing recommendation/For You section को inspect करो।
2. Duplicate Smart Picks section मत बनाओ।
3. Existing wrong-numbered Section 09 implementation को safely reuse करो।
4. Existing `useRecommendations()` preserve करो।
5. Existing `useCustomerSuggestions()` preserve करो।
6. `recommendationRows`, `personalized`, `favorites`, `ready` और `isPersonalized` preserve करो।
7. Recently-viewed consent behavior preserve करो।
8. Existing session/RLS boundaries preserve करो।
9. Shared SalonCard edit करने से पहले all call sites inspect करो।
10. Incorrect old MD/code delete मत करो।
11. कोई route, test, hook, consent state या feature delete मत करो।
12. Database, RPC, RLS या migration change मत करो।

### Do Not Change

- Sections 01–10 functionality
- Sections 12–18
- Salon details UI
- Six app dashboards
- Supabase auth/database/RLS/RPCs
- PWA redirects
- Back to Main Website
- Footer

### Implementation Process

1. Current branch और working tree inspect करो।
2. Existing Smart Picks/For You implementation locate करो।
3. Previous wrong Section 09 implementation inspect करो।
4. Recommendation hooks और response fields inspect करो।
5. Auth/session/logout behavior inspect करो।
6. Recently-viewed consent contract inspect करो।
7. Existing section को correct position 11 और ID `smart-picks` में reuse/upgrade करो।
8. Personalized, location और generic modes implement करो।
9. Truthful reasons and duplicate prevention implement करो।
10. Stale-session/cross-user protection verify करो।
11. Loading, auth-loading, empty, error and offline states implement करो।
12. Desktop/tablet/mobile/accessibility verify करो।
13. Recommendation isolation and fallback tests add/update करो।
14. Existing failures और new failures अलग report करो।

### Required Tests

Run:

- `npm run typecheck`
- `npm run lint`
- `npm run test:security`
- `npm run test:back-to-main`
- `npm run test:contracts`

Targeted verification:

- Logged-out generic mode
- Logged-in personalized mode
- Auth loading neutral state
- No cross-user leakage
- Logout clears personalized data
- Recently viewed only with consent
- Published salons only
- Duplicate salons removed
- Truthful recommendation reasons
- Stale request isolation
- Correct salon route
- Correct View All route
- No duplicate Smart Picks section

Production build केवल real configured public Supabase environment के साथ run करो। Fake key, service-role key या external AI API key use मत करो।

### Acceptance Criteria

- Correct `PHASE1_SECTION11.md` created है।
- Smart Picks correct position 11 पर है।
- Stable ID `smart-picks` है।
- Previous wrong-numbered implementation safely reused है।
- Duplicate Smart Picks section नहीं है।
- Public AI label actual technology से match करता है।
- Logged-out results falsely personalized नहीं हैं।
- Logged-in recommendations consented data use करती हैं।
- No cross-user leakage है।
- Recommendation reasons truthful हैं।
- Only published salons दिखते हैं।
- Loading/auth-loading/empty/error/offline states हैं।
- Desktop/tablet/mobile और accessibility pass हैं।
- Existing Sections 01–10 preserved हैं।
- No auth/database/RLS regression है।
- No file, route, data source, consent state या feature deleted है।
- No new test failure introduced हुआ।
