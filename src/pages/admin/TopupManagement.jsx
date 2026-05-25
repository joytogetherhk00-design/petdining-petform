import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function TopupManagement() {
  const queryClient = useQueryClient();

  const { data: topups = [] } = useQuery({
    queryKey: ['allTopups'],
    queryFn: () => base44.entities.CreditsTopup.list('-date'),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['allCustomers'],
    queryFn: () => base44.entities.Customers.list(),
  });

  const approve = async (topup) => {
    await base44.entities.CreditsTopup.update(topup.id, { status: 'approved' });

    const customer = customers.find(c => c.customer_id === topup.customer_id);
    if (customer) {
      await base44.entities.Customers.update(customer.id, {
        credits_balance: (customer.credits_balance || 0) + topup.amount,
      });
      const now = new Date();
      await base44.entities.CreditsLog.create({
        customer_id: topup.customer_id,
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        allocated: topup.amount,
        type: 'topup',
        status: 'active',
      });
    }

    queryClient.invalidateQueries({ queryKey: ['allTopups'] });
    queryClient.invalidateQueries({ queryKey: ['allCustomers'] });
    toast.success('增值已批准，積分已加入');
  };

  const reject = async (topup) => {
    await base44.entities.CreditsTopup.update(topup.id, { status: 'rejected' });
    queryClient.invalidateQueries({ queryKey: ['allTopups'] });
    toast.success('增值申請已拒絕');
  };

  const getCustomerName = (cid) => {
    const c = customers.find(c => c.customer_id === cid);
    return c?.company_name || cid;
  };

  return (
    <div>
      <PageHeader title="Top-up 管理" />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客戶</TableHead>
              <TableHead>公司名稱</TableHead>
              <TableHead>金額</TableHead>
              <TableHead>日期</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topups.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.customer_id}</TableCell>
                <TableCell>{getCustomerName(t.customer_id)}</TableCell>
                <TableCell className="font-semibold">HK${t.amount?.toLocaleString()}</TableCell>
                <TableCell className="text-sm">{t.date ? format(new Date(t.date), 'yyyy/MM/dd') : '-'}</TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell>
                  {t.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7" onClick={() => approve(t)}>
                        <Check className="h-3.5 w-3.5 mr-1" />批准
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-destructive" onClick={() => reject(t)}>
                        <X className="h-3.5 w-3.5 mr-1" />拒絕
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}