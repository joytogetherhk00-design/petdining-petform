import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, MapPin, Mail, ArrowRight, Home } from 'lucide-react';
import { format } from 'date-fns';

export default function EnrollmentSuccess() {
  const [searchParams] = useSearchParams();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const enrollmentId = searchParams.get('enrollment_id');
    if (enrollmentId) {
      base44.entities.Enrollments.get(enrollmentId)
        .then(data => setEnrollment(data))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">找不到報名記錄</p>
            <Button asChild className="mt-4">
              <Link to="/courses">返回課程目錄</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">✅ 支付成功！</CardTitle>
          <p className="text-muted-foreground mt-2">您的報名已完成</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">【課程資料】</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">課程名稱</p>
                <p className="font-medium">{enrollment.course_title}</p>
              </div>
              {enrollment.schedule_date && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">日期</p>
                    <p>
                      {format(new Date(enrollment.schedule_date), 'yyyy 年 MM 月 dd 日（EEEE）', { locale: { code: 'zh-HK' } })}
                    </p>
                  </div>
                </div>
              )}
              {enrollment.schedule_date && enrollment.schedule_end && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">時間</p>
                    <p>
                      {format(new Date(enrollment.schedule_date), 'HH:mm')} - {format(new Date(enrollment.schedule_end), 'HH:mm')}
                    </p>
                  </div>
                </div>
              )}
              {enrollment.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">地點</p>
                    <p>{enrollment.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">報名編號</p>
                <p className="font-mono font-bold">#{enrollment.enrollment_id || enrollment.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">支付金額</p>
                <p className="text-xl font-bold text-primary">HK${enrollment.amount_paid?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <Mail className="w-4 h-4" />
            <span>確認電郵已發送至：<span className="text-foreground font-medium">{enrollment.user_email}</span></span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/my-courses">
                <ArrowRight className="w-4 h-4 mr-2" />
                查看我的課程
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                返回首頁
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}