import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import PublicIcon from '@mui/icons-material/Public';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const VALUES = [
  { icon: <PublicIcon color="secondary" fontSize="large" />, title: 'Authentic experiences', text: 'We connect travelers with genuine local experiences.' },
  { icon: <FavoriteIcon color="secondary" fontSize="large" />, title: 'Traveler first', text: 'Your comfort, safety, and satisfaction guide everything we do.' },
  { icon: <SupportAgentIcon color="secondary" fontSize="large" />, title: 'Real support', text: 'A responsive team is available before, during, and after your trip.' },
];

export default function About() {
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <TravelExploreIcon color="secondary" fontSize="large" />
        <Typography variant="h3" fontWeight={800}>
          About Wanderlust Travel
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 780 }}>
        Wanderlust Travel is a tour and travel booking platform built to make discovering and booking
        memorable trips effortless. We curate destinations, operate reliable departures, and provide
        transparent pricing so you can focus on the adventure.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {VALUES.map((value) => (
          <Grid item xs={12} md={4} key={value.title}>
            <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
              {value.icon}
              <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
                {value.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {value.text}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 5 }} />

      <Box id="privacy-policy">
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We collect only the information necessary to provide our booking services, including your
          name, email address, and phone number. Your data is stored securely in Google Firebase and
          is never sold to third parties. You may request deletion of your account and data at any
          time by contacting us.
        </Typography>
      </Box>

      <Box id="terms" sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Terms &amp; Conditions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          By booking a tour you agree to provide accurate traveler information, to arrive on time for
          your departure, and to respect local laws and fellow travelers. Prices are quoted per person
          in Philippine pesos and are confirmed at the time of booking. Departures may be adjusted
          where necessary and you will be notified of any changes.
        </Typography>
      </Box>

      <Box id="cancellation-policy" sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Cancellation Policy
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Free cancellation is available up to 7 days before departure. Cancellations made within 7
          days of departure may be subject to charges as stated on each tour package page. To cancel a
          booking, visit your account, open the booking, and follow the cancellation steps.
        </Typography>
      </Box>

      <Box sx={{ mt: 5, textAlign: 'center' }}>
        <Button component={RouterLink} to="/packages" variant="contained" size="large">
          Browse tour packages
        </Button>
      </Box>
    </Container>
  );
}
