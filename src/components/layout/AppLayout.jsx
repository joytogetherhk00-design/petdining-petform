import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIChatWidget from '@/components/customer/AIChatWidget';
import { useAuth } from '@/lib/AuthContext';

export default function AppLayout({ isAdmin }) {
  const { user, isLoadingAuth } = useAuth();
  
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} userType={user?.user_type || 'general'} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 pt-16 lg:pt-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      {!isAdmin && <AIChatWidget />}
    </div>
  );
}