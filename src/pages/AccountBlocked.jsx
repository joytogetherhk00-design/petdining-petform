import React from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ban, LogOut } from 'lucide-react';

export default function AccountBlocked({ customer }) {
  const isSuspended = customer?.status === 'suspended';
  const handleLogout = () => base44.auth.logout('/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-red-50/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <Ban className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSuspended ? '帳戶已暫停' : '帳戶已被拒絕'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {isSuspended
              ? '您的帳戶已被暫停使用，如有疑問請聯絡我們'
              : '您的開戶申請未獲批准，如有疑問請聯絡我們'}
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
                <span className="text-sm text-muted-foreground">電郵</span>
                <span className="font-medium">{customer.email}</span>
              </div>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="text-muted-foreground">
              如有查詢，請聯絡：
              <br />
              WhatsApp：<a href="https://wa.me/85298673497" className="text-primary font-semibold">9867 3497</a>
              <br />
              電郵：<a href="mailto:info@petdininghk.com" className="text-primary font-semibold">info@petdininghk.com</a>
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