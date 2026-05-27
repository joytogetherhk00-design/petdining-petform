import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Pending() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const isLoggedIn = await base44.auth.isAuthenticated();
      if (!isLoggedIn) {
        navigate('/welcome');
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);

      const customers = await base44.entities.Customers.filter({ user_email: userData.email });
      if (customers.length > 0) {
        const cust = customers[0];
        setCustomer(cust);
        
        if (cust.status === 'approved') {
          navigate('/admin');
          return;
        }
      }
    } catch (error) {
      console.error('Check status error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">申請待審批</CardTitle>
          <CardDescription className="text-base mt-2">
            您的商業客戶申請正在審批中
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
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-blue-900 font-medium">審批需時</p>
                <p className="text-sm text-blue-700">
                  我們會在 1-3 個工作天內處理您的申請，審批通過後您將收到電郵通知。
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/courses')}
            >
              瀏覽課程（一般用戶模式）
            </Button>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/welcome')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首頁
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}