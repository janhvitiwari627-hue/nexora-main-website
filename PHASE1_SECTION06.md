# NEXORA HOMEPAGE — PHASE 1 + SECTION 06

## SECTION 06: NEARBY SHOPS

### Goal

User को उसकी selected या detected location के आधार पर nearby published salons और beauty shops दिखानी हैं।

Distance, rating, price, gender और Open Now filtering functional होनी चाहिए।

GPS unavailable या denied होने पर Jaipur fallback और manual area selection काम करना चाहिए।

Fake salon, fake distance, fake rating, fake price, fake availability या hardcoded listing नहीं दिखानी है।

### Section Position

1. Header
2. Hero
3. Smart Search
4. Aap Nexora Par Kya Karna Chahte Hain?
5. Beauty Categories
6. Nearby Shops

### Section Content

Eyebrow:

NEAR YOU

Heading:

Aapke Paas Ke Salons

Supporting Copy:

Apni location ya selected area ke aas-paas available salons, services aur prices explore karein.

Main CTA:

Sabhi Nearby Salons Dekhein

### Existing Data Contracts

Current repository के existing location और salon-discovery contracts inspect और reuse करो:

- `useLocation()`
- `useNearby()`
- `useNearbySalons()`
- `nearbyRows`
- `nearbyBuckets`
- `nearbyRanked`
- Existing on-device Haversine ranking
- Existing published salon data
- Existing salon statistics
- Existing `/salons` filters
- Existing salon detail routes
- Existing Jaipur zones/areas

नया conflicting GPS, distance या location system मत बनाओ।

### Default Location State

- Page load पर GPS permission automatically request मत करो।
- Default location `Jaipur` दिखाओ।
- इसे detected location की तरह falsely present मत करो।
- Label स्पष्ट हो कि Jaipur default location है।
- User manual city या area बदल सके।
- Section GPS permission के बिना भी usable रहे।

### GPS Permission Flow

GPS permission केवल user के explicit action पर माँगो।

Action label:

Use My Current Location

Permission request से पहले user को कारण बताओ:

Nearby salons aur distance dikhane ke liye location access use hoga.

### GPS Detecting State

Message:

Location detect ho rahi hai…

Rules:

- Compact loading indicator दिखाओ।
- Infinite loader मत दिखाओ।
- Multiple permission requests trigger मत करो।
- Detecting के दौरान existing Jaipur results गायब मत करो।

### GPS Allowed State

- Existing location hook से valid coordinates use करो।
- Existing Haversine system से real distance calculate करो।
- Nearest published salons ascending distance में दिखाओ।
- Raw latitude/longitude public UI में मत दिखाओ।
- Precise coordinates URL में मत डालो।
- User coordinates database में save मत करो, जब तक existing consented flow ऐसा नहीं करता।
- Invalid salon coordinates को nearest मत मानो।

### GPS Denied State

Message:

Location permission nahi mili. Jaipur ke salons dikhaye ja rahe hain — aap area manually change kar sakte hain.

Actions:

- Select Area
- Continue with Jaipur

Rules:

- Section block मत करो।
- Permission popup बार-बार trigger मत करो।
- Manual city/area selector prominent हो।
- Denied state को error/crash की तरह treat मत करो।

### GPS Timeout or Unavailable State

Message:

Current location detect nahi ho saki. Jaipur se results dikhaye ja rahe hain.

Actions:

- Retry Location
- Select Area Manually
- Continue with Jaipur

Rules:

- Infinite loader मत दिखाओ।
- Search और salon cards usable रहें।
- Retry user action पर ही GPS दोबारा request करे।

### Outside-Jaipur State

- Detected location को Jaipur मत बताओ।
- Supported marketplace data उपलब्ध हो तो actual detected location के results दिखाओ।
- Marketplace अभी Jaipur-only हो तो honest fallback message दिखाओ:

  `Aapki current location Jaipur se bahar hai. Filhaal Jaipur ke available salons dikhaye ja rahe hain.`

- User manual Jaipur area चुन सके।
- Future city expansion के लिए architecture-ready selector रखो।
- Unsupported city के fake results मत बनाओ।

### Manual City and Area Selection

- Existing Jaipur zones और areas reuse करो।
- Existing `JAIPUR_ZONES` data duplicate मत करो।
- City और area selection accessible हो।
- Selected location section heading/status में दिखे।
- Area change पर nearby results update हों।
- Selected area `/salons` CTA route में preserve हो।
- Invalid area manually inject न हो सके।

### Nearby Salon Cards

हर salon card में available live data के अनुसार:

- Real salon cover image
- Salon/shop name
- Business category
- Area/locality
- Real calculated distance
- Real rating
- Real review count
- Starting price, अगर available हो
- Gender category, अगर available हो
- Open/Closed status, अगर real hours available हों
- Verified badge, केवल existing verification contract के अनुसार
- `View Salon` CTA
- Optional `Book Now` CTA, केवल existing booking route verified हो तो

Card click:

- Existing `/salons/:slug` contract use करे।
- Browser back/forward काम करे।
- Direct navigation और hard refresh काम करें।
- Missing slug पर broken URL मत बनाओ।

