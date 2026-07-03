import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import UserManagement from '@/pages/admin/UserManagement';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

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
      } else {
        navigateToLogin();
      }
      return null;
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
        <Route path="/admin/users" element={<UserManagement />} />
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