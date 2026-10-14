import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { formatPHP } from '../../utils/currency.js';
import { formatDate } from '../../utils/date.js';
import { validateBooking, isClean } from '../../utils/validation.js';
import { remainingSlots } from '../../services/departureService.js';
import { createBooking } from '../../services/bookingService.js';
import useAuth from '../../hooks/useAuth.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';

function errorMessage(error) {
  switch (error && error.code) {
    case 'INSUFFICIENT_SEATS':
    case 'DEPARTURE_CLOSED':
    case 'DEPARTURE_PAST':
    case 'PACKAGE_UNAVAILABLE':
      return error.message;
    case 'permission-denied':
      return 'You do not have permission to create this booking.';
    default:
      return (error && error.message) || 'We could not create your booking. Please try again.';
  }
}

/** Booking form shown on the tour package details page for signed-in customers. */
export default function BookingForm({ pkg, departures = [], destinationName = '' }) {
  const { profile, user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const navigate = useNavigate();

  const availableDepartures = useMemo(
    () => departures.filter((d) => d.status === 'open' && remainingSlots(d) > 0),
    [departures]
  );

  const [values, setValues] = useState({
    departureId: '',
    numberOfTravelers: 1,
    customerName: profile ? profile.fullName : '',
    customerEmail: profile ? profile.email : '',
    customerPhone: profile ? profile.phone : '',
    specialRequests: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const selectedDeparture = availableDepartures.find((d) => d.id === values.departureId) || null;
  const seatsLeft = selectedDeparture ? remainingSlots(selectedDeparture) : null;
  const travelers = Number(values.numberOfTravelers) || 0;
  const totalCentavos = (pkg.pricePerPerson || 0) * travelers;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateBooking(values);
    if (selectedDeparture && seatsLeft !== null && travelers > seatsLeft) {
      validation.numberOfTravelers = `Only ${seatsLeft} seat(s) available for this departure.`;
    }
    setErrors(validation);
    if (!isClean(validation)) {
      return;
    }
    if (!user) {
      setFormError('Please log in to complete your booking.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const created = await createBooking({
        customerId: user.uid,
        packageId: pkg.id,
        departureId: values.departureId,
        numberOfTravelers: travelers,
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        specialRequests: values.specialRequests,
      });
      showSuccess(`Booking ${created.bookingReference} submitted for confirmation.`);
      navigate(`/account/bookings/${created.id}`);
    } catch (error) {
      const message = errorMessage(error);
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (availableDepartures.length === 0) {
    return (
      <Alert severity="info">
        There are no open departures for this tour right now. Please check back later or contact us
        for upcoming schedules.
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Book this tour
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {pkg.name}
        {destinationName ? ` · ${destinationName}` : ''}
      </Typography>

      {formError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      ) : null}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={7}>
            <TextField
              select
              label="Departure schedule"
              name="departureId"
              value={values.departureId}
              onChange={handleChange}
              error={Boolean(errors.departureId)}
              helperText={errors.departureId || (selectedDeparture ? `${seatsLeft} seat(s) left` : ' ')}
              required
            >
              {availableDepartures.map((departure) => (
                <MenuItem key={departure.id} value={departure.id}>
                  {formatDate(departure.departureDate)} – {formatDate(departure.returnDate)} (
                  {remainingSlots(departure)} seats)
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Number of travelers"
              name="numberOfTravelers"
              type="number"
              value={values.numberOfTravelers}
              onChange={handleChange}
              error={Boolean(errors.numberOfTravelers)}
              helperText={errors.numberOfTravelers}
              inputProps={{ min: 1, max: seatsLeft || 30 }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Lead traveler name"
              name="customerName"
              value={values.customerName}
              onChange={handleChange}
              error={Boolean(errors.customerName)}
              helperText={errors.customerName}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Email"
              name="customerEmail"
              type="email"
              value={values.customerEmail}
              onChange={handleChange}
              error={Boolean(errors.customerEmail)}
              helperText={errors.customerEmail}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Phone"
              name="customerPhone"
              value={values.customerPhone}
              onChange={handleChange}
              error={Boolean(errors.customerPhone)}
              helperText={errors.customerPhone}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Special requests (optional)"
              name="specialRequests"
              value={values.specialRequests}
              onChange={handleChange}
              multiline
              minRows={2}
              inputProps={{ maxLength: 1000 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {formatPHP(pkg.pricePerPerson)} × {travelers} traveler(s)
            </Typography>
            <Typography variant="h5" fontWeight={800} color="primary.main">
              {formatPHP(totalCentavos)}
            </Typography>
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {submitting ? 'Submitting…' : 'Submit Booking'}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Your total is recalculated securely from our database when the booking is submitted.
        </Typography>
      </Box>
    </Paper>
  );
}
