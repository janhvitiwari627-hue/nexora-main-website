> SUPERSEDED: Correct specification is PHASE1_SECTION10.md
>
> NUMBERING CORRECTION: Locked MEMORY.md order ke अनुसार "Jaipur's Top 5 Salons" Section 10 hai.
> Yeh PHASE1_SECTION08.md incorrect numbering ke saath create hua tha; isey delete NAHIN kiya gaya.
> Existing implementation (stable id `top-jaipur-salons`) as-is reused aur preserved hai — koi duplicate section nahin.

# NEXORA HOMEPAGE — PHASE 1 + SECTION 08

## SECTION 08: JAIPUR’S TOP 5 SALONS

### Goal

Real published Jaipur salons में से existing verified rating/review-ranking contract के आधार पर Top 5 salons दिखाने हैं।

Fake ranking, fake rating, fake review count, paid placement को organic rank की तरह दिखाना या बिना पर्याप्त data के “Jaipur का #1 salon” claim नहीं करना है।

### Section Position

1. Header
2. Hero
3. Smart Search
4. Aap Nexora Par Kya Karna Chahte Hain?
5. Beauty Categories
6. Nearby Shops
7. Open Now
8. Jaipur’s Top 5 Salons

### Section Content

Eyebrow:

TOP RATED IN JAIPUR

Heading:

Jaipur Ke Top 5 Salons

Supporting Copy:

Real customer ratings aur verified marketplace data ke आधार पर Jaipur के leading salons explore करें।

Main CTA:

Jaipur Ke Sabhi Salons Dekhein

### Ranking Data Contracts

Current repository के existing ranking contracts inspect और reuse करो:

- `useTopRated()`
- `topRatedRows`
- Existing `marketplace_top_rated` RPC, अगर उपलब्ध हो
- Existing Bayesian rating field
- Existing rating average
- Existing review count
- Existing booking count, केवल current ranking contract में शामिल हो तो
- Existing published/approved salon status
- Existing Jaipur city filter
- Existing salon detail route
- Existing marketplace ranking tests

नया parallel ranking system मत बनाओ जब तक existing contract genuinely missing न हो।

Database RPC, function, schema, RLS policy या migration Phase 1 में change मत करो।

### Ranking Truth Rules

Salon Top 5 में तभी eligible हो जब:

1. Salon published और publicly discoverable हो।
2. Salon city real data में Jaipur हो।
3. Rating aggregate valid हो।
4. Review count valid हो।
5. Existing ranking RPC/contract में salon eligible हो।
6. Salon archived, rejected या unpublished न हो।
7. Salon test/demo/placeholder record न हो, अगर existing data इसे identify करता है।

### Ranking Method

Priority:

1. Existing backend `marketplace_top_rated` ranking order
2. Existing Bayesian rating
3. Existing rating average plus review-count confidence
4. Stable deterministic tie-breaker

Frontend में simple raw rating sort से existing backend ranking replace मत करो।

Example problem:

- Salon A: 5.0 rating from 1 review
- Salon B: 4.8 rating from 250 reviews

Salon A को automatically rank #1 मत बनाओ यदि existing Bayesian/confidence ranking Salon B को ऊपर रखती है।

### Minimum Review Threshold

- Existing backend minimum-review rule inspect करो।
- Rule मौजूद हो तो preserve करो।
- Rule मौजूद नहीं हो तो frontend में arbitrary threshold invent मत करो।
- Low-review listing को misleading rank देने से बचने के लिए existing Bayesian value use करो।
- Final report में exact ranking field/method लिखो।

### Exactly Five Rule

- Five eligible salons उपलब्ध हों तो exactly 5 दिखाओ।
- केवल 3 real eligible salons हों तो 3 ही दिखाओ।
- Section भरने के लिए fake salons या lower-quality unpublished records मत जोड़ो।
- Heading/data state में honest copy use करो।

Insufficient data message:

`Jaipur ke available top-rated salons dikhaye ja rahe hain.`

### Rank Labels

Cards पर rank display:

- `#1`
- `#2`
- `#3`
- `#4`
- `#5`

Rules:

- Rank existing sorted response से आए।
- DOM order और visual rank match करें।
- Duplicate rank नहीं।
- Missing/invalid ranking पर fake number मत दिखाओ।
- “Best salon in Jaipur” जैसे absolute legal/marketing claims मत लिखो।

### Salon Cards

हर Top Salon card में available live data के अनुसार:

- Rank number
- Real salon cover image
- Salon name
- Business category
- Jaipur area/locality
- Real rating
- Real review count
- Starting price, अगर available हो
- Distance, अगर valid location available हो
- Open/Closed status, केवल real hours से
- Verified badge, केवल real existing verification contract के अनुसार
- `View Salon` CTA
- Optional `Book Now`, केवल existing booking route verified हो तो

### Rating Display

Valid rating example:

`4.8 ★ · 236 reviews`

Rules:

