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
import StringListField from './StringListField.jsx';
import ItineraryField from './ItineraryField.jsx';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import { createPackage, updatePackage } from '../../services/packageService.js';
import { validatePackage } from '../../utils/validation.js';
import { fromCentavos } from '../../utils/currency.js';

const CATEGORIES = [
  { value: 'island', label: 'Island Hopping' },
  { value: 'city', label: 'City Tour' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'cruise', label: 'Cruise' },
  { value: 'resort', label: 'Resort Getaway' },
];

const EMPTY = {
  name: '',
  destinationId: '',
  description: '',
  category: 'island',
  pricePerPerson: '',
  durationDays: 1,
  durationNights: 0,
  itinerary: [],
  inclusions: [''],
  exclusions: [''],
  imageUrls: [''],
  accommodation: '',
  transportation: '',
  cancellationPolicy: '',
  travelReminders: '',
  promotionId: '',
  isPublished: false,
  isFeatured: false,
};

export default function PackageForm({ open, initial, destinations = [], promotions = [], onClose, onSaved }) {
  const { showSuccess, showError } = useSnackbar();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setValues({
          ...EMPTY,
          ...initial,
          pricePerPerson: initial.pricePerPerson ? fromCentavos(initial.pricePerPerson) : '',
          itinerary: Array.isArray(initial.itinerary) ? initial.itinerary : [],
          inclusions: initial.inclusions && initial.inclusions.length ? initial.inclusions : [''],
          exclusions: initial.exclusions && initial.exclusions.length ? initial.exclusions : [''],
          imageUrls: initial.imageUrls && initial.imageUrls.length ? initial.imageUrls : [''],
          promotionId: initial.promotionId || '',
        });
      } else {
        setValues(EMPTY);
      }
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
    const validation = validatePackage(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        ...values,
        pricePerPerson: Number(values.pricePerPerson),
        durationDays: Number(values.durationDays),
        durationNights: Number(values.durationNights),
        promotionId: values.promotionId || null,
      };
      if (initial && initial.id) {
        await updatePackage(initial.id, payload);
        showSuccess('Tour package updated.');
      } else {
        await createPackage(payload);
        showSuccess('Tour package created.');
      }
      onSaved && onSaved();
      onClose();
    } catch (error) {
      showError(error?.message || 'Could not save the tour package.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initial ? 'Edit tour package' : 'New tour package'}</DialogTitle>
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Package name"
                name="name"
                value={values.name}
                onChange={handleChange}
                error={Boolean(errors.name)}
                helperText={errors.name}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Category"
                name="category"
                value={values.category}
                onChange={handleChange}
                fullWidth
              >
                {CATEGORIES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Destination"
                name="destinationId"
                value={values.destinationId}
                onChange={handleChange}
                error={Boolean(errors.destinationId)}
                helperText={errors.destinationId}
                fullWidth
                required
              >
                {destinations.length === 0 ? (
                  <MenuItem value="" disabled>
                    Create a destination first
                  </MenuItem>
                ) : (
                  destinations.map((destination) => (
                    <MenuItem key={destination.id} value={destination.id}>
                      {destination.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Price per person (PHP)"
                name="pricePerPerson"
                type="number"
                value={values.pricePerPerson}
                onChange={handleChange}
                error={Boolean(errors.pricePerPerson)}
                helperText={errors.pricePerPerson}
                inputProps={{ min: 0, step: '0.01' }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label="Days"
                name="durationDays"
                type="number"
                value={values.durationDays}
                onChange={handleChange}
                error={Boolean(errors.durationDays)}
                inputProps={{ min: 1 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label="Nights"
                name="durationNights"
                type="number"
                value={values.durationNights}
                onChange={handleChange}
                inputProps={{ min: 0 }}
                fullWidth
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
                minRows={4}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <ItineraryField
                value={values.itinerary}
                onChange={(list) => setValues((current) => ({ ...current, itinerary: list }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StringListField
                label="Inclusions"
                values={values.inclusions}
                onChange={(list) => setValues((current) => ({ ...current, inclusions: list }))}
                addLabel="Add inclusion"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StringListField
                label="Exclusions"
                values={values.exclusions}
                onChange={(list) => setValues((current) => ({ ...current, exclusions: list }))}
                addLabel="Add exclusion"
              />
            </Grid>
            <Grid item xs={12}>
              <StringListField
                label="Image URLs"
                values={values.imageUrls}
                onChange={(list) => setValues((current) => ({ ...current, imageUrls: list }))}
                error={errors.imageUrls}
                placeholder="https://…"
                addLabel="Add image"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Accommodation"
                name="accommodation"
                value={values.accommodation}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Transportation"
                name="transportation"
                value={values.transportation}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cancellation policy"
                name="cancellationPolicy"
                value={values.cancellationPolicy}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Travel reminders"
                name="travelReminders"
                value={values.travelReminders}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Linked promotion (optional)"
                name="promotionId"
                value={values.promotionId}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="">None</MenuItem>
                {promotions.map((promotion) => (
                  <MenuItem key={promotion.id} value={promotion.id}>
                    {promotion.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch name="isPublished" checked={values.isPublished} onChange={handleChange} />
                }
                label="Published"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch name="isFeatured" checked={values.isFeatured} onChange={handleChange} />
                }
                label="Featured"
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
            {initial ? 'Save changes' : 'Create package'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
