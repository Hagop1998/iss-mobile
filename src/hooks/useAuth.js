import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus } from '../store/slices/authSlice';

/**
 * Custom hook to access authentication state and actions
 * This hook automatically verifies auth status when the app loads
 */
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

  // Function to manually check auth status
  const verifyAuthStatus = useCallback(() => {
    console.log('🔍 Manual auth status verification requested');
    if (isAuthenticated) {
      console.log('User is authenticated, calling /auth/status...');
      return dispatch(checkAuthStatus());
    } else {
      console.log('User is not authenticated, skipping status check');
      return Promise.resolve(); // Return resolved promise to avoid undefined
    }
  }, [dispatch, isAuthenticated]);

  // Auto-verify auth status on mount if user is authenticated
  // Only check once on initial mount, not on every re-render
  const hasCheckedAuth = React.useRef(false);
  useEffect(() => {
    console.log('🔄 useAuth mounted/updated');
    if (isAuthenticated && user?.token && !hasCheckedAuth.current) {
      console.log('Auto-verifying auth status on initial mount...');
      hasCheckedAuth.current = true;
      const authCheckPromise = verifyAuthStatus();
      if (authCheckPromise && typeof authCheckPromise.catch === 'function') {
        authCheckPromise.catch((error) => {
          // Silently handle auth check errors - don't break the app
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

