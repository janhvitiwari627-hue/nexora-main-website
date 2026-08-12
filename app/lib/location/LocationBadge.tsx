"use client";

/**
 * App-shell control for the canonical @nexora/location service. It always tells
 * the user whether coordinates are fresh GPS or an older private saved fix.
 * With neither source available, it renders no coordinate.
 */

import { useEffect, useRef, useState } from "react";

import {
  formatAccuracy,
  locationFreshness,
  type UseLocationResult,
} from "../../../packages/location/src";

type Tone = "live" | "waiting" | "saved" | "off";

function toneFor(location: UseLocationResult, now: number): Tone {
  const freshness = locationFreshness(location.fix, now);
  if (freshness === "live") return "live";
  if (freshness === "saved" || freshness === "stale") return "saved";
  switch (location.status) {
    case "prompting":
    case "acquiring":
    case "improving":
      return "waiting";
    default:
      return "off";
  }
}

function relativeTime(timestamp: number | undefined, now: number): string {
  if (!timestamp) return "unknown age";
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function labelFor(location: UseLocationResult, tone: Tone, now: number): string {
  if (tone === "saved") return `Saved · ${relativeTime(location.fix?.timestamp, now)}`;
  if (tone === "live") return formatAccuracy(location.fix?.accuracy) || "Live GPS";
  if (tone === "waiting") return location.status === "improving" ? "Improving…" : "Locating…";
  if (location.status === "denied") return "Location off";
  if (location.status === "offline") return "Offline";
  if (location.status === "unsupported") return "No GPS";
  return "Set location";
}

export function LocationBadge({ location }: { location: UseLocationResult }) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const tone = toneFor(location, now);
  const freshness = locationFreshness(location.fix, now);

  // A live fix must visibly become stale if the watcher is paused.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="loc-badge" ref={wrapRef}>
      <button
        type="button"
        className={`loc-badge-button loc-${tone}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Location: ${labelFor(location, tone, now)}`}
        title={location.message}
      >
        <span className="loc-pin" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span className="loc-text">{labelFor(location, tone, now)}</span>
        <span className={`loc-dot loc-dot-${tone}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="loc-panel" role="dialog" aria-label="Location settings">
          <p className="loc-panel-status">{location.error?.message ?? location.message}</p>

          {location.fix ? (
            <dl className="loc-facts">
              <div><dt>Coordinates</dt><dd>{location.fix.latitude.toFixed(5)}, {location.fix.longitude.toFixed(5)}</dd></div>
              <div><dt>Accuracy</dt><dd>{formatAccuracy(location.fix.accuracy)}</dd></div>
              <div><dt>Captured</dt><dd>{relativeTime(location.fix.timestamp, now)}</dd></div>
              <div><dt>Source</dt><dd>{freshness === "live" ? "Fresh device GPS" : "Saved device GPS — not live"}</dd></div>
              <div><dt>Private sync</dt><dd>{location.syncStatus}</dd></div>
            </dl>
          ) : (
            <p className="loc-panel-hint">No coordinates are available. Nexora does not substitute an IP guess or a made-up location.</p>
          )}

          {!location.fix && location.candidateAccuracy != null && (
            <p className="loc-panel-hint">Best reading so far: {formatAccuracy(location.candidateAccuracy)} — waiting for a sharper fix.</p>
          )}

          {freshness !== "live" && location.fix && (
            <p className="loc-panel-hint">Distances use this older saved reading until fresh GPS is allowed and available.</p>
          )}

          <div className="loc-panel-actions">
            <button type="button" className="secondary" onClick={() => location.retry()}>
              {location.status === "denied" ? "Try again" : "Refresh GPS"}
            </button>
          </div>

          {location.status === "denied" && (
            <p className="loc-panel-hint">Open this site’s browser permissions, allow location, then tap Try again. Without a saved real GPS reading, distance sorting remains off.</p>
          )}
          <p className="loc-panel-hint">Private GPS is saved only for the signed-in auth.users.id. Salon coordinates are separate and public only after approval.</p>
        </div>
      )}
    </div>
  );
}
