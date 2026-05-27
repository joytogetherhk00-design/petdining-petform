import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, Mail, Phone } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DragDropUpload from '@/components/shared/DragDropUpload';
import { toast } from 'sonner';

export default function InstructorManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    instructor_id: '',
    name: '',
    email: '',
    phone: '',
    bio: '',
    specialties: [],
    image_url: '',
  });

  const { data: instructors = [], isLoading } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => base44.entities.Instructors.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Instructors.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('導師已創建');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Instructors.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      setIsDialogOpen(false);
      setEditingInstructor(null);
      resetForm();
      toast.success('導師已更新');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Instructors.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      toast.success('導師已刪除');
    },
  });

  const resetForm = () => {
    setFormData({
      instructor_id: '',
      name: '',
      email: '',
      phone: '',
      bio: '',
      specialties: [],
      image_url: '',
    });
  };

  const handleEdit = (instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      instructor_id: instructor.instructor_id || '',
      name: instructor.name,
      email: instructor.email,
      phone: instructor.phone || '',
      bio: instructor.bio || '',
      specialties: instructor.specialties || [],
      image_url: instructor.image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast.error('請填寫必填欄位');
      return;
    }

    if (editingInstructor) {
      updateMutation.mutate({ id: editingInstructor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredInstructors = instructors.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="導師管理"
          description="管理課程導師資訊"
          action={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新增導師
            </Button>
          }
        />

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜索導師..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor) => (
            <Card key={instructor.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{instructor.name}</h3>
                    <Badge variant={instructor.status === 'active' ? 'default' : 'secondary'}>
                      {instructor.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(instructor)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => deleteMutation.mutate(instructor.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{instructor.email}</span>
                  </div>
                  {instructor.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{instructor.phone}</span>
                    </div>
                  )}
                  {instructor.bio && (
                    <p className="text-muted-foreground mt-2">{instructor.bio}</p>
                  )}
                  {instructor.specialties && instructor.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {instructor.specialties.map((spec, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingInstructor(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingInstructor ? '編輯導師' : '新增導師'}
              </DialogTitle>
              <DialogDescription>
                填寫導師詳細資訊
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>導師編號</Label>
                  <Input
                    value={formData.instructor_id}
                    onChange={(e) => setFormData({...formData, instructor_id: e.target.value})}
                    placeholder="例如：INS001"
                  />
                </div>
                <div>
                  <Label>姓名 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>電郵 *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label>電話</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>簡介</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={3}
                />
              </div>

              <div>
                <Label>專長（用逗號分隔）</Label>
                <Input
                  value={formData.specialties?.join(', ')}
                  onChange={(e) => setFormData({...formData, specialties: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="例如：寵物營養，食品安全"
                />
              </div>

              <div>
                <Label>導師照片</Label>
                <DragDropUpload
                  onUploadComplete={(url) => setFormData({...formData, image_url: url})}
                  acceptedTypes="image/*"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {editingInstructor ? '更新' : '創建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}