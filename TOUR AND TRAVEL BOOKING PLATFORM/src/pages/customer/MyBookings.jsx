import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import PaginatedTable from '../../components/tables/PaginatedTable.jsx';
import StatusChip from '../../components/common/StatusChip.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import {
  bookingsByCustomerQuery,
  cancelBooking,
  canCancelBooking,
} from '../../services/bookingService.js';
import { formatPHP } from '../../utils/currency.js';
import { formatDate, toDate } from '../../utils/date.js';
import useAuth from '../../hooks/useAuth.js';
import useDebounce from '../../hooks/useDebounce.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
];

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [target, setTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const { data: bookings, loading } = useCollection(
    useMemo(() => (user ? bookingsByCustomerQuery(user.uid) : null), [user])
  );

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = status === 'all' || booking.bookingStatus === status;
      const matchesSearch =
        !term ||
        (booking.bookingReference || '').toLowerCase().includes(term) ||
        (booking.packageName || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, status, debouncedSearch]);

  const handleCancel = async () => {
    if (!target || !user) return;
    setCancelling(true);
    try {
      await cancelBooking(target.id, user.uid, 'customer');
      showSuccess(`Booking ${target.bookingReference} cancelled.`);
      setTarget(null);
    } catch (error) {
      showError(error?.message || 'Unable to cancel this booking.');
    } finally {
      setCancelling(false);
    }
  };

  const columns = [
    {
      key: 'reference',
      label: 'Reference',
      render: (row) => <Typography variant="body2" fontWeight={700}>{row.bookingReference}</Typography>,
    },
    { key: 'packageName', label: 'Package' },
    { key: 'departureDate', label: 'Departure', render: (row) => formatDate(row.departureDate) },
    { key: 'travelers', label: 'Travelers', align: 'center', render: (row) => row.numberOfTravelers },
    { key: 'total', label: 'Total', align: 'right', render: (row) => formatPHP(row.totalPrice) },
    {
      key: 'bookingStatus',
      label: 'Booking',
      render: (row) => <StatusChip type="booking" value={row.bookingStatus} />,
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (row) => <StatusChip type="payment" value={row.paymentStatus} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => {
        const renewable = canCancelBooking(row, { departureDate: row.departureDate });
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="View details">
              <IconButton size="small" onClick={() => navigate(`/account/bookings/${row.id}`)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {renewable ? (
              <Tooltip title="Cancel booking">
                <IconButton size="small" color="error" onClick={() => setTarget(row)}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        );
      },
    },
  ];

  const upcomingCount = bookings.filter((booking) => {
    const date = toDate(booking.departureDate);
    return date && date.getTime() > Date.now() && ['pending', 'confirmed'].includes(booking.bookingStatus);
  }).length;

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        My Bookings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {bookings.length} total booking(s){upcomingCount > 0 ? ` · ${upcomingCount} upcoming` : ''}.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Search by reference or package"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              size="small"
              sx={{ minWidth: 180 }}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <PaginatedTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyTitle="No bookings found"
        emptyDescription="Try changing your filters, or book a new tour package."
      />

      <ConfirmDialog
        open={Boolean(target)}
        title="Cancel booking"
        message={`Are you sure you want to cancel booking ${target?.bookingReference || ''}? Reserved seats will be released.`}
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        confirmColor="error"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setTarget(null)}
      />
    </Box>
  );
}
