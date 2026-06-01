import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * Protects /admin/* routes.
 * - Not authenticated or not role='admin' → redirect to /admin-login
 * - admin_role not in allowedRoles → redirect to /admin (show access denied)
 * - Allowed → render children
 *
 * allowedRoles: array of 'super_admin' | 'course_admin'
 * Defaults to both (any admin can access).
 */
export function getAdminRole(user) {
  if (!user) return null;
  return user.admin_role || 'super_admin';
}

export default function AdminGuard({ children, allowedRoles = ['super_admin', 'course_admin'] }) {
  const { user, isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Must be logged in AND have role='admin' (Base44 built-in role field)
  if (!isAuthenticated || !user || user.role !== 'admin') {
    window.location.href = '/admin-login';
    return null;
  }

  // Check the granular admin_role
  const adminRole = getAdminRole(user);
  if (!allowedRoles.includes(adminRole)) {
    // Not allowed for this specific page → send back to general admin dashboard
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}