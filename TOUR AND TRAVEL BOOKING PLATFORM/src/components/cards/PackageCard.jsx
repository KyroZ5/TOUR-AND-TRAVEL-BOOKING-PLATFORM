import { Link as RouterLink } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventIcon from '@mui/icons-material/Event';
import { formatPHP } from '../../utils/currency.js';
import { formatDate } from '../../utils/date.js';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60';

/** Tour package card. `destinationName` and `nextDepartureDate` are optional joins. */
export default function PackageCard({ package: pkg, destinationName = '', nextDepartureDate = null }) {
  const image = (pkg.imageUrls && pkg.imageUrls[0]) || PLACEHOLDER;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          image={image}
          alt={pkg.name}
          sx={{ height: 200, objectFit: 'cover' }}
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER;
          }}
        />
        <Chip
          label={formatPHP(pkg.pricePerPerson)}
          color="warning"
          sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700 }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" fontWeight={700} noWrap gutterBottom>
          {pkg.name}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
          <LocationOnIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" noWrap>
            {destinationName || 'Destination'}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
          <ScheduleIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {pkg.durationDays}D / {pkg.durationNights}N
          </Typography>
        </Stack>
        {nextDepartureDate ? (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
            <EventIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Next: {formatDate(nextDepartureDate)}
            </Typography>
          </Stack>
        ) : null}
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="body2" color="text.secondary">
          From <strong>{formatPHP(pkg.pricePerPerson)}</strong> per person
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button component={RouterLink} to={`/packages/${pkg.id}`} variant="outlined" fullWidth>
          View Details
        </Button>
        <Button
          component={RouterLink}
          to={`/packages/${pkg.id}?book=1`}
          variant="contained"
          fullWidth
        >
          Book Now
        </Button>
      </CardActions>
    </Card>
  );
}
