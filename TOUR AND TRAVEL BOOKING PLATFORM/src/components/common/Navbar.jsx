import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import useAuth from '../../hooks/useAuth.js';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Destinations', to: '/destinations' },
  { label: 'Tour Packages', to: '/packages' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
];

function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Navbar() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { isAuthenticated, profile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    setMenuAnchor(null);
    closeDrawer();
    await logout();
    navigate('/');
  };

  const accountMenu = (
    <>
      <MenuItem component={RouterLink} to="/account" onClick={() => setMenuAnchor(null)}>
        My Dashboard
      </MenuItem>
      <MenuItem component={RouterLink} to="/account/bookings" onClick={() => setMenuAnchor(null)}>
        My Bookings
      </MenuItem>
      <MenuItem component={RouterLink} to="/account/notifications" onClick={() => setMenuAnchor(null)}>
        Notifications
      </MenuItem>
      <MenuItem component={RouterLink} to="/account/profile" onClick={() => setMenuAnchor(null)}>
        My Profile
      </MenuItem>
      {isAdmin ? (
        <MenuItem component={RouterLink} to="/admin" onClick={() => setMenuAnchor(null)}>
          <DashboardIcon fontSize="small" sx={{ mr: 1 }} /> Admin Dashboard
        </MenuItem>
      ) : null}
      <Divider />
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </>
  );

  return (
    <AppBar position="sticky" color="primary" enableColorOnDark>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            <TravelExploreIcon />
            <Typography variant="h6" fontWeight={800} noWrap>
              Wanderlust
            </Typography>
          </Box>

          {isDesktop ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 3, flexGrow: 1 }}>
              {NAV_LINKS.map((link) => (
                <Button key={link.to} component={RouterLink} to={link.to} color="inherit">
                  {link.label}
                </Button>
              ))}
            </Box>
          ) : (
            <Box sx={{ flexGrow: 1 }} />
          )}

          {isDesktop ? (
            isAuthenticated ? (
              <IconButton onClick={(event) => setMenuAnchor(event.currentTarget)} color="inherit">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                  {getInitials(profile && profile.fullName)}
                </Avatar>
              </IconButton>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button component={RouterLink} to="/login" color="inherit">
                  Login
                </Button>
                <Button component={RouterLink} to="/register" variant="contained" color="secondary">
                  Register
                </Button>
              </Box>
            )
          ) : (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          )}

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {accountMenu}
          </Menu>
        </Toolbar>
      </Container>

      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
        <Box sx={{ width: 260 }} role="presentation">
          <List>
            {NAV_LINKS.map((link) => (
              <ListItem key={link.to} disablePadding>
                <ListItemButton component={RouterLink} to={link.to} onClick={closeDrawer}>
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <ListItem disablePadding>
                    <ListItemButton component={RouterLink} to="/admin" onClick={closeDrawer}>
                      <ListItemText primary="Admin Dashboard" />
                    </ListItemButton>
                  </ListItem>
                ) : null}
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/account" onClick={closeDrawer}>
                    <ListItemText primary="My Dashboard" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/account/bookings" onClick={closeDrawer}>
                    <ListItemText primary="My Bookings" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/account/profile" onClick={closeDrawer}>
                    <ListItemText primary="My Profile" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={handleLogout}>
                    <ListItemText primary="Logout" />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/login" onClick={closeDrawer}>
                    <ListItemText primary="Login" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/register" onClick={closeDrawer}>
                    <ListItemText primary="Register" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
