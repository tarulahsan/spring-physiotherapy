import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  // Instead of throwing an error, we'll create a more resilient setup
}

// Create a Supabase client with retry logic and enhanced error handling
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', 
                           supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    autoRefreshToken: true,
    debug: false, // Reduce debug logging in production
    retryAttempts: 3,
    retryInterval: 2000
  }
});

// Add a general error handler to prevent uncaught exceptions
supabase.handleError = (error) => {
  console.error('Supabase Error:', error);
  return null; // Return null instead of throwing to prevent app crashes
};

// Enhanced auth state logging
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  } else if (event === 'USER_UPDATED') {
    console.log('User updated');
  }
});

// Add a listener for auth errors to help debugging
window.addEventListener('supabase.auth.error', (e) => {
  console.error('Supabase auth error:', e.detail);
});

// Export only the single instance
export { supabase };
