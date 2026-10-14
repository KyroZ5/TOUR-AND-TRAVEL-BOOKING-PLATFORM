import Chip from '@mui/material/Chip';

const BOOKING_STATUS = {
  pending: { label: 'Pending', color: 'warning' },
  confirmed: { label: 'Confirmed', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'default' },
  completed: { label: 'Completed', color: 'info' },
};

const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', color: 'default' },
  pending_verification: { label: 'Pending verification', color: 'warning' },
  partially_paid: { label: 'Partially paid', color: 'info' },
  paid: { label: 'Paid', color: 'success' },
  refunded: { label: 'Refunded', color: 'secondary' },
  rejected: { label: 'Rejected', color: 'error' },
};

const ACCOUNT_STATUS = {
  active: { label: 'Active', color: 'success' },
  disabled: { label: 'Disabled', color: 'error' },
};

const DEPARTURE_STATUS = {
  open: { label: 'Open', color: 'success' },
  closed: { label: 'Closed', color: 'default' },
  cancelled: { label: 'Cancelled', color: 'error' },
  completed: { label: 'Completed', color: 'info' },
};

const MAPS = {
  booking: BOOKING_STATUS,
  payment: PAYMENT_STATUS,
  account: ACCOUNT_STATUS,
  departure: DEPARTURE_STATUS,
};

/** Colored status chip for bookings, payments, accounts, and departures. */
export default function StatusChip({ type = 'booking', value, size = 'small' }) {
  const map = MAPS[type] || BOOKING_STATUS;
  const config = map[value] || { label: value || 'Unknown', color: 'default' };
  return <Chip label={config.label} color={config.color} size={size} variant="filled" />;
}
