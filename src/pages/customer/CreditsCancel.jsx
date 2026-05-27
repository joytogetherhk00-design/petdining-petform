import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreditsCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold mb-1">充值已取消</h1>
        <p className="text-sm text-muted-foreground mb-2">Top Up Cancelled</p>

        <p className="text-sm text-muted-foreground mt-4 mb-8">
          您的充值已取消，沒有任何款項被扣除。
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/credits/topup">
            <Button className="w-full bg-primary">重新嘗試</Button>
          </Link>
          <Link to="/account">
            <Button variant="outline" className="w-full">返回帳戶</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}