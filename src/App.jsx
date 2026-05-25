import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

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
import Apply from '@/pages/Apply';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
    {/* Public pages - no layout wrapper */}
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/apply" element={<Apply />} />

    {/* Customer side */}
    <Route element={<AppLayout isAdmin={false} />}>
      <Route path="/" element={<ProductCatalog />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/account" element={<MyAccount />} />
      </Route>

      {/* Admin side */}
      <Route element={<AppLayout isAdmin={true} />}>
        <Route path="/admin" element={<Dashboard />} />
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