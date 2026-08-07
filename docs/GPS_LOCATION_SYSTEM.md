# Nexora GPS Location System

Production-ready location module for the Nexora Customer PWA, optimised for
Android Chrome. It uses **only** the browser's native Geolocation API.

## Zero external dependencies

| Provider | Used? |
| --- | --- |
| Google Geolocation API | ❌ |
| Google Maps Geocoding API | ❌ |
| Google Distance Matrix | ❌ |
| Any reverse-geocoding service | ❌ |
| Mapbox | ❌ |
| OpenStreetMap / Nominatim | ❌ |
| Any paid location provider | ❌ |
| Any API key | ❌ |
| `navigator.geolocation.watchPosition()` | ✅ **only source of position** |
| Haversine formula, on-device | ✅ **only source of distance** |

The module issues **no network requests at all**. This is enforced by
`tests/location-system.test.mjs`, which scans the executable source for
forbidden hosts, `fetch`, `XMLHttpRequest` and API-key identifiers.

## Modules — `app/lib/location/`

| File | Responsibility |
| --- | --- |
| `locationService.ts` | `LocationService` — orchestrates the pipeline, owns the global fix, exposes subscriptions. Process-wide singleton. |
| `gpsWatcher.ts` | `GPSWatcher` — the single `watchPosition()` listener, background suspend/resume, clean teardown. |
| `locationValidator.ts` | `LocationValidator` — accuracy grading, freshness, jump plausibility, movement threshold. |
| `distanceCalculator.ts` | Haversine maths, coordinate validation, bounding-box pre-filter, formatting. |
| `nearbySalonService.ts` | `NearbySalonService` — ranking and the Nearby/Close/Around You/Everything Else buckets. |
| `permissionManager.ts` | `PermissionManager` — Permissions API read + change observation, secure-context check. |
| `logger.ts` | `Logger` — namespaced, level-aware console logging with an in-memory trail. |
| `manualAreas.ts` | Bundled static area coordinates for the manual fallback (no geocoding). |
| `useLocation.ts` | `useLocation()` / `useNearbySalons()` React hooks. |
| `types.ts` | Shared types (`GeoFix`, `LocationState`, `LocationError`, …). |
| `index.ts` | Public entry point. |

## GPS configuration

```ts
const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,   // never reuse a cached coordinate
};
```

`getCurrentPosition()` is never used. A continuous watch is what lets Android's
fused provider converge from a coarse cell/Wi-Fi fix to a true GNSS fix.

## Multi-step validation

The first reading is never trusted. Each raw position runs through:

1. **Coordinate sanity** — in range, and not the `(0, 0)` null-island sentinel.
2. **Freshness** — rejected if older than 60 s (the OS sometimes replays fixes).
3. **Jump plausibility** — a huge positional change over a tiny interval, or a
   far-away reading that is 3× less accurate, is discarded. This is the fix for
   "GPS jumping to another place".
4. **Accuracy grading** — see the table below.
5. **Movement gate** — an accepted fix only replaces the stored one if the user
   moved ≥ 100 m or the accuracy improved materially (≥ 40 % tighter).

### Accuracy rules

| `coords.accuracy` | Grade | Action |
| --- | --- | --- |
| 0–15 m | Excellent | Accept immediately |
| 16–30 m | Good | Accept |
| 31–50 m | Fair | Hold; accept after 10 s if nothing better arrives |
| 51–100 m | Poor | Keep waiting, show **"Improving your location…"** |
| > 100 m | Unusable | Reject — nearby salons are **not** computed |

## Stored fix (`GeoFix`)

`latitude`, `longitude`, `accuracy`, `timestamp`, `altitude`,
`altitudeAccuracy`, `speed`, `heading`, `source` (`gps` \| `manual`), `label`.

Available globally via `locationService.getFix()` or the `useLocation()` hook.

## Distance and sorting

Distances are computed on-device with the Haversine formula against the
`latitude`/`longitude` each salon already carries. Salons are sorted by:

1. **Nearest distance** — compared in coarse steps (100 m under 1 km, then
   250 m) so ±20 m of GPS jitter cannot reshuffle the cards on every tick.
2. **Highest rating** — smoothed by review volume (`m = 5`, prior `C = 3.8`) so
   one 5★ review does not outrank a well-reviewed 4.6★ salon.
3. **Featured status**
4. **Recently active**
5. Deterministic id tiebreak.

Display sections: **Nearby** (0–2 km), **Close** (2–5 km), **Around You**
(5–10 km), **Everything Else**.

