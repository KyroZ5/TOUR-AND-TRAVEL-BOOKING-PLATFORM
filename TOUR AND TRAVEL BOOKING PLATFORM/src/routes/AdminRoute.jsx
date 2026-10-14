import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import LoadingScreen from '../components/common/LoadingScreen.jsx';

/**
 * Requires an authenticated administrator. This is a UI convenience only -
 * the real enforcement lives in Firestore Security Rules.
 */
export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verifying administrator access…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
