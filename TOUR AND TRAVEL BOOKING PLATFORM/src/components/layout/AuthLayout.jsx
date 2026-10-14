import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { Link as RouterLink } from 'react-router-dom';

/** Centered card shell used by the login, register and reset pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background:
          'linear-gradient(135deg, #102A43 0%, #16878C 55%, #F2994A 100%)',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 460,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit' }}
          >
            <TravelExploreIcon color="secondary" fontSize="large" />
            <Typography variant="h6" fontWeight={800}>
              Wanderlust Travel
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 2 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {children}

        {footer ? <Box sx={{ mt: 3, textAlign: 'center' }}>{footer}</Box> : null}
      </Paper>
    </Box>
  );
}
