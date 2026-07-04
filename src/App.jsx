import { useEffect, useRef } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import UserTypeGuard from '@/components/UserTypeGuard';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Onboarding
import Onboarding from '@/pages/Onboarding';

// Customer pages
import ProductCatalog from '@/pages/customer/ProductCatalog';
import Cart from '@/pages/customer/Cart';
import OrderHistory from '@/pages/customer/OrderHistory';
import MyAccount from '@/pages/customer/MyAccount';


// Admin pages
import Dashboard from '@/pages/admin/Dashboard';
import CustomerManagement from '@/pages/admin/CustomerManagement';
import OrderManagement from '@/pages/admin/OrderManagement';
import ProductManagement from '@/pages/admin/ProductManagement';
import CategoryManagement from '@/pages/admin/CategoryManagement';
import CreditsManagement from '@/pages/admin/CreditsManagement';
import TopupManagement from '@/pages/admin/TopupManagement';
import SystemSettings from '@/pages/admin/SystemSettings';
import AdminManagement from '@/pages/admin/AdminManagement';
import AllBranches from '@/pages/admin/AllBranches';
import ApplicationManagement from '@/pages/admin/ApplicationManagement';
import TransactionManagement from '@/pages/admin/TransactionManagement';

import CreditsTopup from '@/pages/customer/CreditsTopup';
import MyCredits from '@/pages/customer/MyCredits';
import CreditsSuccess from '@/pages/customer/CreditsSuccess';
import CreditsCancel from '@/pages/customer/CreditsCancel';
import AdminGuard from '@/components/AdminGuard';
import Apply from '@/pages/Apply';
import Privacy from '@/pages/Privacy';
import PrivacyConsent from '@/pages/PrivacyConsent';
import AdminLogin from '@/pages/AdminLogin';
import Pending from '@/pages/Pending';
import AccountBlocked from '@/pages/AccountBlocked';
import { base44 } from '@/api/base44Client';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  const { data: myCustomer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['myCustomerStatus', user?.id],
    queryFn: async () => {
      const results = await base44.entities.Customers.filter({ user_email: user.email });
      return results[0] || null;
    },
    enabled: !!user && user.role !== 'admin',
  });

  const queryClient = useQueryClient();
  const ensureCustomerRef = useRef(false);

  // Auto-create a pending Customer record for new users (no admin approval yet)
  useEffect(() => {
    if (!isLoadingAuth && !isLoadingCustomer && user && user.role !== 'admin' && !myCustomer && !ensureCustomerRef.current) {
      ensureCustomerRef.current = true;
      base44.functions.invoke('ensureCustomerRecord', {})
        .then(() => queryClient.invalidateQueries({ queryKey: ['myCustomerStatus', user.id] }))
        .catch(err => {
          console.error('Failed to ensure customer record:', err);
          ensureCustomerRef.current = false;
        });
    }
  }, [isLoadingAuth, isLoadingCustomer, user, myCustomer, queryClient]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/admin')) {
        window.location.href = '/admin-login';
        return null;
      }
      // For non-admin routes, allow the page to render (public pages like ProductCatalog)
    }
  }

  // Extra security: block non-admin users from /admin/* routes entirely (but not /admin-login)
  if (!isLoadingAuth && user && user.role !== 'admin' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin-login') {
    window.location.href = '/admin-login';
    return null;
  }

  // Block unauthenticated users from /admin/* routes (but not /admin-login)
  if (!isLoadingAuth && !user && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin-login') {
    window.location.href = '/admin-login';
    return null;
  }

  // Show loading while checking customer status for non-admin users
  if (!isLoadingAuth && user && user.role !== 'admin' && isLoadingCustomer) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Block suspended/rejected users entirely
  if (!isLoadingAuth && !isLoadingCustomer && user && user.role !== 'admin' && myCustomer && (myCustomer.status === 'suspended' || myCustomer.status === 'rejected')) {
    return <AccountBlocked customer={myCustomer} />;
  }

  // Block pending users (or users without a customer record) from customer feature routes
  if (!isLoadingAuth && !isLoadingCustomer && user && user.role !== 'admin' && (myCustomer?.status === 'pending' || !myCustomer)) {
    const blockedPaths = ['/cart', '/orders', '/credits', '/account'];
    if (blockedPaths.some(p => window.location.pathname.startsWith(p))) {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <Routes>
    {/* Public pages - no layout wrapper */}
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/apply" element={<Apply />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/privacy-consent" element={<PrivacyConsent />} />
    <Route path="/admin-login" element={<AdminLogin />} />
    <Route path="/pending" element={<Pending />} />

    {/* Customer side */}
    <Route element={<AppLayout isAdmin={false} />}>
        {/* General client routes - cart, orders */}
        <Route path="/cart" element={
          <UserTypeGuard allowedTypes={['general', 'business']}>
            <Cart />
          </UserTypeGuard>
        } />
        <Route path="/orders" element={
          <UserTypeGuard allowedTypes={['general', 'business']}>
            <OrderHistory />
          </UserTypeGuard>
        } />
        <Route path="/account" element={
          <UserTypeGuard allowedTypes={['general', 'business']}>
            <MyAccount />
          </UserTypeGuard>
        } />
        
        {/* Products - public, price hidden for guests; also serves as home */}
        <Route path="/" element={<ProductCatalog />} />
        <Route path="/products" element={<ProductCatalog />} />
        <Route path="/credits" element={
          <UserTypeGuard allowedTypes={['general', 'business']}>
            <MyCredits />
          </UserTypeGuard>
        } />
        <Route path="/credits/topup" element={
          <UserTypeGuard allowedTypes={['general', 'business']}>
            <CreditsTopup />
          </UserTypeGuard>
        } />
        <Route path="/credits/success" element={
          <UserTypeGuard allowedTypes={['general', 'business']}>
            <CreditsSuccess />
          </UserTypeGuard>
        } />
        <Route path="/credits/cancel" element={
          <UserTypeGuard allowedTypes={['general', 'business']}>
            <CreditsCancel />
          </UserTypeGuard>
        } />
      </Route>

      {/* Admin side - protected by AdminGuard with role-based access */}
      <Route element={<AdminGuard><AppLayout isAdmin={true} /></AdminGuard>}>
        <Route path="/admin" element={<Dashboard />} />

        {/* super_admin only */}
        <Route path="/admin/customers" element={<CustomerManagement />} />
        <Route path="/admin/orders" element={<OrderManagement />} />
        <Route path="/admin/products" element={<ProductManagement />} />
        <Route path="/admin/categories" element={<CategoryManagement />} />
        <Route path="/admin/credits" element={<CreditsManagement />} />
        <Route path="/admin/topups" element={<TopupManagement />} />
        <Route path="/admin/settings" element={<SystemSettings />} />
        <Route path="/admin/admins" element={<AdminManagement />} />
        <Route path="/admin/branches" element={<AllBranches />} />
        <Route path="/admin/applications" element={<ApplicationManagement />} />
        <Route path="/admin/transactions" element={<TransactionManagement />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App