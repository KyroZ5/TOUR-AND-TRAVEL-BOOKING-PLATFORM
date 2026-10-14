import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { Link as RouterLink } from 'react-router-dom';

/** 404 page for unknown routes. */
export default function NotFound() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" fontWeight={800} color="primary.main">
          404
        </Typography>
        <Typography variant="h6">Page not found</Typography>
        <Typography variant="body2" color="text.secondary">
          The page you are looking for does not exist or has moved.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Return home
        </Button>
      </Box>
    </Container>
  );
}
