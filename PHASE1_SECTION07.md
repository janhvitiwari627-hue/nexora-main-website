# NEXORA HOMEPAGE — PHASE 1 + SECTION 07

## SECTION 07: OPEN NOW

### Goal

User को केवल वे real published salons दिखाने हैं जो current day, current time और existing salon-hours data के अनुसार वास्तव में open हैं।

Fake Open Now badge, missing hours पर assumed availability, hardcoded salon, random timing या fake closing time नहीं दिखानी है।

### Section Position

1. Header
2. Hero
3. Smart Search
4. Aap Nexora Par Kya Karna Chahte Hain?
5. Beauty Categories
6. Nearby Shops
7. Open Now

### Section Content

Eyebrow:

AVAILABLE NOW

Heading:

Abhi Open Salons

Supporting Copy:

Current salon timings ke hisaab se abhi available salons explore karein.

Main CTA:

Sabhi Open Salons Dekhein

### Existing Data Contracts

Current repository inspect करके existing contracts reuse करो:

- Published salon data
- Existing salon-hours data
- Existing `useNearby()` or relevant discovery hook
- Existing salon cards
- Existing `/salons` filters
- Existing location state
- Existing timezone/date utilities
- Existing `Open Now` filtering logic, अगर मौजूद हो
- Existing salon detail routes

नया parallel salon-hours system मत बनाओ।

Database table, RPC, RLS policy, timezone configuration या migration change मत करो।

### Open Now Truth Rule

Salon को `Open Now` तभी दिखाओ जब:

1. Salon published/approved है।
2. Current weekday के लिए valid working-hours record मौजूद है।
3. Salon उस दिन closed/holiday marked नहीं है।
4. Current time opening और closing interval के अंदर है।
5. Current timezone correctly `Asia/Kolkata` resolve हो रही है।
6. Special closure/override data existing system में उपलब्ध हो तो उसका सम्मान हो।
7. Record invalid या incomplete नहीं है।

इनमें से कोई condition verify न हो तो salon को Open Now claim मत करो।

### Timezone Rules

- Calculation `Asia/Kolkata` timezone में हो।
- Browser की गलत local timezone पर blindly depend मत करो।
- Server/client hydration mismatch avoid करो।
- Current time live update हो।
- Minute boundary पर status safely refresh हो।
- हर second unnecessary rerender मत करो।
- Timezone label public UI में केवल जरूरत होने पर दिखाओ।

### Business Hours Rules

Support existing data contract के अनुसार:

- Normal daily hours
- Multiple shifts, अगर backend support करता है
- Lunch/break interval, अगर data available है
- Closed day
- Special holiday closure, अगर data available है
- Midnight-crossing schedule
- 24-hour schedule, अगर validly supported है

Backend support न होने पर unsupported schedule behavior invent मत करो।

### Midnight-Crossing Hours

Example:

`8:00 PM – 2:00 AM`

ऐसे schedule को केवल current date comparison से incorrectly closed मत मानो।

Previous day interval और current day interval safely evaluate करो।

### Missing Hours

Hours missing हों तो:

- Open Now badge मत दिखाओ।
- Fake Open/Closed status मत बनाओ।
- Safe label:

  `Timings unavailable`

### Invalid Hours

Malformed opening/closing value मिलने पर:

- Page crash मत होने दो।
- Listing को Open Now results से exclude करो।
- Raw invalid data visitor को मत दिखाओ।
- Development-safe logging existing project convention के अनुसार हो।

### Open Now Cards

हर card में available live data के अनुसार:

- Real salon cover image
- Salon name
- Business category
- Area/locality
- `Open Now` status badge
- Real closing time
- Rating and review count
- Starting price, अगर available हो
- Distance, अगर valid user/salon coordinates available हों
- `View Salon` CTA
- Optional `Book Now`, केवल existing booking route verified हो तो

### Closing-Time Copy

Valid close time available हो तो:

`Open until 8:30 PM`

Midnight crossing:

`Open until 2:00 AM`

Closing time unavailable हो तो approximate time invent मत करो।

### Closing Soon State

Current time closing time के 30–60 minutes अंदर हो तो optional label:

`Closing Soon`

लेकिन:

- Threshold consistent और documented हो।
- Fake urgency animation मत लगाओ।
- Countdown timer जरूरी नहीं।
- User को pressure करने वाली misleading copy मत लिखो।

### Reopening Copy

Closed salons इस section में normally नहीं दिखने चाहिए।

अगर fallback state में closed salons दिखाए जाते हैं तो real next-opening data के बिना:

`Opens at 10:00 AM`

जैसा claim मत करो।

### Location Integration

Section 06 की selected/detected location reuse करो।

