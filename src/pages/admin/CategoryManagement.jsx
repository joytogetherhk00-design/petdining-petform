import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CategoryManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Categories.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => base44.entities.Products.list(),
  });

  const openAdd = () => { setEditCat(null); setForm({ name: '', description: '' }); setDialogOpen(true); };
  const openEdit = (c) => { setEditCat(c); setForm({ name: c.name, description: c.description || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (editCat) {
      await base44.entities.Categories.update(editCat.id, form);
      toast.success('分類已更新');
    } else {
      await base44.entities.Categories.create(form);
      toast.success('分類已新增');
    }
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setDialogOpen(false);
  };

  const handleDelete = async (cat) => {
    const hasProducts = products.some(p => p.category === cat.name);
    if (hasProducts) {
      toast.error('此分類下仍有產品，無法刪除');
      return;
    }
    await base44.entities.Categories.delete(cat.id);
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    toast.success('分類已刪除');
  };

  return (
    <div>
      <PageHeader
        title="分類管理"
        action={<Button className="bg-primary" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />新增分類</Button>}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名稱</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>產品數</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{c.description || '-'}</TableCell>
              <TableCell>{products.filter(p => p.category === c.name).length}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCat ? '編輯分類' : '新增分類'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>名稱</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>描述</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
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