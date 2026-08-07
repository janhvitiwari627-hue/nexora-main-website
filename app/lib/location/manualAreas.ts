/**
 * Manual location fallback — a small, static, bundled list of Jaipur zone
 * centres used only when the customer denies permission, has no GPS, or picks
 * an area by hand.
 *
 * These coordinates ship with the app as plain constants. Nothing here calls a
 * geocoding service; there is no lookup, no API key and no network request.
 */

export type ManualArea = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export const MANUAL_AREAS: ManualArea[] = [
  { id: "jaipur-center", label: "Jaipur city centre (MI Road)", latitude: 26.9157, longitude: 75.8189 },
  { id: "c-scheme", label: "C-Scheme / Civil Lines", latitude: 26.9053, longitude: 75.7965 },
  { id: "malviya-nagar", label: "Malviya Nagar / Jagatpura", latitude: 26.8535, longitude: 75.8104 },
  { id: "mansarovar", label: "Mansarovar / New Sanganer Road", latitude: 26.8505, longitude: 75.7628 },
  { id: "vaishali-nagar", label: "Vaishali Nagar / Ajmer Road", latitude: 26.9124, longitude: 75.7368 },
  { id: "vidhyadhar-nagar", label: "Vidhyadhar Nagar / Jhotwara", latitude: 26.9601, longitude: 75.7776 },
  { id: "tonk-road", label: "Tonk Road / Durgapura", latitude: 26.8489, longitude: 75.8005 },
  { id: "raja-park", label: "Raja Park / Adarsh Nagar", latitude: 26.8985, longitude: 75.8309 },
  { id: "sitapura", label: "Sitapura / Pratap Nagar", latitude: 26.7854, longitude: 75.8399 },
  { id: "amer", label: "Amer / North Jaipur", latitude: 26.9855, longitude: 75.8513 },
];

/** Default origin when nothing at all is known — the city centre. */
export const DEFAULT_ORIGIN = MANUAL_AREAS[0];

export function findManualArea(id: string): ManualArea | undefined {
  return MANUAL_AREAS.find((area) => area.id === id);
}
