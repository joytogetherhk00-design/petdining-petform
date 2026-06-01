import React from 'react';
import { useAuth } from '@/lib/AuthContext';

/**
 * Protects all /admin/* routes.
 * - Not authenticated → redirect to /admin-login
 * - Authenticated but not admin → redirect to /admin-login
 * - Admin → render children
 */
export default function AdminGuard({ children }) {
  const { user, isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    window.location.href = '/admin-login';
    return null;
  }

  return <>{children}</>;
}