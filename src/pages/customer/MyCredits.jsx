import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { CreditCard, ArrowUpCircle, Clock, TrendingUp, Upload, Loader2, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from 'sonner';

export default function MyCredits() {
  const queryClient = useQueryClient();
  const [slipFile, setSlipFile] = useState(null);
  const [slipAmount, setSlipAmount] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['myCustomer'],
    queryFn: async () => {
      const me = await base44.auth.me();
      const customers = await base44.entities.Customers.filter({ user_email: me.email });
      return customers[0] || null;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const s = await base44.entities.AppSettings.list();
      return s[0] || {};
    },
    staleTime: 60000,
  });

  const { data: topupHistory = [] } = useQuery({
    queryKey: ['myTopups', customer?.customer_id],
    queryFn: () => base44.entities.CreditsTopup.filter({ customer_id: customer.customer_id }, '-date'),
    enabled: !!customer,
  });

  const { data: slipHistory = [] } = useQuery({
    queryKey: ['mySlips', customer?.customer_id],
    queryFn: () => base44.entities.SlipUploads.filter({ customer_id: customer.customer_id }, '-created_date'),
    enabled: !!customer,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['myOrders', customer?.customer_id],
    queryFn: () => base44.entities.Orders.filter({ customer_id: customer.customer_id }),
    enabled: !!customer,
  });

  const handleSlipUpload = async () => {
    if (!slipFile) { toast.error('請選擇入數紙圖片'); return; }
    if (!slipAmount || Number(slipAmount) < 1) { toast.error('請輸入轉帳金額'); return; }
    if (!customer) { toast.error('找不到客戶資料'); return; }

    setUploading(true);
    const me = await base44.auth.me();

    // Upload file
    const { file_url } = await base44.integrations.Core.UploadFile({ file: slipFile });

    // Create slip record
    const slip = await base44.entities.SlipUploads.create({
      customer_id: customer.customer_id,
      user_email: me.email,
      company_name: customer.company_name,
      amount: Number(slipAmount),
      slip_url: file_url,
      status: 'pending',
    });

    // Notify admin
    await base44.functions.invoke('notifyFpsTopup', { slip_id: slip.id });

    toast.success('入數紙已上傳，等待管理員審批');
    setSlipFile(null);
    setSlipAmount('');
    queryClient.invalidateQueries({ queryKey: ['mySlips'] });
    setUploading(false);
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const hasBankInfo = settings?.bank_name || settings?.fps_id;

  return (
    <div>
      <PageHeader title="我的 Credits" />

      {/* Credits Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />Credits 概覽
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl text-center mb-4">
              <p className="text-muted-foreground text-sm mb-1">Credits 餘額</p>
              <p className="text-4xl font-bold text-primary">{(customer?.credits_balance || 0).toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs">每月配額</p>
                <p className="text-xl font-semibold">{customer?.monthly_credits || 0}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs">計劃</p>
                <p className="text-xl font-semibold">{customer?.plan?.toUpperCase() || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5" />信用卡增值
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/credits/topup" className="block">
              <Button className="w-full bg-primary">
                <CreditCard className="h-4 w-4 mr-2" />Stripe 信用卡
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* FPS Top-up Section */}
      {hasBankInfo && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-5 w-5 text-primary" />轉數快（FPS）增值
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">請轉帳至以下帳戶，並上傳入數紙：</p>

            <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
              {settings?.bank_name && (
                <div className="flex gap-2"><span className="text-muted-foreground w-28 shrink-0">🏦 銀行：</span><span className="font-medium">{settings.bank_name}</span></div>
              )}
              {settings?.fps_id && (
                <div className="flex gap-2"><span className="text-muted-foreground w-28 shrink-0">📱 FPS ID：</span><span className="font-medium">{settings.fps_id}</span></div>
              )}
              {settings?.fps_account_name && (
                <div className="flex gap-2"><span className="text-muted-foreground w-28 shrink-0">👤 帳戶名：</span><span className="font-medium">{settings.fps_account_name}</span></div>
              )}
              {settings?.bank_account && (
                <div className="flex gap-2"><span className="text-muted-foreground w-28 shrink-0">🔢 帳戶號碼：</span><span className="font-medium">{settings.bank_account}</span></div>
              )}
            </div>

            <p className="text-xs text-primary font-medium">💡 轉帳後，請在下方上傳入數紙</p>

            {/* Upload slip */}
            <div className="space-y-3 border rounded-xl p-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />上傳入數紙
              </h4>
              <div>
                <Label className="text-xs mb-1 block">轉帳金額 (HKD)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="例如：1000"
                  value={slipAmount}
                  onChange={e => setSlipAmount(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">入數紙截圖</Label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                  onChange={e => setSlipFile(e.target.files?.[0] || null)}
                />
                {slipFile && <p className="text-xs text-muted-foreground mt-1">已選擇：{slipFile.name}</p>}
              </div>
              <Button
                className="w-full"
                disabled={!slipFile || !slipAmount || uploading}
                onClick={handleSlipUpload}
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上傳中...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />提交增值申請</>
                )}
              </Button>
            </div>

            {/* Slip history */}
            {slipHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">入數紙上傳記錄</h4>
                {slipHistory.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                    <div>
                      <p className="font-semibold">HK${s.amount?.toLocaleString() || '-'}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.created_date ? format(new Date(s.created_date), 'yyyy/MM/dd HH:mm') : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.status} />
                      {s.slip_url && (
                        <a href={s.slip_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">查看</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top-up History */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />Stripe 增值記錄
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
            <Clock className="h-5 w-5" />訂單使用記錄
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暫無使用記錄</p>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
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