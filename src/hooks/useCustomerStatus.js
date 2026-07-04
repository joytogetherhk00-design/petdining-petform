import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export function useCustomerStatus() {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['myCustomerStatus', user?.id],
    queryFn: async () => {
      const results = await base44.entities.Customers.filter({ user_email: user.email });
      return results[0] || null;
    },
    enabled: isLoggedIn && !isAdmin,
  });

  const customer = data;
  const status = isAdmin
    ? 'active'
    : customer?.status || (isLoggedIn ? 'pending' : 'guest');

  return {
    customer,
    status,
    isActive: status === 'active',
    isPending: status === 'pending',
    isBlocked: status === 'suspended' || status === 'rejected',
    isGuest: !isLoggedIn,
    isLoading: isLoggedIn && !isAdmin && isLoading,
  };
}