import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Calendar, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StudentList from '@/components/admin/StudentList';

export default function CourseEnrollmentDetail() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();

  const { data: schedule } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: async () => {
      const schedules = await base44.entities.CourseSchedule.filter({ schedule_id: scheduleId });
      return schedules[0];
    },
    enabled: !!scheduleId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', scheduleId],
    queryFn: () => base44.entities.Enrollments.filter({ schedule_id: scheduleId }),
    enabled: !!scheduleId,
  });

  if (!schedule) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">
            <p>載入中...</p>
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
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              學員名單（{enrolled} 人）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StudentList scheduleId={scheduleId} courseTitle={schedule.course_title} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}