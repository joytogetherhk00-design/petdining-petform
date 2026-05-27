import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useNavigate } from 'react-router-dom';

export default function EnrollmentManagement() {
  const navigate = useNavigate();

  const { data: schedules = [] } = useQuery({
    queryKey: ['courseSchedules'],
    queryFn: () => base44.entities.CourseSchedule.list(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => base44.entities.Enrollments.list(),
  });

  // 按課程分組統計
  const courseStats = schedules.map(schedule => {
    const enrolled = enrollments.filter(e => e.schedule_id === schedule.schedule_id).length;
    return {
      ...schedule,
      enrolled_count: enrolled,
    };
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="報名管理"
          description="查看所有課程及報名狀況"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseStats.map((course) => {
            const enrolled = course.enrolled_count || 0;
            const max = course.max_students || 0;
            const remaining = max - enrolled;
            const isFull = enrolled >= max;
            const isLow = remaining <= 5 && remaining > 0;
            
            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/admin/enrollments/${course.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{course.course_title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        #{course.schedule_id?.slice(-6) || course.id.slice(-6)}
                      </p>
                    </div>
                    <Badge variant={isFull ? 'destructive' : isLow ? 'secondary' : 'default'}>
                      {isFull ? '額滿' : isLow ? '緊張' : '正常'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold text-primary">{enrolled}</p>
                      <p className="text-xs text-muted-foreground">已報名</p>
                    </div>
                    <div className="text-center">
                      <Users className="w-5 h-5 mx-auto mb-1 text-secondary" />
                      <p className="text-2xl font-bold text-secondary">{max}</p>
                      <p className="text-xs text-muted-foreground">課程名額</p>
                    </div>
                    <div className="text-center">
                      <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-bold text-muted-foreground">{remaining}</p>
                      <p className="text-xs text-muted-foreground">尚餘</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {courseStats.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暫無課程資料</p>
          </div>
        )}
      </div>
    </div>
  );
}