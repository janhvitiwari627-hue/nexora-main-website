"use client";

/**
 * LocationBadge — the header location control.
 *
 * Always renders, whether or not permission was granted, so the customer can
 * see what the GPS is doing and fix it without leaving the page:
 *  - granted  → resolved area/city when reverse geocoding succeeds
 *  - waiting  → "Locating…" / "Improving…" with the best accuracy so far
 *  - denied / unsupported / no signal → the reason, a Retry button and a
 *    manual area picker
 *  - reverse geocode failure → "Unable to detect location" with Retry
 *
 * It never throws and never blocks the header: an unavailable GPS simply
 * renders as an "off" state.
 */

import { useEffect, useRef, useState } from "react";

import { formatAccuracy } from "./distanceCalculator";
import { formatLocation } from "./formatLocation";
import type { UseLocationResult } from "./useLocation";

type Tone = "live" | "waiting" | "manual" | "off";

function toneFor(location: UseLocationResult): Tone {
  if (location.fix?.source === "manual") return "manual";
  switch (location.status) {
    case "ready": return "live";
    case "prompting":
    case "acquiring":
    case "improving": return "waiting";
    default: return location.fix ? "live" : "off";
  }
}

function labelFor(location: UseLocationResult, tone: Tone): string {
  const formattedLocation = formatLocation(location.location);
  if (tone === "manual") return location.fix?.label?.split(" / ")[0] ?? "Location unavailable";
  if (location.reverseGeocodeError) return "Location unavailable";
  if (tone === "live") return formattedLocation.primary ?? formatAccuracy(location.fix?.accuracy) ?? "Location unavailable";
  if (tone === "waiting") return "Detecting location...";
  return "Location unavailable";
}

function subLabelFor(location: UseLocationResult): string {
  const formattedLocation = formatLocation(location.location);
  if (location.fix?.source === "manual") return "";
  if (location.reverseGeocodeError) return "";
  return formattedLocation.secondary ?? "";
}

function relativeTime(timestamp: number | undefined): string {
  if (!timestamp) return "";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
}

export function LocationBadge({ location }: { location: UseLocationResult }) {
  const [open, setOpen] = useState(false);
  const [, forceTick] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const tone = toneFor(location);

  // Keep the "updated Xs ago" line honest while the panel is open.
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => forceTick((n) => n + 1), 10_000);
    return () => window.clearInterval(id);
  }, [open]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedAreaId = location.fix?.source === "manual"
    ? (location.manualAreas.find((area) => area.label === location.fix?.label)?.id ?? "")
    : "";
  const compactLabel = labelFor(location, tone);
  const compactSubLabel = subLabelFor(location);
  const formattedLocation = formatLocation(location.location);

  return (
    <div className="loc-badge" ref={wrapRef}>
      <button
        type="button"
        className={`loc-badge-button loc-${tone}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Location: ${compactSubLabel ? `${compactLabel}, ${compactSubLabel}` : compactLabel}`}
        title={compactSubLabel ? `${compactLabel} · ${compactSubLabel}` : (location.reverseGeocodeError ?? location.message)}
      >
        <span className="loc-pin" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span className="loc-text">{compactLabel}</span>
        <span className={`loc-dot loc-dot-${tone}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="loc-panel" role="dialog" aria-label="Location settings">
          <p className="loc-panel-status">{tone === "waiting"
            ? "Detecting location..."
            : (location.reverseGeocodeError || location.error || (!formattedLocation.formattedAddress && location.fix?.source !== "manual"))
              ? "Location unavailable"
              : location.message}</p>

          {location.fix && (
            <dl className="loc-facts">
              {formattedLocation.formattedAddress && (
                <>
                  <div><dt>Area</dt><dd>📍 {formattedLocation.primary}</dd></div>
                  {formattedLocation.secondary && (
                    <div><dt>City</dt><dd>{formattedLocation.secondary}</dd></div>
                  )}
                  {formattedLocation.state && (
                    <div><dt>State</dt><dd>{formattedLocation.state}</dd></div>
                  )}
                </>
              )}
              <div><dt>Accuracy</dt><dd>{location.fix.source === "manual" ? "Approximate (area centre)" : formatAccuracy(location.fix.accuracy)}</dd></div>
              <div><dt>Updated</dt><dd>{relativeTime(location.fix.timestamp)}</dd></div>
              <div><dt>Source</dt><dd>{location.fix.source === "manual" ? "Chosen manually" : "Device GPS"}</dd></div>
            </dl>
          )}

          {location.reverseGeocodeStatus === "loading" && location.fix?.source === "gps" && (
            <p className="loc-panel-hint">Detecting your area and city from the latest GPS fix…</p>
          )}

          {!location.fix && location.candidateAccuracy != null && (
            <p className="loc-panel-hint">Best reading so far: {formatAccuracy(location.candidateAccuracy)} — waiting for a sharper fix.</p>
          )}

          {location.manualAreas.length > 0 && (
            <label className="loc-manual">
              <span>Choose your area</span>
              <select
                value={selectedAreaId}
                onChange={(event) => {
                  if (event.target.value) { location.setManualArea(event.target.value); setOpen(false); }
                  else location.clearManualArea();
                }}
              >
                <option value="">Use my GPS</option>
                {location.manualAreas.map((area) => <option key={area.id} value={area.id}>{area.label}</option>)}
              </select>
            </label>
          )}

          <div className="loc-panel-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => location.reverseGeocodeError ? location.retryPlaceName() : location.retry()}
            >
              {location.reverseGeocodeError ? "Retry" : location.status === "denied" ? "Try again" : "Refresh location"}
            </button>
            {location.fix?.source === "manual" && (
              <button type="button" className="text-button" onClick={() => location.clearManualArea()}>Back to GPS</button>
            )}
          </div>

          {location.status === "denied" && (
            <p className="loc-panel-hint">
              Location is blocked for this site. Open your browser’s site settings (the icon next to the address bar) and allow location, then tap Try again.
            </p>
          )}
          {location.reverseGeocodeError && (
            <p className="loc-panel-hint">GPS is working, but the location name could not be resolved right now.</p>
          )}
        </div>
      )}
    </div>
  );
}
