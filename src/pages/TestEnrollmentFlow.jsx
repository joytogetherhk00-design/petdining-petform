import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  Users, 
  GraduationCap,
  RefreshCw,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

export default function TestEnrollmentFlow() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [testStep, setTestStep] = useState(0);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      addLog(`當前用戶：${currentUser.full_name} (${currentUser.email})`, 'success');
      addLog(`用戶類型：${currentUser.user_type || 'public'}`, 'info');

      const coursesData = await base44.entities.Courses.list();
      setCourses(coursesData);
      addLog(`已載入 ${coursesData.length} 個課程`, 'success');

      const enrollmentsData = await base44.entities.Enrollments.filter({ user_email: currentUser.email });
      setEnrollments(enrollmentsData);
      addLog(`已載入 ${enrollmentsData.length} 個報名記錄`, 'success');
    } catch (error) {
      addLog(`載入失敗：${error.message}`, 'error');
    }
  };

  const testPublicUserEnrollment = async () => {
    setTestStep(1);
    addLog('=== 測試一般用戶報名流程 ===', 'info');
    
    if (!courses.length) {
      addLog('錯誤：沒有可用課程', 'error');
      return;
    }

    const course = courses[0];
    addLog(`選擇課程：${course.title} (HK$${course.price})`, 'info');

    try {
      const enrollment = await base44.entities.Enrollments.create({
        course_id: course.id,
        course_title: course.title,
        user_email: user.email,
        user_name: user.full_name,
        payment_method: 'stripe',
        payment_status: 'pending',
        amount_paid: course.price,
        quota_used: false,
        status: 'pending',
        enrollment_date: new Date().toISOString(),
      });

      addLog(`✓ 創建報名記錄成功 (ID: ${enrollment.id})`, 'success');
      addLog(`支付狀態：${enrollment.payment_status}`, 'info');
      addLog(`下一步：跳轉 Stripe 支付`, 'info');

      // 測試 Stripe 支付
      const response = await base44.functions.invoke('createCourseCheckoutSession', {
        enrollmentId: enrollment.id,
        courseId: course.id,
        courseTitle: course.title,
        amount: course.price,
      });

      if (response.data.url) {
        addLog(`✓ Stripe 連結創建成功`, 'success');
        addLog(`支付 URL: ${response.data.url.substring(0, 50)}...`, 'info');
        toast.success('一般用戶報名流程測試成功！');
      } else {
        addLog('錯誤：無法創建 Stripe 連結', 'error');
      }
    } catch (error) {
      addLog(`錯誤：${error.message}`, 'error');
    }
  };

  const testBusinessUserQuota = async () => {
    setTestStep(2);
    addLog('=== 測試商業客戶 Quota 報名 ===', 'info');

    if (!courses.length) {
      addLog('錯誤：沒有可用課程', 'error');
      return;
    }

    const course = courses[0];
    addLog(`選擇課程：${course.title}`, 'info');
    addLog(`檢查用戶類型：${user.user_type}`, 'info');

    if (user.user_type === 'business') {
      addLog('✓ 用戶為商業客戶，可使用 Quota', 'success');
      
      try {
        const enrollment = await base44.entities.Enrollments.create({
          course_id: course.id,
          course_title: course.title,
          user_email: user.email,
          user_name: user.full_name,
          payment_method: 'quota',
          payment_status: 'paid',
          amount_paid: 0,
          quota_used: true,
          status: 'confirmed',
          enrollment_date: new Date().toISOString(),
        });

        addLog(`✓ Quota 報名成功 (ID: ${enrollment.id})`, 'success');
        addLog(`支付狀態：${enrollment.payment_status} (已付)`, 'success');
        addLog(`狀態：${enrollment.status} (已確認)`, 'success');
        toast.success('商業客戶 Quota 報名測試成功！');
      } catch (error) {
        addLog(`錯誤：${error.message}`, 'error');
      }
    } else {
      addLog('提示：當前用戶不是商業客戶', 'info');
      addLog('商業客戶才能使用 Quota 報名', 'info');
      toast.info('請使用商業客戶賬戶測試 Quota 功能');
    }
  };

  const testAdminApproval = async () => {
    setTestStep(3);
    addLog('=== 測試 Admin 審批流程 ===', 'info');

    try {
      const pendingEnrollments = await base44.entities.Enrollments.filter({ 
        status: 'pending',
        user_email: user.email
      });

      addLog(`找到 ${pendingEnrollments.length} 個待審批報名`, 'info');

      if (pendingEnrollments.length === 0) {
        addLog('沒有待審批的報名記錄', 'info');
        return;
      }

      // 模擬 Admin 審批（需要 admin 權限）
      const enrollment = pendingEnrollments[0];
      addLog(`審批報名：${enrollment.course_title}`, 'info');

      try {
        await base44.entities.Enrollments.update(enrollment.id, {
          status: 'confirmed'
        });
        addLog(`✓ 報名已確認`, 'success');
        toast.success('Admin 審批測試成功！');
      } catch (error) {
        addLog(`審批失敗（可能需要 Admin 權限）: ${error.message}`, 'error');
      }
    } catch (error) {
      addLog(`錯誤：${error.message}`, 'error');
    }
  };

  const refreshData = () => {
    setLogs([]);
    loadTestData();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">課程報名流程測試</h1>
            <p className="text-muted-foreground">測試一般用戶、商業客戶、Stripe 支付和 Admin 審批</p>
          </div>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>

        {/* 用戶信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              當前用戶信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">姓名</p>
                  <p className="font-medium">{user.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">電郵</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">用戶類型</p>
                  <Badge>{user.user_type || 'public'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">角色</p>
                  <Badge>{user.role}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">載入中...</p>
            )}
          </CardContent>
        </Card>

        {/* 測試步驟 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className={testStep === 1 ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="text-sm">
                <Play className="w-4 h-4 inline mr-2" />
                一般用戶報名
              </CardTitle>
              <CardDescription>Stripe 支付流程</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testPublicUserEnrollment} className="w-full">
                開始測試
              </Button>
            </CardContent>
          </Card>

          <Card className={testStep === 2 ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="text-sm">
                <CreditCard className="w-4 h-4 inline mr-2" />
                商業客戶 Quota
              </CardTitle>
              <CardDescription>Quota 扣減流程</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testBusinessUserQuota} className="w-full">
                開始測試
              </Button>
            </CardContent>
          </Card>

          <Card className={testStep === 3 ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="text-sm">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Admin 審批
              </CardTitle>
              <CardDescription>審批報名記錄</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testAdminApproval} className="w-full">
                開始測試
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 課程列表 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              可用課程 ({courses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map(course => (
                <div key={course.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">{course.instructor_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.enrolled_count || 0} / {course.max_students} 人
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">HK${course.price}</p>
                      <Badge>{course.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 報名記錄 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              我的報名記錄 ({enrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {enrollments.map(enrollment => (
                <div key={enrollment.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{enrollment.course_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(enrollment.enrollment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={enrollment.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {enrollment.payment_status}
                    </Badge>
                    <Badge variant={enrollment.status === 'confirmed' ? 'default' : 'secondary'}>
                      {enrollment.status}
                    </Badge>
                    <Badge>{enrollment.payment_method}</Badge>
                  </div>
                </div>
              ))}
              {enrollments.length === 0 && (
                <p className="text-center text-muted-foreground py-4">暫無報名記錄</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 測試日誌 */}
        <Card>
          <CardHeader>
            <CardTitle>測試日誌</CardTitle>
            <CardDescription>實時顯示測試過程</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm space-y-2">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">暫無日誌</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-muted-foreground">[{log.timestamp}]</span>
                    <span className={
                      log.type === 'success' ? 'text-green-600' :
                      log.type === 'error' ? 'text-red-600' :
                      'text-foreground'
                    }>
                      {log.type === 'success' && '✓ '}
                      {log.type === 'error' && '✗ '}
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}