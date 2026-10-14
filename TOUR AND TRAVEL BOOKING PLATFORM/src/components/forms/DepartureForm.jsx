import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import { createDeparture, updateDeparture } from '../../services/departureService.js';
import { validateDeparture } from '../../utils/validation.js';
import { toInputDate } from '../../utils/date.js';

const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

export default function DepartureForm({ open, initial, packages = [], onClose, onSaved }) {
  const { showSuccess, showError } = useSnackbar();
  const [values, setValues] = useState({
    packageId: '',
    departureDate: '',
    returnDate: '',
    capacity: 20,
    status: 'open',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(
        initial
          ? {
              packageId: initial.packageId || '',
              departureDate: toInputDate(initial.departureDate),
              returnDate: toInputDate(initial.returnDate),
              capacity: initial.capacity || 20,
              status: initial.status || 'open',
            }
          : { packageId: '', departureDate: '', returnDate: '', capacity: 20, status: 'open' }
      );
      setErrors({});
    }
  }, [open, initial]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateDeparture(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      const payload = { ...values, capacity: Number(values.capacity) };
      if (initial && initial.id) {
        await updateDeparture(initial.id, payload);
        showSuccess('Departure updated.');
      } else {
        await createDeparture(payload);
        showSuccess('Departure scheduled.');
      }
      onSaved && onSaved();
      onClose();
    } catch (error) {
      showError(error?.message || 'Could not save the departure.');
    } finally {
      setSaving(false);
    }
  };

  const booked = initial ? Number(initial.bookedCount) || 0 : 0;
  const capacityTooLow = Number(values.capacity) < booked;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Edit departure' : 'Schedule departure'}</DialogTitle>
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                label="Tour package"
                name="packageId"
                value={values.packageId}
                onChange={handleChange}
                error={Boolean(errors.packageId)}
                helperText={errors.packageId}
                fullWidth
              >
                {packages.length === 0 ? (
                  <MenuItem value="" disabled>
                    No packages available
                  </MenuItem>
                ) : (
                  packages.map((pkg) => (
                    <MenuItem key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Departure date"
                name="departureDate"
                type="date"
                value={values.departureDate}
                onChange={handleChange}
                error={Boolean(errors.departureDate)}
                helperText={errors.departureDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Return date"
                name="returnDate"
                type="date"
                value={values.returnDate}
                onChange={handleChange}
                error={Boolean(errors.returnDate)}
                helperText={errors.returnDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Capacity"
                name="capacity"
                type="number"
                value={values.capacity}
                onChange={handleChange}
                error={Boolean(errors.capacity) || capacityTooLow}
                helperText={
                  errors.capacity ||
                  (capacityTooLow ? `Capacity cannot be below booked seats (${booked}).` : ' ')
                }
                inputProps={{ min: Math.max(1, booked) }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Status"
                name="status"
                value={values.status}
                onChange={handleChange}
                fullWidth
              >
                {STATUSES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {capacityTooLow ? (
              <Grid item xs={12}>
                <Alert severity="warning">
                  {booked} seat(s) are already booked for this departure.
                </Alert>
              </Grid>
            ) : null}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || capacityTooLow}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {initial ? 'Save changes' : 'Schedule departure'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
