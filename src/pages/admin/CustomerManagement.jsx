import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import DragDropUpload from '@/components/shared/DragDropUpload';
import BranchManagement from '@/pages/admin/BranchManagement';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Plus, Check, X, UserPlus, Building2 } from 'lucide-react';
import { PLANS, PLAN_LABELS, REGIONS } from '@/lib/planConfig';
import { toast } from 'sonner';

export default function CustomerManagement() {
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(null);
  const [pendingOpen, setPendingOpen] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    company_name: '', contact: '', phone: '', email: '',
    delivery_address: '', br_address: '', plan: 'plan_a', region: 'PDK',
    logo_url: '', br_document_url: '',
  });
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['allCustomers'],
    queryFn: () => base44.entities.Customers.list('-created_date'),
  });

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !search || c.customer_id?.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q) || c.account_number?.toLowerCase().includes(q);
  });

  const generateAccountNumber = (region) => {
    const existing = customers.filter(c => c.customer_id?.startsWith(region));
    return `${region}${String(1000 + existing.length + 1)}`;
  };

  const handleAdd = async () => {
    const accountNum = generateAccountNumber(newCustomer.region);
    const plan = PLANS[newCustomer.plan];
    await base44.entities.Customers.create({
      customer_id: accountNum,
      account_number: accountNum,
      company_name: newCustomer.company_name,
      contact: newCustomer.contact,
      phone: newCustomer.phone,
      email: newCustomer.email,
      delivery_address: newCustomer.delivery_address,
      br_address: newCustomer.br_address,
      logo_url: newCustomer.logo_url,
      br_document_url: newCustomer.br_document_url,
      status: 'active',
      plan: newCustomer.plan,
      monthly_credits: plan.credits,
      credits_balance: plan.credits,
      approved_date: new Date().toISOString().split('T')[0],
      user_email: newCustomer.email,
    });
    await base44.entities.CreditsLog.create({
      customer_id: accountNum,
      month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      allocated: plan.credits,
      used: 0,
      remaining: plan.credits,
      type: 'allocation',
      status: 'active',
    });
    queryClient.invalidateQueries({ queryKey: ['allCustomers'] });
    setAddOpen(false);
    setNewCustomer({ company_name: '', contact: '', phone: '', email: '', delivery_address: '', br_address: '', plan: 'plan_a', region: 'PDK', logo_url: '', br_document_url: '' });
    toast.success('客戶已新增');
  };

  const toggleStatus = async (customer) => {
    const newStatus = customer.status === 'active' ? 'suspended' : 'active';
    await base44.entities.Customers.update(customer.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['allCustomers'] });
    toast.success(`客戶已${newStatus === 'active' ? '啟用' : '暫停'}`);
  };

  const approvePending = async (customer) => {
    await base44.entities.Customers.update(customer.id, { ...customer.pending_changes, pending_changes: null });
    queryClient.invalidateQueries({ queryKey: ['allCustomers'] });
    setPendingOpen(null);
    toast.success('變更已批准');
  };

  const rejectPending = async (customer) => {
    await base44.entities.Customers.update(customer.id, { pending_changes: null });
    queryClient.invalidateQueries({ queryKey: ['allCustomers'] });
    setPendingOpen(null);
    toast.success('變更已拒絕');
  };

  return (
    <div>
      <PageHeader
        title="客戶管理"
        action={<Button className="bg-primary" onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4 mr-2" />新增客戶</Button>}
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜尋帳戶編號或公司名稱..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>帳戶編號</TableHead>
              <TableHead>公司名稱</TableHead>
              <TableHead>聯絡人</TableHead>
              <TableHead>計劃</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => setDetailOpen(c)}>
                <TableCell onClick={e => e.stopPropagation()}>
                  {c.logo_url ? (
                    <img src={c.logo_url} alt="logo" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">{c.customer_id}</TableCell>
                <TableCell className="font-medium">{c.company_name}</TableCell>
                <TableCell className="text-sm">{c.contact}</TableCell>
                <TableCell className="text-sm">{PLANS[c.plan]?.name || '-'}</TableCell>
                <TableCell className="font-semibold">{(c.credits_balance || 0).toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(c)}>
                      {c.status === 'active' ? '暫停' : '啟用'}
                    </Button>
                    {c.pending_changes && (
                      <Button variant="outline" size="sm" className="text-amber-600" onClick={() => setPendingOpen(c)}>
                        審批
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Customer Detail Dialog with Branches tab */}
      <Dialog open={!!detailOpen} onOpenChange={() => setDetailOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {detailOpen?.logo_url && <img src={detailOpen.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
              {detailOpen?.company_name}
            </DialogTitle>
          </DialogHeader>
          {detailOpen && (
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">公司資料</TabsTrigger>
                <TabsTrigger value="branches">分店</TabsTrigger>
                {detailOpen.br_document_url && <TabsTrigger value="br">商業登記</TabsTrigger>}
              </TabsList>
              <TabsContent value="info" className="space-y-3 text-sm pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">帳戶編號：</span><span className="font-mono font-semibold">{detailOpen.customer_id}</span></div>
                  <div><span className="text-muted-foreground">狀態：</span><StatusBadge status={detailOpen.status} /></div>
                  <div><span className="text-muted-foreground">聯絡人：</span>{detailOpen.contact}</div>
                  <div><span className="text-muted-foreground">電話：</span>{detailOpen.phone}</div>
                  <div><span className="text-muted-foreground">電郵：</span>{detailOpen.email}</div>
                  <div><span className="text-muted-foreground">計劃：</span>{PLANS[detailOpen.plan]?.name || '-'}</div>
                  <div><span className="text-muted-foreground">Credits 餘額：</span><span className="font-bold text-primary">{(detailOpen.credits_balance || 0).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">每月 Credits：</span>{detailOpen.monthly_credits || '-'}</div>
                </div>
                <div><span className="text-muted-foreground">送貨地址：</span>{detailOpen.delivery_address || '-'}</div>
                <div><span className="text-muted-foreground">商業登記地址：</span>{detailOpen.br_address || '-'}</div>
              </TabsContent>
              <TabsContent value="branches" className="pt-3">
                <BranchManagement customerId={detailOpen.customer_id} />
              </TabsContent>
              {detailOpen.br_document_url && (
                <TabsContent value="br" className="pt-3">
                  {detailOpen.br_document_url.endsWith('.pdf') ? (
                    <a href={detailOpen.br_document_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">查看商業登記文件 (PDF)</a>
                  ) : (
                    <img src={detailOpen.br_document_url} alt="BR" className="max-w-full rounded-lg border" />
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>新增客戶</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block">公司 Logo</Label>
              <DragDropUpload value={newCustomer.logo_url} onChange={url => setNewCustomer({ ...newCustomer, logo_url: url })} accept="image/*" label="上傳 Logo" hint="PNG / JPG" />
            </div>
            <div><Label>公司名稱</Label><Input value={newCustomer.company_name} onChange={e => setNewCustomer({ ...newCustomer, company_name: e.target.value })} /></div>
            <div><Label>聯絡人</Label><Input value={newCustomer.contact} onChange={e => setNewCustomer({ ...newCustomer, contact: e.target.value })} /></div>
            <div><Label>電話</Label><Input value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></div>
            <div><Label>電郵</Label><Input value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} /></div>
            <div><Label>送貨地址</Label><Input value={newCustomer.delivery_address} onChange={e => setNewCustomer({ ...newCustomer, delivery_address: e.target.value })} /></div>
            <div><Label>商業登記地址</Label><Input value={newCustomer.br_address} onChange={e => setNewCustomer({ ...newCustomer, br_address: e.target.value })} /></div>
            <div>
              <Label className="mb-1.5 block">商業登記文件</Label>
              <DragDropUpload value={newCustomer.br_document_url} onChange={url => setNewCustomer({ ...newCustomer, br_document_url: url })} accept="image/*,.pdf" label="上傳商業登記 (BR)" hint="PNG / JPG / PDF，最大 10MB" />
            </div>
            <div>
              <Label>區域</Label>
              <Select value={newCustomer.region} onValueChange={v => setNewCustomer({ ...newCustomer, region: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REGIONS).map(([k, v]) => <SelectItem key={k} value={k}>{k} - {v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>計劃</Label>
              <Select value={newCustomer.plan} onValueChange={v => setNewCustomer({ ...newCustomer, plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
            <Button className="bg-primary" onClick={handleAdd}>新增</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Changes Dialog */}
      <Dialog open={!!pendingOpen} onOpenChange={() => setPendingOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>審批變更 - {pendingOpen?.customer_id}</DialogTitle></DialogHeader>
          {pendingOpen?.pending_changes && (
            <div className="space-y-2 text-sm">
              {Object.entries(pendingOpen.pending_changes).map(([key, val]) => (
                <div key={key} className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => rejectPending(pendingOpen)}><X className="h-4 w-4 mr-1" />拒絕</Button>
            <Button className="bg-primary" onClick={() => approvePending(pendingOpen)}><Check className="h-4 w-4 mr-1" />批准</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}