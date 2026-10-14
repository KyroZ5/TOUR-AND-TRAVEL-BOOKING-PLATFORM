import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import StatusChip from '../../components/common/StatusChip.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { bookingsByCustomerQuery } from '../../services/bookingService.js';
import { formatPHP } from '../../utils/currency.js';
import { formatDate, toDate } from '../../utils/date.js';
import useAuth from '../../hooks/useAuth.js';

function StatCard({ icon, label, value, color }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function CustomerDashboard() {
  const { user, profile } = useAuth();
  const { data: bookings, loading } = useCollection(
    useMemo(() => (user ? bookingsByCustomerQuery(user.uid) : null), [user])
  );

  const stats = useMemo(() => {
    const upcoming = bookings.filter((booking) => {
      const date = toDate(booking.departureDate);
      return (
        date &&
        date.getTime() > Date.now() &&
        ['pending', 'confirmed'].includes(booking.bookingStatus)
      );
    });
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.bookingStatus === 'pending').length,
      confirmed: bookings.filter((b) => b.bookingStatus === 'confirmed').length,
      upcoming: upcoming.length,
    };
  }, [bookings]);

  const recent = bookings.slice(0, 5);

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Welcome back{profile ? `, ${profile.fullName.split(' ')[0]}` : ''}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Here is an overview of your bookings and upcoming trips.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <StatCard icon={<BookOnlineIcon />} label="Total bookings" value={stats.total} color="primary.main" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<HourglassEmptyIcon />}
            label="Pending"
            value={stats.pending}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<CheckCircleIcon />}
            label="Confirmed"
            value={stats.confirmed}
            color="success.main"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<FlightTakeoffIcon />}
            label="Upcoming trips"
            value={stats.upcoming}
            color="secondary.main"
          />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Recent activity
            </Typography>
            <Button component={RouterLink} to="/account/bookings" size="small">
              View all
            </Button>
          </Stack>
          <Divider sx={{ my: 2 }} />

          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Loading your bookings…
            </Typography>
          ) : recent.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="When you book a tour, it will appear here."
              action={
                <Button component={RouterLink} to="/packages" variant="contained" sx={{ mt: 1 }}>
                  Browse tour packages
                </Button>
              }
            />
          ) : (
            <Stack divider={<Divider flexItem />} spacing={2}>
              {recent.map((booking) => (
                <Stack
                  key={booking.id}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Box>
                    <Typography fontWeight={700}>{booking.packageName || 'Tour package'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {booking.bookingReference} · Departure {formatDate(booking.departureDate)} ·{' '}
                      {booking.numberOfTravelers} traveler(s) · {formatPHP(booking.totalPrice)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StatusChip type="booking" value={booking.bookingStatus} />
                    <Button
                      component={RouterLink}
                      to={`/account/bookings/${booking.id}`}
                      size="small"
                      variant="text"
                    >
                      Details
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
