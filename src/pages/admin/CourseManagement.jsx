import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DragDropUpload from '@/components/shared/DragDropUpload';
import { toast } from 'sonner';

export default function CourseManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    course_code: '',
    title: '',
    description: '',
    instructor_id: '',
    instructor_name: '',
    price: 980,
    duration: '',
    location: '',
    max_students: 20,
    image_url: '',
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Courses.list(),
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => base44.entities.Instructors.list(),
  });

  const createCourseMutation = useMutation({
    mutationFn: (data) => base44.entities.Courses.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('課程已創建');
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Courses.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsEditDialogOpen(false);
      setEditingCourse(null);
      resetForm();
      toast.success('課程已更新');
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id) => base44.entities.Courses.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('課程已刪除');
    },
  });

  const resetForm = () => {
    setFormData({
      course_code: '',
      title: '',
      description: '',
      instructor_id: '',
      instructor_name: '',
      price: 980,
      duration: '',
      location: '',
      max_students: 20,
      image_url: '',
    });
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      course_code: course.course_code || '',
      title: course.title,
      description: course.description || '',
      instructor_id: course.instructor_id || '',
      instructor_name: course.instructor_name || '',
      price: course.price,
      duration: course.duration || '',
      location: course.location || '',
      max_students: course.max_students,
      image_url: course.image_url || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.price || !formData.max_students) {
      toast.error('請填寫必填欄位');
      return;
    }

    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: formData });
    } else {
      createCourseMutation.mutate(formData);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="課程管理"
          description="管理所有課程資訊"
          action={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新增課程
            </Button>
          }
        />

        {/* 搜索 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜索課程..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 課程列表 */}
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{course.title}</h3>
                      <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{course.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{course.instructor_name || '待定'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>HK${course.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{course.duration || '待定'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{course.enrolled_count || 0} / {course.max_students} 人</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(course)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteCourseMutation.mutate(course.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 創建/編輯對話框 */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingCourse(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? '編輯課程' : '新增課程'}
              </DialogTitle>
              <DialogDescription>
                填寫課程詳細資訊
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>課程編號</Label>
                  <Input
                    value={formData.course_code}
                    onChange={(e) => setFormData({...formData, course_code: e.target.value})}
                    placeholder="例如：PET101"
                  />
                </div>
                <div>
                  <Label>課程名稱 *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="寵物友善餐飲基礎證書"
                  />
                </div>
              </div>

              <div>
                <Label>課程描述</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="課程簡介..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>導師</Label>
                  <Select
                    value={formData.instructor_id}
                    onValueChange={(value) => {
                      const instructor = instructors.find(i => i.id === value);
                      setFormData({
                        ...formData,
                        instructor_id: value,
                        instructor_name: instructor?.name || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇導師" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>價格 (HKD) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>課程時長</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="例如：3 小時"
                  />
                </div>
                <div>
                  <Label>上課地點</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="上課地址"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>最大學生數 *</Label>
                  <Input
                    type="number"
                    value={formData.max_students}
                    onChange={(e) => setFormData({...formData, max_students: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>課程圖片</Label>
                  <DragDropUpload
                    onUploadComplete={(url) => setFormData({...formData, image_url: url})}
                    acceptedTypes="image/*"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingCourse(null);
                resetForm();
              }}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {editingCourse ? '更新' : '創建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}