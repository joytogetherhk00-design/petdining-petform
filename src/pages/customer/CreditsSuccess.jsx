import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreditsSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [creditsAmount, setCreditsAmount] = useState(null);

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }

    const verify = async () => {
      const res = await base44.functions.invoke('verifyStripeSession', { session_id: sessionId });
      if (res.data?.success) {
        setCreditsAmount(res.data.credits_amount);
        setStatus('success');
      } else {
        setStatus('error');
      }
    };
    verify();
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">正在確認付款...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-lg font-semibold text-destructive mb-2">確認失敗</p>
          <p className="text-muted-foreground text-sm mb-6">如已付款，請聯絡客服確認 Credits。</p>
          <Link to="/credits"><Button variant="outline">返回 Credits</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold mb-1">充值成功</h1>
        <p className="text-sm text-muted-foreground mb-2">Top Up Successful</p>

        {creditsAmount && (
          <div className="my-6 p-5 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl">
            <p className="text-xs text-muted-foreground mb-1">已充值</p>
            <p className="text-4xl font-bold text-primary">{Number(creditsAmount).toLocaleString()}</p>
            <p className="text-sm font-medium mt-1">Credits</p>
            <p className="text-sm text-muted-foreground mt-1">金額：HK${Number(creditsAmount).toLocaleString()}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <Link to="/credits">
            <Button className="w-full bg-primary">查看 Credits</Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full">返回首頁</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}