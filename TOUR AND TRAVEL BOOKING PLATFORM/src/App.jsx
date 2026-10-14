import Box from '@mui/material/Box';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppRoutes />
    </Box>
  );
}
