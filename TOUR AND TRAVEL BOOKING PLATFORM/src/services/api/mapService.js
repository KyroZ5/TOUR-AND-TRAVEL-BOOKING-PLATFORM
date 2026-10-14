// Map helpers for Leaflet / OpenStreetMap. The map itself needs no API key;
// please respect the tile provider's usage policy.
// Docs: https://leafletjs.com/ and https://operations.osmfoundation.org/policies/tiles/

export const DEFAULT_CENTER = { lat: 12.8797, lng: 121.774 }; // Philippines
export const DEFAULT_ZOOM = 6;
export const DETAIL_ZOOM = 12;

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** True when both values are finite and within valid lat/lng ranges. */
export function isValidCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/** Build a [lat, lng] tuple for react-leaflet, or null when invalid. */
export function toLatLng(latitude, longitude) {
  return isValidCoordinate(latitude, longitude) ? [Number(latitude), Number(longitude)] : null;
}

/** Center on the first destination that has coordinates, else the default. */
export function resolveMapCenter(destinations = []) {
  const withCoords = destinations.find((d) => isValidCoordinate(d.latitude, d.longitude));
  if (withCoords) {
    return { center: toLatLng(withCoords.latitude, withCoords.longitude), zoom: DETAIL_ZOOM };
  }
  return { center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], zoom: DEFAULT_ZOOM };
}
