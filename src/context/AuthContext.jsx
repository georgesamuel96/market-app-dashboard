import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// Simple session storage key
const SESSION_KEY = 'dashboard_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = () => {
    try {
      const savedUser = sessionStorage.getItem(SESSION_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Error checking session:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // Call the PostgreSQL function to verify login
      const { data, error: rpcError } = await supabase.rpc('verify_user_login', {
        user_email: email,
        user_password: password,
      });

      if (rpcError) throw rpcError;

      // Check the response from the function
      if (!data.success) {
        throw new Error(data.error);
      }

      // Create session user object
      const sessionUser = {
        id: data.user.id,
        email: data.user.email,
        name: `${data.user.first_name} ${data.user.last_name}`.trim() || email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        role: data.user.role,
      };

      // Save to session storage
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    setError(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    userProfile: user, // Alias for compatibility
    loading,
    error,
    signIn,
    signOut,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
