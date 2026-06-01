import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import DragDropUpload from '@/components/shared/DragDropUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemSettings() {
  const [form, setForm] = useState({
    company_name: '', min_order_amount: 500, credits_reset_day: 1,
    currency: 'HKD', bank_name: '', bank_account: '', account_holder: '', fps_id: '',
    logo_url: '', stripe_publishable_key: '', low_stock_threshold: 10, app_url: '',
  });
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const s = await base44.entities.AppSettings.list();
      return s[0] || null;
    },
  });

  useEffect(() => {
    if (settings) setForm(prev => ({ ...prev, ...settings }));
  }, [settings]);

  const handleSave = async () => {
    if (settings?.id) {
      await base44.entities.AppSettings.update(settings.id, form);
    } else {
      await base44.entities.AppSettings.create(form);
    }
    queryClient.invalidateQueries({ queryKey: ['appSettings'] });
    toast.success('設定已儲存');
  };

  return (
    <div>
      <PageHeader title="系統設定" action={<Button className="bg-primary" onClick={handleSave}><Save className="h-4 w-4 mr-2" />儲存</Button>} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">基本設定</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="mb-1.5 block">系統 Logo</Label>
              <DragDropUpload
                value={form.logo_url}
                onChange={url => setForm({ ...form, logo_url: url })}
                accept="image/*"
                label="上傳 Logo"
                hint="建議尺寸 200×200px"
              />
            </div>
            <div><Label>公司名稱</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
            <div>
              <Label>正式網站 URL</Label>
              <Input value={form.app_url} onChange={e => setForm({ ...form, app_url: e.target.value })} placeholder="https://yourapp.base44.app" />
              <p className="text-xs text-muted-foreground mt-1">用於生成邀請管理員的登入連結，請填入正式發佈的網址</p>
            </div>
            <div><Label>最低訂單金額 (HK$)</Label><Input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) })} /></div>
            <div><Label>貨幣</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} /></div>
            <div>
              <Label>庫存警戒水平（件數）</Label>
              <Input type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground mt-1">庫存 ≤ 此數值時顯示紅色警告，預設為 10 件</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">銀行資料</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>銀行名稱</Label><Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} /></div>
            <div><Label>銀行帳號</Label><Input value={form.bank_account} onChange={e => setForm({ ...form, bank_account: e.target.value })} /></div>
            <div><Label>帳戶持有人</Label><Input value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })} /></div>
            <div><Label>FPS ID</Label><Input value={form.fps_id} onChange={e => setForm({ ...form, fps_id: e.target.value })} /></div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Stripe 付款設定</CardTitle></CardHeader>
          <CardContent>
            <div>
              <Label>Stripe Publishable Key (pk_live_ 或 pk_test_)</Label>
              <Input
                value={form.stripe_publishable_key}
                onChange={e => setForm({ ...form, stripe_publishable_key: e.target.value })}
                placeholder="pk_live_..."
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">用於客戶信用卡 Top-up。Secret Key 請在後台 Secrets 設定。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}