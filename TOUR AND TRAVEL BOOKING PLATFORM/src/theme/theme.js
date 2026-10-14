import { createTheme } from '@mui/material/styles';

// Travel-industry palette: deep navy (primary), ocean teal (secondary),
// warm orange/gold (accent) on white / light-gray backgrounds.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#102A43', // deep navy
      light: '#334E68',
      dark: '#0A1A2B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#16878C', // ocean teal
      light: '#4FB3B8',
      dark: '#0E5F63',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F2994A', // warm orange
      light: '#FFC38C',
      dark: '#C46D1E',
      contrastText: '#102A43',
    },
    success: { main: '#2E7D32' },
    error: { main: '#C62828' },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2933',
      secondary: '#52606D',
    },
  },
  typography: {
    fontFamily: [
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(16, 42, 67, 0.08)',
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true, size: 'small' },
    },
    MuiTable: {
      defaultProps: { size: 'small' },
    },
  },
});

export default theme;
