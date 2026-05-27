import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';

export default function MyCourses() {
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['myEnrollments'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Enrollments.filter({ user_email: me.email }, '-enrollment_date');
    },
  });

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return enrollment.status === 'pending' || enrollment.payment_status === 'pending';
    if (filterStatus === 'confirmed') return enrollment.status === 'confirmed' && enrollment.payment_status === 'paid';
    if (filterStatus === 'completed') return enrollment.status === 'completed';
    return true;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="我的課程"
          description="查看已報名的課程"
        />

        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="pending">待確認</TabsTrigger>
            <TabsTrigger value="confirmed">已確認</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full mx-auto"></div>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>暫無課程報名記錄</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEnrollments.map(enrollment => (
              <Card key={enrollment.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{enrollment.course_title}</h3>
                      <StatusBadge status={enrollment.status} />
                      <Badge variant={enrollment.payment_method === 'quota' ? 'secondary' : 'default'}>
                        {enrollment.payment_method === 'quota' ? 'Quota' : 'Stripe'}
                      </Badge>
                    </div>
                    
                    {enrollment.schedule_date && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(enrollment.schedule_date), 'yyyy/MM/dd')}
                          </span>
                        </div>
                        {enrollment.schedule_end && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(new Date(enrollment.schedule_date), 'HH:mm')} - {format(new Date(enrollment.schedule_end), 'HH:mm')}
                            </span>
                          </div>
                        )}
                        {enrollment.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{enrollment.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">學員：</span>
                        <span>{enrollment.student_name || enrollment.user_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">報名日期：</span>
                        <span>
                          {enrollment.enrollment_date ? format(new Date(enrollment.enrollment_date), 'yyyy/MM/dd') : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">報名編號：</span>
                        <span className="font-mono">#{enrollment.enrollment_id || enrollment.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">支付狀態</p>
                    <StatusBadge status={enrollment.payment_status} />
                    <p className="text-lg font-bold text-primary mt-2">
                      HK${enrollment.amount_paid?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}