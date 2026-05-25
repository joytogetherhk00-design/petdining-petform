import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

const emptyBranch = { branch_id: '', area: '', brand: '', contact_person: '', phone: '', email: '', address: '' };

export default function BranchManagement({ customerId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [form, setForm] = useState(emptyBranch);
  const queryClient = useQueryClient();

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', customerId],
    queryFn: () => base44.entities.Branches.filter({ customer_id: customerId }),
    enabled: !!customerId,
  });

  const openAdd = () => { setEditBranch(null); setForm(emptyBranch); setDialogOpen(true); };
  const openEdit = (b) => { setEditBranch(b); setForm({ ...emptyBranch, ...b }); setDialogOpen(true); };

  const handleSave = async () => {
    if (editBranch) {
      await base44.entities.Branches.update(editBranch.id, { ...form, customer_id: customerId });
      toast.success('分店已更新');
    } else {
      await base44.entities.Branches.create({ ...form, customer_id: customerId });
      toast.success('分店已新增');
    }
    queryClient.invalidateQueries({ queryKey: ['branches', customerId] });
    setDialogOpen(false);
  };

  const handleDelete = async (b) => {
    await base44.entities.Branches.delete(b.id);
    queryClient.invalidateQueries({ queryKey: ['branches', customerId] });
    toast.success('分店已刪除');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />分店列表 ({branches.length})
        </h3>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />新增分店
        </Button>
      </div>

      {branches.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">暫無分店</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>品牌</TableHead>
              <TableHead>地區</TableHead>
              <TableHead>聯絡人</TableHead>
              <TableHead>電話</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.brand}</TableCell>
                <TableCell>{b.area}</TableCell>
                <TableCell>{b.contact_person}</TableCell>
                <TableCell>{b.phone}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editBranch ? '編輯分店' : '新增分店'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>品牌</Label><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
              <div><Label>地區</Label><Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></div>
            </div>
            <div><Label>地址</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>聯絡人</Label><Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div><Label>電話</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>電郵</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button className="bg-primary" onClick={handleSave}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}