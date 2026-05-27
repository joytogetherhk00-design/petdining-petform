import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, Package, CreditCard, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

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

  const { data: settings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => { const s = await base44.entities.AppSettings.list(); return s[0] || {}; },
    staleTime: 60000,
  });

  const threshold = settings?.low_stock_threshold ?? 10;
  const lowStockProducts = products.filter(p => p.status === 'active' && (p.stock ?? 0) <= threshold);
  const totalCredits = customers.reduce((sum, c) => sum + (c.credits_balance || 0), 0);
  const recentOrders = orders.slice(0, 10);

  return (
    <div>
      <PageHeader title="控制台總覽" description="PetDining 管理概覽" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="客戶數量" value={customers.length} icon={Users} />
        <StatsCard title="訂單總數" value={orders.length} icon={ShoppingCart} />
        <StatsCard title="產品數量" value={products.length} icon={Package} />
        <StatsCard title="總 Credits 餘額" value={totalCredits.toLocaleString()} icon={CreditCard} />
      </div>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              庫存警告 — {lowStockProducts.length} 件產品低於安全水平（≤ {threshold} 件）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-destructive/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                  </div>
                  <span className={`ml-2 shrink-0 text-sm font-bold ${p.stock === 0 ? 'text-destructive' : 'text-orange-600'}`}>
                    {p.stock === 0 ? '缺貨' : `剩 ${p.stock}`}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/admin/products" className="inline-block mt-3 text-xs text-primary underline underline-offset-2">前往產品管理補貨 →</Link>
          </CardContent>
        </Card>
      )}

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