### Distance Rules

- Distance केवल valid user location और valid salon coordinates से दिखाओ।
- Missing coordinates पर fake `0 km` मत दिखाओ।
- Random distance मत बनाओ।
- Safe fallback label:

  `Distance unavailable`

- Display examples:

  `850 m away`  
  `1.8 km away`

- Nearby sorting numeric real distance से हो।
- Missing-distance listings को nearest position पर मत रखो।
- Distance rounding consistent हो।
- Exact coordinates public UI में expose मत करो।

### Rating Rules

- Existing real rating aggregate use करो।
- Existing review count use करो।
- Missing rating पर fake `5.0` मत दिखाओ।
- No rating state:

  `No ratings yet`

- Rating filter missing ratings को incorrectly high-rated न माने।

### Price Rules

- Existing starting price data use करो।
- Price available हो तो:

  `Starts from ₹499`

- Missing price पर fake amount मत दिखाओ।
- Safe fallback:

  `View services for pricing`

- Currency formatting existing utility से हो।
- Price filter only supported live data पर apply हो।

### Open/Closed Rules

- Current weekday, local time और real salon-hours data से calculate करो।
- Timezone existing contract के अनुसार `Asia/Kolkata` हो।
- Hours unavailable हों तो:

  `Hours unavailable`

- Missing hours पर `Open Now` मत दिखाओ।
- Midnight-crossing schedule safely handle करो।
- Open Now filter केवल real active schedule पर apply हो।
- Backend data के बिना approximate availability मत बनाओ।

### Verified Badge

Verified badge पर hover, focus और click tooltip होना चाहिए।

Tooltip में केवल existing backend द्वारा confirmed meaning लिखो।

Owner ID, licence, documents या government approval का claim बिना backend evidence मत करो।

Exact verification meaning unavailable हो तो safe copy:

This salon profile is approved for publishing on Nexora.

Rules:

- Tooltip keyboard accessible हो।
- Mobile पर tap से open/close हो।
- Outside click और Escape से close हो।
- Badge केवल verified/approved record पर दिखे।
- हर salon को automatically verified मत दिखाओ।

### Filters

Section में instant filters:

- Distance
- Rating
- Price range
- Gender: Unisex / Men / Women
- Open Now

### Distance Filter

Supported options existing product contract के अनुसार:

- Nearest
- Within 2 km
- Within 5 km
- Within 10 km

User location unavailable होने पर distance-radius filters disable हों और reason दिखे।

### Rating Filter

Suggested options:

- 4.5+
- 4.0+
- 3.5+

Real rating aggregate पर apply हो।

### Price Filter

Existing price data के अनुसार safe bands use करो।

Fake universal price bands मत बनाओ। Existing `/salons` filter contract inspect करो।

### Gender Filter

Options:

- All
- Unisex
- Women
- Men

Existing `gender_category` values normalize करो। Unknown value delete मत करो; `Other`/neutral handling use करो।

### Open Now Filter

- केवल real salon-hours data पर apply हो।
- Hours unavailable listings Open Now results में शामिल न हों।

### Filter Actions

- Apply Filters
- Clear All
- Active filter count

Rules:

- Desktop पर compact popover/panel।
- Mobile पर accessible drawer/bottom sheet।
- Filter state clear और reversible हो।
- Smart Search और `/salons` parameter contract से conflict न करे।
- Unsupported URL parameters invent मत करो।

### Section CTA Route

`Sabhi Nearby Salons Dekhein` existing `/salons` route खोले।

Selected state preserve करो:

- City
- Area
- Supported distance sort/filter
- Rating
- Price
- Gender
- Open Now

Existing parameter names use करो। Fake parameter names मत बनाओ।

### Display Limit

- Homepage पर maximum 4–6 nearby salon cards।
- Remaining results CTA से `/salons` में खुलें।
- Large unbounded list homepage पर render मत करो।
- Existing live order और distance ranking preserve करो।

### Loading State

- 3–4 salon-card skeletons दिखाओ।
- Section heading और location controls तुरंत render हों।
- Skeleton real cards के dimensions के करीब हो।
- Layout shift कम हो।
- Whole page blank spinner मत बनाओ।

### Empty State

Message:

Is area mein abhi koi salon nahi mila.

Actions:

- Change Area
- Clear Filters
- View All Salons

Empty state में fake salon cards मत दिखाओ।

### Filtered Empty State

Message:

In filters ke saath koi salon nahi mila.

Actions:

- Clear Filters
- Change Area
- View All Salons

### Error State

Message:

Nearby salons load nahi ho sake. Dobara try karein.

Actions:

- Retry
- Select Area
- View All Salons

Raw Supabase error, RPC name, environment variable या stack trace public UI में मत दिखाओ।

### Offline State

Message:

Aap offline hain. Live nearby results ke liye internet connection check karein.

Cached listings available हों तो:

- `Saved results` label दिखाओ।
- Cached results को live मत बताओ।
- Stale availability/Open Now status hide या clearly mark करो।

### Salon Image Rules

