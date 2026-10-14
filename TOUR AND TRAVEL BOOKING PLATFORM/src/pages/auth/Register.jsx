import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import useAuth from '../../hooks/useAuth.js';
import { validateRegistration, isClean } from '../../utils/validation.js';
import { mapAuthError } from '../../services/authService.js';

const initialValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateRegistration(values);
    setErrors(validation);
    if (!isClean(validation)) {
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await register(values);
      navigate('/account', { replace: true });
    } catch (error) {
      setFormError(mapAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const passwordToggle = (visible, onToggle, label) => (
    <InputAdornment position="end">
      <IconButton aria-label={label} onClick={onToggle} edge="end">
        {visible ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Book tours and manage your trips in one place."
      footer={
        <Link component={RouterLink} to="/login" variant="body2">
          Already have an account? Log in
        </Link>
      }
    >
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        {formError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        ) : null}

        <TextField
          label="Full name"
          name="fullName"
          value={values.fullName}
          onChange={handleChange}
          error={Boolean(errors.fullName)}
          helperText={errors.fullName}
          autoComplete="name"
          margin="normal"
          required
        />

        <TextField
          label="Email address"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={Boolean(errors.email)}
          helperText={errors.email}
          autoComplete="email"
          margin="normal"
          required
        />

        <TextField
          label="Phone number"
          name="phone"
          value={values.phone}
          onChange={handleChange}
          error={Boolean(errors.phone)}
          helperText={errors.phone || 'e.g. +63 917 123 4567'}
          autoComplete="tel"
          margin="normal"
          required
        />

        <TextField
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={values.password}
          onChange={handleChange}
          error={Boolean(errors.password)}
          helperText={errors.password || 'At least 8 characters with a number.'}
          autoComplete="new-password"
          margin="normal"
          required
          InputProps={{
            endAdornment: passwordToggle(
              showPassword,
              () => setShowPassword((current) => !current),
              showPassword ? 'Hide password' : 'Show password'
            ),
          }}
        />

        <TextField
          label="Confirm password"
          name="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          value={values.confirmPassword}
          onChange={handleChange}
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword}
          autoComplete="new-password"
          margin="normal"
          required
          InputProps={{
            endAdornment: passwordToggle(
              showConfirm,
              () => setShowConfirm((current) => !current),
              showConfirm ? 'Hide password' : 'Show password'
            ),
          }}
        />

        <FormControlLabel
          sx={{ mt: 2, alignItems: 'flex-start' }}
          control={
            <Checkbox
              checked={values.acceptedTerms}
              onChange={handleChange}
              name="acceptedTerms"
              color="secondary"
            />
          }
          label={
            <Box component="span" sx={{ fontSize: 14 }}>
              I agree to the Terms and Conditions and the Cancellation Policy.
            </Box>
          }
        />
        {errors.acceptedTerms ? (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {errors.acceptedTerms}
          </Alert>
        ) : null}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={submitting}
          sx={{ mt: 2 }}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </Box>
    </AuthLayout>
  );
}
