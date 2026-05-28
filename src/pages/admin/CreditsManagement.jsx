import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { PLANS } from '@/lib/planConfig';

export default function CreditsManagement() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data: customers = [] } = useQuery({
    queryKey: ['allCustomers'],
    queryFn: () => base44.entities.Customers.filter({ status: 'active' }),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['creditsLogs', selected?.customer_id],
    queryFn: () => base44.entities.CreditsLog.filter({ customer_id: selected.customer_id }, '-created_date'),
    enabled: !!selected,
  });

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !search || c.customer_id?.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q);
  });

  const exportCSV = () => {
    const headers = ['帳戶編號', '公司名稱', '積分餘額', '合約到期'];
    const rows = filtered.map(c => [c.customer_id, c.company_name, c.credits_balance || 0, c.contract_end_date || '-']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'credits_report.csv';
    a.click();
  };

  const typeLabels = { allocation: '分配', usage: '使用', topup: '增值', expiry: '過期' };

  return (
    <div>
      <PageHeader
        title="Credits 管理"
        action={<Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />匯出 CSV</Button>}
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜尋帳戶編號或公司名稱..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>帳戶編號</TableHead>
              <TableHead>公司名稱</TableHead>
              <TableHead>Credits 餘額</TableHead>
              <TableHead>合約到期</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.customer_id}</TableCell>
                <TableCell>{c.company_name}</TableCell>
                <TableCell className="font-semibold">{(c.credits_balance || 0).toLocaleString()}</TableCell>
                <TableCell className="text-sm">{c.contract_end_date || '-'}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setSelected(c)}>查看記錄</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>積分記錄 - {selected?.customer_id}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">暫無記錄</p>
            ) : logs.map(log => (
              <Card key={log.id} className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{typeLabels[log.type] || log.type}</span>
                  <span className={log.type === 'usage' || log.type === 'expiry' ? 'text-destructive' : 'text-green-600'}>
                    {log.type === 'usage' || log.type === 'expiry' ? '-' : '+'}{log.allocated || log.remaining || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{log.month}</p>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}