import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { apiClient } from '../services/api';

const AuthInitializer = () => {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {

    
    if (isAuthenticated && user?.token) {

      
      apiClient.setAuthToken(user.token);
      
    } else if (isAuthenticated && !user?.token) {
      console.error('⚠️ WARNING: User is authenticated but no token found!');
    } else {
    }
  }, [user, isAuthenticated, user?.token]);

  return null;
};

export default AuthInitializer;

