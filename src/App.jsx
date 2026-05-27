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
import CourseCatalog from '@/pages/customer/CourseCatalog';

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
import CourseManagement from '@/pages/admin/CourseManagement';
import InstructorManagement from '@/pages/admin/InstructorManagement';
import EnrollmentManagement from '@/pages/admin/EnrollmentManagement';
import CourseSchedule from '@/pages/admin/CourseSchedule';
import UserManagement from '@/pages/admin/UserManagement';
import CreditsTopup from '@/pages/customer/CreditsTopup';
import CreditsSuccess from '@/pages/customer/CreditsSuccess';
import CreditsCancel from '@/pages/customer/CreditsCancel';
import Apply from '@/pages/Apply';
import Privacy from '@/pages/Privacy';
import AdminLogin from '@/pages/AdminLogin';
import TestEnrollmentFlow from '@/pages/TestEnrollmentFlow';
import Welcome from '@/pages/Welcome';
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

  // 如果已登入但不是 admin，嘗試訪問後台時跳轉到登入頁
  if (user && user.role !== 'admin') {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin')) {
      window.location.href = '/admin-login';
      return null;
    }
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

  return (
    <Routes>
    {/* Public pages - no layout wrapper */}
    <Route path="/" element={<Welcome />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/apply" element={<Apply />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/admin-login" element={<AdminLogin />} />
    <Route path="/test-enrollment" element={<TestEnrollmentFlow />} />
    <Route path="/pending" element={<Pending />} />

    {/* Customer side */}
    <Route element={<AppLayout isAdmin={false} />}>
        {/* General client routes - courses, cart, orders */}
        <Route path="/courses" element={
          <UserTypeGuard allowedTypes={['general', 'business']}>
            <CourseCatalog />
          </UserTypeGuard>
        } />
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
        
        {/* Business client routes - products only */}
        <Route path="/products" element={
          <UserTypeGuard allowedTypes={['business']}>
            <ProductCatalog />
          </UserTypeGuard>
        } />
        <Route path="/credits/topup" element={
          <UserTypeGuard allowedTypes={['business']}>
            <CreditsTopup />
          </UserTypeGuard>
        } />
        <Route path="/credits/success" element={
          <UserTypeGuard allowedTypes={['business']}>
            <CreditsSuccess />
          </UserTypeGuard>
        } />
        <Route path="/credits/cancel" element={
          <UserTypeGuard allowedTypes={['business']}>
            <CreditsCancel />
          </UserTypeGuard>
        } />
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
        <Route path="/admin/transactions" element={<TransactionManagement />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/admin/instructors" element={<InstructorManagement />} />
        <Route path="/admin/enrollments" element={<EnrollmentManagement />} />
        <Route path="/admin/schedule" element={<CourseSchedule />} />
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