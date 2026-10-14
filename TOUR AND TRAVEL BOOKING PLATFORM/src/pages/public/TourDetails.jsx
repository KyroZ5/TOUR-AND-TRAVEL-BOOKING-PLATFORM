import { useEffect, useMemo, useRef } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import HotelIcon from '@mui/icons-material/Hotel';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BookingForm from '../../components/forms/BookingForm.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useCollection, useDocument } from '../../hooks/useFirestore.js';
import { packageDocRef } from '../../services/packageService.js';
import { destinationDocRef } from '../../services/destinationService.js';
import { openDeparturesQuery, remainingSlots } from '../../services/departureService.js';
import { formatPHP } from '../../utils/currency.js';
import { formatDate } from '../../utils/date.js';
import useAuth from '../../hooks/useAuth.js';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=60';

export default function TourDetails() {
  const { packageId } = useParams();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const bookingRef = useRef(null);

  const { data: pkg, loading, error } = useDocument(
    useMemo(() => packageDocRef(packageId), [packageId])
  );
  const destinationRef = useMemo(
    () => (pkg && pkg.destinationId ? destinationDocRef(pkg.destinationId) : null),
    [pkg]
  );
  const { data: destination } = useDocument(destinationRef);
  const { data: departures } = useCollection(
    useMemo(() => openDeparturesQuery(packageId), [packageId])
  );

  useEffect(() => {
    if (searchParams.get('book') === '1' && bookingRef.current) {
      bookingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams, pkg]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton width="50%" height={48} />
        <Skeleton width="90%" height={24} />
      </Container>
    );
  }

  if (error || !pkg) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <EmptyState
          title="Tour package not found"
          description="This package may have been removed or is not published."
          action={
            <Button component={RouterLink} to="/packages" variant="contained">
              Back to packages
            </Button>
          }
        />
      </Container>
    );
  }

  const images =
    Array.isArray(pkg.imageUrls) && pkg.imageUrls.length > 0 ? pkg.imageUrls : [PLACEHOLDER];

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <CardMedia
            component="img"
            image={images[0]}
            alt={pkg.name}
            sx={{ borderRadius: 3, height: { xs: 260, md: 400 }, objectFit: 'cover' }}
            onError={(event) => {
              event.currentTarget.src = PLACEHOLDER;
            }}
          />
          {images.length > 1 ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 1 }}>
              {images.map((image) => (
                <Box
                  key={image}
                  component="img"
                  src={image}
                  alt={pkg.name}
                  sx={{ width: 96, height: 66, objectFit: 'cover', borderRadius: 1.5 }}
                />
              ))}
            </Stack>
          ) : null}

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
            {pkg.category ? <Chip label={pkg.category} color="secondary" size="small" /> : null}
            <Chip icon={<ScheduleIcon />} label={`${pkg.durationDays}D / ${pkg.durationNights}N`} size="small" />
            {destination ? (
              <Chip
                icon={<LocationOnIcon />}
                label={destination.name}
                size="small"
                variant="outlined"
                component={RouterLink}
                to={`/destinations/${destination.id}`}
                clickable
              />
            ) : null}
          </Stack>

          <Typography variant="h3" fontWeight={800} sx={{ mt: 2 }}>
            {pkg.name}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {pkg.description}
          </Typography>

          <Divider sx={{ my: 3 }} />

          {pkg.itinerary && pkg.itinerary.length > 0 ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Itinerary
              </Typography>
              {pkg.itinerary.map((day) => (
                <Paper key={day.day} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={`Day ${day.day}`} size="small" color="primary" />
                    <Typography fontWeight={700}>{day.title}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {day.details}
                  </Typography>
                </Paper>
              ))}
            </Box>
          ) : null}

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Inclusions
              </Typography>
              {pkg.inclusions && pkg.inclusions.length > 0 ? (
                <List dense>
                  {pkg.inclusions.map((item) => (
                    <ListItem key={item} disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not specified.
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Exclusions
              </Typography>
              {pkg.exclusions && pkg.exclusions.length > 0 ? (
                <List dense>
                  {pkg.exclusions.map((item) => (
                    <ListItem key={item} disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CancelIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not specified.
                </Typography>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2}>
            {pkg.accommodation ? (
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <HotelIcon color="action" />
                  <Box>
                    <Typography fontWeight={700}>Accommodation</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pkg.accommodation}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            ) : null}
            {pkg.transportation ? (
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <DirectionsBusIcon color="action" />
                  <Box>
                    <Typography fontWeight={700}>Transportation</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pkg.transportation}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            ) : null}
          </Grid>

          {pkg.cancellationPolicy ? (
            <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mt: 3 }}>
              <Typography fontWeight={700}>Cancellation Policy</Typography>
              <Typography variant="body2">{pkg.cancellationPolicy}</Typography>
            </Alert>
          ) : null}

          {pkg.travelReminders ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography fontWeight={700}>Travel Reminders</Typography>
              <Typography variant="body2">{pkg.travelReminders}</Typography>
            </Alert>
          ) : null}
        </Grid>

        {/* Booking sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: { md: 'sticky' }, top: 88 }}>
            <CardContent>
              <Typography variant="h4" fontWeight={800} color="primary.main">
                {formatPHP(pkg.pricePerPerson)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                per person
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Available departures
              </Typography>
              {departures.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No open departures right now.
                </Typography>
              ) : (
                <List dense>
                  {departures.slice(0, 4).map((departure) => (
                    <ListItem key={departure.id} disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <EventIcon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={formatDate(departure.departureDate)}
                        secondary={`${remainingSlots(departure)} seat(s) left`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => bookingRef.current && bookingRef.current.scrollIntoView({ behavior: 'smooth' })}
              >
                Book Now
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Booking form section */}
      <Box ref={bookingRef} sx={{ mt: 4 }} id="booking-section">
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Reserve your spot
        </Typography>
        {isAuthenticated ? (
          <BookingForm pkg={pkg} departures={departures} destinationName={destination ? destination.name : ''} />
        ) : (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              Log in or create an account to book this tour.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
              <Button component={RouterLink} to="/login" variant="contained">
                Log in
              </Button>
              <Button component={RouterLink} to="/register" variant="outlined">
                Register
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>
    </Container>
  );
}
