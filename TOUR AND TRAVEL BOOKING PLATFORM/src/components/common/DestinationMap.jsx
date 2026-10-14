import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  TILE_URL,
  TILE_ATTRIBUTION,
  DEFAULT_ZOOM,
  DETAIL_ZOOM,
  isValidCoordinate,
  toLatLng,
} from '../../services/api/mapService.js';

// Fix Leaflet's default marker icons under bundlers such as Vite.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/**
 * Interactive OpenStreetMap view for a destination. Renders a friendly notice
 * when coordinates are missing instead of crashing.
 */
export default function DestinationMap({
  latitude,
  longitude,
  name = 'Destination',
  location = '',
  height = 320,
  zoom,
  sx,
}) {
  const position = useMemo(() => toLatLng(latitude, longitude), [latitude, longitude]);

  if (!position) {
    return (
      <Alert severity="info" sx={sx}>
        A map is not available for this destination because coordinates are missing.
      </Alert>
    );
  }

  return (
    <Box sx={[{ height, width: '100%', borderRadius: 2, overflow: 'hidden' }, sx]}>
      <MapContainer
        center={position}
        zoom={zoom || (isValidCoordinate(latitude, longitude) ? DETAIL_ZOOM : DEFAULT_ZOOM)}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <Marker position={position}>
          <Popup>
            <strong>{name}</strong>
            {location ? <div>{location}</div> : null}
          </Popup>
        </Marker>
      </MapContainer>
    </Box>
  );
}
