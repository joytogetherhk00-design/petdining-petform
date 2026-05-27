import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

export default function CourseCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Courses.list(),
  });

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleEnroll = async (course) => {
    try {
      const user = await base44.auth.me();
      
      // 檢查用戶是否有可用 Quota
      let paymentMethod = 'stripe';
      let amountPaid = course.price;
      
      if (user.user_type === 'business') {
        // TODO: 檢查商業客戶的課程 Quota
        // 如果有 Quota，可以免費報名
        paymentMethod = 'quota';
        amountPaid = 0;
      }

      // 創建報名記錄
      const enrollment = await base44.entities.Enrollments.create({
        course_id: course.id,
        course_title: course.title,
        user_email: user.email,
        user_name: user.full_name,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'quota' ? 'paid' : 'pending',
        amount_paid: amountPaid,
        quota_used: paymentMethod === 'quota',
        status: 'pending',
        enrollment_date: new Date().toISOString(),
      });

      // 更新課程已報名人數
      await base44.entities.Courses.update(course.id, {
        enrolled_count: (course.enrolled_count || 0) + 1
      });

      toast.success('報名成功！');
      
      if (paymentMethod === 'stripe') {
        // 創建 Stripe Checkout Session
        const response = await base44.functions.invoke('createCourseCheckoutSession', {
          enrollmentId: enrollment.id,
          courseId: course.id,
          courseTitle: course.title,
          amount: course.price,
        });

        if (response.data.url) {
          // 跳轉到 Stripe 支付頁面
          window.location.href = response.data.url;
        } else {
          toast.error('無法創建支付連結');
        }
      }
    } catch (error) {
      toast.error('報名失敗：' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="課程目錄"
          description="探索我們的專業寵物友善餐飲課程"
          action={
            <Button onClick={() => window.location.href = '/admin/courses'}>
              <Plus className="w-4 h-4 mr-2" />
              管理課程
            </Button>
          }
        />

        {/* 搜索和篩選 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜索課程..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="active">開放報名</TabsTrigger>
              <TabsTrigger value="full">已滿</TabsTrigger>
              <TabsTrigger value="inactive">暫停</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 課程列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                {course.image_url && (
                  <img 
                    src={course.image_url} 
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-t-lg mb-4"
                  />
                )}
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{course.instructor_name || '待定'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration || '待定'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{course.location || '待定'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                    {course.status === 'active' ? '開放報名' : 
                     course.status === 'full' ? '已滿' : '暫停'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {course.enrolled_count || 0} / {course.max_students} 人
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="text-lg font-bold text-primary">
                  HK${course.price}
                </div>
                <Button 
                  onClick={() => handleEnroll(course)}
                  disabled={course.status === 'full' || course.status === 'inactive'}
                >
                  {course.status === 'full' ? '已滿' : 
                   course.status === 'inactive' ? '暫停' : '立即報名'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暫無課程</p>
          </div>
        )}
      </div>
    </div>
  );
}