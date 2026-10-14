// OpenWeather Current Weather API service (Free tier: 60 calls/min, 1M/month).
// Endpoint: https://api.openweathermap.org/data/2.5/weather
// Caching: localStorage, 10-minute TTL per location (per OpenWeather guidance
// to call no more than once per 10 minutes for the same location).

const WEATHER_ENDPOINT = 'https://api.openweathermap.org/data/2.5/weather';
const CACHE_PREFIX = 'ttb_weather_v1_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

export class WeatherApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'WeatherApiError';
    this.code = code;
  }
}

export function getWeatherApiKey() {
  try {
    const env = typeof import.meta !== 'undefined' ? import.meta.env : null;
    const key = env ? env.VITE_WEATHER_API_KEY : '';
    return typeof key === 'string' ? key.trim() : '';
  } catch (error) {
    return '';
  }
}

export function hasWeatherApiKey() {
  return getWeatherApiKey().length > 0;
}

function toCoordinate(value, min, max) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    return null;
  }
  return num;
}

function buildCacheKey(lat, lon) {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

function readCached(cacheKey) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(CACHE_PREFIX + cacheKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.cachedAt !== 'number' || !parsed.data) {
      return null;
    }
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      removeCached(cacheKey);
      return null;
    }
    return parsed.data;
  } catch (error) {
    return null;
  }
}

function writeCached(cacheKey, data) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(
      CACHE_PREFIX + cacheKey,
      JSON.stringify({ cachedAt: Date.now(), data })
    );
  } catch (error) {
    // Storage full or blocked (private mode) - the app still works without cache.
  }
}

function removeCached(cacheKey) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(CACHE_PREFIX + cacheKey);
  } catch (error) {
    // Ignore storage failures.
  }
}

function capitalize(text) {
  if (!text) {
    return '';
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeWeatherResponse(payload) {
  const main = payload.main || {};
  const condition = payload.weather[0] || {};
  const wind = payload.wind || {};
  const iconCode = condition.icon || '01d';
  const dtSeconds = Number.isFinite(payload.dt) ? payload.dt : Math.floor(Date.now() / 1000);

  return {
    temperature: Number.isFinite(main.temp) ? Math.round(main.temp) : null,
    feelsLike: Number.isFinite(main.feels_like) ? Math.round(main.feels_like) : null,
    humidity: Number.isFinite(main.humidity) ? Math.round(main.humidity) : null,
    windSpeedKph: Number.isFinite(wind.speed) ? Math.round(wind.speed * 3.6) : null,
    condition: condition.main || 'Unknown',
    description: capitalize(condition.description || ''),
    iconCode,
    iconUrl: `https://openweathermap.org/img/wn/${iconCode}@2x.png`,
    city: payload.name || '',
    country: (payload.sys && payload.sys.country) || '',
    updatedAt: new Date(dtSeconds * 1000).toISOString(),
    latitude: payload.coord && Number.isFinite(payload.coord.lat) ? payload.coord.lat : null,
    longitude: payload.coord && Number.isFinite(payload.coord.lon) ? payload.coord.lon : null,
  };
}

function httpStatusToError(status) {
  if (status === 401) {
    return new WeatherApiError('INVALID_KEY', 'OpenWeather rejected the API key (HTTP 401).');
  }
  if (status === 404) {
    return new WeatherApiError('NOT_FOUND', 'No weather data found for this location (HTTP 404).');
  }
  if (status === 429) {
    return new WeatherApiError('RATE_LIMIT', 'OpenWeather rate limit exceeded (HTTP 429).');
  }
  if (status >= 500) {
    return new WeatherApiError('SERVER', `OpenWeather server error (HTTP ${status}).`);
  }
  return new WeatherApiError('UNKNOWN', `Unexpected weather service response (HTTP ${status}).`);
}

/**
 * Fetches current weather for a coordinate pair.
 * Always resolves to a normalized weather object or rejects with WeatherApiError.
 *
 * @param {Object} options
 * @param {number|string} options.latitude - Latitude (-90..90).
 * @param {number|string} options.longitude - Longitude (-180..180).
 * @param {AbortSignal} [options.signal] - Optional external cancellation signal.
 * @param {boolean} [options.forceRefresh] - Bypass and clear the cached response.
 * @returns {Promise<Object>} Normalized weather data.
 */
export async function fetchCurrentWeather({
  latitude,
  longitude,
  signal,
  forceRefresh = false,
} = {}) {
  const apiKey = getWeatherApiKey();
  if (!apiKey) {
    throw new WeatherApiError('MISSING_API_KEY', 'VITE_WEATHER_API_KEY is not set.');
  }

  const lat = toCoordinate(latitude, -90, 90);
  const lon = toCoordinate(longitude, -180, 180);
  if (lat === null || lon === null) {
    throw new WeatherApiError('INVALID_COORDS', 'Destination coordinates are missing or invalid.');
  }

  const cacheKey = buildCacheKey(lat, lon);
  if (forceRefresh) {
    removeCached(cacheKey);
  } else {
    const cached = readCached(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const url =
    `${WEATHER_ENDPOINT}?lat=${lat}&lon=${lon}` +
    `&units=metric&appid=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw signal.reason || new DOMException('Aborted', 'AbortError');
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (signal && signal.aborted) {
      throw error;
    }
    if (error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      throw new WeatherApiError('NETWORK', 'The weather request timed out.');
    }
    throw new WeatherApiError('NETWORK', 'Could not reach the weather service.');
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }

  if (!response.ok) {
    throw httpStatusToError(response.status);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new WeatherApiError('SERVER', 'Weather service returned unreadable JSON.');
  }

  if (!payload || !payload.main || !Array.isArray(payload.weather) || payload.weather.length === 0) {
    throw new WeatherApiError('SERVER', 'Weather service response was incomplete.');
  }

  const data = normalizeWeatherResponse(payload);
  writeCached(cacheKey, data);
  return data;
}

/**
 * Maps a WeatherApiError (or unknown error) to a user-friendly message
 * suitable for an MUI Alert.
 */
export function getWeatherErrorMessage(error) {
  const code = error && error.code;
  switch (code) {
    case 'MISSING_API_KEY':
      return 'Weather information is not configured for this website.';
    case 'INVALID_COORDS':
      return 'This destination does not have valid coordinates yet.';
    case 'RATE_LIMIT':
      return 'The weather service is busy right now. Please try again in about 10 minutes.';
    case 'INVALID_KEY':
      return 'The weather service credentials are invalid. Please contact the site administrator.';
    case 'NOT_FOUND':
      return 'No weather data was found for this location.';
    case 'NETWORK':
      return 'Could not reach the weather service. Check your internet connection and try again.';
    case 'SERVER':
      return 'The weather service is temporarily unavailable. Please try again shortly.';
    default:
      return 'Weather information could not be retrieved right now.';
  }
}

/** Clears every cached weather response from localStorage. */
export function clearWeatherCache() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    // Ignore storage failures.
  }
}