- Location permission दोबारा automatically मत माँगो।
- Selected Jaipur area preserve करो।
- GPS allowed हो तो nearest open salons rank कर सकते हो।
- GPS unavailable हो तो Jaipur/selected area के open salons दिखाओ।
- Raw coordinates URL या UI में expose मत करो।
- Open Now calculation location permission पर निर्भर नहीं होनी चाहिए।

### Sorting

Default order:

1. Open and nearest, अगर valid distance available है
2. Better rating
3. More reviews
4. Existing marketplace ranking

लेकिन existing product ranking contract available हो तो उसे preserve करो।

Sponsored placement को organic Open Now ranking की तरह hide मत करो।

### Filters

Section में compact filters:

- Nearest
- Top Rated
- Price
- Unisex
- Women
- Men

Open Now already mandatory filter है।

Rules:

- Real supported fields पर filtering करो।
- Missing distance listing को nearest मत मानो।
- Missing rating को high-rated मत मानो।
- Missing price पर fake price band मत लगाओ।
- Gender values existing contract के अनुसार normalize करो।
- Active filters visible हों।
- `Clear All` action हो।
- Open Now mandatory state Clear All से remove न हो; यह section का core rule है।

### Main CTA Route

`Sabhi Open Salons Dekhein` existing `/salons` route खोले।

Existing supported Open Now parameter use करो।

Suggested example केवल तभी use करो जब current contract यही हो:

`/salons?open=true`

Selected supported state preserve करो:

- City
- Area
- Distance sort
- Rating
- Price
- Gender

Unknown URL parameters invent मत करो।

### Display Limit

- Homepage पर maximum 4–6 open salons।
- Remaining results main CTA से `/salons` में खुलें।
- Unbounded live list homepage पर मत दिखाओ।
- Duplicate salon cards avoid करो।

### Real-Time Refresh

- Current time change होने पर Open Now results safely refresh हों।
- Salon closing time pass होने पर stale Open Now badge indefinitely न रहे।
- Efficient interval use करो, preferably minute-level।
- Component unmount पर interval cleanup करो।
- Duplicate timers मत बनाओ।
- Background tab में unnecessary heavy work मत करो।

### Loading State

- 3–4 salon-card skeletons।
- Heading और selected area तुरंत render हों।
- Skeleton card dimensions real cards के करीब हों।
- Whole section blank spinner मत बनाओ।
- Layout shift कम हो।

### Empty State

अगर current area में कोई salon open नहीं है:

`Is area mein abhi koi salon open nahi hai.`

Actions:

- View All Salons
- Change Area
- Check Nearby Shops

Empty state में closed salon को Open Now badge के साथ मत दिखाओ।

### Filtered Empty State

`Selected filters ke saath abhi koi open salon nahi mila.`

Actions:

- Clear Filters
- Change Area
- View All Salons

### Missing-Hours Empty State

अगर listings मौजूद हैं लेकिन verified timings उपलब्ध नहीं:

`Verified salon timings abhi available nahi hain.`

CTA:

`Sabhi Salons Dekhein`

Public UI में database/admin instructions मत दिखाओ।

### Error State

Message:

Open salons load nahi ho sake. Dobara try karein.

Actions:

- Retry
- View All Salons

Raw Supabase error, table name, RPC name, stack trace या environment details public UI में मत दिखाओ।

### Offline State

Message:

Aap offline hain. Live Open Now status verify nahi kiya ja sakta.

Rules:

- Cached Open Now badge को current live status की तरह मत दिखाओ।
- Cached salon cards दिखें तो `Saved results` label हो।
- Availability badge hide या `Status unavailable offline` दिखाओ।
- Offline state में misleading timing claim मत करो।

### Image Rules

- Existing real salon cover images use करो।
- Missing image पर approved local fallback asset।
- Random remote/hotlinked image मत लगाओ।
- Broken image fallback handle करो।
- Meaningful alt text दो।
- Project-compatible image optimization use करो।

### Verified Badge

अगर salon card पर Verified badge दिखता है:

- Existing backend publishing/verification contract follow करो।
- Tooltip accessible हो।
- Unsupported licence, identity या government-approval claim मत करो।
- Safe fallback:

  `This salon profile is approved for publishing on Nexora.`

### Responsive Layout

Desktop:

- 3 या 4-card grid।
- Heading, location और filters aligned हों।
- Closing-time label readable हो।

Tablet:

- 2-card grid।
- Filters clean wrap हों।
- Text और CTA clipping न हो।

Mobile:

- 1-column card layout preferred।
- Status badge और closing time readable हों।
- Filters accessible drawer या wrapped chips में।
- Minimum 44×44px targets।
- Horizontal page overflow नहीं।
- Sticky Header के लिए correct scroll margin हो।

Sections 01–06 के existing design tokens, typography, spacing, radii और components reuse करो।

