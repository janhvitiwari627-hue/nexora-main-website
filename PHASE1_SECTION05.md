# NEXORA HOMEPAGE — PHASE 1 + SECTION 05

## SECTION 05: BEAUTY CATEGORIES

### Goal

Live, admin-approved beauty-business categories को visual discovery grid में दिखाना है।

Category click पर `/salons` में उसी category के real published salon results खुलने चाहिए।

Hardcoded fake categories, fake salon counts, fake service counts, fake icons या fake results नहीं दिखाने हैं।

### Section Position

1. Header
2. Hero
3. Smart Search
4. Aap Nexora Par Kya Karna Chahte Hain?
5. Beauty Categories

### Section Content

Eyebrow:

BROWSE BY CATEGORY

Heading:

Beauty Categories Explore Karein

Supporting Copy:

Salon, spa, makeup, hair, nails aur doosri beauty services apni zaroorat ke hisaab se dhoondhein.

Main CTA:

Sabhi Salons Dekhein

CTA Route:

`/salons`

### Data Source

Current repository का existing live category system inspect और reuse करो:

- `useMarketplaceCategories(online)`
- `marketplace_categories` RPC
- Existing category response type
- Existing admin category order
- Existing active/approved category rules
- Existing `/salons?category=` filtering contract
- Existing `CANONICAL_CATEGORIES` fallback contract

Database schema, RPC, RLS policy या migration change मत करो।

### Expected Category Fields

Existing response में available fields inspect करो:

- `name`
- `slug`
- `icon`
- `salon_count`
- `service_count`
- Existing active/order fields

Missing fields invent मत करो।

### Live Data Rules

1. Live approved category list primary source हो।
2. Existing admin order preserve हो।
3. Inactive या unapproved category manually inject मत करो।
4. Salon count केवल live response से दिखाओ।
5. Service count केवल live response से दिखाओ।
6. Count unavailable हो तो fake `0` मत दिखाओ।
7. Count unavailable होने पर neutral copy दिखाओ:

   `Explore available listings`

8. Existing canonical category list को fake live database data की तरह मत दिखाओ।
9. Hardcoded cards से live hook replace मत करो।

### Category Cards

हर category card में:

- Approved icon
- Category name
- Real salon count, अगर available हो
- Real service count, अगर available हो
- Clear hover state
- Clear keyboard focus state
- Accessible category label

Card click destination:

`/salons?category=<URL_ENCODED_CATEGORY_NAME>`

Existing route parameter अलग हो तो existing contract reuse करो। नया parameter guess मत करो।

### Count Grammar

Correct grammar use करो:

- `1 salon`
- `2 salons`
- `1 service`
- `2 services`

Example:

Salon  
12 salons • 48 services

Count unavailable example:

Nail Studio  
Explore available listings

### Icon Rules

- Existing approved icon library use करो।
- Database icon value icon-key हो तो safe whitelist mapping बनाओ।
- Raw database string सीधे HTML/icon की तरह render मत करो।
- Unknown या missing icon पर consistent generic category icon दिखाओ।
- Emoji icons मत लगाओ।
- Handcrafted fake SVG, CSS art या text-symbol icon मत बनाओ।
- Existing approved local icon assets हों तो reuse करो।

### Display Rules

- Desktop पर maximum 8–10 live categories दिखाओ।
- Mobile पर maximum 6–8 categories initially दिखा सकते हो।
- More categories के लिए `Sabhi Categories Dekhein` या expandable control दो।
- Live admin ordering preserve करो।
- Existing ordering unavailable हो तभी alphabetical fallback use करो।
- Zero-listing category दिखाने का existing rule inspect करो।
- Dead category route मत बनाओ।
- Simple responsive grid preferred है।
- Unnecessary carousel मत बनाओ।

### Header Integration

Header का `Categories` link:

- Existing navigation contract inspect करे।
- Homepage पर हो तो `#categories` section तक smooth-scroll कर सकता है।
- दूसरे route पर हो तो homepage categories anchor या `/salons` discovery safely खोले।
- Desktop और mobile behavior consistent हो।
- Sticky Header के नीचे heading hidden न हो; correct scroll margin दो।

### Loading State

- Category-card skeleton grid दिखाओ।
- Section heading तुरंत render हो।
- Layout shift कम हो।
- Whole section को single spinner से blank मत रखो।
- Skeleton real card dimensions के करीब हो।

### Empty State

Message:

Categories abhi available nahi hain.

Actions:

- Sabhi Salons Dekhein
- Retry, अगर load function available है

Public visitor को admin panel, RPC, database या RLS instructions मत दिखाओ।

### Error State

Message:

Categories load nahi ho saki. Dobara try karein.

Actions:

- Retry
- Sabhi Salons Dekhein

Raw Supabase error, RPC name, stack trace या environment details public UI में मत दिखाओ।

Current hook loading और empty को same state मानता हो तो safe non-breaking `error` state add कर सकते हो। Backend contract मत बदलो।

### Offline State

