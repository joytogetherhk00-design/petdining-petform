import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

export default function OrderHistory() {
  const [selected, setSelected] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Orders.filter({ user_email: me.email }, '-order_date');
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ['orderItems', selected?.id],
    queryFn: () => base44.entities.OrderItems.filter({ order_id: selected.id }),
    enabled: !!selected,
  });

  if (!isLoading && orders.length === 0) {
    return (
      <div>
        <PageHeader title="訂單記錄" />
        <div className="text-center py-20 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>暫無訂單記錄</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="訂單記錄" />

      <div className="space-y-3">
        {orders.map(order => (
          <Card
            key={order.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelected(order)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{order.order_number}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.order_date ? format(new Date(order.order_date), 'yyyy/MM/dd HH:mm') : '-'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">HK${order.total?.toLocaleString()}</p>
                <StatusBadge status={order.status} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>訂單詳情 - {selected?.order_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">狀態：</span><StatusBadge status={selected.status} /></div>
                <div><span className="text-muted-foreground">日期：</span>{selected.order_date ? format(new Date(selected.order_date), 'yyyy/MM/dd') : '-'}</div>
                <div><span className="text-muted-foreground">積分使用：</span>{selected.credits_used}</div>
                <div><span className="text-muted-foreground">總計：</span>HK${selected.total?.toLocaleString()}</div>
              </div>
              {selected.delivery_address && (
                <div className="text-sm"><span className="text-muted-foreground">送貨地址：</span>{selected.delivery_address}</div>
              )}
              {selected.notes && (
                <div className="text-sm"><span className="text-muted-foreground">備註：</span>{selected.notes}</div>
              )}
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