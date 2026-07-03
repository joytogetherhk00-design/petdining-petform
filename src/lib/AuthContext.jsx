import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [checkingPrivacy, setCheckingPrivacy] = useState(false);

  useEffect(() => {
    checkAppState();
  }, []);

  // 檢查用戶是否已確認私隱政策
  useEffect(() => {
    if (user && !isLoadingAuth && !checkingPrivacy && isAuthenticated) {
      checkPrivacyConsent();
    }
  }, [user, isLoadingAuth, isAuthenticated]);

  const checkPrivacyConsent = async () => {
    setCheckingPrivacy(true);
    try {
      const currentUser = await base44.auth.me();
      
      // 管理員豁免
      if (currentUser?.role === 'admin') {
        setCheckingPrivacy(false);
        return;
      }

      // 如果未確認私隱政策，且不在同意頁面，則跳轉
      if (!currentUser?.privacy_accepted) {
        const pathname = window.location.pathname;
        if (pathname !== '/privacy-consent' && pathname !== '/') {
          window.location.href = '/privacy-consent';
        }
      }
    } catch (error) {
      console.error('Error checking privacy consent:', error);
    } finally {
      setCheckingPrivacy(false);
    }
  };

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      try {
        const headers = { 'X-App-Id': appParams.appId };
        if (appParams.token) headers['Authorization'] = `Bearer ${appParams.token}`;
        const resp = await axios.get(`/api/apps/public/prod/public-settings/by-id/${appParams.appId}`, { headers });
        const publicSettings = resp.data;
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        const status = appError.response?.status || appError.status;
        const extra = appError.response?.data?.extra_data || appError.data?.extra_data;
        if (status === 403 && extra?.reason) {
          const reason = extra.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
      } finally {
        // Always ensure loading states are cleared
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      console.log('Current user data:', currentUser);
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  // 添加刷新用戶數據的方法
  const refreshUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      console.log('Refreshed user data:', currentUser);
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Refresh user failed:', error);
      throw error;
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};