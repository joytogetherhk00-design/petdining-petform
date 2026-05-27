import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, Calendar, MapPin, CheckCircle, XCircle, Clock, Download, AlertCircle, UserCheck, Phone, Mail } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

export default function CourseEnrollmentDetail() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [attendanceMode, setAttendanceMode] = useState(false);

  const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: async () => {
      // 直接用 id 查找（因為 schedule_id 字段可能為空）
      const schedules = await base44.entities.CourseSchedule.list();
      return schedules.find(s => s.id === scheduleId || s.schedule_id === scheduleId) || null;
    },
    enabled: !!scheduleId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', scheduleId],
    queryFn: async () => {
      if (!schedule) return [];
      // 用 course_id 查找學員（因為 schedule_id 可能為空）
      const results = await base44.entities.Enrollments.filter({ course_id: schedule.course_id });
      return results;
    },
    enabled: !!scheduleId && !!schedule,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Enrollments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', scheduleId] });
      toast.success('已更新');
    },
  });

  const handleAttendanceCheck = async (enrollment, status) => {
    const user = await base44.auth.me();
    updateMutation.mutate({
      id: enrollment.id,
      data: {
        attendance_status: status,
        attendance_checked_at: new Date().toISOString(),
        attendance_checked_by: user?.email || 'unknown',
      }
    });
  };

  const getAttendanceBadge = (status) => {
    const config = {
      not_checked: { label: '未簽到', variant: 'outline', icon: Clock },
      attended: { label: '已出席', variant: 'default', icon: CheckCircle },
      absent: { label: '缺席', variant: 'destructive', icon: XCircle },
      late: { label: '遲到', variant: 'secondary', icon: AlertCircle },
    };
    const { label, variant, icon: Icon } = config[status] || config.not_checked;
    const BadgeIcon = Icon;
    return (
      <Badge variant={variant} className="gap-1">
        <BadgeIcon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const handleExportCSV = () => {
    const headers = ['姓名', '電話', '電郵', '公司', '分店', '支付狀態', '報名狀態', '出席狀態'];
    const rows = enrollments.map(e => [
      e.student_name || e.user_name,
      e.student_phone,
      e.student_email,
      e.company,
      e.branch,
      e.payment_status,
      e.status,
      e.attendance_status
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${schedule?.course_title || '學員名單'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('已匯出學員名單');
  };

  if (isLoadingSchedule) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p>載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">
            <p>找不到課程資料</p>
          </div>
        </div>
      </div>
    );
  }

  const enrolled = enrollments.length;
  const max = schedule.max_students || 0;
  const remaining = max - enrolled;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin/enrollments')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回課程列表
          </Button>
          <PageHeader
            title={schedule.course_title}
            description="查看課程詳情及學員名單"
          />
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">日期</p>
                  <p className="font-semibold">
                    {new Date(schedule.start_datetime).toLocaleDateString('zh-HK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(schedule.start_datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(schedule.end_datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <MapPin className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">地點</p>
                  <p className="font-semibold">{schedule.location || '待定'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">名額</p>
                  <p className="font-semibold">{max} 人</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  remaining === 0 ? 'bg-destructive/10' :
                  remaining <= 5 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <Users className={`w-6 h-6 ${
                    remaining === 0 ? 'text-destructive' :
                    remaining <= 5 ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">報名狀況</p>
                  <p className="font-semibold">
                    已報名 {enrolled} / 尚餘 {remaining}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                學員名單（{enrolled} 人）
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={attendanceMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAttendanceMode(!attendanceMode)}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  {attendanceMode ? '退出簽到' : '簽到模式'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  匯出 CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>電話</TableHead>
                    <TableHead>電郵</TableHead>
                    <TableHead>公司</TableHead>
                    <TableHead>分店</TableHead>
                    <TableHead>支付狀態</TableHead>
                    <TableHead>報名狀態</TableHead>
                    <TableHead>出席狀態</TableHead>
                    {attendanceMode && <TableHead>操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.student_name || enrollment.user_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {enrollment.student_phone}
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.student_email || enrollment.user_email}</TableCell>
                      <TableCell>{enrollment.company || '-'}</TableCell>
                      <TableCell>{enrollment.branch || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={enrollment.payment_status === 'paid' ? 'default' : 'outline'}>
                          {enrollment.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          enrollment.status === 'confirmed' ? 'default' :
                          enrollment.status === 'completed' ? 'secondary' :
                          enrollment.status === 'cancelled' ? 'destructive' : 'outline'
                        }>
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getAttendanceBadge(enrollment.attendance_status || 'not_checked')}
                        {enrollment.attendance_checked_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(enrollment.attendance_checked_at).toLocaleString('zh-HK')}
                          </p>
                        )}
                      </TableCell>
                      {attendanceMode && enrollment.status !== 'cancelled' && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={enrollment.attendance_status === 'attended' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceCheck(enrollment, 'attended')}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant={enrollment.attendance_status === 'absent' ? 'destructive' : 'outline'}
                              onClick={() => handleAttendanceCheck(enrollment, 'absent')}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant={enrollment.attendance_status === 'late' ? 'secondary' : 'outline'}
                              onClick={() => handleAttendanceCheck(enrollment, 'late')}
                            >
                              <AlertCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {enrollments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>暫無學員資料</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}