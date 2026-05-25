import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIChatWidget from '@/components/customer/AIChatWidget';

export default function AppLayout({ isAdmin }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 pt-16 lg:pt-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      {!isAdmin && <AIChatWidget />}
    </div>
  );
}