// Geoapify geocoding / destination search service.
// Docs: https://apidocs.geoapify.com/docs/geocoding/autocomplete/

const AUTOCOMPLETE_ENDPOINT = 'https://api.geoapify.com/v1/geocode/autocomplete';
const GEOCODE_ENDPOINT = 'https://api.geoapify.com/v1/geocode/search';
const REQUEST_TIMEOUT_MS = 8000;

export class LocationApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LocationApiError';
    this.code = code;
  }
}

export function getLocationApiKey() {
  try {
    const key = import.meta.env ? import.meta.env.VITE_LOCATION_API_KEY : '';
    return typeof key === 'string' ? key.trim() : '';
  } catch (error) {
    return '';
  }
}

export function hasLocationApiKey() {
  return getLocationApiKey().length > 0;
}

function normalizeFeature(feature) {
  const props = feature.properties || {};
  const coords = feature.geometry ? feature.geometry.coordinates : [];
  return {
    id: props.place_id || `${props.lat}-${props.lon}`,
    name: props.name || props.address_line1 || props.city || props.formatted || 'Unknown',
    city: props.city || props.town || props.village || '',
    country: props.country || '',
    region: props.state || props.region || '',
    location: props.formatted || '',
    category: props.result_type || '',
    latitude: typeof props.lat === 'number' ? props.lat : coords[1],
    longitude: typeof props.lon === 'number' ? props.lon : coords[0],
  };
}

async function request(url, signal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new LocationApiError('ABORTED', 'Search cancelled.');
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (signal && signal.aborted) {
      throw new LocationApiError('ABORTED', 'Search cancelled.');
    }
    throw new LocationApiError('NETWORK', 'Could not reach the location service.');
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new LocationApiError('INVALID_KEY', 'The location service key is invalid.');
    }
    if (response.status === 429) {
      throw new LocationApiError('RATE_LIMIT', 'Location search limit reached. Try again shortly.');
    }
    throw new LocationApiError('SERVER', 'The location service is unavailable right now.');
  }

  return response.json();
}

/**
 * Autocomplete destination search. Returns an array of normalized suggestions.
 * Empty text returns an empty array without making a request.
 */
export async function searchDestinations(text, { limit = 6, signal, countryCode = '' } = {}) {
  const query = (text || '').trim();
  if (query.length < 2) {
    return [];
  }

  const apiKey = getLocationApiKey();
  if (!apiKey) {
    throw new LocationApiError('MISSING_API_KEY', 'Location search is not configured.');
  }

  const params = new URLSearchParams({
    text: query,
    limit: String(limit),
    format: 'geojson',
    apiKey,
  });
  if (countryCode) {
    params.set('filter', `countrycode:${countryCode}`);
  }

  const data = await request(`${AUTOCOMPLETE_ENDPOINT}?${params.toString()}`, signal);
  const features = Array.isArray(data.features) ? data.features : [];
  return features.map(normalizeFeature);
}

/** Resolve a full-text place into a single normalized location (or null). */
export async function geocodeDestination(text, { signal } = {}) {
  const query = (text || '').trim();
  if (!query) {
    return null;
  }

  const apiKey = getLocationApiKey();
  if (!apiKey) {
    throw new LocationApiError('MISSING_API_KEY', 'Location search is not configured.');
  }

  const params = new URLSearchParams({
    text: query,
    limit: '1',
    format: 'geojson',
    apiKey,
  });

  const data = await request(`${GEOCODE_ENDPOINT}?${params.toString()}`, signal);
  const features = Array.isArray(data.features) ? data.features : [];
  return features.length > 0 ? normalizeFeature(features[0]) : null;
}

export function getLocationErrorMessage(error) {
  const code = error && error.code;
  switch (code) {
    case 'MISSING_API_KEY':
      return 'Destination search is not configured for this website.';
    case 'INVALID_KEY':
      return 'The destination search service credentials are invalid.';
    case 'RATE_LIMIT':
      return 'Destination search is temporarily busy. Please try again in a moment.';
    case 'NETWORK':
      return 'Could not reach the destination search service. Check your connection.';
    case 'SERVER':
      return 'Destination search is unavailable right now.';
    default:
      return 'Destination search failed. Please try again.';
  }
}