- Existing rating formatting utility reuse करो।
- Rating sensible precision में दिखाओ।
- Fake `5.0` fallback मत लगाओ।
- Missing rating पर:

  `No ratings yet`

लेकिन no-rating salon को Top 5 में include नहीं करना चाहिए, जब तक existing backend contract explicitly ऐसा करता हो।

### Review Count Rules

Correct grammar:

- `1 review`
- `2 reviews`

Verified-booking reviews available हों तो tooltip में explain कर सकते हो, लेकिन सभी reviews को verified मत कहो।

### Price Display

Valid price:

`Starts from ₹499`

Price unavailable:

`View services for pricing`

Fake starting price मत बनाओ।

### Distance Integration

- Section 06 का selected/detected location state reuse कर सकते हो।
- Valid coordinates available हों तभी distance दिखाओ।
- Missing coordinates पर:

  `Distance unavailable`

- Distance ranking का primary basis नहीं बने, जब तक user explicitly Nearest sort चुनता हो।
- Raw coordinates public UI या URL में expose मत करो।

### Open/Closed Status

- Section 07 का verified business-hours calculation reuse करो।
- Missing hours पर fake status मत दिखाओ।
- Safe fallback:

  `Timings unavailable`

- Top 5 rank current Open/Closed status से change नहीं होना चाहिए, जब तक existing ranking contract ऐसा न करे।

### Verified Badge

Tooltip में केवल backend-supported meaning दिखाओ।

Safe fallback:

`This salon profile is approved for publishing on Nexora.`

Unsupported claims मत करो:

- Government verified
- Licence verified
- Owner identity verified
- Documents verified

जब तक backend evidence न हो।

### Sponsored Content Rule

- Sponsored salon को organic Top 5 ranking में silently inject मत करो।
- Existing backend ranking sponsored placement include करता हो तो inspect करो।
- Sponsored placement दिखाना जरूरी हो तो स्पष्ट `Sponsored` label दो।
- Sponsored card को fake `#1` rank मत दो।
- Organic ranking और paid promotion visually distinguish हों।

### City Validation

- Salon city field normalize करके Jaipur match करो।
- Area name Jaipur होना city verification के बराबर नहीं है।
- Missing city salon को Jaipur Top 5 में blindly include मत करो।
- Jaipur spelling/casing normalization existing system के अनुसार हो।
- Outside-Jaipur salon इस section में नहीं दिखना चाहिए।

### Sorting and Tie-Breaking

Existing backend order first priority हो।

Backend stable order unavailable हो तो deterministic tie-break sequence:

1. Bayesian rating descending
2. Review count descending
3. Rating average descending
4. Existing booking/ranking signal, अगर approved contract में हो
5. Salon name या stable ID

Random sorting मत करो।

### Main CTA Route

`Jaipur Ke Sabhi Salons Dekhein` existing `/salons` route खोले।

Existing supported city and ranking parameters use करो।

Suggested example केवल current contract match होने पर:

`/salons?city=Jaipur&sort=rating`

Unknown parameter invent मत करो।

### Display Layout

Desktop:

- Rank #1 को slightly featured card बनाया जा सकता है।
- बाकी four cards balanced grid में।
- लेकिन #1 card बाकी listings को visually insignificant न बनाए।

Tablet:

- 2-column layout।
- Rank order visual flow में clear रहे।

Mobile:

- 1-column rank list preferred।
- DOM order #1 से #5 हो।
- Horizontal carousel use हो तो accessible controls जरूरी हैं।
- Rank, rating, area और CTA fold में readable हों।
- Horizontal page overflow नहीं।

### Image Rules

- Existing real salon cover images use करो।
- Missing image पर approved local fallback asset।
- Random remote/hotlinked image मत लगाओ।
- Broken image fallback handle करो।
- Meaningful alt text दो।
- Project-compatible image optimization use करो।
- Same generic image सभी salons पर मत दिखाओ।

### Loading State

- Five rank-card skeletons या available layout के matching skeletons।
- Heading तुरंत render हो।
- Fake rank/name skeleton text मत दिखाओ।
- Layout shift कम हो।
- Whole section blank spinner मत बनाओ।

### Empty State

अगर कोई eligible Jaipur salon नहीं है:

`Jaipur ke top-rated salons abhi available nahi hain.`

Actions:

- View All Jaipur Salons
- Explore Categories

Fake fallback salons मत बनाओ।

### Partial State

अगर five से कम eligible salons हैं:

`Available top-rated Jaipur salons`

- जितने real eligible salons हैं उतने दिखाओ।
- Missing ranks के placeholder cards मत दिखाओ।
- Section hide मत करो, अगर useful real data available है।

### Error State

Message:

Top-rated salons load nahi ho sake. Dobara try karein.

Actions:

- Retry
- View All Jaipur Salons

Raw Supabase error, RPC name, SQL message या stack trace public UI में मत दिखाओ।

### Offline State

Message:

Aap offline hain. Live rankings verify nahi ki ja sakti.

