import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Trash2, Shield, Edit, KeyRound, Info, GraduationCap, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// 權限矩陣
const PERMISSIONS = {
  super_admin: {
    products: true,
    customers: true,
    orders: true,
    credits: true,
    courses: true,
    instructors: true,
    schedule: true,
    enrollments: true,
    attendance: true,
    admins: true,
  },
  course_admin: {
    products: false,
    customers: false,
    orders: false,
    credits: false,
    courses: true,
    instructors: true,
    schedule: true,
    enrollments: true,
    attendance: true,
    admins: false,
  },
};

const PERMISSION_LABELS = {
  products: '產品管理',
  customers: '客戶管理',
  orders: '訂單管理',
  credits: 'Credits 管理',
  courses: '課程管理',
  instructors: '導師管理',
  schedule: '行事曆管理',
  enrollments: '報名管理',
  attendance: '出席記錄',
  admins: '管理員帳戶',
};

export default function AdminManagement() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(null); // { email, loginLink }
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState('all');
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    admin_role: 'super_admin',
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    admin_role: 'super_admin',
    status: 'active',
  });

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const admins = users.filter(u => u.role === 'admin');
  const filteredAdmins = admins.filter(admin => {
    if (filter === 'all') return true;
    // 沒有 admin_role 的預設視為 super_admin
    const role = admin.admin_role || 'super_admin';
    return role === filter;
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      await base44.users.inviteUser(data.email, 'admin');
      // Wait briefly then update the newly created user record
      await new Promise(r => setTimeout(r, 1500));
      const updatedUsers = await base44.entities.User.list();
      const newUser = updatedUsers.find(u => u.email === data.email);
      if (newUser) {
        await base44.entities.User.update(newUser.id, {
          admin_role: data.admin_role,
          full_name: data.full_name || newUser.full_name,
          status: 'active',
          is_first_login: true,
          invited_at: new Date().toISOString(),
        });
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setInviteOpen(false);
      setInviteForm({ email: '', full_name: '', admin_role: 'super_admin' });
      const loginLink = `${window.location.origin}/admin-login`;
      setInviteSuccess({ email: data.email, loginLink });
    },
    onError: (error) => {
      toast.error('邀請失敗：' + error.message);
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      await base44.entities.User.update(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setEditOpen(false);
      toast.success('管理員資料已更新');
    },
    onError: (error) => {
      toast.error('更新失敗：' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.update(userId, { role: 'user', status: 'inactive' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setDeleteOpen(false);
      setSelectedUser(null);
      toast.success('管理員權限已移除');
    },
    onError: (error) => {
      toast.error('刪除失敗：' + error.message);
    },
  });

  const handleInvite = () => {
    if (!inviteForm.email || !inviteForm.full_name) {
      toast.error('請填寫電郵和姓名');
      return;
    }
    inviteMutation.mutate(inviteForm);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('已複製到剪貼板');
  };

  const handleEdit = () => {
    if (!editForm.full_name) {
      toast.error('請填寫姓名');
      return;
    }
    editMutation.mutate({ userId: selectedUser.id, data: editForm });
  };

  const handleDelete = () => {
    if (selectedUser.email === currentUser?.email) {
      toast.error('不能刪除自己');
      return;
    }
    deleteMutation.mutate(selectedUser.id);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      admin_role: user.admin_role || 'super_admin',
      status: user.status || 'active',
    });
    setEditOpen(true);
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const getRoleBadge = (role) => {
    if (!role || role === 'super_admin') {
      return <Badge className="bg-purple-100 text-purple-700 border-purple-200">超級管理員</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200">課程管理員</Badge>;
  };

  const getStatusBadge = (status) => {
    if (status === 'inactive') {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600">停用</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-700">啟用</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="管理員帳戶" 
        description="管理系統管理員及權限設置"
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />新增管理員
          </Button>
        }
      />

      {/* 權限說明卡片 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            權限說明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                超級管理員
              </div>
              <div className="text-muted-foreground">
                擁有系統所有權限，包括產品、客戶、訂單、Credits、課程、管理員等全部功能。
              </div>
            </div>
            <div>
              <div className="font-medium mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                課程管理員
              </div>
              <div className="text-muted-foreground">
                僅可管理課程相關功能，包括課程、導師、行事曆、報名及出席記錄。
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 篩選器 */}
      <div className="flex gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="篩選角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="super_admin">超級管理員</SelectItem>
            <SelectItem value="course_admin">課程管理員</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 管理員列表 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>電郵</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead>創建日期</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAdmins.map(u => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{getRoleBadge(u.admin_role)}</TableCell>
              <TableCell>{getStatusBadge(u.status)}</TableCell>
              <TableCell className="text-muted-foreground">
                {u.created_date ? new Date(u.created_date).toLocaleDateString('zh-HK') : '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => openEditDialog(u)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive"
                    onClick={() => openDeleteDialog(u)}
                    disabled={u.email === currentUser?.email}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 新增管理員 Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增管理員</DialogTitle>
            <DialogDescription>
              邀請新管理員並設置權限角色
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>姓名 *</Label>
              <Input 
                value={inviteForm.full_name} 
                onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})}
                placeholder="輸入姓名"
              />
            </div>
            <div>
              <Label>電郵 *</Label>
              <Input 
                type="email"
                value={inviteForm.email} 
                onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                placeholder="輸入電郵地址"
              />
            </div>
            <div>
              <Label>角色 *</Label>
              <Select 
                value={inviteForm.admin_role} 
                onValueChange={(value) => setInviteForm({...inviteForm, admin_role: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">超級管理員</SelectItem>
                  <SelectItem value="course_admin">課程管理員</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {inviteForm.admin_role === 'super_admin' 
                  ? '擁有所有系統權限' 
                  : '僅可管理課程相關功能'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>取消</Button>
            <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? '邀請中...' : '確認邀請'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 邀請成功 Dialog */}
      <Dialog open={!!inviteSuccess} onOpenChange={() => setInviteSuccess(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              管理員已成功邀請
            </DialogTitle>
            <DialogDescription>
              請將以下登入資訊通過 WhatsApp / WeChat / Telegram 發送給新管理員
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">電郵地址</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-background border rounded px-2 py-1">{inviteSuccess?.email}</code>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(inviteSuccess?.email)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">登入連結</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-background border rounded px-2 py-1 truncate">{inviteSuccess?.loginLink}</code>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(inviteSuccess?.loginLink)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800">
              <p className="font-medium mb-1">📋 給新管理員的說明：</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>點擊登入連結進入管理後台登入頁</li>
                <li>輸入電郵地址，系統會發送登入連結到郵箱</li>
                <li>點擊郵件內的連結即可登入</li>
              </ol>
            </div>
            <Button 
              className="w-full" 
              onClick={() => copyToClipboard(`管理後台登入資訊\n電郵：${inviteSuccess?.email}\n登入連結：${inviteSuccess?.loginLink}`)}
            >
              <Copy className="h-4 w-4 mr-2" />
              一鍵複製全部資訊
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteSuccess(null)}>關閉</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編輯管理員 Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯管理員</DialogTitle>
            <DialogDescription>
              修改管理員資料及權限
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>姓名 *</Label>
              <Input 
                value={editForm.full_name} 
                onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                placeholder="輸入姓名"
              />
            </div>
            <div>
              <Label>電郵</Label>
              <Input disabled value={selectedUser?.email || ''} />
            </div>
            <div>
              <Label>角色 *</Label>
              <Select 
                value={editForm.admin_role} 
                onValueChange={(value) => setEditForm({...editForm, admin_role: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">超級管理員</SelectItem>
                  <SelectItem value="course_admin">課程管理員</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>狀態</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch
                  checked={editForm.status === 'active'}
                  onCheckedChange={(checked) => setEditForm({...editForm, status: checked ? 'active' : 'inactive'})}
                />
                <span className="text-sm">{editForm.status === 'active' ? '啟用' : '停用'}</span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <Button variant="outline" className="w-full" disabled>
                <KeyRound className="h-4 w-4 mr-2" />重置密碼（即將推出）
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending}>
              {editMutation.isPending ? '更新中...' : '確認更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認 Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              此操作將移除 {selectedUser?.full_name || '此管理員'} 的管理員權限
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              刪除後，該用戶將變為普通用戶，無法再訪問管理後台。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? '刪除中...' : '確認刪除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}