- Existing real salon cover images use करो।
- Missing image पर approved local fallback asset use करो।
- Random remote या hotlinked salon image मत लगाओ।
- Broken image fallback handle करो।
- Meaningful alt text दो।
- Project-compatible image optimization use करो।
- Image crop में salon content unreadable या distorted न हो।

### Responsive Layout

Desktop:

- 3 या 4-card grid।
- Location status और filters section heading के साथ aligned हों।
- Cards equal height और readable हों।

Tablet:

- 2-card grid।
- Filters readable wrap हों।
- Location selector compress होकर unusable न हो।

Mobile:

- 1-column cards preferred।
- Horizontal card list use हो तो accessible controls जरूरी हैं।
- Filter button minimum 44×44px हो।
- Text, image और CTA clipping नहीं।
- Page horizontal overflow नहीं।
- Section scroll margin sticky Header के अनुसार हो।

Sections 01–05 के existing colors, typography, spacing, radii और components reuse करो। नया unrelated design system मत बनाओ।

### Accessibility

- Semantic `<section>` use करो।
- Section heading `<h2>` हो।
- Salon cards semantic article/link हों।
- Filters properly labelled हों।
- Keyboard tab order visual order से match करे।
- Visible focus ring हो।
- Verified tooltip keyboard accessible हो।
- Location status polite live region में हो।
- Loading/error status announce हो।
- Color contrast WCAG AA target करे।
- Reduced-motion preference respect हो।
- Drawer/modal focus trap और return focus सही हो।

### No-Data-Loss Migration

Current homepage में existing Nearby section और location hooks मौजूद हो सकते हैं।

Mandatory rules:

1. Existing Nearby section को upgrade करो।
2. Duplicate Nearby section मत बनाओ।
3. Existing `useLocation()` preserve करो।
4. Existing `useNearby()` preserve करो।
5. Existing `useNearbySalons()` preserve करो।
6. Existing `nearbyRows`, `nearbyBuckets` और `nearbyRanked` behavior preserve करो।
7. Existing Haversine ranking delete/replace मत करो।
8. Existing published salon query preserve करो।
9. Shared salon-card component edit करने से पहले सभी call sites inspect करो।
10. कोई existing file, route, hook, data source, test या feature delete मत करो।
11. Database table, RPC, RLS policy या migration change मत करो।

### Do Not Change

- Section 01 Header
- Section 02 Hero
- Section 03 Smart Search
- Section 04 six-app grid
- Section 05 Categories
- Sections 07–18
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
2. Existing Nearby section locate करो।
3. Existing location and nearby hooks inspect करो।
4. Current salon coordinate, hours, rating, price और gender fields map करो।
5. Existing `/salons` filter/query contract verify करो।
6. Existing section को stable `nearby-shops` ID के साथ upgrade करो।
7. Real distance ranking और manual location fallback connect करो।
8. Supported filters implement करो।
9. Verified badge tooltip implement करो।
10. Loading, empty, filtered-empty, error और offline states implement करो।
11. Desktop, tablet और mobile layouts verify करो।
12. Keyboard और screen-reader behavior verify करो।
13. Relevant location, filter, route और fallback tests add/update करो।
14. Existing failures और इस change से आए failures अलग report करो।

### Required Tests

Run:

- `npm run typecheck`
- `npm run lint`
- `npm run test:location`
- `npm run test:security`
- `npm run test:back-to-main`
- `npm run test:contracts`

Production build केवल real configured public Supabase environment variables के साथ run करो।

Fake anon key, placeholder credential या service-role key use मत करो।

### Manual Verification

- Default Jaipur state
- Manual city/area selection
- GPS allowed
- GPS denied
- GPS timeout
- GPS unavailable
- Outside-Jaipur fallback
- Real distance
- Missing distance
- Rating and review count
- Price and missing price
- Open/Closed and missing hours
- Verified badge tooltip
- Distance filter
- Rating filter
- Price filter
- Gender filter
- Open Now filter
- Clear All
- Loading skeleton
- Empty state
- Filtered-empty state
- Error and Retry
- Offline state
- Desktop layout
- Tablet layout
- Mobile layout
- Keyboard navigation
- Screen-reader labels
- Sections 01–05 unchanged

### Acceptance Criteria

- Section correct order पर है।
- Stable ID `nearby-shops` है।
- GPS automatically request नहीं होता।
- Default Jaipur state honest है।
- GPS allowed flow functional है।
- GPS denied fallback functional है।
- GPS unavailable fallback functional है।
- Outside-Jaipur state honest है।
- Manual area selector काम करता है।
- Salon cards real published data use करते हैं।
- Fake distance/rating/price/hours नहीं हैं।
- Supported filters functional हैं।
- Verified tooltip backend truth से match करता है।
- Loading state मौजूद है।
- Empty state मौजूद है।
- Error और Retry state मौजूद है।
- Offline state मौजूद है।
- Desktop/tablet/mobile pass है।
- Accessibility pass है।
- Existing location and nearby hooks preserved हैं।
- Existing Sections 01–05 preserved हैं।
- No auth/database/RLS/app regression है।
- No file, feature, route या data source deleted है।
- No new test failure introduced हुआ।
