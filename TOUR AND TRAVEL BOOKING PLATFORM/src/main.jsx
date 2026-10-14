import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import App from './App.jsx';
import theme from './theme/theme.js';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SnackbarProvider } from './contexts/SnackbarContext.jsx';
import { isFirebaseConfigured } from './firebase/firebase.js';
import FirebaseSetupNotice from './components/common/FirebaseSetupNotice.jsx';
import 'leaflet/dist/leaflet.css';
import './index.css';

// When the Firebase web config is missing (fresh clone / deploy without .env),
// render setup instructions instead of mounting the app tree — mounting it would
// throw "auth/invalid-api-key" and leave a blank page.
if (!isFirebaseConfigured) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FirebaseSetupNotice />
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <SnackbarProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </SnackbarProvider>
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
}
