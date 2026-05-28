import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import DragDropUpload from '@/components/shared/DragDropUpload';
import StripeTopup from '@/components/customer/StripeTopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { CreditCard, MessageCircle, ArrowUpCircle, Pencil, Plus, MapPin, Building2 } from 'lucide-react';
import { PLANS } from '@/lib/planConfig';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';

export default function MyAccount() {
  const [editOpen, setEditOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupMode, setTopupMode] = useState('stripe'); // 'stripe' | 'bank'
  const [topupAmount, setTopupAmount] = useState('');
  const [editData, setEditData] = useState({});
  const [newAddress, setNewAddress] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      return await base44.auth.me();
    },
  });

  const { data: customer, isLoading } = useQuery({
    queryKey: ['myCustomer'],
    queryFn: async () => {
      const me = await base44.auth.me();
      const customers = await base44.entities.Customers.filter({ user_email: me.email });
      return customers[0] || null;
    },
  });

  // 一般用戶顯示個人資料，商業用戶顯示公司資料
  const isGeneralUser = user?.user_type === 'general' || !customer;

  const { data: settings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const s = await base44.entities.AppSettings.list();
      return s[0] || {};
    },
  });

  const { data: topupHistory = [] } = useQuery({
    queryKey: ['myTopups', customer?.customer_id],
    queryFn: () => base44.entities.CreditsTopup.filter({ customer_id: customer.customer_id }, '-date'),
    enabled: !!customer,
  });

  const hasPendingTopup = topupHistory.some(t => t.status === 'pending');
  const plan = customer?.plan ? PLANS[customer.plan] : null;
  const nextReset = customer?.approved_date
    ? format(addDays(new Date(customer.approved_date), 30), 'yyyy/MM/dd')
    : '-';

  const submitEdit = async () => {
    await base44.entities.Customers.update(customer.id, { pending_changes: editData });
    queryClient.invalidateQueries({ queryKey: ['myCustomer'] });
    setEditOpen(false);
    toast.success('已提交更改，待管理員審批');
  };

  const submitBankTopup = async () => {
    const amount = Number(topupAmount);
    if (amount < 1000) { toast.error('最低 Top-up 金額為 HK$1,000'); return; }
    const me = await base44.auth.me();
    await base44.entities.CreditsTopup.create({
      customer_id: customer.customer_id,
      amount,
      status: 'pending',
      date: new Date().toISOString(),
      user_email: me.email,
    });
    queryClient.invalidateQueries({ queryKey: ['myTopups'] });
    setTopupOpen(false);
    setTopupAmount('');
    toast.success('Top-up 申請已提交');
  };

  const addAddress = async () => {
    if (!newAddress.trim()) return;
    const addresses = [...(customer.multiple_addresses || []), newAddress.trim()];
    await base44.entities.Customers.update(customer.id, { multiple_addresses: addresses });
    queryClient.invalidateQueries({ queryKey: ['myCustomer'] });
    setNewAddress('');
    toast.success('地址已新增');
  };

  const handleStripeSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['myCustomer'] });
    queryClient.invalidateQueries({ queryKey: ['myTopups'] });
    setTopupOpen(false);
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="我的帳戶" />

      {isGeneralUser ? (
        // 一般用戶個人資料
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">個人資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">姓名：</span>{user?.full_name || '-'}</div>
              <div><span className="text-muted-foreground">電郵：</span>{user?.email}</div>
              <div><span className="text-muted-foreground">用戶類型：</span>一般客戶</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // 商業用戶公司資料
        <div className="grid md:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">公司資料</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => {
              setEditData({ company_name: customer.company_name, contact: customer.contact, phone: customer.phone, br_address: customer.br_address });
              setEditOpen(true);
            }}>
              <Pencil className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {customer.logo_url && (
              <img src={customer.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-cover" />
            )}
            <div><span className="text-muted-foreground">帳戶編號：</span><span className="font-mono font-semibold">{customer.account_number || customer.customer_id}</span></div>
            <div><span className="text-muted-foreground">公司名稱：</span>{customer.company_name}</div>
            <div><span className="text-muted-foreground">聯絡人：</span>{customer.contact}</div>
            <div><span className="text-muted-foreground">電話：</span>{customer.phone}</div>
            <div><span className="text-muted-foreground">電郵：</span>{customer.email}</div>
            <div><span className="text-muted-foreground">商業登記地址：</span>{customer.br_address || '-'}</div>
            <div><span className="text-muted-foreground">狀態：</span><StatusBadge status={customer.status} /></div>
            {customer.pending_changes && (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">待審批變更</Badge>
            )}
          </CardContent>
        </Card>

        {/* Credits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />Credits 與計劃
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">計劃：</span>{plan ? `${plan.name} (HK$${plan.fee.toLocaleString()}/月, ${plan.credits.toLocaleString()} Credits)` : '-'}</div>
            <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
              <p className="text-muted-foreground text-xs mb-1">Credits 餘額</p>
              <p className="text-3xl font-bold text-primary">{(customer.credits_balance || 0).toLocaleString()}</p>
            </div>
            <div><span className="text-muted-foreground">每月 Credits：</span>{customer.monthly_credits || plan?.credits || '-'}</div>
            <div><span className="text-muted-foreground">下次更新日期：</span>{nextReset}</div>
            {customer.contract_end_date && (
              <div><span className="text-muted-foreground">合約到期：</span>{customer.contract_end_date}</div>
            )}
            {(customer.plan === 'plan_a' || customer.plan === 'plan_b') && (
              <Button variant="outline" className="w-full border-secondary text-secondary" size="sm">升級計劃</Button>
            )}
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />送貨地址</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm p-3 bg-muted rounded-lg">{customer.delivery_address || '未設定'}</div>
            {(customer.multiple_addresses || []).map((addr, i) => (
              <div key={i} className="text-sm p-3 bg-muted rounded-lg">{addr}</div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="新增送貨地址" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
              <Button size="icon" onClick={addAddress}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Top-up */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ArrowUpCircle className="h-4 w-4" />Credits Top-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Link to="/credits/topup" className="flex-1">
                <Button className="w-full bg-primary">
                  <CreditCard className="h-4 w-4 mr-2" />信用卡 Top-up
                </Button>
              </Link>
              <Button variant="outline" disabled={hasPendingTopup} onClick={() => { setTopupMode('bank'); setTopupOpen(true); }}>
                {hasPendingTopup ? '轉帳審批中...' : '銀行轉帳'}
              </Button>
            </div>

            {topupHistory.length > 0 && (
              <div className="space-y-2 mt-1">
                <p className="text-xs font-medium text-muted-foreground">Top-up 記錄</p>
                {topupHistory.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded-lg">
                    <span>HK${t.amount?.toLocaleString()}</span>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}

            <a
              href="https://api.whatsapp.com/send?phone=85298673497&text=你好，我想查詢有關我的帳戶"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full text-sm text-green-600 hover:text-green-700 py-1"
            >
              <MessageCircle className="h-4 w-4" />WhatsApp 查詢
            </a>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Edit dialog - only for business users */}
      {!isGeneralUser && (
        <>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>修改公司資料</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>公司名稱</Label><Input value={editData.company_name || ''} onChange={e => setEditData({ ...editData, company_name: e.target.value })} /></div>
              <div><Label>聯絡人</Label><Input value={editData.contact || ''} onChange={e => setEditData({ ...editData, contact: e.target.value })} /></div>
              <div><Label>電話</Label><Input value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} /></div>
              <div><Label>商業登記地址</Label><Input value={editData.br_address || ''} onChange={e => setEditData({ ...editData, br_address: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
              <Button className="bg-primary" onClick={submitEdit}>提交審批</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Top-up dialog */}
        <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{topupMode === 'stripe' ? '信用卡 Top-up' : '銀行轉帳 Top-up'}</DialogTitle>
            </DialogHeader>
            {topupMode === 'stripe' ? (
              <StripeTopup customer={customer} onSuccess={handleStripeSuccess} onCancel={() => setTopupOpen(false)} />
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-sm space-y-1">
                  {settings?.bank_name && <p>銀行：{settings.bank_name}</p>}
                  {settings?.bank_account && <p>帳號：{settings.bank_account}</p>}
                  {settings?.account_holder && <p>持有人：{settings.account_holder}</p>}
                  {settings?.fps_id && <p>FPS ID：{settings.fps_id}</p>}
                  <p className="text-xs text-muted-foreground mt-2">請轉帳到此帳戶，並保留收據</p>
                </div>
                <div>
                  <Label>Top-up 金額 (最低 HK$1,000)</Label>
                  <Input type="number" min={1000} step={100} value={topupAmount} onChange={e => setTopupAmount(e.target.value)} placeholder="1000" />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTopupOpen(false)}>取消</Button>
                  <Button className="bg-primary" onClick={submitBankTopup}>申請 Top-up</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </>
      )}
    </div>
  );
}