import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Destinations', to: '/destinations' },
  { label: 'Tour Packages', to: '/packages' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
];

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'grey.100', mt: 'auto' }}>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <TravelExploreIcon />
              <Typography variant="h6" fontWeight={800}>
                Wanderlust Travel
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'grey.300', maxWidth: 360 }}>
              Carefully curated tour packages and unforgettable journeys across the Philippines and
              beyond. Book with confidence.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <IconButton size="small" sx={{ color: 'grey.100' }} aria-label="Facebook">
                <FacebookIcon />
              </IconButton>
              <IconButton size="small" sx={{ color: 'grey.100' }} aria-label="Instagram">
                <InstagramIcon />
              </IconButton>
              <IconButton size="small" sx={{ color: 'grey.100' }} aria-label="Twitter">
                <TwitterIcon />
              </IconButton>
            </Stack>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Explore
            </Typography>
            <Stack spacing={1}>
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  underline="hover"
                  sx={{ color: 'grey.300' }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Support
            </Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/about" underline="hover" sx={{ color: 'grey.300' }}>
                Privacy Policy
              </Link>
              <Link component={RouterLink} to="/about" underline="hover" sx={{ color: 'grey.300' }}>
                Terms &amp; Conditions
              </Link>
              <Link component={RouterLink} to="/about" underline="hover" sx={{ color: 'grey.300' }}>
                Cancellation Policy
              </Link>
              <Link component={RouterLink} to="/contact" underline="hover" sx={{ color: 'grey.300' }}>
                FAQs
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Contact
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOnOutlinedIcon fontSize="small" />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  Manila, Philippines
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PhoneOutlinedIcon fontSize="small" />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  +63 917 000 0000
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmailOutlinedIcon fontSize="small" />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  hello@wanderlust.travel
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
        <Typography variant="body2" align="center" sx={{ color: 'grey.400' }}>
          © {new Date().getFullYear()} Wanderlust Travel. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
