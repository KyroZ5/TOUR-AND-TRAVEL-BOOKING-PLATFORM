import { Link as RouterLink } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60';

/** Destination summary card used on the homepage and destinations listing. */
export default function DestinationCard({ destination }) {
  const image = (destination.imageUrls && destination.imageUrls[0]) || PLACEHOLDER;
  const locationText = [destination.location, destination.country].filter(Boolean).join(', ');

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        image={image}
        alt={destination.name}
        sx={{ height: 200, objectFit: 'cover' }}
        onError={(event) => {
          event.currentTarget.src = PLACEHOLDER;
        }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            {destination.name}
          </Typography>
          {destination.category ? (
            <Chip label={destination.category} size="small" color="secondary" variant="outlined" />
          ) : null}
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
          <LocationOnIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {locationText || 'Location unavailable'}
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {destination.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          component={RouterLink}
          to={`/destinations/${destination.id}`}
          variant="outlined"
          fullWidth
        >
          Explore
        </Button>
      </CardActions>
    </Card>
  );
}
