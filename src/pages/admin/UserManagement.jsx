import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, User, Mail, Calendar, Shield, Trash2, Ban, CheckCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import StatusBadge from '@/components/shared/StatusBadge';

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'business', 'general'
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleUser, setRoleUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  // 獲取用戶的客戶資料以判斷用戶類型
  const { data: customers = [] } = useQuery({
    queryKey: ['allCustomersForUserMgmt'],
    queryFn: () => base44.entities.Customers.list(),
  });

  const filteredUsers = users.filter(user => {
    const q = search.toLowerCase();
    const matchesSearch = !search || 
      user.email?.toLowerCase().includes(q) || 
      user.full_name?.toLowerCase().includes(q) ||
      user.role?.toLowerCase().includes(q);
    
    // 根據用戶類型過濾
    let matchesType = true;
    if (filterType === 'business') {
      const customerEmails = customers.filter(c => c.status === 'active' || c.status === 'pending').map(c => c.user_email);
      matchesType = customerEmails.includes(user.email);
    } else if (filterType === 'general') {
      const customerEmails = customers.map(c => c.user_email);
      matchesType = !customerEmails.includes(user.email);
    }
    
    return matchesSearch && matchesType;
  });

  const handleDisableUser = async (user) => {
    try {
      await base44.entities.User.update(user.id, { 
        disabled: !user.disabled,
        disabled_reason: user.disabled ? null : '管理員停用'
      });
      toast.success(`用戶已${user.disabled ? '啟用' : '停用'}`);
    } catch (error) {
      toast.error('操作失敗');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await base44.entities.User.delete(userToDelete.id);
      toast.success('用戶已刪除');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error('刪除失敗');
    }
  };

  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Derive composite role value from user fields
  const getCompositeRole = (user) => {
    if (user.role === 'admin') return user.admin_role || 'super_admin';
    return 'user';
  };

  const openRoleDialog = (user) => {
    setRoleUser(user);
    setNewRole(getCompositeRole(user));
    setRoleDialogOpen(true);
  };

  const handleChangeRole = async () => {
    if (!roleUser) return;
    setSavingRole(true);
    try {
      let updateData = {};
      if (newRole === 'super_admin') {
        updateData = { role: 'admin', admin_role: 'super_admin' };
      } else if (newRole === 'course_admin') {
        updateData = { role: 'admin', admin_role: 'course_admin' };
      } else {
        updateData = { role: 'user', admin_role: null };
      }
      await base44.entities.User.update(roleUser.id, updateData);
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      const label = { super_admin: '超級管理員', course_admin: '課程管理員', user: '一般用戶' }[newRole];
      toast.success(`已將 ${roleUser.full_name || roleUser.email} 的角色更新為「${label}」`);
      setRoleDialogOpen(false);
    } catch (error) {
      toast.error('更改角色失敗');
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="用戶管理"
        description="查看所有註冊用戶（商業客戶 + 一般客戶）的詳細資料及狀態"
      />

      <Card className="p-4 mb-4">
        <div className="flex gap-4 mb-4">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            className={filterType === 'all' ? 'bg-primary' : ''}
            onClick={() => setFilterType('all')}
          >
            所有用戶
          </Button>
          <Button
            variant={filterType === 'business' ? 'default' : 'outline'}
            className={filterType === 'business' ? 'bg-primary' : ''}
            onClick={() => setFilterType('business')}
          >
            商業客戶
          </Button>
          <Button
            variant={filterType === 'general' ? 'default' : 'outline'}
            className={filterType === 'general' ? 'bg-primary' : ''}
            onClick={() => setFilterType('general')}
          >
            一般客戶
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="搜尋用戶名稱、電郵或角色..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9" 
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用戶名稱</TableHead>
                <TableHead>電郵</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>註冊日期</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-muted-foreground">載入中...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    沒有找到用戶
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedUser(user)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        {user.full_name || '未設定'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-1 rounded-full w-fit ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {user.role === 'admin' ? '管理員' : '用戶'}
                        </span>
                        {(() => {
                          const customer = customers.find(c => c.user_email === user.email);
                          if (customer) {
                            return (
                              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary w-fit">
                                商業客戶 - {customer.customer_id}
                              </span>
                            );
                          }
                          return (
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground w-fit">
                              一般客戶
                            </span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.created_date).toLocaleDateString('zh-HK')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.disabled ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                          已停用
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          正常
                        </span>
                      )}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRoleDialog(user)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          角色
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDisableUser(user)}
                          className={user.disabled ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}
                        >
                          {user.disabled ? '啟用' : '停用'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDeleteDialog(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          刪除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-lg">{selectedUser?.full_name || '未設定'}</div>
                <div className="text-sm text-muted-foreground">{selectedUser?.email}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    用戶名稱
                  </div>
                  <div className="font-medium">{selectedUser.full_name || '未設定'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    電郵地址
                  </div>
                  <div className="font-medium">{selectedUser.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    用戶角色
                  </div>
                  <div className="font-medium">
                    <span className={`text-xs px-2 py-1 rounded-full ${selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {selectedUser.role === 'admin' ? '管理員' : '一般用戶'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    註冊日期
                  </div>
                  <div className="font-medium">
                    {new Date(selectedUser.created_date).toLocaleDateString('zh-HK', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    驗證狀態
                  </div>
                  <div className="font-medium">
                    {selectedUser.is_verified ? (
                      <span className="text-green-600">已驗證</span>
                    ) : (
                      <span className="text-yellow-600">未驗證</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Ban className="h-4 w-4" />
                    帳戶狀態
                  </div>
                  <div className="font-medium">
                    {selectedUser.disabled ? (
                      <span className="text-red-600">已停用</span>
                    ) : (
                      <span className="text-green-600">正常</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedUser.disabled && selectedUser.disabled_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-800">
                    <strong>停用原因：</strong>{selectedUser.disabled_reason}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">API Key</div>
                <code className="block p-2 bg-muted rounded text-xs font-mono break-all">
                  {selectedUser.api_key}
                </code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>更改用戶角色</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-sm text-muted-foreground">
              用戶：<strong>{roleUser?.full_name || roleUser?.email}</strong>
            </div>
            <div className="space-y-2">
              <Label>選擇角色</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">🛡️ 超級管理員 — 所有後台權限</SelectItem>
                  <SelectItem value="course_admin">🎓 課程管理員 — 僅課程相關功能</SelectItem>
                  <SelectItem value="user">👤 一般用戶 — 移除管理員權限</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newRole === 'super_admin' || newRole === 'course_admin') && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                ⚠️ 此用戶將獲得管理後台訪問權限，請確認後再操作。
              </div>
            )}
            {newRole === 'user' && roleUser?.role === 'admin' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                ⚠️ 此操作將移除該用戶的所有管理員權限。
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>取消</Button>
            <Button onClick={handleChangeRole} disabled={savingRole}>
              {savingRole ? '儲存中...' : '確認更改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除用戶</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              確定要刪除用戶 <strong>{userToDelete?.full_name || userToDelete?.email}</strong> 嗎？
              此操作無法復原。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" />
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}