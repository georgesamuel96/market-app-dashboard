import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

      // Hash the password and query the admins table
      const hashedPassword = await hashPassword(password);
      const { data, error: queryError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('password', hashedPassword)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          throw new Error('Invalid email or password');
        }
        throw queryError;
      }

      if (!data) {
        throw new Error('Invalid email or password');
      }

      // Create session user object
      const sessionUser = {
        id: data.id,
        email: data.email,
        name: `${data.first_name} ${data.last_name}`.trim() || email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: 'admin',
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
