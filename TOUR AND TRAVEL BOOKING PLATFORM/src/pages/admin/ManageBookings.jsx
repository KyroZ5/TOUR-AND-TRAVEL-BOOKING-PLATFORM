import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import PaginatedTable from '../../components/tables/PaginatedTable.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import StatusChip from '../../components/common/StatusChip.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import {
  allBookingsQuery,
  confirmBooking,
  rejectBooking,
  completeBooking,
  cancelBooking,
  updateBookingAdmin,
} from '../../services/bookingService.js';
import { logActivity } from '../../services/activityLogService.js';
import { formatPHP } from '../../utils/currency.js';
import { formatDate, formatDateTime } from '../../utils/date.js';
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

function DetailRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

export default function ManageBookings() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const { data: bookings, loading } = useCollection(useMemo(() => allBookingsQuery(), []));
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 250);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [active, setActive] = useState(null);

  const [detail, setDetail] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [working, setWorking] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesStatus = statusFilter === 'all' || b.bookingStatus === statusFilter;
      const matchesTerm =
        !term ||
        (b.bookingReference || '').toLowerCase().includes(term) ||
        (b.customerName || '').toLowerCase().includes(term) ||
        (b.customerEmail || '').toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [bookings, statusFilter, debounced]);

  const runAction = async (booking, action) => {
    setWorking(true);
    try {
      if (action === 'confirm') {
        await confirmBooking(booking.id, user.uid);
        showSuccess('Booking confirmed.');
      } else if (action === 'complete') {
        await completeBooking(booking.id, user.uid);
        showSuccess('Booking marked as completed.');
      } else if (action === 'cancel') {
        await cancelBooking(booking.id, user.uid, 'admin');
        showSuccess('Booking cancelled.');
      } else if (action === 'reject') {
        await rejectBooking(booking.id, user.uid, rejectReason);
        showSuccess('Booking rejected.');
        setRejectReason('');
        setRejectTarget(null);
      }
      await logActivity({
        actorUid: user.uid,
        action: `${action}_booking`,
        targetType: 'booking',
        targetId: booking.id,
        metadata: { reference: booking.bookingReference },
      });
    } catch (error) {
      showError(error?.message || 'The action could not be completed.');
    } finally {
      setWorking(false);
    }
  };

  const openDetail = (booking) => {
    setDetail(booking);
    setNotes(booking.adminNotes || '');
  };

  const saveNotes = async () => {
    if (!detail) return;
    setSavingNotes(true);
    try {
      await updateBookingAdmin(detail.id, { adminNotes: notes });
      showSuccess('Notes saved.');
    } catch (error) {
      showError('Could not save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const columns = [
    {
      key: 'reference',
      label: 'Reference',
      render: (row) => (
        <Typography variant="body2" fontWeight={700}>
          {row.bookingReference}
        </Typography>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <Box>
          <Typography variant="body2">{row.customerName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.customerEmail}
          </Typography>
        </Box>
      ),
    },
    { key: 'packageName', label: 'Package' },
    { key: 'departureDate', label: 'Departure', render: (row) => formatDate(row.departureDate) },
    { key: 'totalPrice', label: 'Total', align: 'right', render: (row) => formatPHP(row.totalPrice) },
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
      render: (row) => (
        <Tooltip title="Actions">
          <IconButton
            size="small"
            onClick={(event) => {
              setMenuAnchor(event.currentTarget);
              setActive(row);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const closeMenu = () => {
    setMenuAnchor(null);
    setActive(null);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Bookings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {bookings.length} booking(s) · {bookings.filter((b) => b.bookingStatus === 'pending').length}{' '}
        pending
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search reference, name, or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          sx={{ maxWidth: 360 }}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
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

      <PaginatedTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyTitle="No bookings"
        emptyDescription="Bookings placed by customers will appear here."
      />

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            openDetail(active);
            closeMenu();
          }}
        >
          View details
        </MenuItem>
        {active && active.bookingStatus === 'pending' ? (
          <MenuItem
            onClick={() => {
              runAction(active, 'confirm');
              closeMenu();
            }}
          >
            Confirm booking
          </MenuItem>
        ) : null}
        {active && active.bookingStatus === 'confirmed' ? (
          <MenuItem
            onClick={() => {
              setConfirmAction('complete');
              setConfirmTarget(active);
              closeMenu();
            }}
          >
            Mark completed
          </MenuItem>
        ) : null}
        {active && ['pending', 'confirmed'].includes(active.bookingStatus) ? (
          <MenuItem
            onClick={() => {
              setRejectTarget(active);
              closeMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            Reject booking
          </MenuItem>
        ) : null}
        {active && ['pending', 'confirmed'].includes(active.bookingStatus) ? (
          <MenuItem
            onClick={() => {
              setConfirmAction('cancel');
              setConfirmTarget(active);
              closeMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            Cancel booking
          </MenuItem>
        ) : null}
      </Menu>

      {/* Details dialog */}
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Booking {detail?.bookingReference}</DialogTitle>
        <DialogContent dividers>
          {detail ? (
            <Box>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <StatusChip type="booking" value={detail.bookingStatus} />
                <StatusChip type="payment" value={detail.paymentStatus} />
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DetailRow label="Package" value={detail.packageName} />
                  <DetailRow label="Departure" value={formatDate(detail.departureDate)} />
                  <DetailRow label="Return" value={formatDate(detail.returnDate)} />
                  <DetailRow label="Travelers" value={detail.numberOfTravelers} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DetailRow label="Customer" value={detail.customerName} />
                  <DetailRow label="Email" value={detail.customerEmail} />
                  <DetailRow label="Phone" value={detail.customerPhone} />
                  <DetailRow label="Total" value={formatPHP(detail.totalPrice)} />
                </Grid>
              </Grid>
              {detail.specialRequests ? (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">Special requests</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {detail.specialRequests}
                  </Typography>
                </Box>
              ) : null}

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Admin notes
              </Typography>
              <TextField
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                fullWidth
                multiline
                minRows={2}
                size="small"
              />
              <Button
                onClick={saveNotes}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                disabled={savingNotes}
              >
                Save notes
              </Button>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Status history
              </Typography>
              {Array.isArray(detail.statusHistory) && detail.statusHistory.length > 0 ? (
                <Stack spacing={0.5}>
                  {detail.statusHistory
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <Typography key={index} variant="caption" color="text.secondary">
                        <strong style={{ textTransform: 'capitalize' }}>{entry.status}</strong> ·{' '}
                        {formatDateTime(entry.at)}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </Typography>
                    ))}
                </Stack>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No history recorded.
                </Typography>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject booking</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide an optional reason (shared with the customer). Reserved seats will be released.
          </Typography>
          <TextField
            label="Reason"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)} disabled={working} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => runAction(rejectTarget, 'reject')}
            color="error"
            variant="contained"
            disabled={working}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmAction === 'cancel' ? 'Cancel booking' : 'Complete booking'}
        message={
          confirmAction === 'cancel'
            ? `Cancel booking ${confirmTarget?.bookingReference || ''}? Reserved seats will be released.`
            : `Mark booking ${confirmTarget?.bookingReference || ''} as completed?`
        }
        confirmLabel={confirmAction === 'cancel' ? 'Cancel booking' : 'Mark completed'}
        confirmColor={confirmAction === 'cancel' ? 'error' : 'primary'}
        loading={working}
        onConfirm={async () => {
          await runAction(confirmTarget, confirmAction);
          setConfirmTarget(null);
        }}
        onClose={() => setConfirmTarget(null)}
      />
    </Box>
  );
}
