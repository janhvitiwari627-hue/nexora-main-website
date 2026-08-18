# NEXORA HOMEPAGE — PHASE 1 + SECTION 10

> NUMBERING CORRECTION: Locked MEMORY.md order ke अनुसार "Jaipur's Top 5 Salons"
> Section 10 hai (earlier incorrect numbering PHASE1_SECTION08.md supersede karti hai —
> woh file delete nahin ki gayi, sirf SUPERSEDED note ke saath preserved hai).
> Existing implementation (stable id `top-jaipur-salons`, `useTopRated()` contract,
> rank cards, tests) as-is reused hai — koi duplicate section nahin banaya gaya.

## SECTION 10: JAIPUR'S TOP 5 SALONS

### Goal

Real published Jaipur salons में से existing verified ranking contract के आधार पर Top 5 salons दिखाने हैं।

Fake ranking, fake rating, fake reviews, fake bookings या sponsored salon को hidden organic rank की तरह नहीं दिखाना है।

### Content

Eyebrow:

TOP RATED IN JAIPUR

Heading:

Jaipur Ke Top 5 Salons

Supporting Copy:

Real ratings, customer reviews aur marketplace activity ke आधार पर Jaipur के leading salons explore करें।

Main CTA:

Jaipur Ke Sabhi Salons Dekhein

### Existing Contracts

Inspect and reuse:

- `useTopRated()`
- `topRatedRows`
- Existing `marketplace_top_rated` RPC
- Existing Bayesian rating
- Existing rating average
- Existing review count
- Existing completed-booking signal, केवल ranking contract में supported हो तो
- Existing published/active salon status
- Existing salon detail route
- Existing city and sort filters
- Existing ranking tests

Frontend में नया conflicting ranking algorithm मत बनाओ।

Database, RPC, schema, RLS या migration change मत करो।

### Eligibility

Salon तभी eligible हो जब:

1. Published और active हो।
2. Publicly discoverable हो।
3. Real city data Jaipur हो।
4. Valid rating/review data हो।
5. Existing ranking contract में eligible हो।
6. Archived, rejected या unpublished न हो।
7. Test/demo record existing metadata से identifiable हो तो exclude हो।

### Ranking Priority

1. Existing backend ranking order
2. Bayesian rating
3. Review-count confidence
4. Rating average
5. Completed-booking signal, केवल existing approved contract में हो तो
6. Stable deterministic tie-breaker

Raw rating average से backend ranking overwrite मत करो।

5.0 rating with one review को automatically 4.8 rating with hundreds of reviews से ऊपर मत रखो, यदि existing Bayesian ranking ऐसा नहीं करती।

### Five-Salon Rule

- Five eligible salons available हों तो exactly five दिखाओ।
- Five से कम eligible salons हों तो जितने real salons हैं उतने दिखाओ।
- Fake cards या unpublished salons से list पूरी मत करो।
- Empty rank placeholders मत बनाओ।

### Rank Labels

Display:

- #1
- #2
- #3
- #4
- #5

Rules:

- Rank sorted response order से आए।
- Duplicate rank नहीं।
- Visual और DOM order match करें।
- Absolute “Jaipur का सबसे best salon” claim मत करो।

### Salon Cards

हर card में available live data:

- Rank
- Real cover image
- Salon name
- Business category
- Jaipur area
- Real rating
- Real review count
- Starting price, अगर available हो
- Distance, अगर valid coordinates available हों
- Open/Closed status, real business hours से
- Verified badge, existing verification contract से
- View Salon CTA
- Optional Book Now, only verified route available हो तो

### Rating

Example:

`4.8 ★ · 236 reviews`

Rules:

- Fake 5.0 fallback मत लगाओ।
- Missing rating:

  `No ratings yet`

- No-rating salon को Top 5 में include मत करो, जब तक backend contract explicitly allow न करे।

### Price

Available:

`Starts from ₹499`

Unavailable:

`View services for pricing`

Fake price मत बनाओ।

### Distance

- Section 08 Nearby का selected/detected location state reuse करो।
- Valid coordinates होने पर distance दिखाओ।
- Missing coordinates:

  `Distance unavailable`

- Raw coordinates UI या URL में expose मत करो।
- Distance organic Top 5 rank का primary signal न बने।

### Open/Closed

- Section 09 Open Now का verified hours calculation reuse करो।
- Missing hours:

  `Timings unavailable`

- Current availability से Top 5 ranking बदलनी नहीं चाहिए, जब तक backend contract ऐसा न करे।

### Verified Badge

Safe tooltip:

`This salon profile is approved for publishing on Nexora.`

Backend evidence के बिना ये claims मत करो:

- Government verified
- Licence verified
- Owner identity verified
- Documents verified

### Sponsored Content

- Sponsored listing को silently organic Top 5 में inject मत करो।
- Sponsored placement दिखे तो clear `Sponsored` label हो।
- Sponsored salon को fake #1 rank मत दो।
- Existing backend response sponsored और organic data mix करता हो तो exact behavior inspect करो।

