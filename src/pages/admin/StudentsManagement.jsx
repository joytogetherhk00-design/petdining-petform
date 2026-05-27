import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
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
import { Search, Download, GraduationCap, Mail, Phone } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

export default function StudentsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: enrollments = [] } = useQuery({
    queryKey: ['allEnrollments'],
    queryFn: () => base44.entities.Enrollments.list(),
  });

  // 將報名記錄按學員分組
  const studentsMap = enrollments.reduce((acc, enrollment) => {
    const key = enrollment.student_email || enrollment.user_email;
    if (!key) return acc;
    
    if (!acc[key]) {
      acc[key] = {
        id: enrollment.id,
        student_name: enrollment.student_name || enrollment.user_name,
        student_phone: enrollment.student_phone,
        student_email: key,
        company: enrollment.company,
        branch: enrollment.branch,
        courses: [],
        status: 'active',
      };
    }
    
    acc[key].courses.push({
      course_title: enrollment.course_title,
      enrollment_date: enrollment.enrollment_date,
      status: enrollment.status,
      schedule_id: enrollment.schedule_id,
    });
    
    return acc;
  }, {});

  const students = Object.values(studentsMap);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_phone?.includes(searchTerm) ||
      student.student_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['姓名', '電話', '電郵', '公司', '分店', '已報課程數', '狀態'];
    const rows = filteredStudents.map(s => [
      s.student_name,
      s.student_phone,
      s.student_email,
      s.company,
      s.branch,
      s.courses.length,
      s.status
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `學員名單_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('已匯出學員名單');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="學員管理"
          description="查看所有已報名學員及其資料"
          action={
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              匯出 CSV
            </Button>
          }
        />

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜尋學員（姓名/電話/電郵）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">全部狀態</option>
            <option value="active">活躍</option>
            <option value="cancelled">已取消</option>
          </select>
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
                <TableHead>已報課程</TableHead>
                <TableHead>狀態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.student_email}>
                  <TableCell className="font-medium">
                    {student.student_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {student.student_phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      {student.student_email}
                    </div>
                  </TableCell>
                  <TableCell>{student.company || '-'}</TableCell>
                  <TableCell>{student.branch || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {student.courses.length} 個課程
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'default' : 'outline'}>
                      {student.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暫無學員資料</p>
          </div>
        )}
      </div>
    </div>
  );
}