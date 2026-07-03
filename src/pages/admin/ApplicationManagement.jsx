import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Check, X, Building2, ExternalLink } from 'lucide-react';
import { REGIONS } from '@/lib/planConfig';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ApplicationManagement() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');
  const [detailOpen, setDetailOpen] = useState(null);
  const [approveOpen, setApproveOpen] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approveRegion, setApproveRegion] = useState('PDK');
  const [tempPassword, setTempPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.Application.list('-created_date'),
  });

  const pendingApps = applications.filter(a => a.status === 'pending');
  const processedApps = applications.filter(a => a.status !== 'pending');

  const filtered = (tab === 'pending' ? pendingApps : processedApps).filter(a => {
    const q = search.toLowerCase();
    return !search || a.company_name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.contact?.toLowerCase().includes(q);
  });

  const handleApprove = async () => {
    if (!tempPassword || tempPassword.length < 6) {
      toast.error('請設定至少 6 個字元的臨時密碼');
      return;
    }
    setProcessing(true);
    const res = await base44.functions.invoke('notifyApplicant', {
      application_id: approveOpen.id,
      action: 'approve',
      region: approveRegion,
      temp_password: tempPassword,
    });
    if (res.data?.success) {
      toast.success(`申請已批准！客戶編號：${res.data.customer_id}`);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['allCustomers'] });
      setApproveOpen(null);
      setDetailOpen(null);
      setTempPassword('');
    } else {
      toast.error('批准失敗，請重試');
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    setProcessing(true);
    const res = await base44.functions.invoke('notifyApplicant', {
      application_id: rejectOpen.id,
      action: 'reject',
      rejection_reason: rejectionReason,
    });
    if (res.data?.success) {
      toast.success('申請已拒絕，通知已發送');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setRejectOpen(null);
      setDetailOpen(null);
      setRejectionReason('');
    } else {
      toast.error('操作失敗，請重試');
    }
    setProcessing(false);
  };

  return (
    <div>
      <PageHeader title="帳戶申請" description="審批新商戶開戶申請" />

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={tab === 'pending' ? 'default' : 'outline'}
          className={tab === 'pending' ? 'bg-primary' : ''}
          onClick={() => setTab('pending')}
        >
          🔔 待審批
          {pendingApps.length > 0 && (
            <span className={`ml-1.5 text-xs font-bold rounded-full px-1.5 py-0.5 leading-none ${tab === 'pending' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
              {pendingApps.length}
            </span>
          )}
        </Button>
        <Button
          variant={tab === 'processed' ? 'default' : 'outline'}
          className={tab === 'processed' ? 'bg-primary' : ''}
          onClick={() => setTab('processed')}
        >
          📋 已處理 ({processedApps.length})
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜尋公司名稱或電郵..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>公司名稱</TableHead>
              <TableHead>聯絡人</TableHead>
              <TableHead>電話</TableHead>
              <TableHead>電郵</TableHead>
              <TableHead>申請日期</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  {tab === 'pending' ? '暫無待審批申請' : '暫無已處理記錄'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map(app => (
              <TableRow key={app.id} className="cursor-pointer" onClick={() => setDetailOpen(app)}>
                <TableCell className="font-medium">{app.company_name}</TableCell>
                <TableCell className="text-sm">{app.contact}</TableCell>
                <TableCell className="text-sm">{app.phone}</TableCell>
                <TableCell className="text-sm">{app.email}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {app.created_date ? format(new Date(app.created_date), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell><StatusBadge status={app.status} /></TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  {app.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setApproveOpen(app); setApproveRegion('PDK'); }}>
                        <Check className="h-3 w-3 mr-1" />批准
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => { setRejectOpen(app); setRejectionReason(''); }}>
                        <X className="h-3 w-3 mr-1" />拒絕
                      </Button>
                    </div>
                  )}
                  {app.status === 'approved' && (
                    <span className="text-xs text-muted-foreground">客戶：{app.customer_id}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
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
                <TabsTrigger value="info">申請資料</TabsTrigger>
                {detailOpen.br_document_url && <TabsTrigger value="br">商業登記</TabsTrigger>}
              </TabsList>
              <TabsContent value="info" className="space-y-3 text-sm pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">聯絡人：</span>{detailOpen.contact}</div>
                  <div><span className="text-muted-foreground">電話：</span>
                    <a href={`https://wa.me/852${detailOpen.phone?.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                      {detailOpen.phone} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div><span className="text-muted-foreground">電郵：</span>{detailOpen.email}</div>
                  <div><span className="text-muted-foreground">狀態：</span><StatusBadge status={detailOpen.status} /></div>
                  {detailOpen.customer_id && <div><span className="text-muted-foreground">客戶編號：</span><span className="font-mono font-semibold">{detailOpen.customer_id}</span></div>}
                </div>
                <div><span className="text-muted-foreground">送貨地址：</span>{detailOpen.delivery_address}</div>
                <div><span className="text-muted-foreground">分店地址：</span>{detailOpen.branch_address}</div>
                <div><span className="text-muted-foreground">商業登記地址：</span>{detailOpen.br_address}</div>
                {detailOpen.notes && <div><span className="text-muted-foreground">備註：</span>{detailOpen.notes}</div>}
                {detailOpen.rejection_reason && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-muted-foreground">拒絕原因：</span>{detailOpen.rejection_reason}
                  </div>
                )}
              </TabsContent>
              {detailOpen.br_document_url && (
                <TabsContent value="br" className="pt-3">
                  {detailOpen.br_document_url.toLowerCase().includes('.pdf') ? (
                    <a href={detailOpen.br_document_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">查看商業登記文件 (PDF)</a>
                  ) : (
                    <img src={detailOpen.br_document_url} alt="BR" className="max-w-full rounded-lg border" />
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}
          {detailOpen?.status === 'pending' && (
            <DialogFooter className="gap-2">
              <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => { setRejectOpen(detailOpen); setDetailOpen(null); setRejectionReason(''); }}>
                <X className="h-4 w-4 mr-1" />拒絕
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => { setApproveOpen(detailOpen); setDetailOpen(null); }}>
                <Check className="h-4 w-4 mr-1" />批准
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveOpen} onOpenChange={() => { setApproveOpen(null); setTempPassword(''); }}>
      <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>批准申請 — 設定帳戶</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <p className="text-sm text-muted-foreground">{approveOpen?.company_name}</p>
        <div>
          <Label>區域</Label>
          <Select value={approveRegion} onValueChange={setApproveRegion}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(REGIONS).map(([k, v]) => <SelectItem key={k} value={k}>{k} - {v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>臨時密碼 <span className="text-destructive">*</span></Label>
          <Input
            className="mt-1"
            type="text"
            value={tempPassword}
            onChange={e => setTempPassword(e.target.value)}
            placeholder="設定用戶首次登入密碼（最少 6 位）"
          />
          <p className="text-xs text-muted-foreground mt-1">此密碼將發送給申請人，用戶首次登入後必須更改。</p>
        </div>
        <p className="text-xs text-muted-foreground bg-muted p-2 rounded">批准後將自動建立客戶帳戶並發送電郵通知。</p>
      </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(null)}>取消</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={processing}>
              {processing ? '處理中...' : '確認批准'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectOpen} onOpenChange={() => setRejectOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>拒絕申請</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{rejectOpen?.company_name}</p>
            <div>
              <Label>拒絕原因（可選，會發送給申請人）</Label>
              <Textarea
                className="mt-1"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="例：商業登記文件不清晰，請重新提交..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(null)}>取消</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? '處理中...' : '確認拒絕'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}