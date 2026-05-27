import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function UserTypeGuard({ children, allowedTypes }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // 檢查是否為管理員預覽模式
  const urlParams = new URLSearchParams(location.search);
  const previewParam = urlParams.get('preview');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const isLoggedIn = await base44.auth.isAuthenticated();
      if (isLoggedIn) {
        const userData = await base44.auth.me();
        console.log('User data:', userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Check user error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 如果有 preview 參數，跳過用戶類型檢查（管理員預覽模式）
  if (previewParam) {
    const previewType = previewParam === 'general' ? 'general' : 'business';
    if (!allowedTypes.includes(previewType)) {
      return <Navigate to="/courses" replace />;
    }
    return children;
  }

  const userType = user.user_type || 'general';
  
  if (!allowedTypes.includes(userType)) {
    if (userType === 'general') {
      return <Navigate to="/courses" replace />;
    } else {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
}