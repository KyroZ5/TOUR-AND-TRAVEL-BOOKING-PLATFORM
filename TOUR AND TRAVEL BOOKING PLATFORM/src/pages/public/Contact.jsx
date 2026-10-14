import { useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { isEmail, isNonEmpty } from '../../utils/validation.js';
import { DEFAULT_SETTINGS } from '../../services/settingsService.js';

const AGENCY_EMAIL = DEFAULT_SETTINGS.contactEmail;

export default function Contact() {
  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = (event) => {
    // Opens the visitor's email client with a prefilled message. We do not
    // integrate an external email API (not part of the project scope).
    event.preventDefault();
    const nextErrors = {};
    if (!isNonEmpty(values.name)) nextErrors.name = 'Enter your name.';
    if (!isEmail(values.email)) nextErrors.email = 'Enter a valid email address.';
    if (!isNonEmpty(values.message)) nextErrors.message = 'Enter your message.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    const subject = encodeURIComponent(`Website enquiry from ${values.name}`);
    const body = encodeURIComponent(`${values.message}\n\nFrom: ${values.name} <${values.email}>`);
    window.location.href = `mailto:${AGENCY_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h3" fontWeight={800} gutterBottom>
        Contact Us
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        We are here to help you plan your next adventure.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Get in touch
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <EmailOutlinedIcon color="secondary" />
                <Typography variant="body2">{DEFAULT_SETTINGS.contactEmail}</Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <PhoneOutlinedIcon color="secondary" />
                <Typography variant="body2">{DEFAULT_SETTINGS.contactPhone}</Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <LocationOnOutlinedIcon color="secondary" />
                <Typography variant="body2">{DEFAULT_SETTINGS.address}</Typography>
              </Stack>
            </Stack>
          </Paper>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Frequently Asked Questions
            </Typography>
            {DEFAULT_SETTINGS.faqs.slice(0, 3).map((faq) => (
              <Accordion key={faq.q}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight={600}>
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Send us a message
            </Typography>
            {sent ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                Your email app should now be open with your message. Send it to reach our team.
              </Alert>
            ) : null}
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                label="Your name"
                name="name"
                value={values.name}
                onChange={handleChange}
                error={Boolean(errors.name)}
                helperText={errors.name}
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
                margin="normal"
                required
              />
              <TextField
                label="Message"
                name="message"
                value={values.message}
                onChange={handleChange}
                error={Boolean(errors.message)}
                helperText={errors.message}
                margin="normal"
                multiline
                minRows={4}
                required
              />
              <Button type="submit" variant="contained" color="secondary" sx={{ mt: 2 }}>
                Send message
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
