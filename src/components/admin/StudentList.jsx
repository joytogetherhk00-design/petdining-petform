import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Download, Mail, Phone, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function StudentList({ scheduleId, courseTitle }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', scheduleId],
    queryFn: () => base44.entities.Enrollments.filter({ schedule_id: scheduleId }),
    enabled: !!scheduleId,
  });

  const filteredStudents = enrollments.filter(enrollment => {
    const matchesSearch = 
      enrollment.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.student_phone?.includes(searchTerm) ||
      enrollment.student_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'confirmed' && enrollment.status === 'confirmed') ||
      (filterStatus === 'pending' && enrollment.status === 'pending') ||
      (filterStatus === 'cancelled' && enrollment.status === 'cancelled');
    
    return matchesSearch && matchesStatus;
  });

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
    const rows = filteredStudents.map(e => [
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
    link.download = `${courseTitle || '學員名單'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜尋學員（姓名/電話/電郵）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">全部狀態</option>
            <option value="confirmed">已確認</option>
            <option value="pending">待確認</option>
            <option value="cancelled">已取消</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            匯出 CSV
          </Button>
        </div>
      </div>

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  {student.student_name || student.user_name}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    {student.student_phone}
                  </div>
                </TableCell>
                <TableCell>{student.student_email || student.user_email}</TableCell>
                <TableCell>{student.company || '-'}</TableCell>
                <TableCell>{student.branch || '-'}</TableCell>
                <TableCell>
                  <Badge variant={student.payment_status === 'paid' ? 'default' : 'outline'}>
                    {student.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    student.status === 'confirmed' ? 'default' :
                    student.status === 'completed' ? 'secondary' :
                    student.status === 'cancelled' ? 'destructive' : 'outline'
                  }>
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getAttendanceBadge(student.attendance_status || 'not_checked')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>暫無學員資料</p>
        </div>
      )}
    </div>
  );
}