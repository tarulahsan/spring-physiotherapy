import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    role: 'admin',  // Default to admin for now
    loading: false,  // Start with loading false
    error: null,
  });

  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const processSession = useCallback(async (session) => {
    try {
      if (session?.user) {
        // Set role based on email
        const isAdmin = session.user.email === 'musadumc@gmail.com';
        updateState({
          user: session.user,
          role: isAdmin ? 'admin' : 'viewer',
          loading: false,
          error: null,
        });
      } else {
        updateState({
          user: null,
          role: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error processing session:', error);
      updateState({
        user: null,
        role: null,
        loading: false,
        error: 'Authentication error',
      });
    }
  }, [updateState]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          await processSession(session);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          updateState({
            user: null,
            role: null,
            loading: false,
            error: 'Authentication error',
          });
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        await processSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [processSession]);

  const signIn = useCallback(async (email, password) => {
    try {
      updateState({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      updateState({ error: error.message });
      throw error;
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const signOut = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      updateState({ error: error.message });
      throw error;
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const value = {
    user: state.user,
    role: state.role,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
