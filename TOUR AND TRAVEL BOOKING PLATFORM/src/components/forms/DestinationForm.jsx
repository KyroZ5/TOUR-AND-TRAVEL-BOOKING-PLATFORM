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
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import { createDestination, updateDestination } from '../../services/destinationService.js';
import { validateDestination } from '../../utils/validation.js';

const CATEGORIES = [
  { value: 'beach', label: 'Beach & Islands' },
  { value: 'mountain', label: 'Mountain & Nature' },
  { value: 'city', label: 'City & Culture' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'heritage', label: 'Heritage' },
  { value: 'resort', label: 'Resort' },
];

const EMPTY = {
  name: '',
  country: '',
  region: '',
  location: '',
  category: 'beach',
  description: '',
  latitude: '',
  longitude: '',
  imageUrls: [''],
  isPublished: false,
  isFeatured: false,
};

export default function DestinationForm({ open, initial, onClose, onSaved }) {
  const { showSuccess, showError } = useSnackbar();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial ? { ...EMPTY, ...initial } : EMPTY);
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
    const validation = validateDestination(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      if (initial && initial.id) {
        await updateDestination(initial.id, values);
        showSuccess('Destination updated.');
      } else {
        await createDestination(values);
        showSuccess('Destination created.');
      }
      onSaved && onSaved();
      onClose();
    } catch (error) {
      showError(error?.message || 'Could not save the destination.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initial ? 'Edit destination' : 'New destination'}</DialogTitle>
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Name"
                name="name"
                value={values.name}
                onChange={handleChange}
                error={Boolean(errors.name)}
                helperText={errors.name}
                fullWidth
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country"
                name="country"
                value={values.country}
                onChange={handleChange}
                error={Boolean(errors.country)}
                helperText={errors.country}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Region / Province"
                name="region"
                value={values.region}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Location"
                name="location"
                value={values.location}
                onChange={handleChange}
                error={Boolean(errors.location)}
                helperText={errors.location || 'City / area shown on the map and listing.'}
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
                minRows={4}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Latitude"
                name="latitude"
                value={values.latitude ?? ''}
                onChange={handleChange}
                fullWidth
                helperText="Optional. Used for the map marker."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Longitude"
                name="longitude"
                value={values.longitude ?? ''}
                onChange={handleChange}
                fullWidth
                helperText="Optional. Used for the map marker."
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
              <FormControlLabel
                control={
                  <Switch name="isPublished" checked={values.isPublished} onChange={handleChange} />
                }
                label="Published"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch name="isFeatured" checked={values.isFeatured} onChange={handleChange} />
                }
                label="Featured on homepage"
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
            {initial ? 'Save changes' : 'Create destination'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
