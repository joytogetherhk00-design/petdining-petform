import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, CheckCircle, XCircle, Clock, Mail, Bell, Award } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

export default function EnrollmentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => base44.entities.Enrollments.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Enrollments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('已更新');
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: ({ enrollmentId, notificationType }) => 
      base44.functions.invoke('notifyEnrollment', { enrollmentId, notificationType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  const handleSendNotification = (enrollment, type) => {
    const labels = {
      confirmation: '確認通知',
      reminder: '提醒通知',
      completion: '完成通知',
    };
    
    if (window.confirm(`確定要發送${labels[type]}給 ${enrollment.user_name}？`)) {
      sendNotificationMutation.mutate({
        enrollmentId: enrollment.id,
        notificationType: type,
      }, {
        onSuccess: () => {
          toast.success(`${labels[type]}已發送`);
        },
        onError: (error) => {
          toast.error(`發送失敗：${error.message}`);
        },
      });
    }
  };

  const handleStatusChange = (enrollment, newStatus) => {
    updateMutation.mutate({
      id: enrollment.id,
      data: { status: newStatus }
    });
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = enrollment.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || enrollment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="報名管理"
          description="管理所有課程報名記錄"
        />

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜索報名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="pending">待處理</TabsTrigger>
              <TabsTrigger value="confirmed">已確認</TabsTrigger>
              <TabsTrigger value="completed">已完成</TabsTrigger>
              <TabsTrigger value="cancelled">已取消</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-4">
          {filteredEnrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{enrollment.course_title}</h3>
                      <Badge variant={
                        enrollment.status === 'confirmed' ? 'default' :
                        enrollment.status === 'completed' ? 'secondary' :
                        enrollment.status === 'cancelled' ? 'destructive' : 'outline'
                      }>
                        {enrollment.status}
                      </Badge>
                      {enrollment.payment_method === 'quota' && (
                        <Badge variant="outline">Quota</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mt-4">
                      <div>
                        <p className="text-muted-foreground">學員</p>
                        <p className="font-medium">{enrollment.student_name || enrollment.user_name}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.user_email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">課程</p>
                        <p className="font-medium">{enrollment.course_title}</p>
                        <p className="text-xs text-muted-foreground">#{enrollment.enrollment_id?.slice(-6) || enrollment.id.slice(-6)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">支付方式</p>
                        <p className="font-medium">
                          {enrollment.payment_method === 'stripe' ? 'Stripe' : 'Quota'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {enrollment.payment_method === 'stripe' ? `HK$${enrollment.amount_paid}` : '免費'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">支付狀態</p>
                        <p className="font-medium">{enrollment.payment_status}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">報名日期</p>
                        <p className="font-medium">
                          {new Date(enrollment.enrollment_date).toLocaleDateString('zh-HK')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {enrollment.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(enrollment, 'confirmed')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          確認
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(enrollment, 'cancelled')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          取消
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSendNotification(enrollment, 'confirmation')}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          發送確認
                        </Button>
                      </>
                    )}
                    {enrollment.status === 'confirmed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(enrollment, 'completed')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          標記為完成
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSendNotification(enrollment, 'reminder')}
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          發送提醒
                        </Button>
                      </>
                    )}
                    {enrollment.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSendNotification(enrollment, 'completion')}
                      >
                        <Award className="w-4 h-4 mr-2" />
                        發送完成證書
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEnrollments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暫無報名記錄</p>
          </div>
        )}
      </div>
    </div>
  );
}