import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import PaginatedTable from '../../components/tables/PaginatedTable.jsx';
import StatusChip from '../../components/common/StatusChip.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import { allPaymentsQuery, verifyPayment } from '../../services/paymentService.js';
import { allBookingsQuery } from '../../services/bookingService.js';
import { logActivity } from '../../services/activityLogService.js';
import { formatPHP } from '../../utils/currency.js';
import { formatDate } from '../../utils/date.js';
import useAuth from '../../hooks/useAuth.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending_verification', label: 'Pending verification' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];

export default function ManagePayments() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const { data: payments, loading } = useCollection(useMemo(() => allPaymentsQuery(), []));
  const { data: bookings } = useCollection(useMemo(() => allBookingsQuery(), []));
  const [statusFilter, setStatusFilter] = useState('pending_verification');
  const [target, setTarget] = useState(null);
  const [approve, setApprove] = useState(true);
  const [working, setWorking] = useState(false);

  const bookingMap = useMemo(() => new Map(bookings.map((b) => [b.id, b])), [bookings]);

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? payments
        : payments.filter((p) => p.paymentStatus === statusFilter),
    [payments, statusFilter]
  );

  const handleVerify = async () => {
    if (!target) return;
    setWorking(true);
    const booking = bookingMap.get(target.bookingId);
    try {
      await verifyPayment(target.id, user.uid, {
        approved: approve,
        bookingId: target.bookingId,
        amount: target.amount,
        totalPrice: booking?.totalPrice,
      });
      await logActivity({
        actorUid: user.uid,
        action: approve ? 'approve_payment' : 'reject_payment',
        targetType: 'payment',
        targetId: target.id,
        metadata: { bookingId: target.bookingId, amount: target.amount },
      });
      showSuccess(approve ? 'Payment approved.' : 'Payment rejected.');
      setTarget(null);
    } catch (error) {
      showError(error?.message || 'Could not update the payment.');
    } finally {
      setWorking(false);
    }
  };

  const columns = [
    {
      key: 'booking',
      label: 'Booking',
      render: (row) => {
        const booking = bookingMap.get(row.bookingId);
        return (
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {booking?.bookingReference || 'Unknown'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {booking?.customerName || ''}
            </Typography>
          </Box>
        );
      },
    },
    { key: 'amount', label: 'Amount', align: 'right', render: (row) => formatPHP(row.amount) },
    { key: 'paymentMethod', label: 'Method', render: (row) => row.paymentMethod },
    {
      key: 'referenceNumber',
      label: 'Reference',
      render: (row) =>
        row.receiptUrl ? (
          <Link href={row.receiptUrl} target="_blank" rel="noopener">
            {row.referenceNumber || 'Receipt'}
          </Link>
        ) : (
          row.referenceNumber || '—'
        ),
    },
    { key: 'createdAt', label: 'Submitted', render: (row) => formatDate(row.createdAt) },
    {
      key: 'paymentStatus',
      label: 'Status',
      render: (row) => <StatusChip type="payment" value={row.paymentStatus} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) =>
        row.paymentStatus === 'pending_verification' ? (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => {
                setApprove(true);
                setTarget(row);
              }}
            >
              Approve
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => {
                setApprove(false);
                setTarget(row);
              }}
            >
              Reject
            </Button>
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            —
          </Typography>
        ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Payments
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {payments.filter((p) => p.paymentStatus === 'pending_verification').length} payment(s)
        awaiting verification
      </Typography>

      <TextField
        select
        label="Status"
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        size="small"
        sx={{ mb: 2, minWidth: 220 }}
      >
        {STATUS_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <PaginatedTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyTitle="No payments"
        emptyDescription="Customer payment submissions will appear here for verification."
      />

      <ConfirmDialog
        open={Boolean(target)}
        title={approve ? 'Approve payment' : 'Reject payment'}
        message={
          approve
            ? `Approve ${formatPHP(target?.amount || 0)} for this booking? The booking payment status will be updated.`
            : `Reject ${formatPHP(target?.amount || 0)} for this booking?`
        }
        confirmLabel={approve ? 'Approve' : 'Reject'}
        confirmColor={approve ? 'success' : 'error'}
        loading={working}
        onConfirm={handleVerify}
        onClose={() => setTarget(null)}
      />
    </Box>
  );
}
