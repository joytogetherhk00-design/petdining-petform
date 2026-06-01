import React from 'react';
import { useAuth } from '@/lib/AuthContext';

/**
 * Protects /admin/* routes with role-based access control.
 * - Not authenticated → redirect to /admin-login
 * - Authenticated but role not in allowedRoles → redirect to /admin/courses (course_admin) or /admin-login
 * - Allowed → render children
 *
 * allowedRoles: array of 'super_admin' | 'course_admin'
 * Defaults to both (any admin can access).
 */
export function getAdminRole(user) {
  if (!user || user.role !== 'admin') return null;
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

  if (!isAuthenticated || !user || user.role !== 'admin') {
    window.location.href = '/admin-login';
    return null;
  }

  const adminRole = getAdminRole(user);
  if (!allowedRoles.includes(adminRole)) {
    // course_admin trying to access super_admin-only page → redirect to their dashboard
    window.location.href = '/admin/courses';
    return null;
  }

  return <>{children}</>;
}