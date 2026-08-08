import type { StandardLocation } from "./types";

export type FormattedLocation = {
  primary: string | null;
  secondary: string | null;
  state: string | null;
  formattedAddress: string | null;
};

export function formatLocation(location: StandardLocation | null): FormattedLocation {
  if (!location) {
    return {
      primary: null,
      secondary: null,
      state: null,
      formattedAddress: null,
    };
  }

  const primary = location.area ?? location.city ?? location.formattedAddress ?? null;
  const secondary = location.area && location.city
    ? location.city
    : !location.area && location.city && location.state
      ? location.state
      : null;

  return {
    primary,
    secondary,
    state: location.state,
    formattedAddress: location.formattedAddress,
  };
}
