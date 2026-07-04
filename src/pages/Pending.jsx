import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';

export default function Pending() {
  const { user } = useAuth();

  const { data: customer } = useQuery({
    queryKey: ['pendingCustomer', user?.id],
    queryFn: async () => {
      const results = await base44.entities.Customers.filter({ user_email: user.email });
      return results[0] || null;
    },
    enabled: !!user && user.role !== 'admin',
  });

  const handleLogout = () => base44.auth.logout('/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">帳戶仍在審批中</CardTitle>
          <CardDescription className="text-base mt-2">
            您的帳戶正在審批中，請耐心等待管理員批准
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {customer && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">公司名稱</span>
                <span className="font-medium">{customer.company_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">聯絡人</span>
                <span className="font-medium">{customer.contact}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">電郵</span>
                <span className="font-medium">{customer.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">申請狀態</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <Clock className="h-3 w-3" />
                  待審批
                </span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              我們會在 1-3 個工作天內處理您的申請，審批通過後您將收到電郵通知。
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            登出
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}