import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );



  const verifyAuthStatus = useCallback(() => {
    if (isAuthenticated) {
      return dispatch(checkAuthStatus());
    } else {
      return Promise.resolve(); 
    }
  }, [dispatch, isAuthenticated]);

  const hasCheckedAuth = React.useRef(false);
  useEffect(() => {
    if (isAuthenticated && user?.token && !hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      const authCheckPromise = verifyAuthStatus();
      if (authCheckPromise && typeof authCheckPromise.catch === 'function') {
        authCheckPromise.catch((error) => {
          console.warn('⚠️ Auth status check failed, but continuing:', error);
        });
      }
    } else {
 
    }
  }, [isAuthenticated, user?.token, verifyAuthStatus]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    verifyAuthStatus,
  };
};

export default useAuth;

