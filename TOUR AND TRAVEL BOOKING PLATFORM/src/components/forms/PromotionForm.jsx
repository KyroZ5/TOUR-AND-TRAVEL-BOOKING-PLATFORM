import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import { createPromotion, updatePromotion } from '../../services/promotionService.js';
import { validatePromotion } from '../../utils/validation.js';
import { toInputDate } from '../../utils/date.js';

const EMPTY = {
  title: '',
  description: '',
  imageUrl: '',
  discountType: 'percent',
  discountValue: 10,
  applicablePackageIds: [],
  startDate: '',
  endDate: '',
  isActive: true,
};

export default function PromotionForm({ open, initial, packages = [], onClose, onSaved }) {
  const { showSuccess, showError } = useSnackbar();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(
        initial
          ? {
              ...EMPTY,
              ...initial,
              applicablePackageIds: Array.isArray(initial.applicablePackageIds)
                ? initial.applicablePackageIds
                : [],
              startDate: toInputDate(initial.startDate),
              endDate: toInputDate(initial.endDate),
            }
          : EMPTY
      );
      setErrors({});
    }
  }, [open, initial]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validatePromotion(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      const payload = { ...values, discountValue: Number(values.discountValue) };
      if (initial && initial.id) {
        await updatePromotion(initial.id, payload);
        showSuccess('Promotion updated.');
      } else {
        await createPromotion(payload);
        showSuccess('Promotion created.');
      }
      onSaved && onSaved();
      onClose();
    } catch (error) {
      showError(error?.message || 'Could not save the promotion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initial ? 'Edit promotion' : 'New promotion'}</DialogTitle>
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Title"
                name="title"
                value={values.title}
                onChange={handleChange}
                error={Boolean(errors.title)}
                helperText={errors.title}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                select
                label="Type"
                name="discountType"
                value={values.discountType}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="percent">Percent (%)</MenuItem>
                <MenuItem value="fixed">Fixed (PHP)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label="Value"
                name="discountValue"
                type="number"
                value={values.discountValue}
                onChange={handleChange}
                error={Boolean(errors.discountValue)}
                helperText={errors.discountValue}
                inputProps={{ min: 0, step: '0.01' }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={values.description}
                onChange={handleChange}
                error={Boolean(errors.description)}
                helperText={errors.description}
                fullWidth
                multiline
                minRows={2}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Image URL"
                name="imageUrl"
                value={values.imageUrl}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start date"
                name="startDate"
                type="date"
                value={values.startDate}
                onChange={handleChange}
                error={Boolean(errors.startDate)}
                helperText={errors.startDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End date"
                name="endDate"
                type="date"
                value={values.endDate}
                onChange={handleChange}
                error={Boolean(errors.endDate)}
                helperText={errors.endDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="applicable-packages-label">Applicable packages</InputLabel>
                <Select
                  labelId="applicable-packages-label"
                  multiple
                  name="applicablePackageIds"
                  value={values.applicablePackageIds}
                  onChange={handleChange}
                  label="Applicable packages"
                  renderValue={(selected) => `${selected.length} selected`}
                >
                  {packages.length === 0 ? (
                    <MenuItem value="" disabled>
                      No packages available
                    </MenuItem>
                  ) : (
                    packages.map((pkg) => (
                      <MenuItem key={pkg.id} value={pkg.id}>
                        <Checkbox checked={values.applicablePackageIds.includes(pkg.id)} />
                        <ListItemText primary={pkg.name} />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch name="isActive" checked={values.isActive} onChange={handleChange} />}
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {initial ? 'Save changes' : 'Create promotion'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
