import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Navbar from '../common/Navbar.jsx';

const CUSTOMER_TABS = [
  { label: 'Overview', to: '/account', value: 'overview' },
  { label: 'My Bookings', to: '/account/bookings', value: 'bookings' },
  { label: 'Notifications', to: '/account/notifications', value: 'notifications' },
  { label: 'My Profile', to: '/account/profile', value: 'profile' },
];

function currentTab(pathname) {
  if (pathname.startsWith('/account/bookings')) return 'bookings';
  if (pathname.startsWith('/account/notifications')) return 'notifications';
  if (pathname.startsWith('/account/profile')) return 'profile';
  return 'overview';
}

/** Customer account shell: public navbar + account tabs + content. */
export default function CustomerLayout() {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', py: 4 }}>
        <Container maxWidth="lg">
          <Paper sx={{ mb: 3, px: 1 }}>
            <Tabs
              value={currentTab(location.pathname)}
              variant="scrollable"
              scrollButtons="auto"
              textColor="secondary"
              indicatorColor="secondary"
            >
              {CUSTOMER_TABS.map((tab) => (
                <Tab
                  key={tab.value}
                  component={NavLink}
                  to={tab.to}
                  value={tab.value}
                  label={tab.label}
                />
              ))}
            </Tabs>
          </Paper>
          <Outlet />
        </Container>
      </Box>
    </>
  );
}