Cached results available हों तो:

- `Saved ranking` label दिखाओ।
- Cached result को current live ranking मत बताओ।
- Open Now और live availability status hide या mark unavailable करो।

### Accessibility

- Semantic section और `<h2>` heading।
- Ordered ranking के लिए semantic ordered list preferred।
- Rank केवल color या card size से communicate मत करो।
- Visible text rank हो।
- Salon cards keyboard accessible हों।
- Visible focus ring हो।
- Rating का accessible label हो, जैसे `4.8 out of 5`।
- Loading/error status live region में announce हो।
- Tooltip keyboard accessible हो।
- Color contrast WCAG AA target करे।
- Reduced-motion preference respect हो।

### Performance

- Existing `useTopRated()` hook reuse करो।
- Same rating data के duplicate requests avoid करो।
- Homepage पर maximum five cards render करो।
- Stable keys use करो।
- Images appropriately lazy-load हों।
- Featured first image only if above fold and beneficial हो तो priority load करो।
- Unnecessary reranking every render पर मत करो।

### No-Data-Loss Migration

Current homepage में existing Top Rated section और ranking hooks मौजूद हो सकते हैं।

Mandatory rules:

1. Existing Top Rated section को upgrade करो।
2. Duplicate Top 5 section मत बनाओ।
3. Existing `useTopRated()` preserve करो।
4. Existing `topRatedRows` preserve करो।
5. Existing backend ranking order preserve करो।
6. Existing rating/review aggregates preserve करो।
7. Shared salon-card component edit करने से पहले सभी call sites inspect करो।
8. Existing route/filter behavior preserve करो।
9. Existing section visibility/admin configuration preserve करो।
10. कोई file, hook, route, test, data source या feature delete मत करो।
11. Database, RPC, RLS या migration change मत करो।

### Do Not Change

- Sections 01–07
- Sections 09–18
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

1. Current branch और working tree inspect करो।
2. Existing Top Rated section locate करो।
3. `useTopRated()` and `topRatedRows` inspect करो।
4. Ranking RPC/order/fields inspect करो।
5. Jaipur city eligibility inspect करो।
6. `/salons` city/rating sort contract verify करो।
7. Existing section को stable `top-jaipur-salons` ID के साथ upgrade करो।
8. Real Top 5 ranking cards implement करो।
9. Sponsored/rank separation verify करो।
10. Rating, review, price, distance, hours and verification display wire करो।
11. Loading, empty, partial, error और offline states implement करो।
12. Desktop, tablet और mobile layouts verify करो।
13. Keyboard और screen-reader behavior verify करो।
14. Ranking, city, ties and route tests add/update करो।
15. Existing failures और इस change से आए failures अलग report करो।

### Required Tests

Run:

- `npm run typecheck`
- `npm run lint`
- `npm run test:security`
- `npm run test:back-to-main`
- `npm run test:contracts`

Relevant targeted tests:

- Only published salons eligible
- Only Jaipur salons eligible
- Backend ranking order preserved
- Five salons limit
- Fewer-than-five partial state
- Rating/review tie-breaking
- Missing rating excluded
- Sponsored content labelled
- Correct details route
- Correct View All route

Production build केवल real configured public Supabase environment variables के साथ run करो।

Fake anon key, placeholder credential या service-role key use मत करो।

### Manual Verification

- Exactly five eligible salons
- Fewer than five salons
- No eligible salons
- Jaipur-only eligibility
- Outside-Jaipur salon excluded
- Rank #1–#5 order
- Rating/review accuracy
- Tie handling
- Price and missing price
- Distance and missing distance
- Open/Closed and missing hours
- Verified tooltip
- Sponsored label
- View Salon route
- View All route
- Loading skeleton
- Empty state
- Partial state
- Error and Retry
- Offline state
- Desktop layout
- Tablet layout
- Mobile layout
- Keyboard order
- Screen-reader labels
- Sections 01–07 unchanged

### Acceptance Criteria

- Section correct order पर है।
- Stable ID `top-jaipur-salons` है।
- Only real published Jaipur salons eligible हैं।
- Existing ranking RPC/order reuse हुआ है।
- Five eligible salons होने पर exactly five दिखते हैं।
- Fewer than five होने पर fake cards नहीं बनते।
- Rank labels correct और unique हैं।
- Rating और review counts real हैं।
- Sponsored placement organic rank की तरह hidden नहीं है।
- Correct salon details routes काम करते हैं।
- Main CTA correct Jaipur salon results खोलता है।
- Loading state मौजूद है।
- Empty और partial states मौजूद हैं।
- Error/Retry state मौजूद है।
- Offline state honest है।
- Desktop/tablet/mobile pass है।
- Accessibility pass है।
- Existing ranking hooks/data preserved हैं।
- Existing Sections 01–07 preserved हैं।
- No auth/database/RLS/app regression है।
- No file, route, data source या feature deleted है।
- No new test failure introduced हुआ।
