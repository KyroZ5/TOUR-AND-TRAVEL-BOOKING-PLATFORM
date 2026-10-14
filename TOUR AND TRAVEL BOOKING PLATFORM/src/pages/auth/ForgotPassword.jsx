import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import useAuth from '../../hooks/useAuth.js';
import { isEmail } from '../../utils/validation.js';
import { mapAuthError } from '../../services/authService.js';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    setFormError('');
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setFormError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a secure link to choose a new password."
      footer={
        <Link component={RouterLink} to="/login" variant="body2">
          Back to login
        </Link>
      }
    >
      {sent ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          If an account exists for {email}, a reset link is on its way. Check your inbox and spam
          folder.
        </Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {formError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          ) : null}

          <TextField
            label="Email address"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            error={Boolean(error)}
            helperText={error}
            autoComplete="email"
            margin="normal"
            required
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={submitting}
            sx={{ mt: 3 }}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </Box>
      )}
    </AuthLayout>
  );
}
