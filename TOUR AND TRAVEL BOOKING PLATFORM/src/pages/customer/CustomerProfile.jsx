import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import { updateUserProfile } from '../../services/userService.js';
import { changeUserEmail, changeUserPassword, mapAuthError } from '../../services/authService.js';
import { isEmail, isNonEmpty, isPhone, passwordIssue } from '../../utils/validation.js';
import useAuth from '../../hooks/useAuth.js';

export default function CustomerProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const { showSuccess, showError } = useSnackbar();

  const [details, setDetails] = useState({
    fullName: profile ? profile.fullName : '',
    phone: profile ? profile.phone : '',
  });
  const [detailErrors, setDetailErrors] = useState({});
  const [savingDetails, setSavingDetails] = useState(false);

  const [emailForm, setEmailForm] = useState({ currentPassword: '', newEmail: '' });
  const [emailErrors, setEmailErrors] = useState({});
  const [savingEmail, setSavingEmail] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const saveDetails = async (event) => {
    event.preventDefault();
    const errors = {};
    if (details.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
    if (details.phone && !isPhone(details.phone)) errors.phone = 'Enter a valid phone number.';
    setDetailErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingDetails(true);
    try {
      await updateUserProfile(user.uid, details);
      await refreshProfile();
      showSuccess('Profile updated.');
    } catch (error) {
      showError(error?.message || 'Could not update your profile.');
    } finally {
      setSavingDetails(false);
    }
  };

  const saveEmail = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!isNonEmpty(emailForm.currentPassword)) errors.currentPassword = 'Enter your current password.';
    if (!isEmail(emailForm.newEmail)) errors.newEmail = 'Enter a valid email address.';
    setEmailErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingEmail(true);
    try {
      await changeUserEmail(emailForm.currentPassword, emailForm.newEmail);
      await refreshProfile();
      setEmailForm({ currentPassword: '', newEmail: '' });
      showSuccess('Email address updated.');
    } catch (error) {
      showError(mapAuthError(error));
    } finally {
      setSavingEmail(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!isNonEmpty(pwForm.currentPassword)) errors.currentPassword = 'Enter your current password.';
    const issue = passwordIssue(pwForm.newPassword);
    if (issue) errors.newPassword = issue;
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingPw(true);
    try {
      await changeUserPassword(pwForm.currentPassword, pwForm.newPassword);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showSuccess('Password updated.');
    } catch (error) {
      showError(mapAuthError(error));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        My Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your personal information and account security.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Personal details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box component="form" onSubmit={saveDetails} noValidate>
                <TextField
                  label="Full name"
                  value={details.fullName}
                  onChange={(event) => {
                    setDetails((c) => ({ ...c, fullName: event.target.value }));
                    setDetailErrors((c) => ({ ...c, fullName: undefined }));
                  }}
                  error={Boolean(detailErrors.fullName)}
                  helperText={detailErrors.fullName}
                  fullWidth
                  margin="dense"
                />
                <TextField
                  label="Email"
                  value={profile ? profile.email : ''}
                  fullWidth
                  margin="dense"
                  disabled
                  helperText="Change your email below."
                />
                <TextField
                  label="Phone"
                  value={details.phone}
                  onChange={(event) => {
                    setDetails((c) => ({ ...c, phone: event.target.value }));
                    setDetailErrors((c) => ({ ...c, phone: undefined }));
                  }}
                  error={Boolean(detailErrors.phone)}
                  helperText={detailErrors.phone}
                  fullWidth
                  margin="dense"
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={savingDetails}
                  startIcon={savingDetails ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  Save changes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Change email
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box component="form" onSubmit={saveEmail} noValidate>
                <TextField
                  label="New email address"
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(event) => {
                    setEmailForm((c) => ({ ...c, newEmail: event.target.value }));
                    setEmailErrors((c) => ({ ...c, newEmail: undefined }));
                  }}
                  error={Boolean(emailErrors.newEmail)}
                  helperText={emailErrors.newEmail}
                  fullWidth
                  margin="dense"
                />
                <TextField
                  label="Current password"
                  type="password"
                  value={emailForm.currentPassword}
                  onChange={(event) => {
                    setEmailForm((c) => ({ ...c, currentPassword: event.target.value }));
                    setEmailErrors((c) => ({ ...c, currentPassword: undefined }));
                  }}
                  error={Boolean(emailErrors.currentPassword)}
                  helperText={emailErrors.currentPassword}
                  fullWidth
                  margin="dense"
                />
                <Button
                  type="submit"
                  variant="outlined"
                  sx={{ mt: 2 }}
                  disabled={savingEmail}
                  startIcon={savingEmail ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  Update email
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Change password
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box component="form" onSubmit={savePassword} noValidate>
                <Stack spacing={0}>
                  <TextField
                    label="Current password"
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(event) => {
                      setPwForm((c) => ({ ...c, currentPassword: event.target.value }));
                      setPwErrors((c) => ({ ...c, currentPassword: undefined }));
                    }}
                    error={Boolean(pwErrors.currentPassword)}
                    helperText={pwErrors.currentPassword}
                    fullWidth
                    margin="dense"
                  />
                  <TextField
                    label="New password"
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(event) => {
                      setPwForm((c) => ({ ...c, newPassword: event.target.value }));
                      setPwErrors((c) => ({ ...c, newPassword: undefined }));
                    }}
                    error={Boolean(pwErrors.newPassword)}
                    helperText={pwErrors.newPassword}
                    fullWidth
                    margin="dense"
                  />
                  <TextField
                    label="Confirm new password"
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(event) => {
                      setPwForm((c) => ({ ...c, confirmPassword: event.target.value }));
                      setPwErrors((c) => ({ ...c, confirmPassword: undefined }));
                    }}
                    error={Boolean(pwErrors.confirmPassword)}
                    helperText={pwErrors.confirmPassword}
                    fullWidth
                    margin="dense"
                  />
                </Stack>
                <Button
                  type="submit"
                  variant="outlined"
                  sx={{ mt: 2 }}
                  disabled={savingPw}
                  startIcon={savingPw ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  Update password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
