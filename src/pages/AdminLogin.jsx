import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await base44.auth.redirectToLogin('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">管理員登入</CardTitle>
          <CardDescription>
            點擊下方按鈕，系統會發送登入連結到您的管理員電郵
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                跳轉中...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                管理員登入
              </>
            )}
          </Button>
          <div className="text-center text-xs text-muted-foreground">
            登入後如無管理員權限，將自動跳轉回此頁面
          </div>
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              返回首頁
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}