### City Validation

- Real salon city field Jaipur होना चाहिए।
- Area Jaipur का होने मात्र से city verification complete मत मानो।
- Missing city salon को blindly include मत करो।
- Case/spelling normalization existing system के अनुसार हो।
- Outside-Jaipur salon exclude हो।

### CTA Route

`Jaipur Ke Sabhi Salons Dekhein` existing supported route खोले।

Expected behavior:

- City = Jaipur
- Sort = existing top-rated/rating contract

Suggested URL केवल current contract support करे तो:

`/salons?city=Jaipur&sort=rating`

Unsupported parameter invent मत करो।

### Loading

- Five card-shaped skeletons।
- Heading तुरंत render हो।
- Layout shift कम हो।
- Whole section blank spinner मत बनाओ।

### Partial State

Five से कम salons:

`Available top-rated Jaipur salons`

- केवल real eligible salons दिखाओ।
- Fake rank placeholders नहीं।

### Empty State

`Jaipur ke top-rated salons abhi available nahi hain.`

Actions:

- View All Jaipur Salons
- Explore Categories

### Error State

`Top-rated salons load nahi ho sake. Dobara try karein.`

Actions:

- Retry
- View All Jaipur Salons

Raw Supabase error, RPC name, SQL या stack trace public UI में मत दिखाओ।

### Offline State

`Aap offline hain. Live rankings verify nahi ki ja sakti.`

Cached results available हों तो:

- `Saved ranking` label दिखाओ।
- Cached ranking को current live rank मत बताओ।
- Live Open/Closed status hide या unavailable mark करो।

### Images

- Real salon cover images use करो।
- Missing image पर approved local fallback।
- Random remote/hotlinked image मत लगाओ।
- Broken-image fallback हो।
- Meaningful alt text हो।
- Project-compatible optimization use करो।

### Responsive Layout

Desktop:

- #1 featured हो सकता है।
- बाकी four cards balanced layout में।
- सभी salons readable रहें।

Tablet:

- Two-column layout।
- Rank order clear हो।

Mobile:

- One-column ordered list।
- DOM order #1 से #5 हो।
- Rank, rating, area और CTA readable हों।
- Horizontal overflow नहीं।
- Minimum 44×44px targets।

### Accessibility

- Semantic section और `<h2>`।
- Ranking के लिए ordered list preferred।
- Rank visible text में हो।
- Rating accessible label हो: `4.8 out of 5`।
- Keyboard focus visible हो।
- Tooltip accessible हो।
- Loading/error live region में announce हो।
- WCAG AA contrast target हो।
- Reduced motion respect हो।

### Performance

- Existing `useTopRated()` reuse करो।
- Duplicate ranking requests मत बनाओ।
- Maximum five cards render करो।
- Stable keys use करो।
- Images appropriately lazy-load हों।
- Ranking calculation unnecessary हर render पर न चले।

### No-Data-Loss Rules

1. Existing Top Rated/Top 5 implementation को reuse करो।
2. Duplicate section मत बनाओ।
3. Existing `useTopRated()` preserve करो।
4. Existing `topRatedRows` preserve करो।
5. Existing backend order preserve करो।
6. Existing rating/review data preserve करो।
7. Shared SalonCard edit करने से पहले सभी call sites inspect करो।
8. Existing visibility/admin configuration preserve करो।
9. Incorrectly numbered previous MD/code delete मत करो।
10. कोई file, hook, route, test या feature delete मत करो।

### Do Not Change

- Sections 01–09 functionality
- Section 11 AI Smart Picks
- Sections 12–18
- Salon details UI
- Six app dashboards
- Supabase auth/database/RLS/RPCs
- PWA redirects
- Back to Main Website
- Footer

### Required Tests

Run:

- `npm run typecheck`
- `npm run lint`
- `npm run test:security`
- `npm run test:back-to-main`
- `npm run test:contracts`

Targeted verification:

- Published-only salons
- Jaipur-only salons
- Backend ranking preserved
- Exactly five limit
- Fewer-than-five state
- Stable tie-breaking
- Missing rating handling
- Sponsored separation
- Correct salon routes
- Correct View All route
- No duplicate Top 5 section

Production build केवल real configured public Supabase environment के साथ run करो। Fake key या service-role key use मत करो।

### Acceptance Criteria

- `PHASE1_SECTION10.md` created है।
- Section correct position 10 पर है।
- Stable ID `top-jaipur-salons` है।
- Existing Top 5 implementation safely reused है।
- Duplicate Top 5 section नहीं है।
- Only real published Jaipur salons दिखते हैं।
- Existing ranking order preserved है।
- Exactly five limit काम करता है।
- Fake ranks/ratings/reviews नहीं हैं।
- Sponsored content clearly labelled है।
- Loading, partial, empty, error और offline states हैं।
- Desktop/tablet/mobile और accessibility pass हैं।
- Sections 01–09 data/functionality preserved हैं।
- No database/auth/RLS regression है।
- No new failure introduced हुआ।