## Automatic updates

The watch stays live. When the customer moves more than **100 m** the stored
fix is replaced, distances are recalculated and the nearby list re-ranks
itself. No page refresh is required.

## Permission and error handling

Every failure mode has a user-facing message, a **Retry location** button and a
**manual area picker** — the app never crashes or blanks out.

| Code | Message |
| --- | --- |
| `PERMISSION_DENIED` | Please enable location to discover nearby salons. |
| `POSITION_UNAVAILABLE` | GPS is unavailable right now. Turn on device location (high accuracy) and try again. |
| `TIMEOUT` | Location is taking too long. Move near a window or open area, then retry. |
| `OFFLINE` | You are offline. Nearby salons will refresh when you reconnect. |
| `WEAK_SIGNAL` | Weak GPS signal — still improving your location. |
| `GPS_DISABLED` | Device location appears to be turned off. Enable it in your phone settings and retry. |
| `UNSUPPORTED` | This browser cannot access location. Pick your area manually instead. |
| `UNKNOWN` | We could not determine your location. Please retry or choose your area manually. |

An already-accepted fix is **kept** through a transient error, so the list the
customer is reading never disappears. Recoverable errors auto-retry on a
4 s → 8 s → 15 s → 30 s backoff, and the module re-acquires automatically when
the device comes back online or the OS permission flips to granted.

## Debug logging

Every GPS update logs latitude, longitude, accuracy, grade, timestamp, age,
movement distance, speed, heading, altitude, permission status, update count,
accepted count, time-to-fix and the accept/reject reason.

```js
// Toggle verbose GPS logs at runtime (on by default in development):
window.__nexoraLocationDebug = true;
```

Sample output:

```
[Nexora/Location:GPSWatcher] watchPosition started. { watchId: 1, options: {…} }
[Nexora/Location:Service] 📍 GPS update #1 { accuracyMeters: 1240, grade: 'unusable',
  decision: 'Rejected: unusable accuracy (±1240 m > 100 m). Nearby salons are not computed.' }
[Nexora/Location:Service] 📍 GPS update #4 { accuracyMeters: 38, grade: 'fair',
  decision: 'Held: fair accuracy (±38 m). Accepting in 10s unless a better reading arrives.' }
[Nexora/Location:Service] 📍 GPS update #6 { accuracyMeters: 11, grade: 'excellent' }
[Nexora/Location:Service] ✅ First accepted fix in 7412 ms — Accepted immediately: excellent accuracy (±11 m ≤ 15 m).
```

## Android PWA optimisation

- **Fast lock** — the watch starts on first mount and reports progress while
  the fused provider converges.
- **Battery** — the watch is suspended after 30 s in the background and resumed
  on return, releasing the GNSS radio.
- **No duplicate listeners** — a module singleton plus reference counting means
  exactly one `watchPosition` id exists no matter how many components mount.
  React StrictMode's double-effect is a no-op.
- **No memory leaks** — `stop()` clears the watch, both timers, the
  `visibilitychange` handler, the online/offline handlers and the permission
  subscription.
- **Stability** — jitter-tolerant sorting and the 100 m movement gate keep the
  UI from thrashing.
- **HTTPS guard** — a non-secure origin is detected up front and reported as
  `UNSUPPORTED` rather than failing silently.

## Usage

```tsx
import { useLocation, useNearbySalons, formatDistance } from "@/app/lib/location";

function NearbySalons({ salons }) {
  const location = useLocation();
  const { buckets } = useNearbySalons(salons, location.fix);

  if (location.status === "denied") {
    return (
      <>
        <p>{location.error?.message}</p>
        <button onClick={location.retry}>Retry</button>
        <select onChange={(e) => location.setManualArea(e.target.value)}>
          {location.manualAreas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </>
    );
  }

  return buckets.map((bucket) => (
    <section key={bucket.key}>
      <h3>{bucket.title}</h3>
      {bucket.items.map((s) => <div key={s.id}>{s.name} — {formatDistance(s.distanceKm)}</div>)}
    </section>
  ));
}
```

Outside React:

```ts
import { locationService } from "@/app/lib/location";

const stop = locationService.subscribe((state) => console.log(state.fix));
const fix = locationService.getFix();
stop();
```

## Tests

```bash
node --test tests/location-system.test.mjs
```

19 contract tests covering provider absence, `watchPosition`-only tracking, the
GPS option values, accuracy boundaries, Haversine reference distances, sort
priority, bucket definitions, module presence, error coverage and log fields.
