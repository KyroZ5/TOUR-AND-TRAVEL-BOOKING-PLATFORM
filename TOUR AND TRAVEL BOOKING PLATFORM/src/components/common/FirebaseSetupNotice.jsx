import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
];

/**
 * Rendered instead of the app when the Firebase web config is missing from the
 * environment. Prevents a blank page caused by the SDK throwing
 * "auth/invalid-api-key" during module initialisation.
 */
export default function FirebaseSetupNotice() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            Firebase is not configured
          </Typography>
          <Alert severity="info">
            This deployment is missing its Firebase web configuration, so the app cannot
            start. Nothing is broken — the credentials simply have not been supplied yet.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Copy <code>.env.example</code> to <code>.env</code> in the project root and fill
            in the web app config from the Firebase console (Project settings → Your apps →
            SDK setup and configuration → Config). Then rebuild.
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
            <Typography component="li" variant="body2">
              Firebase console → Project settings → add a <strong>Web</strong> app.
            </Typography>
            <Typography component="li" variant="body2">
              Copy the <code>config</code> values into <code>.env</code>.
            </Typography>
            <Typography component="li" variant="body2">
              <code>npm run build</code>, then redeploy.
            </Typography>
          </Box>
          <Typography variant="subtitle2">Required variables</Typography>
          <Box
            component="ul"
            sx={{ m: 0, pl: 2.5, fontFamily: 'monospace', fontSize: '0.85rem' }}
          >
            {REQUIRED_VARS.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
