import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminManagement() {
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const admins = users.filter(u => u.role === 'admin');

  const addAdmin = async () => {
    if (!email.trim()) return;
    await base44.users.inviteUser(email.trim(), 'admin');
    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    setEmail('');
    toast.success('管理員已邀請');
  };

  const removeAdmin = async (user) => {
    await base44.entities.User.update(user.id, { role: 'user' });
    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    toast.success('管理員權限已移除');
  };

  return (
    <div>
      <PageHeader title="管理員" />

      <div className="flex gap-3 mb-6">
        <Input placeholder="輸入電郵地址" value={email} onChange={e => setEmail(e.target.value)} />
        <Button className="bg-primary shrink-0" onClick={addAdmin}>
          <UserPlus className="h-4 w-4 mr-2" />邀請管理員
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名稱</TableHead>
            <TableHead>電郵</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map(u => (
            <TableRow key={u.id}>
              <TableCell className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {u.full_name || '-'}
              </TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell><Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">管理員</Badge></TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAdmin(u)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}