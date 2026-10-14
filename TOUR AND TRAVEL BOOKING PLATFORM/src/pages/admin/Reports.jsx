import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import DownloadIcon from '@mui/icons-material/Download';
import { useCollection } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import { allBookingsQuery } from '../../services/bookingService.js';
import { allPaymentsQuery } from '../../services/paymentService.js';
import {
  summarizeBookings,
  calculateCollectedRevenue,
  filterBookingsByRange,
  toCsv,
  downloadCsv,
} from '../../services/reportService.js';
import { formatPHP } from '../../utils/currency.js';
import { formatDate } from '../../utils/date.js';

function Metric({ label, value }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" fontWeight={800}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const { showSuccess } = useSnackbar();
  const { data: bookings } = useCollection(useMemo(() => allBookingsQuery(), []));
  const { data: payments } = useCollection(useMemo(() => allPaymentsQuery(), []));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    return filterBookingsByRange(bookings, start, end);
  }, [bookings, startDate, endDate]);

  const summary = useMemo(() => summarizeBookings(filtered), [filtered]);
  const collected = useMemo(
    () => calculateCollectedRevenue(payments, filtered),
    [payments, filtered]
  );

  const handleExport = () => {
    const csv = toCsv(filtered, [
      { label: 'Reference', value: (row) => row.bookingReference },
      { label: 'Customer', value: (row) => row.customerName },
      { label: 'Email', value: (row) => row.customerEmail },
      { label: 'Package', value: (row) => row.packageName },
      { label: 'Departure', value: (row) => formatDate(row.departureDate) },
      { label: 'Travelers', value: (row) => row.numberOfTravelers },
      { label: 'Total (PHP)', value: (row) => (Number(row.totalPrice) || 0) / 100 },
      { label: 'Booking status', value: (row) => row.bookingStatus },
      { label: 'Payment status', value: (row) => row.paymentStatus },
      { label: 'Booked on', value: (row) => formatDate(row.createdAt) },
    ]);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`bookings-report-${stamp}.csv`, csv);
    showSuccess('Report exported.');
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Analyze bookings and revenue. Leave the dates empty to include all records.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Start date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="End date"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
          Export CSV
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Metric label="Bookings" value={summary.total} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Metric label="Travelers" value={summary.travelers} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Metric label="Booking value" value={formatPHP(summary.totalBookingValue)} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Metric label="Collected revenue" value={formatPHP(collected)} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={2}>
          <Metric label="Pending" value={summary.pending} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Metric label="Confirmed" value={summary.confirmed} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Metric label="Completed" value={summary.completed} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Metric label="Cancelled" value={summary.cancelled} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Metric label="Rejected" value={summary.rejected} />
        </Grid>
      </Grid>

      <Paper variant="outlined">
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Package</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Departure</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Travelers
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Total
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No bookings in this range.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(0, 100).map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.bookingReference}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.packageName}</TableCell>
                    <TableCell>{formatDate(row.departureDate)}</TableCell>
                    <TableCell align="center">{row.numberOfTravelers}</TableCell>
                    <TableCell align="right">{formatPHP(row.totalPrice)}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{row.bookingStatus}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {filtered.length > 100 ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Showing the first 100 rows. Export the CSV for the full report.
        </Typography>
      ) : null}
    </Box>
  );
}
