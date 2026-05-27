import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

export default function CourseSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    course_id: '',
    course_title: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    max_students: 20,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Courses.list(),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['course-schedules'],
    queryFn: () => base44.entities.CourseSchedule.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-schedules'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('時間表已創建');
    },
  });

  const resetForm = () => {
    setFormData({
      course_id: '',
      course_title: '',
      start_datetime: '',
      end_datetime: '',
      location: '',
      max_students: 20,
    });
  };

  const handleSubmit = () => {
    if (!formData.course_id || !formData.start_datetime || !formData.end_datetime) {
      toast.error('請填寫必填欄位');
      return;
    }

    createMutation.mutate({
      ...formData,
      start_datetime: new Date(formData.start_datetime).toISOString(),
      end_datetime: new Date(formData.end_datetime).toISOString(),
    });
  };

  const schedulesOnDate = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.start_datetime);
    return scheduleDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="課程時間表"
          description="管理課程時間安排"
          action={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新增時間表
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 日曆 */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* 當日課程 */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedDate.toLocaleDateString('zh-HK', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              
              <div className="space-y-4">
                {schedulesOnDate.map((schedule) => (
                  <Card key={schedule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{schedule.course_title}</h4>
                            <Badge variant={
                              schedule.status === 'ongoing' ? 'default' :
                              schedule.status === 'completed' ? 'secondary' :
                              schedule.status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                              {schedule.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(schedule.start_datetime).toLocaleTimeString('zh-HK', {hour: '2-digit', minute:'2-digit'})} - 
                                {new Date(schedule.end_datetime).toLocaleTimeString('zh-HK', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{schedule.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{schedule.enrolled_count} / {schedule.max_students} 人</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {schedulesOnDate.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>這天沒有課程</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 新增時間表對話框 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新增課程時間表</DialogTitle>
              <DialogDescription>
                設定課程的日期和時間
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>選擇課程 *</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => {
                    const course = courses.find(c => c.id === value);
                    setFormData({
                      ...formData,
                      course_id: value,
                      course_title: course?.title || '',
                      location: course?.location || '',
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇課程" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>開始時間 *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_datetime}
                    onChange={(e) => setFormData({...formData, start_datetime: e.target.value})}
                  />
                </div>
                <div>
                  <Label>結束時間 *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_datetime}
                    onChange={(e) => setFormData({...formData, end_datetime: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>上課地點</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder={courses.find(c => c.id === formData.course_id)?.location || ''}
                />
              </div>

              <div>
                <Label>最大學生數</Label>
                <Input
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData({...formData, max_students: Number(e.target.value)})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                創建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}