नया unrelated visual system मत बनाओ।

### Accessibility

- Semantic section और `<h2>` heading।
- Salon cards semantic article/link हों।
- Open status केवल color से communicate मत करो।
- Visible text label भी हो।
- Filter controls properly labelled हों।
- Keyboard focus visible हो।
- Screen-reader status understandable हो।
- Loading/error state live region में announce हो।
- Tooltip keyboard accessible हो।
- Color contrast WCAG AA target करे।
- Reduced-motion preference respect हो।

### Performance

- Existing salon data hook reuse करो।
- Same salon/hours data के duplicate requests avoid करो।
- Business-hours calculation memoize हो जहाँ useful हो।
- One timer per card मत बनाओ।
- Shared minute-level clock preferred है।
- Homepage पर केवल limited cards render करो।
- Images lazy-load हों, first visible asset को छोड़कर।

### No-Data-Loss Migration

Current homepage में existing Open Now markup, salon-hours logic या discovery data मौजूद हो सकता है।

Mandatory rules:

1. Existing Open Now section मिले तो उसी को upgrade करो।
2. Duplicate Open Now section मत बनाओ।
3. Existing salon-hours data source preserve करो।
4. Existing salon data hooks preserve करो।
5. Existing route/filter behavior preserve करो।
6. Existing shared SalonCard edit करने से पहले सभी call sites inspect करो।
7. Existing Nearby location state reuse करो।
8. Existing working-hours values transform करते समय original data mutate मत करो।
9. किसी file, hook, route, test, data source या feature को delete मत करो।
10. Database, RPC, RLS या migration change मत करो।

### Do Not Change

- Section 01 Header
- Section 02 Hero
- Section 03 Smart Search
- Section 04 six-app grid
- Section 05 Categories
- Section 06 Nearby Shops
- Sections 08–18
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

1. Current working tree और uncommitted changes inspect करो।
2. Existing Open Now markup/data logic locate करो।
3. Salon-hours schema and available fields inspect करो।
4. Existing timezone utilities inspect करो।
5. `/salons` Open Now filter parameter verify करो।
6. Open status calculation के edge cases map करो।
7. Existing section को stable `open-now` ID के साथ upgrade करो।
8. Truthful Open Now and closing-time display implement करो।
9. Section 06 location state integrate करो।
10. Supported filters और CTA route implement करो।
11. Loading, empty, filtered-empty, error और offline states implement करो।
12. Efficient minute-level refresh implement करो।
13. Desktop, tablet और mobile layouts verify करो।
14. Keyboard और screen-reader behavior verify करो।
15. Relevant time, timezone, filter और route tests add/update करो।
16. Existing failures और नए failures अलग report करो।

### Required Tests

Run:

- `npm run typecheck`
- `npm run lint`
- `npm run test:location`
- `npm run test:security`
- `npm run test:back-to-main`
- `npm run test:contracts`

Relevant targeted tests भी run करो:

- Current weekday hours
- Before opening
- Exactly at opening
- During open interval
- Exactly at closing
- Closed day
- Missing hours
- Invalid hours
- Midnight-crossing schedule
- Asia/Kolkata timezone
- Offline availability honesty

Production build केवल real configured public Supabase environment variables के साथ run करो।

Fake anon key, placeholder credential या service-role key use मत करो।

### Manual Verification

- Real open salon
- Closed salon excluded
- Missing hours excluded
- Invalid hours handled
- Open-until time
- Closing Soon state
- Midnight-crossing hours
- Default Jaipur
- Selected area
- GPS location reuse
- Nearest sorting
- Rating filter
- Price filter
- Gender filter
- Clear All
- View All route
- Loading skeleton
- Empty state
- Filtered empty state
- Error and Retry
- Offline status honesty
- Desktop layout
- Tablet layout
- Mobile layout
- Keyboard navigation
- Screen-reader labels
- Sections 01–06 unchanged

### Acceptance Criteria

- Section correct order पर है।
- Stable ID `open-now` है।
- केवल genuinely open salons दिखते हैं।
- `Asia/Kolkata` timezone safely use होती है।
- Missing/invalid hours पर fake status नहीं है।
- Midnight-crossing schedule safely handled है।
- Closing time real data से है।
- Location state Section 06 से reuse होती है।
- Filters functional हैं।
- Main CTA correct filtered `/salons` route खोलता है।
- Loading state मौजूद है।
- Empty state मौजूद है।
- Error/Retry state मौजूद है।
- Offline state misleading नहीं है।
- Desktop/tablet/mobile pass है।
- Accessibility pass है।
- Existing salon-hours/data hooks preserved हैं।
- Existing Sections 01–06 preserved हैं।
- No auth/database/RLS/app regression है।
- No file, route, data source या feature deleted है।
- No new test failure introduced हुआ।
