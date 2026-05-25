import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, Package, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: customers = [] } = useQuery({
    queryKey: ['allCustomers'],
    queryFn: () => base44.entities.Customers.list(),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => base44.entities.Orders.list('-order_date', 50),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => base44.entities.Products.list(),
  });

  const totalCredits = customers.reduce((sum, c) => sum + (c.credits_balance || 0), 0);
  const recentOrders = orders.slice(0, 10);

  return (
    <div>
      <PageHeader title="儀表板" description="PetDining 管理概覽" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="客戶數量" value={customers.length} icon={Users} />
        <StatsCard title="訂單總數" value={orders.length} icon={ShoppingCart} />
        <StatsCard title="產品數量" value={products.length} icon={Package} />
        <StatsCard title="總積分餘額" value={totalCredits.toLocaleString()} icon={CreditCard} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近訂單</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">暫無訂單</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer_id} · {order.order_date ? format(new Date(order.order_date), 'MM/dd HH:mm') : '-'}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-semibold text-sm">HK${order.total?.toLocaleString()}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}