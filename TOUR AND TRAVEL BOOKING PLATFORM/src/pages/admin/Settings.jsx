import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import { getSiteSettings, updateSiteSettings } from '../../services/settingsService.js';
import { logActivity } from '../../services/activityLogService.js';
import { isEmail } from '../../utils/validation.js';
import useAuth from '../../hooks/useAuth.js';

function FaqEditor({ faqs, onChange }) {
  const updateAt = (index, patch) => {
    const next = faqs.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Frequently asked questions
      </Typography>
      <Stack spacing={2}>
        {faqs.map((faq, index) => (
          <Stack
            key={index}
            direction="row"
            spacing={1}
            alignItems="flex-start"
            sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          >
            <Stack spacing={1} sx={{ flexGrow: 1 }}>
              <TextField
                label="Question"
                value={faq.q || ''}
                onChange={(event) => updateAt(index, { q: event.target.value })}
                size="small"
                fullWidth
              />
              <TextField
                label="Answer"
                value={faq.a || ''}
                onChange={(event) => updateAt(index, { a: event.target.value })}
                size="small"
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
            <IconButton onClick={() => onChange(faqs.filter((_, i) => i !== index))}>
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Button
        startIcon={<AddIcon />}
        size="small"
        sx={{ mt: 1 }}
        onClick={() => onChange([...faqs, { q: '', a: '' }])}
      >
        Add FAQ
      </Button>
    </Box>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSiteSettings()
      .then((settings) => {
        if (!cancelled) {
          setValues({
            ...settings,
            socials: settings.socials || { facebook: '', instagram: '', twitter: '' },
            faqs: Array.isArray(settings.faqs) ? settings.faqs : [],
          });
        }
      })
      .catch(() => {
        showError('Could not load site settings.');
      });
    return () => {
      cancelled = true;
    };
  }, [showError]);

  const setField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const save = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!values.agencyName || values.agencyName.trim().length < 2) {
      nextErrors.agencyName = 'Enter the agency name.';
    }
    if (!isEmail(values.contactEmail)) {
      nextErrors.contactEmail = 'Enter a valid contact email.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await updateSiteSettings(values, user.uid);
      await logActivity({
        actorUid: user.uid,
        action: 'update_settings',
        targetType: 'settings',
        targetId: 'site',
        metadata: {},
      });
      showSuccess('Settings saved.');
    } catch (error) {
      showError('Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!values) {
    return (
      <Box>
        <Skeleton width={240} height={40} />
        <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2, mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Site Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage public site content and contact information.
      </Typography>

      <Box component="form" onSubmit={save}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Agency
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <TextField
                    label="Agency name"
                    value={values.agencyName}
                    onChange={(event) => setField('agencyName', event.target.value)}
                    error={Boolean(errors.agencyName)}
                    helperText={errors.agencyName}
                    fullWidth
                  />
                  <TextField
                    label="Contact email"
                    value={values.contactEmail}
                    onChange={(event) => setField('contactEmail', event.target.value)}
                    error={Boolean(errors.contactEmail)}
                    helperText={errors.contactEmail}
                    fullWidth
                  />
                  <TextField
                    label="Contact phone"
                    value={values.contactPhone}
                    onChange={(event) => setField('contactPhone', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Address"
                    value={values.address}
                    onChange={(event) => setField('address', event.target.value)}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Social links
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <TextField
                    label="Facebook URL"
                    value={values.socials.facebook || ''}
                    onChange={(event) =>
                      setField('socials', { ...values.socials, facebook: event.target.value })
                    }
                    fullWidth
                  />
                  <TextField
                    label="Instagram URL"
                    value={values.socials.instagram || ''}
                    onChange={(event) =>
                      setField('socials', { ...values.socials, instagram: event.target.value })
                    }
                    fullWidth
                  />
                  <TextField
                    label="Twitter URL"
                    value={values.socials.twitter || ''}
                    onChange={(event) =>
                      setField('socials', { ...values.socials, twitter: event.target.value })
                    }
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Homepage
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <TextField
                    label="Hero title"
                    value={values.heroTitle}
                    onChange={(event) => setField('heroTitle', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Hero subtitle"
                    value={values.heroSubtitle}
                    onChange={(event) => setField('heroSubtitle', event.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label="Default cancellation policy"
                    value={values.cancellationPolicyDefault}
                    onChange={(event) => setField('cancellationPolicyDefault', event.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <FaqEditor faqs={values.faqs} onChange={(faqs) => setField('faqs', faqs)} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          size="large"
          sx={{ mt: 3 }}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </Box>
    </Box>
  );
}
