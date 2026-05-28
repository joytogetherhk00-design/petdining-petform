import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';

export default function OrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Orders.filter({ user_email: me.email }, '-order_date');
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['myEnrollments'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Enrollments.filter({ user_email: me.email }, '-enrollment_date');
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ['orderItems', selectedOrder?.id],
    queryFn: () => base44.entities.OrderItems.filter({ order_id: selectedOrder?.id }),
    enabled: !!selectedOrder,
  });

  return (
    <div>
      <PageHeader title="我的記錄" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="orders">訂單記錄</TabsTrigger>
          <TabsTrigger value="courses">課程報名</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>暫無訂單記錄</p>
            </div>
          ) : (
            orders.map(order => (
              <Card
                key={order.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.order_date ? format(new Date(order.order_date), 'yyyy/MM/dd HH:mm') : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">HK${(order.credits_used || 0).toLocaleString()}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-3">
          {enrollments.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>暫無課程報名記錄</p>
            </div>
          ) : (
            enrollments.map(enrollment => (
              <Card
                key={enrollment.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedEnrollment(enrollment)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{enrollment.course_title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {enrollment.enrollment_date ? format(new Date(enrollment.enrollment_date), 'yyyy/MM/dd HH:mm') : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Badge variant={enrollment.payment_method === 'quota' ? 'secondary' : 'default'}>
                        {enrollment.payment_method === 'quota' ? 'Quota' : 'Stripe'}
                      </Badge>
                      <StatusBadge status={enrollment.status} />
                    </div>
                    <p className="font-bold text-primary">HK${enrollment.amount_paid?.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>訂單詳情 - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">狀態：</span><StatusBadge status={selectedOrder.status} /></div>
                <div><span className="text-muted-foreground">日期：</span>{selectedOrder.order_date ? format(new Date(selectedOrder.order_date), 'yyyy/MM/dd') : '-'}</div>
                <div><span className="text-muted-foreground">積分使用：</span>{selectedOrder.credits_used}</div>
                <div><span className="text-muted-foreground">Credits 使用：</span>HK${(selectedOrder.credits_used || 0).toLocaleString()}</div>
              </div>
              {selectedOrder.delivery_address && (
                <div className="text-sm"><span className="text-muted-foreground">送貨地址：</span>{selectedOrder.delivery_address}</div>
              )}
              {selectedOrder.notes && (
                <div className="text-sm"><span className="text-muted-foreground">備註：</span>{selectedOrder.notes}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enrollment Details Dialog */}
      <Dialog open={!!selectedEnrollment} onOpenChange={() => setSelectedEnrollment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>報名詳情 - {selectedEnrollment?.course_title}</DialogTitle>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">狀態：</span><StatusBadge status={selectedEnrollment.status} /></div>
                <div><span className="text-muted-foreground">報名日期：</span>{selectedEnrollment.enrollment_date ? format(new Date(selectedEnrollment.enrollment_date), 'yyyy/MM/dd') : '-'}</div>
                <div><span className="text-muted-foreground">支付方式：</span>
                  <Badge variant={selectedEnrollment.payment_method === 'quota' ? 'secondary' : 'default'} className="ml-2">
                    {selectedEnrollment.payment_method === 'quota' ? 'Quota' : 'Stripe'}
                  </Badge>
                </div>
                <div><span className="text-muted-foreground">支付狀態：</span><StatusBadge status={selectedEnrollment.payment_status} /></div>
                <div><span className="text-muted-foreground">金額：</span>HK${selectedEnrollment.amount_paid?.toLocaleString()}</div>
                {selectedEnrollment.quota_used && (
                  <div><span className="text-muted-foreground">Quota 使用：</span>是</div>
                )}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">用戶：</span>{selectedEnrollment.user_name} ({selectedEnrollment.user_email})
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}