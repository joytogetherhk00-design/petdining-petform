import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function UserTypeGuard({ children, allowedTypes }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const isLoggedIn = await base44.auth.isAuthenticated();
      if (isLoggedIn) {
        const userData = await base44.auth.me();
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