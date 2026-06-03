import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, ArrowLeft, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000];

export default function CreditsTopup() {
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: customer } = useQuery({
    queryKey: ['myCustomer'],
    queryFn: async () => {
      const me = await base44.auth.me();
      const customers = await base44.entities.Customers.filter({ user_email: me.email });
      return customers[0] || null;
    },
  });

  const finalAmount = selected !== null ? selected : (custom ? Number(custom) : null);

  const handleCheckout = async () => {
    if (!finalAmount || finalAmount < 1000) {
      toast.error('最低充值金額為 HK$1,000');
      return;
    }
    setLoading(true);
    const origin = window.location.origin;
    const res = await base44.functions.invoke('createCheckoutSession', {
      amount: finalAmount,
      customer_id: customer?.customer_id || '',
      success_url: `${origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/credits/cancel`,
    });

    if (res.data?.url) {
      window.open(res.data.url, '_blank');
    } else {
      toast.error(res.data?.error || '建立付款失敗，請稍後重試');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <Link to="/account" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> 返回我的帳戶
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Credits 充值 / Top Up</h1>
          <p className="text-muted-foreground text-sm mt-1">1 Credit = HK$1，最低充值 HK$1,000</p>
        </div>

        {/* Current balance */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground mb-1">當前 Credits 餘額</p>
            <p className="text-3xl font-bold text-primary">
              {customer ? (customer.credits_balance || 0).toLocaleString() : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> 選擇充值金額
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset amounts */}
            <div className="grid grid-cols-2 gap-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setSelected(amt); setCustom(''); }}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selected === amt
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <p className="text-sm text-muted-foreground">HK${amt.toLocaleString()}</p>
                  <p className="text-lg font-bold">{amt.toLocaleString()} Credits</p>
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div>
              <Label className="mb-1.5 block text-sm">自訂金額（最少 HK$1,000）</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">HKD</span>
                <Input
                  type="number"
                  min={1000}
                  step={100}
                  value={custom}
                  onChange={e => { setCustom(e.target.value); setSelected(null); }}
                  placeholder="1000"
                  className="pl-14"
                />
              </div>
              {custom && Number(custom) >= 1000 && (
                <p className="text-xs text-muted-foreground mt-1">= {Number(custom).toLocaleString()} Credits</p>
              )}
            </div>

            {/* Summary */}
            {finalAmount && finalAmount >= 1000 && (
              <div className="p-3 bg-muted rounded-lg text-sm flex items-center justify-between">
                <span className="text-muted-foreground">充值 Credits</span>
                <span className="font-bold text-primary">{finalAmount.toLocaleString()} Credits</span>
              </div>
            )}

            <Button
              className="w-full bg-primary h-12 text-base font-semibold"
              disabled={!finalAmount || finalAmount < 1000 || loading}
              onClick={handleCheckout}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 處理中...</>
              ) : (
                <><CreditCard className="h-4 w-4 mr-2" /> 前往付款 HK${finalAmount ? finalAmount.toLocaleString() : '—'}</>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              付款由 Stripe 安全處理 · 支援 Visa、Mastercard、American Express
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}