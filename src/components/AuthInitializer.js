import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { apiClient } from '../services/api';

/**
 * This component ensures the API client always has the auth token
 * when a user is authenticated. It runs on app startup and whenever
 * the user state changes.
 */
const AuthInitializer = () => {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    console.log('🔐 AuthInitializer - Checking auth state...');
    console.log('Is authenticated:', isAuthenticated);
    console.log('Has user:', !!user);
    console.log('Has token:', !!user?.token);
    
    if (isAuthenticated && user?.token) {
      console.log('✅ Setting auth token in API client globally...');
      console.log('Token length:', user.token.length);
      console.log('Token preview:', user.token.substring(0, 20) + '...');
      
      apiClient.setAuthToken(user.token);
      
      console.log('✅ Token set successfully! All API requests will now include this token.');
    } else if (isAuthenticated && !user?.token) {
      console.error('⚠️ WARNING: User is authenticated but no token found!');
      console.error('This should not happen. User may need to re-login.');
      console.error('User object:', JSON.stringify(user, null, 2));
    } else {
      console.log('ℹ️ User not authenticated, skipping token setup');
    }
  }, [user, isAuthenticated, user?.token]);

  // This component doesn't render anything
  return null;
};

export default AuthInitializer;

