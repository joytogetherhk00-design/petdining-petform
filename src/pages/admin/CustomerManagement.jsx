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
import { Search, Plus, Check, X, UserPlus, Building2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { REGIONS } from '@/lib/planConfig';
import { toast } from 'sonner';

export default function CustomerManagement() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');
  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(null);
  const [pendingOpen, setPendingOpen] = useState(null);
  const [editOpen, setEditOpen] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    company_name: '', restaurant_name: '', contact: '', phone: '', email: '',
    delivery_address: '', branch_address: '', br_address: '', region: 'PDK',
    logo_url: '', br_document_url: '', temp_password: '',
  });
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['allCustomers'],
    queryFn: () => base44.entities.Customers.list('-created_date'),
  });

  const pendingCustomers = customers.filter(c => c.status === 'pending');
  const activeCustomers = customers.filter(c => c.status === 'active' || c.status === 'suspended');

  const filtered = (tab === 'pending' ? pendingCustomers : activeCustomers).filter(c => {
    const q = search.toLowerCase();
    return !search || c.customer_id?.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q) || c.account_number?.toLowerCase().includes(q) || c.restaurant_name?.toLowerCase().includes(q);
  });

  const generateAccountNumber = (region) => {
    const existing = customers.filter(c => c.customer_id?.startsWith(region));
    return `${region}${String(1000 + existing.length + 1)}`;
  };

  const handleAdd = async () => {
    const accountNum = generateAccountNumber(newCustomer.region);
    await base44.entities.Customers.create({
      customer_id: accountNum,
      account_number: accountNum,
      company_name: newCustomer.company_name,
      restaurant_name: newCustomer.restaurant_name,
      contact: newCustomer.contact,
      phone: newCustomer.phone,
      email: newCustomer.email,
      delivery_address: newCustomer.delivery_address,
      branch_address: newCustomer.branch_address,
      br_address: newCustomer.br_address,
      logo_url: newCustomer.logo_url,
      br_document_url: newCustomer.br_document_url,
      status: 'pending',
      credits_balance: 0,
      user_email: newCustomer.email,
      onboarding_completed: true,
      temp_password: newCustomer.temp_password || undefined,
      must_change_password: !!newCustomer.temp_password,
    });
    queryClient.invalidateQueries({ queryKey: ['allCustomers'] });
    setAddOpen(false);
    setNewCustomer({ company_name: '', restaurant_name: '', contact: '', phone: '', email: '', delivery_address: '', branch_address: '', br_address: '', region: 'PDK', logo_url: '', br_document_url: '', temp_password: '' });
    toast.success('客戶已新增（待審批）');
  };

  const handleEdit = async () => {
    if (!editOpen) return;
    await base44.entities.Customers.update(editOpen.id, editOpen);
    queryClient.invalidateQueries({ queryKey: ['allCustomers'] });
    setEditOpen(null);
    toast.success('客戶資料已更新');
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

  const handleDelete = async (customer) => {
    await base44.entities.Customers.delete(customer.id);
    queryClient.invalidateQueries({ queryKey: ['allCustomers'] });
    setDeleteConfirm(null);
    toast.success('客戶已刪除');
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

      {/* Sub-Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={tab === 'pending' ? 'default' : 'outline'}
          className={tab === 'pending' ? 'bg-primary' : ''}
          onClick={() => setTab('pending')}
        >
          🔔 帳戶申請
          {pendingCustomers.length > 0 && (
            <span className={`ml-1.5 text-xs font-bold rounded-full px-1.5 py-0.5 leading-none ${tab === 'pending' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
              {pendingCustomers.length}
            </span>
          )}
        </Button>
        <Button
          variant={tab === 'active' ? 'default' : 'outline'}
          className={tab === 'active' ? 'bg-primary' : ''}
          onClick={() => setTab('active')}
        >
          👥 現有帳戶
          {activeCustomers.length > 0 && (
            <span className={`ml-1.5 text-xs font-bold rounded-full px-1.5 py-0.5 leading-none ${tab === 'active' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
              {activeCustomers.length}
            </span>
          )}
        </Button>
      </div>

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
              <TableHead>餐廳名稱</TableHead>
              <TableHead>聯絡人</TableHead>
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
                <TableCell className="text-sm text-muted-foreground">{c.restaurant_name || '-'}</TableCell>
                <TableCell className="text-sm">{c.contact}</TableCell>
                <TableCell className="font-semibold">{(c.credits_balance || 0).toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(c)}>
                      {c.status === 'active' ? '暫停' : '啟用'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditOpen({ ...c })}>
                      編輯
                    </Button>
                    {c.pending_changes && (
                      <Button variant="outline" size="sm" className="text-amber-600" onClick={() => setPendingOpen(c)}>
                        審批
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm(c)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
              {detailOpen?.logo_url ? (
                <img src={detailOpen.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {detailOpen?.company_name}
            </DialogTitle>
          </DialogHeader>
          {detailOpen && (
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">公司資料</TabsTrigger>
                <TabsTrigger value="branches">分店</TabsTrigger>
                {detailOpen?.br_document_url && <TabsTrigger value="br">商業登記</TabsTrigger>}
              </TabsList>
              <TabsContent value="info" className="space-y-3 text-sm pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">帳戶編號：</span><span className="font-mono font-semibold">{detailOpen.customer_id}</span></div>
                  <div><span className="text-muted-foreground">狀態：</span><StatusBadge status={detailOpen.status} /></div>
                  <div><span className="text-muted-foreground">建立方式：</span>
                    {detailOpen.created_by_admin ? '管理員新增' : detailOpen.created_by_onboarding ? 'Onboarding' : detailOpen.created_by_application ? '申請批准' : '未知'}
                  </div>
                  <div><span className="text-muted-foreground">聯絡人：</span>{detailOpen.contact}</div>
                  <div><span className="text-muted-foreground">電話：</span>{detailOpen.phone}</div>
                  <div><span className="text-muted-foreground">電郵：</span>{detailOpen.email}</div>
                  <div><span className="text-muted-foreground">Credits 餘額：</span><span className="font-bold text-primary">{(detailOpen.credits_balance || 0).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">每月 Credits：</span>{detailOpen.monthly_credits || '-'}</div>
                </div>
                <div><span className="text-muted-foreground">送貨地址：</span>{detailOpen.delivery_address || '-'}</div>
                <div><span className="text-muted-foreground">分店地址：</span>{detailOpen.branch_address || '-'}</div>
                <div><span className="text-muted-foreground">商業登記地址：</span>{detailOpen.br_address || '-'}</div>
              </TabsContent>
              <TabsContent value="branches" className="pt-3">
                <BranchManagement customerId={detailOpen.customer_id} />
              </TabsContent>
              {detailOpen?.br_document_url && (
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
            <div><Label>餐廳名稱</Label><Input value={newCustomer.restaurant_name} onChange={e => setNewCustomer({ ...newCustomer, restaurant_name: e.target.value })} /></div>
            <div><Label>聯絡人</Label><Input value={newCustomer.contact} onChange={e => setNewCustomer({ ...newCustomer, contact: e.target.value })} /></div>
            <div><Label>電話</Label><Input value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></div>
            <div><Label>電郵</Label><Input value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} /></div>
            <div><Label>送貨地址 <span className="text-destructive">*</span></Label><Input value={newCustomer.delivery_address} onChange={e => setNewCustomer({ ...newCustomer, delivery_address: e.target.value })} /></div>
            <div><Label>分店地址 <span className="text-destructive">*</span></Label><Input value={newCustomer.branch_address} onChange={e => setNewCustomer({ ...newCustomer, branch_address: e.target.value })} /></div>
            <div><Label>商業登記地址</Label><Input value={newCustomer.br_address} onChange={e => setNewCustomer({ ...newCustomer, br_address: e.target.value })} /></div>
            <div>
              <Label className="mb-1.5 block">商業登記文件</Label>
              <DragDropUpload value={newCustomer.br_document_url} onChange={url => setNewCustomer({ ...newCustomer, br_document_url: url })} accept="image/*,.pdf" label="上傳商業登記 (BR)" hint="PNG / JPG / PDF，最大 10MB" />
            </div>
            <div><Label>臨時密碼 <span className="text-muted-foreground text-xs">（用戶首次登入後須更改）</span></Label><Input value={newCustomer.temp_password} onChange={e => setNewCustomer({ ...newCustomer, temp_password: e.target.value })} placeholder="選填，設定後用戶須強制更改" /></div>
            <div>
              <Label>區域</Label>
              <Select value={newCustomer.region} onValueChange={v => setNewCustomer({ ...newCustomer, region: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REGIONS).map(([k, v]) => <SelectItem key={k} value={k}>{k} - {v}</SelectItem>)}
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

      {/* Edit Customer Dialog */}
      <Dialog open={!!editOpen} onOpenChange={() => setEditOpen(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>編輯客戶資料 — {editOpen?.customer_id}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block">公司 Logo</Label>
              <DragDropUpload value={editOpen?.logo_url || ''} onChange={url => setEditOpen({ ...editOpen, logo_url: url })} accept="image/*" label="上傳 Logo" hint="PNG / JPG" />
            </div>
            <div><Label>公司名稱</Label><Input value={editOpen?.company_name || ''} onChange={e => setEditOpen({ ...editOpen, company_name: e.target.value })} /></div>
            <div><Label>聯絡人</Label><Input value={editOpen?.contact || ''} onChange={e => setEditOpen({ ...editOpen, contact: e.target.value })} /></div>
            <div><Label>電話</Label><Input value={editOpen?.phone || ''} onChange={e => setEditOpen({ ...editOpen, phone: e.target.value })} /></div>
            <div><Label>電郵</Label><Input value={editOpen?.email || ''} onChange={e => setEditOpen({ ...editOpen, email: e.target.value })} /></div>
            <div><Label>送貨地址</Label><Input value={editOpen?.delivery_address || ''} onChange={e => setEditOpen({ ...editOpen, delivery_address: e.target.value })} /></div>
            <div><Label>分店地址</Label><Input value={editOpen?.branch_address || ''} onChange={e => setEditOpen({ ...editOpen, branch_address: e.target.value })} /></div>
            <div><Label>商業登記地址</Label><Input value={editOpen?.br_address || ''} onChange={e => setEditOpen({ ...editOpen, br_address: e.target.value })} /></div>
            <div>
              <Label className="mb-1.5 block">商業登記文件</Label>
              <DragDropUpload value={editOpen?.br_document_url || ''} onChange={url => setEditOpen({ ...editOpen, br_document_url: url })} accept="image/*,.pdf" label="上傳商業登記 (BR)" hint="PNG / JPG / PDF，最大 10MB" />
            </div>
            <div>
              <Label>每月 Credits</Label>
              <Input type="number" value={editOpen?.monthly_credits || 0} onChange={e => setEditOpen({ ...editOpen, monthly_credits: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(null)}>取消</Button>
            <Button className="bg-primary" onClick={handleEdit}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除客戶</AlertDialogTitle>
            <AlertDialogDescription>
              即將刪除 <strong>{deleteConfirm?.company_name}</strong>（{deleteConfirm?.customer_id}）。此操作不可撤銷，所有相關資料將被永久移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(deleteConfirm)}>確認刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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