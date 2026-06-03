import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CreditCard, ArrowUpCircle, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';

export default function MyCredits() {
  const { data: customer, isLoading } = useQuery({
    queryKey: ['myCustomer'],
    queryFn: async () => {
      const me = await base44.auth.me();
      const customers = await base44.entities.Customers.filter({ user_email: me.email });
      return customers[0] || null;
    },
  });

  const { data: topupHistory = [] } = useQuery({
    queryKey: ['myTopups', customer?.customer_id],
    queryFn: () => base44.entities.CreditsTopup.filter({ customer_id: customer.customer_id }, '-date'),
    enabled: !!customer,
  });

  const { data: usageHistory = { enrollments: [], orders: [] } } = useQuery({
    queryKey: ['myUsageHistory', customer?.customer_id],
    queryFn: async () => {
      const [enrollments, orders] = await Promise.all([
        base44.entities.Enrollments.filter({ user_email: customer.user_email }),
        base44.entities.Orders.filter({ customer_id: customer.customer_id }),
      ]);
      return { enrollments, orders };
    },
    enabled: !!customer,
  });

  const hasPendingTopup = topupHistory.some(t => t.status === 'pending');

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="我的積分" />

      {/* Credits Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />積分概覽
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl text-center mb-4">
              <p className="text-muted-foreground text-sm mb-1">Credits 餘額</p>
              <p className="text-4xl font-bold text-primary">{(customer?.credits_balance || 0).toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs">每月配額</p>
                <p className="text-xl font-semibold">{customer?.monthly_credits || 0}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs">計劃</p>
                <p className="text-xl font-semibold">{customer?.plan?.toUpperCase() || '-'}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs">Quota 餘額</p>
                <p className="text-xl font-semibold">{customer?.quota_remaining || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5" />增值
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/credits/topup" className="block">
              <Button className="w-full bg-primary">
                <CreditCard className="h-4 w-4 mr-2" />信用卡增值
              </Button>
            </Link>
            {hasPendingTopup ? (
              <Button variant="outline" className="w-full" disabled>轉帳審批中</Button>
            ) : (
              <Button variant="outline" className="w-full" disabled>銀行轉帳</Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top-up History */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />增值記錄
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topupHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暫無增值記錄</p>
          ) : (
            <div className="space-y-3">
              {topupHistory.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-semibold">HK${t.amount?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.date ? format(new Date(t.date), 'yyyy/MM/dd HH:mm') : '-'}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />使用記錄
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(usageHistory.enrollments.length === 0 && usageHistory.orders.length === 0) ? (
            <p className="text-muted-foreground text-center py-8">暫無使用記錄</p>
          ) : (
            <div className="space-y-3">
              {usageHistory.enrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-semibold">課程報名 - {e.course_title || ''}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.enrollment_date ? format(new Date(e.enrollment_date), 'yyyy/MM/dd') : '-'}
                    </p>
                  </div>
                  {e.payment_method === 'quota' && (
                    <p className="text-destructive font-semibold">-1 Quota</p>
                  )}
                </div>
              ))}
              {usageHistory.orders.map(o => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-semibold">訂單 #{o.order_number || o.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.order_date ? format(new Date(o.order_date), 'yyyy/MM/dd') : '-'}
                    </p>
                  </div>
                  <p className="text-destructive font-semibold">-{o.credits_used || 0}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}