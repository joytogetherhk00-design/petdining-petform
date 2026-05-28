import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Users, Calendar, MapPin, CheckCircle, XCircle, Clock,
  Download, AlertCircle, UserCheck, Phone, FileSpreadsheet, FileText, Pencil,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const STATUS_LABELS = {
  pending: '待確認',
  confirmed: '已確認',
  completed: '已完成',
  cancelled: '已取消',
};

const PAYMENT_LABELS = {
  pending: '待付款',
  paid: '已付款',
  refunded: '已退款',
};

const ATTENDANCE_LABELS = {
  not_checked: '未簽到',
  attended: '已出席',
  absent: '缺席',
  late: '遲到',
};

const SCHEDULE_STATUS_LABELS = {
  upcoming: '報名中',
  ongoing: '進行中',
  completed: '已完成',
  cancelled: '已截止',
};

function EditCourseDialog({ schedule, open, onClose, onSave }) {
  const [form, setForm] = useState({
    date: schedule ? new Date(schedule.start_datetime).toISOString().split('T')[0] : '',
    start_time: schedule ? new Date(schedule.start_datetime).toTimeString().slice(0, 5) : '',
    end_time: schedule ? new Date(schedule.end_datetime).toTimeString().slice(0, 5) : '',
    location: schedule?.location || '',
    max_students: schedule?.max_students || '',
    status: schedule?.status || 'upcoming',
  });

  React.useEffect(() => {
    if (schedule) {
      setForm({
        date: new Date(schedule.start_datetime).toISOString().split('T')[0],
        start_time: new Date(schedule.start_datetime).toTimeString().slice(0, 5),
        end_time: new Date(schedule.end_datetime).toTimeString().slice(0, 5),
        location: schedule.location || '',
        max_students: schedule.max_students || '',
        status: schedule.status || 'upcoming',
      });
    }
  }, [schedule]);

  const handleSave = () => {
    const start = new Date(`${form.date}T${form.start_time}:00`);
    const end = new Date(`${form.date}T${form.end_time}:00`);
    onSave({
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      location: form.location,
      max_students: Number(form.max_students),
      status: form.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>編輯課程資料</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1 block">日期</label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">開始時間</label>
              <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">結束時間</label>
              <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">地點</label>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="上課地點" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">名額上限</label>
            <Input type="number" value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">狀態</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SCHEDULE_STATUS_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setForm({ ...form, status: val })}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-all ${form.status === val ? 'bg-primary text-white border-primary' : 'border-input hover:bg-muted'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>儲存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditEnrollmentDialog({ enrollment, open, onClose, onSave }) {
  const [form, setForm] = useState({
    student_name: '',
    student_phone: '',
    student_email: '',
    company: '',
    branch: '',
    status: 'confirmed',
    payment_status: 'pending',
    attendance_status: 'not_checked',
    attendance_notes: '',
  });

  React.useEffect(() => {
    if (enrollment) {
      setForm({
        student_name: enrollment.student_name || enrollment.user_name || '',
        student_phone: enrollment.student_phone || '',
        student_email: enrollment.student_email || enrollment.user_email || '',
        company: enrollment.company || '',
        branch: enrollment.branch || '',
        status: enrollment.status || 'confirmed',
        payment_status: enrollment.payment_status || 'pending',
        attendance_status: enrollment.attendance_status || 'not_checked',
        attendance_notes: enrollment.attendance_notes || '',
      });
    }
  }, [enrollment]);

  const handleSave = () => onSave(form);

  const RadioGroup = ({ label, options, field }) => (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(({ val, text }) => (
          <button
            key={val}
            onClick={() => setForm({ ...form, [field]: val })}
            className={`px-3 py-1.5 rounded-md text-sm border transition-all ${form[field] === val ? 'bg-primary text-white border-primary' : 'border-input hover:bg-muted'}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>編輯學員資料</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">姓名</label>
              <Input value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">電話</label>
              <Input value={form.student_phone} onChange={e => setForm({ ...form, student_phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">電郵</label>
            <Input value={form.student_email} onChange={e => setForm({ ...form, student_email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">公司</label>
              <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">分店</label>
              <Input value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} />
            </div>
          </div>
          <RadioGroup
            label="報名狀態"
            field="status"
            options={[
              { val: 'pending', text: '待確認' },
              { val: 'confirmed', text: '已確認' },
              { val: 'completed', text: '已完成' },
              { val: 'cancelled', text: '已取消' },
            ]}
          />
          <RadioGroup
            label="支付狀態"
            field="payment_status"
            options={[
              { val: 'pending', text: '待付款' },
              { val: 'paid', text: '已付款' },
              { val: 'refunded', text: '已退款' },
            ]}
          />
          <RadioGroup
            label="出席狀態"
            field="attendance_status"
            options={[
              { val: 'not_checked', text: '未簽到' },
              { val: 'attended', text: '已出席' },
              { val: 'absent', text: '缺席' },
              { val: 'late', text: '遲到' },
            ]}
          />
          <div>
            <label className="text-sm font-medium mb-1 block">備註</label>
            <Input value={form.attendance_notes} onChange={e => setForm({ ...form, attendance_notes: e.target.value })} placeholder="備註（可選）" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>儲存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CourseEnrollmentDetail() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [editEnrollment, setEditEnrollment] = useState(null);

  const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: async () => {
      const schedules = await base44.entities.CourseSchedule.list();
      return schedules.find(s => s.id === scheduleId || s.schedule_id === scheduleId) || null;
    },
    enabled: !!scheduleId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', scheduleId],
    queryFn: async () => {
      if (!schedule) return [];
      return base44.entities.Enrollments.filter({ course_id: schedule.course_id });
    },
    enabled: !!scheduleId && !!schedule,
  });

  // Recalculate and sync enrollment counts to schedule
  const syncScheduleCapacity = async (scheduleId, newEnrollments, overrideMaxStudents) => {
    const confirmedCount = newEnrollments.filter(
      e => e.payment_status === 'paid' && e.status !== 'cancelled'
    ).length;
    const max = overrideMaxStudents ?? schedule?.max_students ?? 0;
    const spotsRemaining = max - confirmedCount;
    const updates = { enrolled_count: confirmedCount };
    if (spotsRemaining <= 0) updates.status = 'ongoing'; // full
    await base44.entities.CourseSchedule.update(scheduleId, updates);
    queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
    queryClient.invalidateQueries({ queryKey: ['courseSchedules'] });
  };

  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const user = await base44.auth.me();
      const updateData = { ...data };
      // Auto-record attendance timestamp and admin
      if (data.attendance_status && data.attendance_status !== 'not_checked') {
        updateData.attendance_checked_at = new Date().toISOString();
        updateData.attendance_checked_by = user?.email || 'admin';
      }
      return base44.entities.Enrollments.update(id, updateData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrollments', scheduleId] });
      // Refetch updated enrollments for capacity sync
      const updated = await base44.entities.Enrollments.filter({ course_id: schedule?.course_id });
      await syncScheduleCapacity(schedule?.id, updated);
      toast.success('已更新學員資料');
      setEditEnrollment(null);
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseSchedule.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['courseSchedules'] });
      // Re-sync capacity with new max_students if changed
      if (variables.data.max_students !== undefined) {
        const updated = await base44.entities.Enrollments.filter({ course_id: schedule?.course_id });
        await syncScheduleCapacity(schedule?.id, updated, variables.data.max_students);
      }
      toast.success('已更新課程資料');
      setEditCourseOpen(false);
    },
  });

  const handleAttendanceCheck = async (enrollment, status) => {
    updateEnrollmentMutation.mutate({ id: enrollment.id, data: { attendance_status: status } });
  };

  const handleSaveEnrollment = (formData) => {
    if (!editEnrollment) return;
    updateEnrollmentMutation.mutate({ id: editEnrollment.id, data: formData });
  };

  const handleSaveSchedule = (formData) => {
    if (!schedule) return;
    updateScheduleMutation.mutate({ id: schedule.id, data: formData });
  };

  const handleExportExcel = () => {
    const headers = ['姓名', '電話', '電郵', '公司', '分店', '支付狀態', '報名狀態', '出席狀態'];
    const rows = enrollments.map(e => [
      e.student_name || e.user_name, e.student_phone, e.student_email,
      e.company, e.branch, e.payment_status, e.status, e.attendance_status
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${schedule?.course_title || '學員名單'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('已匯出 Excel');
  };

  const handleExportPDF = () => {
    toast.info('正在生成 PDF...');
    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString('zh-HK');
    const courseName = schedule?.course_title || '課程';
    printWindow.document.write(`
      <html><head><title>${courseName} 學員名單 - ${date}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px}h1{color:#333;border-bottom:2px solid #ff8c42;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:12px;text-align:left}th{background-color:#ff8c42;color:white}tr:nth-child(even){background-color:#f9f9f9}</style>
      </head><body>
      <h1>${courseName}</h1>
      <p>${date} | 學員人數：${enrollments.length} 人</p>
      <table><thead><tr><th>姓名</th><th>電話</th><th>電郵</th><th>公司</th><th>支付狀態</th><th>報名狀態</th><th>出席狀態</th></tr></thead>
      <tbody>${enrollments.map(e => `<tr><td>${e.student_name || e.user_name || ''}</td><td>${e.student_phone || ''}</td><td>${e.student_email || e.user_email || ''}</td><td>${e.company || ''}</td><td>${PAYMENT_LABELS[e.payment_status] || e.payment_status || ''}</td><td>${STATUS_LABELS[e.status] || e.status || ''}</td><td>${ATTENDANCE_LABELS[e.attendance_status] || ''}</td></tr>`).join('')}
      </tbody></table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getAttendanceBadge = (status) => {
    const config = {
      not_checked: { label: '未簽到', variant: 'outline', icon: Clock },
      attended: { label: '已出席', variant: 'default', icon: CheckCircle },
      absent: { label: '缺席', variant: 'destructive', icon: XCircle },
      late: { label: '遲到', variant: 'secondary', icon: AlertCircle },
    };
    const { label, variant, icon: Icon } = config[status] || config.not_checked;
    return <Badge variant={variant} className="gap-1"><Icon className="w-3 h-3" />{label}</Badge>;
  };

  const getPaymentBadge = (status) => {
    if (status === 'paid') return <Badge variant="default" className="bg-green-500">已付款</Badge>;
    if (status === 'refunded') return <Badge variant="secondary">已退款</Badge>;
    return <Badge variant="outline">待付款</Badge>;
  };

  const getStatusBadge = (status) => {
    if (status === 'confirmed') return <Badge variant="default">已確認</Badge>;
    if (status === 'completed') return <Badge variant="secondary">已完成</Badge>;
    if (status === 'cancelled') return <Badge variant="destructive">已取消</Badge>;
    return <Badge variant="outline">待確認</Badge>;
  };

  if (isLoadingSchedule) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12 text-muted-foreground"><p>找不到課程資料</p></div>
      </div>
    );
  }

  const confirmedCount = enrollments.filter(e => e.payment_status === 'paid' && e.status !== 'cancelled').length;
  const totalEnrolled = enrollments.filter(e => e.status !== 'cancelled').length;
  const max = schedule.max_students || 0;
  const remaining = max - confirmedCount;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin/enrollments')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />返回課程列表
          </Button>
          <PageHeader
            title={schedule.course_title}
            description="課程詳情與學員管理"
            action={
              <Button onClick={() => setEditCourseOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" />編輯課程資料
              </Button>
            }
          />
        </div>

        {/* Course Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">日期 & 時間</p>
                  <p className="font-medium text-sm">
                    {new Date(schedule.start_datetime).toLocaleDateString('zh-HK', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(schedule.start_datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {new Date(schedule.end_datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg mt-0.5">
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">地點</p>
                  <p className="font-medium text-sm">{schedule.location || '待定'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg mt-0.5 ${remaining <= 0 ? 'bg-destructive/10' : remaining <= 5 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                  <Users className={`w-5 h-5 ${remaining <= 0 ? 'text-destructive' : remaining <= 5 ? 'text-yellow-600' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">名額狀況</p>
                  <p className="font-medium text-sm">已確認 {confirmedCount} / 共 {max} 人</p>
                  <p className="text-xs text-muted-foreground">總報名 {totalEnrolled} 人 · 尚餘 {Math.max(remaining, 0)} 個名額</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex items-center gap-2">
              <span className="text-sm text-muted-foreground">課程狀態：</span>
              <Badge variant={schedule.status === 'upcoming' ? 'default' : schedule.status === 'completed' ? 'secondary' : 'outline'}>
                {SCHEDULE_STATUS_LABELS[schedule.status] || schedule.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />學員名單（{totalEnrolled} 人）
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />匯出
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleExportExcel}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />匯出 Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <FileText className="w-4 h-4 mr-2" />匯出 PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>電話</TableHead>
                    <TableHead>電郵</TableHead>
                    <TableHead>公司</TableHead>
                    <TableHead>分店</TableHead>
                    <TableHead>支付</TableHead>
                    <TableHead>報名狀態</TableHead>
                    <TableHead>出席</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {enrollment.student_name || enrollment.user_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {enrollment.student_phone || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {enrollment.student_email || enrollment.user_email}
                      </TableCell>
                      <TableCell>{enrollment.company || '-'}</TableCell>
                      <TableCell>{enrollment.branch || '-'}</TableCell>
                      <TableCell>{getPaymentBadge(enrollment.payment_status)}</TableCell>
                      <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                      <TableCell>
                        {attendanceMode && enrollment.status !== 'cancelled' ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant={enrollment.attendance_status === 'attended' ? 'default' : 'outline'} onClick={() => handleAttendanceCheck(enrollment, 'attended')}>
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant={enrollment.attendance_status === 'absent' ? 'destructive' : 'outline'} onClick={() => handleAttendanceCheck(enrollment, 'absent')}>
                              <XCircle className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant={enrollment.attendance_status === 'late' ? 'secondary' : 'outline'} onClick={() => handleAttendanceCheck(enrollment, 'late')}>
                              <AlertCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            {getAttendanceBadge(enrollment.attendance_status || 'not_checked')}
                            {enrollment.attendance_checked_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(enrollment.attendance_checked_at).toLocaleString('zh-HK')}
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditEnrollment(enrollment)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />編輯
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {enrollments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>暫無學員資料</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <EditCourseDialog
        schedule={schedule}
        open={editCourseOpen}
        onClose={() => setEditCourseOpen(false)}
        onSave={handleSaveSchedule}
      />
      <EditEnrollmentDialog
        enrollment={editEnrollment}
        open={!!editEnrollment}
        onClose={() => setEditEnrollment(null)}
        onSave={handleSaveEnrollment}
      />
    </div>
  );
}