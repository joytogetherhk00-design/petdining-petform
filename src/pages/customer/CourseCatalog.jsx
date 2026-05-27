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
  XCircle,
  CalendarDays
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function CourseCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewScheduleCourse, setViewScheduleCourse] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Courses.list(),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['courseSchedules'],
    queryFn: () => base44.entities.CourseSchedule.list(),
  });

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSelectSchedule = (course, schedule) => {
    // 跳轉到報名表單頁面
    window.location.href = `/courses/${course.id}/enroll?schedule_id=${schedule.id}`;
  };

  const handleEnroll = async (course) => {
    try {
      // 檢查該課程是否有日程
      const courseSchedules = schedules.filter(s => s.course_id === course.id);
      
      if (courseSchedules.length === 0) {
        toast.error('該課程暫無可報名的時間');
        return;
      }

      if (courseSchedules.length === 1) {
        // 只有一個時間，直接跳轉到報名表單
        handleSelectSchedule(course, courseSchedules[0]);
      } else {
        // 多個時間，打開選擇對話框
        setViewScheduleCourse(course);
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
              <CardFooter className="flex justify-between items-center gap-2">
              <div className="text-lg font-bold text-primary">
                HK${course.price}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setViewScheduleCourse(course)}
                >
                  <CalendarDays className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => handleEnroll(course)}
                  disabled={course.status === 'full' || course.status === 'inactive'}
                >
                  {course.status === 'full' ? '已滿' : 
                   course.status === 'inactive' ? '暫停' : '立即報名'}
                </Button>
              </div>
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

        {/* 課程時間表 Dialog */}
        <Dialog open={!!viewScheduleCourse} onOpenChange={() => setViewScheduleCourse(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {viewScheduleCourse?.title} - 可報名日期及時間
              </DialogTitle>
            </DialogHeader>
            {viewScheduleCourse && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {schedules
                  .filter(sched => sched.course_id === viewScheduleCourse.id)
                  .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>暫未設定課程時間</p>
                  </div>
                ) : (
                  schedules
                    .filter(sched => sched.course_id === viewScheduleCourse.id)
                    .map((sched) => (
                      <Card key={sched.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                        <div 
                          className="space-y-2"
                          onClick={() => handleSelectSchedule(viewScheduleCourse, sched)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-primary" />
                              <span className="font-medium">
                                {format(new Date(sched.start_datetime), 'yyyy/MM/dd')}
                              </span>
                            </div>
                            <Badge variant={sched.status === 'upcoming' ? 'default' : 'secondary'}>
                              {sched.status === 'upcoming' ? '可報名' : 
                               sched.status === 'ongoing' ? '進行中' : 
                               sched.status === 'completed' ? '已完結' : '已取消'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {format(new Date(sched.start_datetime), 'HH:mm')} - {format(new Date(sched.end_datetime), 'HH:mm')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{sched.location || '待定'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{sched.enrolled_count || 0} / {sched.max_students} 人</span>
                            </div>
                          </div>
                          <div className="flex justify-end mt-2">
                            <Button size="sm">選擇此時間</Button>
                          </div>
                        </div>
                      </Card>
                    ))
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}