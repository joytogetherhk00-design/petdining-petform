import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待處理' },
  { value: 'confirmed', label: '已確認' },
  { value: 'shipped', label: '已出貨' },
  { value: 'completed', label: '已完成' },
];

export default function OrderManagement() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => base44.entities.Orders.list('-order_date'),
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ['orderItems', selected?.id],
    queryFn: () => base44.entities.OrderItems.filter({ order_id: selected.id }),
    enabled: !!selected,
  });

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  const updateStatus = async (order, newStatus) => {
    await base44.entities.Orders.update(order.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['allOrders'] });
    if (selected?.id === order.id) setSelected({ ...order, status: newStatus });
    toast.success('訂單狀態已更新');
  };

  return (
    <div>
      <PageHeader title="訂單管理" />

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>訂單編號</TableHead>
              <TableHead>客戶</TableHead>
              <TableHead>日期</TableHead>
              <TableHead>總計</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(order => (
              <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelected(order)}>
                <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                <TableCell>{order.customer_id}</TableCell>
                <TableCell className="text-sm">{order.order_date ? format(new Date(order.order_date), 'yyyy/MM/dd') : '-'}</TableCell>
                <TableCell className="font-semibold">HK${order.total?.toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={order.status} /></TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Select value={order.status} onValueChange={v => updateStatus(order, v)}>
                    <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">待處理</SelectItem>
                      <SelectItem value="confirmed">已確認</SelectItem>
                      <SelectItem value="shipped">已出貨</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>訂單詳情 - {selected?.order_number}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">客戶：</span>{selected.customer_id}</div>
                <div><span className="text-muted-foreground">狀態：</span><StatusBadge status={selected.status} /></div>
                <div><span className="text-muted-foreground">日期：</span>{selected.order_date ? format(new Date(selected.order_date), 'yyyy/MM/dd HH:mm') : '-'}</div>
                <div><span className="text-muted-foreground">總計：</span>HK${selected.total?.toLocaleString()}</div>
                <div><span className="text-muted-foreground">積分：</span>{selected.credits_used}</div>
              </div>
              {selected.delivery_address && <div className="text-sm"><span className="text-muted-foreground">送貨地址：</span>{selected.delivery_address}</div>}
              {selected.notes && <div className="text-sm"><span className="text-muted-foreground">備註：</span>{selected.notes}</div>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>產品</TableHead>
                    <TableHead className="text-right">數量</TableHead>
                    <TableHead className="text-right">單價</TableHead>
                    <TableHead className="text-right">小計</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{item.product_name}</TableCell>
                      <TableCell className="text-right">{item.qty}</TableCell>
                      <TableCell className="text-right">HK${item.price}</TableCell>
                      <TableCell className="text-right font-medium">HK${item.subtotal?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}