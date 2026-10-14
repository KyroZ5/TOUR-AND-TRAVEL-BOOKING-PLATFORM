import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Navbar from '../common/Navbar.jsx';
import Footer from '../common/Footer.jsx';

/** Public marketing site shell: sticky navbar, routed content, footer. */
export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      <Footer />
    </>
  );
}
