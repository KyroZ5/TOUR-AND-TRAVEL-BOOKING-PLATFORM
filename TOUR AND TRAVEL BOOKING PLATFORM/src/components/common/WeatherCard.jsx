import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ThermostatOutlinedIcon from '@mui/icons-material/ThermostatOutlined';
import WaterOutlinedIcon from '@mui/icons-material/WaterOutlined';
import AirOutlinedIcon from '@mui/icons-material/AirOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import {
  fetchCurrentWeather,
  getWeatherErrorMessage,
  hasWeatherApiKey,
} from '../../services/api/weatherApi';

const RETRYABLE_CODES = ['NETWORK', 'RATE_LIMIT', 'SERVER', 'UNKNOWN'];

function hasCoordinates(latitude, longitude) {
  return (
    latitude !== null &&
    latitude !== undefined &&
    latitude !== '' &&
    longitude !== null &&
    longitude !== undefined &&
    longitude !== ''
  );
}

function formatUpdatedAt(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function WeatherSkeleton({ sx }) {
  return (
    <Card sx={[{ height: '100%' }, sx]}>
      <CardContent aria-label="Loading weather information" aria-busy="true">
        <Skeleton width="45%" height={22} sx={{ mb: 1.5 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="circular" width={72} height={72} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={40} />
            <Skeleton width="45%" height={24} />
          </Box>
        </Box>
        <Skeleton width="70%" height={20} sx={{ mt: 1.5 }} />
        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Skeleton width={110} height={24} />
          <Skeleton width={90} height={24} />
          <Skeleton width={100} height={24} />
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Displays current weather for a destination using the OpenWeather API.
 *
 * Props:
 * - latitude / longitude: destination coordinates (numbers or numeric strings).
 *   When missing, the card quietly reports that weather is unavailable.
 * - destinationName: preferred label (falls back to the API city name).
 * - country: optional ISO country code shown next to the location label.
 * - sx: optional MUI sx overrides merged onto the root card.
 */
export default function WeatherCard({
  latitude,
  longitude,
  destinationName,
  country,
  sx,
}) {
  const [status, setStatus] = useState('loading'); // loading | success | error | empty | unconfigured
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!hasCoordinates(latitude, longitude)) {
      setStatus('empty');
      setWeather(null);
      setError(null);
      return undefined;
    }

    if (!hasWeatherApiKey()) {
      setStatus('unconfigured');
      setWeather(null);
      setError(null);
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    setStatus('loading');
    setError(null);

    (async () => {
      try {
        const data = await fetchCurrentWeather({
          latitude,
          longitude,
          signal: controller.signal,
          forceRefresh: retryCount > 0,
        });
        if (!cancelled) {
          setWeather(data);
          setStatus('success');
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err);
        setWeather(null);
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [latitude, longitude, retryCount]);

  const handleRetry = () => {
    setRetryCount((count) => count + 1);
  };

  if (status === 'empty') {
    return (
      <Alert severity="info" sx={sx}>
        Weather information is not available for this destination.
      </Alert>
    );
  }

  if (status === 'unconfigured') {
    return (
      <Alert severity="info" sx={sx}>
        Weather information is not configured for this website.
      </Alert>
    );
  }

  if (status === 'loading') {
    return <WeatherSkeleton sx={sx} />;
  }

  if (status === 'error') {
    const canRetry = error && RETRYABLE_CODES.includes(error.code);
    return (
      <Alert
        severity="warning"
        sx={sx}
        action={
          canRetry ? (
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              startIcon={<RefreshOutlinedIcon />}
            >
              Retry
            </Button>
          ) : null
        }
      >
        {getWeatherErrorMessage(error)}
      </Alert>
    );
  }

  const locationLabel = destinationName || weather.city || 'Unknown location';
  const countryLabel = country || weather.country;

  return (
    <Card sx={[{ height: '100%' }, sx]}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
          <WbSunnyOutlinedIcon fontSize="small" color="warning" />
          <Typography variant="overline" color="text.secondary">
            Current Weather
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box
            component="img"
            src={weather.iconUrl}
            alt={weather.description || weather.condition}
            sx={{ width: 72, height: 72 }}
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <Box>
            <Typography variant="h3" component="span" sx={{ fontWeight: 700 }}>
              {weather.temperature !== null ? `${weather.temperature}°C` : '—'}
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
              {weather.condition}
            </Typography>
            {weather.description ? (
              <Typography variant="body2" color="text.secondary">
                {weather.description}
              </Typography>
            ) : null}
          </Box>
        </Box>

        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'center', mt: 1.5, flexWrap: 'wrap' }}
        >
          <LocationOnOutlinedIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {locationLabel}
            {countryLabel ? `, ${countryLabel}` : ''}
          </Typography>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          sx={{ flexWrap: 'wrap', rowGap: 1 }}
        >
          {weather.feelsLike !== null ? (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <ThermostatOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Feels like {weather.feelsLike}°C
              </Typography>
            </Stack>
          ) : null}
          {weather.humidity !== null ? (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <WaterOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Humidity {weather.humidity}%
              </Typography>
            </Stack>
          ) : null}
          {weather.windSpeedKph !== null ? (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <AirOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Wind {weather.windSpeedKph} km/h
              </Typography>
            </Stack>
          ) : null}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Last updated: {formatUpdatedAt(weather.updatedAt)}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
          Weather is for planning purposes only and may change.
        </Typography>
      </CardContent>
    </Card>
  );
}
