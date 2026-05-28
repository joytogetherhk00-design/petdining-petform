import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// This component now redirects to Stripe Checkout (secure, webhook-verified flow)
export default function StripeTopup({ customer, onSuccess, onCancel }) {
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (amount < 1000) {
      toast.error('最低 Top-up 金額為 HK$1,000');
      return;
    }
    if (!customer) {
      toast.error('找不到客戶資料');
      return;
    }

    setLoading(true);
    const origin = window.location.origin;
    const res = await base44.functions.invoke('createCheckoutSession', {
      amount,
      customer_id: customer.customer_id,
      success_url: `${origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/credits/cancel`,
    });

    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      toast.error(res.data?.error || '建立付款失敗，請稍後重試');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Top-up 金額 (HK$，最低 $1,000)</Label>
        <Input
          type="number"
          min={1000}
          step={100}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="mt-1 text-lg font-semibold"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1000, 2000, 5000].map(v => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className={`py-2 text-sm rounded-lg border transition-all ${amount === v ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-primary/50'}`}
          >
            HK${v.toLocaleString()}
          </button>
        ))}
      </div>
      <div className="p-3 bg-muted rounded-lg text-sm text-center text-muted-foreground">
        獲得 <span className="font-bold text-foreground">{amount.toLocaleString()} Credits</span>（1 Credit = HK$1）
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>取消</Button>
        <Button className="flex-1 bg-primary" onClick={handleCheckout} disabled={loading}>
          {loading
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />處理中...</>
            : <><CreditCard className="h-4 w-4 mr-2" />前往 Stripe 付款</>
          }
        </Button>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        🔒 由 Stripe 安全處理，付款後 Credits 自動到帳
      </p>
    </div>
  );
}