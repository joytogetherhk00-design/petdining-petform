import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, CreditCard, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionManagement() {
  const [search, setSearch] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['creditTransactions'],
    queryFn: () => base44.entities.CreditTransaction.list('-created_date', 200),
  });

  const filtered = transactions.filter(t =>
    !search ||
    t.customer_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
    t.stripe_session_id?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCompleted = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.payment_amount || 0), 0);

  const typeLabel = { topup: '充值', deduction: '扣減', refund: '退款' };
  const typeBadge = { topup: 'bg-green-100 text-green-700', deduction: 'bg-red-100 text-red-700', refund: 'bg-blue-100 text-blue-700' };

  return (
    <div>
      <PageHeader title="交易記錄" description="Stripe 充值交易歷史" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">完成交易</p>
              <p className="text-xl font-bold">{transactions.filter(t => t.status === 'completed').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">總收入 (HKD)</p>
              <p className="text-xl font-bold">HK${totalCompleted.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="搜尋客戶、Session ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>客戶編號</TableHead>
              <TableHead>類型</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead className="text-right">金額 (HKD)</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>Session ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暫無交易記錄</TableCell></TableRow>
            ) : filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell className="text-sm">{t.created_date ? format(new Date(t.created_date), 'MM/dd HH:mm') : '-'}</TableCell>
                <TableCell className="font-mono text-xs">{t.customer_id}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={typeBadge[t.type]}>{typeLabel[t.type] || t.type}</Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">{t.amount?.toLocaleString()}</TableCell>
                <TableCell className="text-right">HK${t.payment_amount?.toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[140px]">{t.stripe_session_id || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}