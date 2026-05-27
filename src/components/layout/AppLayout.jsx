import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIChatWidget from '@/components/customer/AIChatWidget';
import { useAuth } from '@/lib/AuthContext';

export default function AppLayout({ isAdmin }) {
  const { user, isLoadingAuth, refreshUser } = useAuth();
  
  // 從 URL 參數獲取視角（管理員預覽用）
  const urlParams = new URLSearchParams(window.location.search);
  const previewParam = urlParams.get('preview');
  const viewParam = urlParams.get('view');
  
  // 決定用戶類型：管理員預覽 > 實際用戶類型 > 默認商業客戶
  let userType;
  if (isAdmin) {
    // 管理員模式下，根據 URL 參數決定顯示哪個客戶端的導航
    userType = previewParam === 'general' || viewParam === 'general' ? 'general' : 'business';
  } else {
    userType = user?.user_type || 'business'; // 默認商業客戶，確保看到產品目錄
  }
  
  // 如果用戶已登入但 user_type 為空，刷新用戶數據
  useEffect(() => {
    if (user && !user.user_type && !isAdmin) {
      console.log('User type missing, refreshing...');
      refreshUser();
    }
  }, [user, isAdmin, refreshUser]);
  
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} userType={userType} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 pt-16 lg:pt-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      {!isAdmin && <AIChatWidget />}
    </div>
  );
}