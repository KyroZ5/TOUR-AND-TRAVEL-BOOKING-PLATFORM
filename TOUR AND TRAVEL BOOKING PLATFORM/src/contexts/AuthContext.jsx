import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  sendResetEmail,
  fetchUserProfile,
  ensureUserProfile,
} from '../services/authService.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase Auth user
  const [profile, setProfile] = useState(null); // users/{uid} document
  const [loading, setLoading] = useState(true); // auth initialization
  const [authError, setAuthError] = useState(null);

  const loadProfile = useCallback(async (firebaseUser) => {
    try {
      let data = await fetchUserProfile(firebaseUser.uid);
      if (!data) {
        data = await ensureUserProfile(firebaseUser);
      }
      setProfile(data);
      setAuthError(null);
      return data;
    } catch (error) {
      setAuthError(error);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadProfile(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadProfile]);

  const register = useCallback(async (values) => {
    const firebaseUser = await registerUser(values);
    const newProfile = await loadProfile(firebaseUser);
    return { user: firebaseUser, profile: newProfile };
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    const firebaseUser = await loginUser(email, password);
    const loggedInProfile = await loadProfile(firebaseUser);
    return { user: firebaseUser, profile: loggedInProfile };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback((email) => sendResetEmail(email), []);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      await loadProfile(auth.currentUser);
    }
  }, [loadProfile]);

  const value = useMemo(() => {
    const role = profile ? profile.role : null;
    return {
      user,
      profile,
      role,
      isAdmin: role === 'admin',
      isCustomer: role === 'customer',
      isAuthenticated: Boolean(user),
      isAccountActive: !profile || profile.accountStatus === 'active',
      loading,
      authError,
      register,
      login,
      logout,
      resetPassword,
      refreshProfile,
    };
  }, [user, profile, loading, authError, register, login, logout, resetPassword, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
