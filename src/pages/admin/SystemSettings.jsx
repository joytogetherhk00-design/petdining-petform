import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
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
    if (settings) setForm({ ...form, ...settings });
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
            <div><Label>公司名稱</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
            <div><Label>最低訂單金額 (HK$)</Label><Input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) })} /></div>
            <div><Label>貨幣</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} /></div>
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
      </div>
    </div>
  );
}