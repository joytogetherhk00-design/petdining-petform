import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function CourseStatsCard({ course, onDetailView }) {
  const enrolled = course.enrolled_count || 0;
  const max = course.max_students || 0;
  const remaining = max - enrolled;
  
  // 判斷課程狀態
  const getStatus = () => {
    if (enrolled >= max) return { label: '額滿', variant: 'destructive', icon: XCircle };
    if (remaining <= 5) return { label: '緊張', variant: 'secondary', icon: Clock };
    return { label: '正常', variant: 'default', icon: CheckCircle };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onDetailView}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{course.course_title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              #{course.schedule_id?.slice(-6) || course.id.slice(-6)}
            </p>
          </div>
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">{enrolled}</p>
            <p className="text-xs text-muted-foreground">已報名</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Users className="w-5 h-5 mx-auto mb-1 text-secondary" />
            <p className="text-2xl font-bold text-secondary">{max}</p>
            <p className="text-xs text-muted-foreground">課程名額</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold text-muted-foreground">{remaining}</p>
            <p className="text-xs text-muted-foreground">尚餘</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="text-sm text-primary hover:underline font-medium">
            查看詳情 →
          </button>
        </div>
      </CardContent>
    </Card>
  );
}