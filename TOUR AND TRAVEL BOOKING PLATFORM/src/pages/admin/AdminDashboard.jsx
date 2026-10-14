import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import PaymentsIcon from '@mui/icons-material/Payments';
import PeopleIcon from '@mui/icons-material/People';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import StatusChip from '../../components/common/StatusChip.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { allBookingsQuery } from '../../services/bookingService.js';
import { allPaymentsQuery } from '../../services/paymentService.js';
import { allPackagesQuery } from '../../services/packageService.js';
import { allDestinationsQuery } from '../../services/destinationService.js';
import { customersQuery } from '../../services/userService.js';
import {
  summarizeBookings,
  calculateCollectedRevenue,
  popularPackages,
  popularDestinations,
  groupBookingsByMonth,
} from '../../services/reportService.js';
import { formatPHP } from '../../utils/currency.js';
import { formatDate } from '../../utils/date.js';

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

export default function AdminDashboard() {
  const { data: bookings } = useCollection(useMemo(() => allBookingsQuery(), []));
  const { data: payments } = useCollection(useMemo(() => allPaymentsQuery(), []));
  const { data: packages } = useCollection(useMemo(() => allPackagesQuery(), []));
  const { data: destinations } = useCollection(useMemo(() => allDestinationsQuery(), []));
  const { data: customers } = useCollection(useMemo(() => customersQuery(), []));

  const summary = useMemo(() => summarizeBookings(bookings), [bookings]);
  const collected = useMemo(
    () => calculateCollectedRevenue(payments, bookings),
    [payments, bookings]
  );
  const packageMap = useMemo(() => new Map(packages.map((p) => [p.id, p])), [packages]);
  const destinationMap = useMemo(() => new Map(destinations.map((d) => [d.id, d])), [destinations]);
  const packageToDestination = useMemo(
    () => new Map(packages.map((p) => [p.id, p.destinationId])),
    [packages]
  );

  const topPackages = useMemo(() => popularPackages(bookings, 5), [bookings]);
  const topDestinations = useMemo(
    () => popularDestinations(bookings, packageToDestination, 5),
    [bookings, packageToDestination]
  );
  const monthly = useMemo(() => groupBookingsByMonth(bookings).slice(-6), [bookings]);
  const maxMonth = Math.max(1, ...monthly.map((m) => m.count));
  const recent = bookings.slice(0, 5);
  const pendingPayments = payments.filter((p) => p.paymentStatus === 'pending_verification').length;

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Admin Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        A snapshot of bookings, revenue, and activity across the platform.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <StatCard icon={<BookOnlineIcon />} label="Total bookings" value={summary.total} color="primary.main" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<PaymentsIcon />}
            label="Collected revenue"
            value={formatPHP(collected)}
            color="success.main"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<PeopleIcon />} label="Customers" value={customers.length} color="secondary.main" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<FlightTakeoffIcon />}
            label="Pending payments"
            value={pendingPayments}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={700}>
                  Recent bookings
                </Typography>
                <Button component={RouterLink} to="/admin/bookings" size="small">
                  Manage
                </Button>
              </Stack>
              <Divider sx={{ my: 2 }} />
              {recent.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No bookings yet.
                </Typography>
              ) : (
                <Stack divider={<Divider flexItem />} spacing={1.5}>
                  {recent.map((booking) => (
                    <Stack
                      key={booking.id}
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={0.5}
                    >
                      <Box>
                        <Typography fontWeight={700}>
                          {booking.bookingReference} · {booking.packageName || 'Package'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.customerName} · {formatDate(booking.departureDate)} ·{' '}
                          {formatPHP(booking.totalPrice)}
                        </Typography>
                      </Box>
                      <StatusChip type="booking" value={booking.bookingStatus} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Bookings per month
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {monthly.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Not enough data yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {monthly.map((month) => (
                    <Box key={month.month}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">{month.month}</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {month.count}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(month.count / maxMonth) * 100}
                        sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Booking status breakdown
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <Stack direction="row" justifyContent="space-between" width="100%">
                    <Typography variant="body2">Pending</Typography>
                    <StatusChip type="booking" value="pending" size="small" />
                  </Stack>
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <Stack direction="row" justifyContent="space-between" width="100%">
                    <Typography variant="body2">Confirmed</Typography>
                    <StatusChip type="booking" value="confirmed" size="small" />
                  </Stack>
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <Stack direction="row" justifyContent="space-between" width="100%">
                    <Typography variant="body2">Completed</Typography>
                    <StatusChip type="booking" value="completed" size="small" />
                  </Stack>
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <Stack direction="row" justifyContent="space-between" width="100%">
                    <Typography variant="body2">Cancelled</Typography>
                    <StatusChip type="booking" value="cancelled" size="small" />
                  </Stack>
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <Stack direction="row" justifyContent="space-between" width="100%">
                    <Typography variant="body2">Rejected</Typography>
                    <StatusChip type="booking" value="rejected" size="small" />
                  </Stack>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Top packages
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {topPackages.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No bookings yet.
                </Typography>
              ) : (
                <List dense>
                  {topPackages.map((item) => (
                    <ListItem key={item.packageId} sx={{ px: 0 }}>
                      <Stack direction="row" justifyContent="space-between" width="100%">
                        <Typography variant="body2">
                          {packageMap.get(item.packageId)?.name || 'Unknown package'}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {item.count}
                        </Typography>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Top destinations
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {topDestinations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No bookings yet.
                </Typography>
              ) : (
                <List dense>
                  {topDestinations.map((item) => (
                    <ListItem key={item.destinationId} sx={{ px: 0 }}>
                      <Stack direction="row" justifyContent="space-between" width="100%">
                        <Typography variant="body2">
                          {destinationMap.get(item.destinationId)?.name || 'Unknown destination'}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {item.count}
                        </Typography>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
