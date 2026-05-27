import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, DollarSign, User, Phone, Mail, Building } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';

export default function EnrollmentForm() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get('schedule_id');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    student_name: '',
    gender: '',
    phone: '',
    email: '',
    company: '',
    branch: '',
  });

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => base44.entities.Courses.get(courseId),
  });

  const { data: schedule } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: () => base44.entities.CourseSchedule.get(scheduleId),
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddToCart = async () => {
    try {
      // 驗證必填欄位
      if (!formData.student_name || !formData.gender || !formData.phone || !formData.email) {
        toast.error('請填寫所有必填欄位');
        return;
      }

      const user = await base44.auth.me();
      
      // 創建購物車項目
      const cartItem = {
        type: 'course',
        course_id: course.id,
        schedule_id: schedule.id,
        course_title: course.title,
        schedule_date: schedule.start_datetime,
        schedule_end: schedule.end_datetime,
        location: schedule.location,
        student_name: formData.student_name,
        student_gender: formData.gender,
        student_phone: formData.phone,
        student_email: formData.email,
        company: formData.company,
        branch: formData.branch,
        price: course.price,
        user_email: user.email,
      };

      // 讀取現有購物車
      const existingCart = localStorage.getItem('cart');
      const cart = existingCart ? JSON.parse(existingCart) : [];
      
      // 檢查是否已存在相同的課程和時間表
      const exists = cart.some(item => 
        item.type === 'course' && 
        item.course_id === course.id && 
        item.schedule_id === schedule.id &&
        item.student_name === formData.student_name
      );
      
      if (exists) {
        toast.error('您已報名此課程的相同時間段');
        return;
      }
      
      cart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // 觸發購物車更新事件
      window.dispatchEvent(new Event('cart-updated'));

      toast.success('已加入購物車');
      navigate('/cart');
    } catch (error) {
      toast.error('加入購物車失敗：' + error.message);
    }
  };

  if (!course || !schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="課程報名"
          description="請填寫報名資料"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 報名資料表單 */}
          <Card>
            <CardHeader>
              <CardTitle>報名資料</CardTitle>
              <CardDescription>請填寫學員資料</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student_name">
                  姓名（身份證明文件上的名稱）*
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="student_name"
                    placeholder="請輸入學員姓名"
                    value={formData.student_name}
                    onChange={(e) => handleInputChange('student_name', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">性別 *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇性別" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">聯絡電話 *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="phone"
                    placeholder="請輸入聯絡電話"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="請輸入 Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">所屬公司</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="company"
                    placeholder="請輸入公司名稱"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">分店</Label>
                <Input
                  id="branch"
                  placeholder="請輸入分店名稱"
                  value={formData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 課程資料 */}
          <Card>
            <CardHeader>
              <CardTitle>課程資料</CardTitle>
              <CardDescription>報名課程詳情</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">課程名稱</p>
                  <p className="font-medium">{course.title}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">日期</p>
                    <p>{schedule.start_datetime ? new Date(schedule.start_datetime).toLocaleDateString('zh-HK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    }) : '待定'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">時間</p>
                    <p>
                      {schedule.start_datetime ? new Date(schedule.start_datetime).toLocaleTimeString('zh-HK', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '待定'} - 
                      {schedule.end_datetime ? new Date(schedule.end_datetime).toLocaleTimeString('zh-HK', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '待定'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">地點</p>
                    <p>{schedule.location || '待定'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">費用</p>
                    <p className="text-lg font-bold text-primary">HK${course.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">剩餘名額</p>
                    <p>
                      {schedule.max_students - (schedule.enrolled_count || 0)} / {schedule.max_students}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleAddToCart}>
                加入購物車
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}