Message:

Aap offline hain. Live categories dekhne ke liye internet connection check karein.

Cached approved categories available हों तो:

- `Saved results` label दिखाओ।
- Cached results को live मत बताओ।
- Fake categories generate मत करो।

### Responsive Layout

Desktop:

- 4 या 5-column balanced grid।
- Cards equal visual weight रखें।
- Heading और CTA homepage content shell से aligned हों।

Tablet:

- 2 या 3-column grid।
- Category names और counts clip न हों।

Mobile:

- 2-column compact grid या readable 1-column list।
- Long category names safely wrap हों।
- Text truncate करके category meaning मत खोओ।
- Minimum 44×44px interactive target।
- Horizontal page overflow नहीं।
- Cards screen width से बाहर नहीं जाएँ।

Sections 01–04 के existing colors, typography, spacing, radii और components reuse करो। नया unrelated design system मत बनाओ।

### Accessibility

- Semantic `<section>` use करो।
- Section heading `<h2>` हो।
- `aria-labelledby` association हो।
- Category cards semantic links/buttons हों।
- Keyboard tab order visual order से match करे।
- Visible focus ring हो।
- Icon-only information न हो।
- Loading/error status screen reader live region में announce हो।
- Color contrast WCAG AA target करे।
- Reduced-motion preference respect हो।

### Public Copy Cleanup

Current Categories section में ऐसी technical copy हो सकती है:

`Business categories from salons.business_category – smart search filter.`

इसे public UI से हटाओ।

Backend field, RPC, RLS, database table या admin-system wording visitor को मत दिखाओ।

Technical copy हटाने का मतलब backend functionality हटाना नहीं है।

### No-Data-Loss Migration

Current homepage में existing Categories section पहले से मौजूद है।

Mandatory rules:

1. Existing section को upgrade करो।
2. Duplicate Categories section मत बनाओ।
3. Existing `useMarketplaceCategories()` hook preserve करो।
4. Existing `marketplace_categories` RPC usage preserve करो।
5. Existing admin order preserve करो।
6. Existing category click route preserve करो।
7. Existing counts preserve करो।
8. Existing loading behavior safely improve करो।
9. Component extraction से पहले imports और call sites inspect करो।
10. कोई existing category data source, route, file, feature या test delete मत करो।

### Do Not Change

- Section 01 Header, except Categories link wiring if required
- Section 02 Hero
- Section 03 Smart Search
- Section 04 six-app grid
- Sections 06–18
- Salon results page design, except essential category-query compatibility
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

1. Current working tree और existing uncommitted work inspect करो।
2. Existing Categories markup locate करो।
3. `useMarketplaceCategories()` hook inspect करो।
4. `marketplace_categories` response fields inspect करो।
5. `/salons` category query contract verify करो।
6. Existing section को stable `categories` ID के साथ upgrade करो।
7. Live category cards implement करो।
8. Safe icon whitelist/fallback mapping implement करो।
9. Real counts और correct grammar implement करो।
10. Loading, empty, error और offline states implement करो।
11. Header Categories navigation verify करो।
12. Desktop, tablet और mobile layouts verify करो।
13. Keyboard और screen-reader behavior verify करो।
14. Relevant category route/data-state tests add या update करो।
15. Existing failures और इस change से आए failures अलग report करो।

### Required Tests

Run:

- `npm run typecheck`
- `npm run lint`
- `npm run test:security`
- `npm run test:back-to-main`
- `npm run test:contracts`

Production build केवल real configured public Supabase environment variables के साथ run करो।

Fake anon key, placeholder credential या service-role key use मत करो।

### Manual Verification

- Loading skeleton
- Live categories render
- Admin order preserved
- Real salon count
- Real service count
- Singular/plural grammar
- Missing count fallback
- Valid icon mapping
- Missing/invalid icon fallback
- Category click URL
- Results filtered correctly
- Browser back/forward
- Empty state
- Error and Retry
- Offline state
- Desktop layout
- Tablet layout
- Mobile layout
- Keyboard focus
- Screen-reader labels
- Sections 01–04 unchanged

### Acceptance Criteria

- Section correct order पर है।
- Stable ID `categories` है।
- Approved heading और supporting copy use हुई है।
- Public technical database text हट गया है।
- Live `marketplace_categories` contract reuse हुआ है।
- Existing admin order preserve हुआ है।
- Fake category या fake count नहीं है।
- Category click correct filtered `/salons` URL खोलता है।
- Icons approved library/whitelist से हैं।
- Raw emoji icons नहीं हैं।
- Loading skeleton मौजूद है।
- Empty state मौजूद है।
- Error और Retry state मौजूद है।
- Offline state मौजूद है।
- Desktop/tablet/mobile layout pass है।
- Accessibility pass है।
- Existing category hook/RPC preserved है।
- Existing Sections 01–04 preserved हैं।
- No auth/database/RLS/app regression है।
- No file, feature, route या data source deleted है।
- No new test failure introduced हुआ।
