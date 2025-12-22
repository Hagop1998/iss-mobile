import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  console.log('📱 useAuth Hook State:', {
    isAuthenticated,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    hasToken: !!user?.token,
    tokenLength: user?.token?.length,
    isLoading,
    hasError: !!error,
  });

  const verifyAuthStatus = useCallback(() => {
    console.log('🔍 Manual auth status verification requested');
    if (isAuthenticated) {
      console.log('User is authenticated, calling /auth/status...');
      return dispatch(checkAuthStatus());
    } else {
      console.log('User is not authenticated, skipping status check');
      return Promise.resolve(); 
    }
  }, [dispatch, isAuthenticated]);

  const hasCheckedAuth = React.useRef(false);
  useEffect(() => {
    console.log('🔄 useAuth mounted/updated');
    if (isAuthenticated && user?.token && !hasCheckedAuth.current) {
      console.log('Auto-verifying auth status on initial mount...');
      hasCheckedAuth.current = true;
      const authCheckPromise = verifyAuthStatus();
      if (authCheckPromise && typeof authCheckPromise.catch === 'function') {
        authCheckPromise.catch((error) => {
          console.warn('⚠️ Auth status check failed, but continuing:', error);
        });
      }
    } else {
      console.log('Skipping auto-verification:', {
        isAuthenticated,
        hasToken: !!user?.token,
        hasChecked: hasCheckedAuth.current,
      });
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

