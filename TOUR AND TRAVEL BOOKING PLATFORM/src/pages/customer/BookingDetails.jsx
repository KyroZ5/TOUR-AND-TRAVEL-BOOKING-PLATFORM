import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StatusChip from '../../components/common/StatusChip.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useCollection, useDocument } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import { bookingDocRef, cancelBooking, canCancelBooking } from '../../services/bookingService.js';
import { packageDocRef } from '../../services/packageService.js';
import { paymentsByBookingQuery, submitPayment } from '../../services/paymentService.js';
import { formatPHP, toCentavos } from '../../utils/currency.js';
import { formatDate, formatDateTime } from '../../utils/date.js';
import useAuth from '../../hooks/useAuth.js';

const PAYMENT_METHODS = [
  { value: 'gcash', label: 'GCash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash (office)' },
  { value: 'other', label: 'Other' },
];

function Row({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

export default function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();

  const { data: booking, loading, error } = useDocument(
    useMemo(() => bookingDocRef(bookingId), [bookingId])
  );
  const packageRef = useMemo(
    () => (booking && booking.packageId ? packageDocRef(booking.packageId) : null),
    [booking]
  );
  const { data: pkg } = useDocument(packageRef);
  const { data: payments } = useCollection(
    useMemo(() => (bookingId ? paymentsByBookingQuery(bookingId) : null), [bookingId])
  );

  const [pay, setPay] = useState({ amount: '', paymentMethod: 'gcash', referenceNumber: '', receiptUrl: '' });
  const [payError, setPayError] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (loading) {
    return (
      <Box>
        <Skeleton width={200} height={40} />
        <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2, mt: 2 }} />
      </Box>
    );
  }

  if (error || !booking || (booking.customerId && user && booking.customerId !== user.uid)) {
    return (
      <EmptyState
        title="Booking not found"
        description="This booking does not exist or you do not have access to it."
        action={
          <Button component={RouterLink} to="/account/bookings" variant="contained">
            Back to my bookings
          </Button>
        }
      />
    );
  }

  const cancellable = canCancelBooking(booking, { departureDate: booking.departureDate });

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking(booking.id, user.uid, 'customer');
      showSuccess('Booking cancelled and seats released.');
      setConfirmCancel(false);
    } catch (err) {
      showError(err?.message || 'Unable to cancel this booking.');
    } finally {
      setCancelling(false);
    }
  };

  const handlePaySubmit = async (event) => {
    event.preventDefault();
    const amountPesos = Number(pay.amount);
    if (!amountPesos || amountPesos <= 0) {
      setPayError('Enter the amount you paid.');
      return;
    }
    setPayError('');
    setSubmittingPay(true);
    try {
      await submitPayment({
        bookingId: booking.id,
        customerId: user.uid,
        amount: toCentavos(amountPesos),
        paymentMethod: pay.paymentMethod,
        referenceNumber: pay.referenceNumber,
        receiptUrl: pay.receiptUrl.trim(),
      });
      setPay({ amount: '', paymentMethod: 'gcash', referenceNumber: '', receiptUrl: '' });
      showSuccess('Payment submitted. Our team will verify it shortly.');
    } catch (err) {
      showError(err?.message || 'Could not submit your payment.');
    } finally {
      setSubmittingPay(false);
    }
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/account/bookings')} sx={{ mb: 2 }}>
        Back to My Bookings
      </Button>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={800}>
          {booking.bookingReference}
        </Typography>
        <StatusChip type="booking" value={booking.bookingStatus} size="medium" />
        <StatusChip type="payment" value={booking.paymentStatus} size="medium" />
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Trip details
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Row label="Package" value={booking.packageName || '—'} />
              <Row label="Departure date" value={formatDate(booking.departureDate)} />
              <Row label="Return date" value={formatDate(booking.returnDate)} />
              <Row label="Travelers" value={booking.numberOfTravelers} />
              <Row label="Lead traveler" value={booking.customerName || '—'} />
              <Row label="Email" value={booking.customerEmail || '—'} />
              <Row label="Phone" value={booking.customerPhone || '—'} />
              {booking.specialRequests ? (
                <Row label="Special requests" value={booking.specialRequests} />
              ) : null}
              <Divider sx={{ my: 1.5 }} />
              <Row
                label={`Price per person × ${booking.numberOfTravelers}`}
                value={formatPHP(booking.pricePerPerson)}
              />
              <Stack direction="row" justifyContent="space-between" sx={{ pt: 1 }}>
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={800} color="primary.main">
                  {formatPHP(booking.totalPrice)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {pkg && pkg.cancellationPolicy ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography fontWeight={700}>Cancellation policy</Typography>
              <Typography variant="body2">{pkg.cancellationPolicy}</Typography>
            </Alert>
          ) : null}

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Status history
              </Typography>
              {Array.isArray(booking.statusHistory) && booking.statusHistory.length > 0 ? (
                <Stack spacing={0}>
                  {booking.statusHistory.slice().reverse().map((entry, index, arr) => (
                    <Stack key={`${entry.status}-${index}`} direction="row" spacing={2}>
                      <Stack alignItems="center" sx={{ width: 16 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: 'secondary.main',
                            mt: 0.5,
                          }}
                        />
                        {index < arr.length - 1 ? (
                          <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider', minHeight: 28 }} />
                        ) : null}
                      </Stack>
                      <Box sx={{ pb: 2 }}>
                        <Typography fontWeight={600} textTransform="capitalize">
                          {entry.status}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(entry.at)}
                          {entry.note ? ` · ${entry.note}` : ''}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No history recorded.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Payments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Submit your payment reference below. An administrator verifies each payment manually.
              </Typography>

              {payments.length > 0 ? (
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {payments.map((item) => (
                    <Stack
                      key={item.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {formatPHP(item.amount)} · {item.paymentMethod}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.referenceNumber || 'No reference'} · {formatDate(item.createdAt)}
                        </Typography>
                      </Box>
                      <StatusChip type="payment" value={item.paymentStatus} />
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No payments submitted yet.
                </Typography>
              )}

              {['cancelled', 'rejected', 'completed'].includes(booking.bookingStatus) ? (
                <Alert severity="info">This booking is closed and cannot accept new payments.</Alert>
              ) : (
                <Box component="form" onSubmit={handlePaySubmit} noValidate>
                  <TextField
                    label="Amount paid (PHP)"
                    type="number"
                    value={pay.amount}
                    onChange={(event) => setPay((c) => ({ ...c, amount: event.target.value }))}
                    error={Boolean(payError)}
                    helperText={payError || `Balance: ${formatPHP(booking.totalPrice)}`}
                    fullWidth
                    margin="dense"
                    inputProps={{ min: 1, step: '0.01' }}
                  />
                  <TextField
                    select
                    label="Payment method"
                    value={pay.paymentMethod}
                    onChange={(event) => setPay((c) => ({ ...c, paymentMethod: event.target.value }))}
                    fullWidth
                    margin="dense"
                  >
                    {PAYMENT_METHODS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Reference number"
                    value={pay.referenceNumber}
                    onChange={(event) => setPay((c) => ({ ...c, referenceNumber: event.target.value }))}
                    fullWidth
                    margin="dense"
                  />
                  <TextField
                    label="Receipt image URL (optional)"
                    value={pay.receiptUrl}
                    onChange={(event) => setPay((c) => ({ ...c, receiptUrl: event.target.value }))}
                    fullWidth
                    margin="dense"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    sx={{ mt: 1 }}
                    disabled={submittingPay}
                    startIcon={submittingPay ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    Submit payment
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Actions
              </Typography>
              {cancellable ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setConfirmCancel(true)}
                  fullWidth
                >
                  Cancel booking
                </Button>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  This booking can no longer be cancelled online. Please contact support for
                  assistance.
                </Typography>
              )}
              <Button
                component={RouterLink}
                to="/contact"
                variant="text"
                fullWidth
                sx={{ mt: 1 }}
              >
                Contact support
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel booking"
        message={`Cancel booking ${booking.bookingReference}? Reserved seats will be released.`}
        confirmLabel="Cancel booking"
        confirmColor="error"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setConfirmCancel(false)}
      />
    </Box>
  );
}
