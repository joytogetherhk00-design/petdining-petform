import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Pencil, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyProduct = { sku: '', name: '', category: '', description: '', wholesale_price: '', min_order: 1, unit: '件', stock: 0, image1: '', image2: '', image3: '', country_of_origin: '', status: 'active' };

export default function ProductManagement() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => base44.entities.Products.list('-created_date'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Categories.list(),
  });

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setEditProduct(null); setForm(emptyProduct); setDialogOpen(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ ...emptyProduct, ...p, wholesale_price: p.wholesale_price || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    const data = { ...form, wholesale_price: Number(form.wholesale_price), min_order: Number(form.min_order), stock: Number(form.stock) };
    if (editProduct) {
      await base44.entities.Products.update(editProduct.id, data);
      toast.success('產品已更新');
    } else {
      await base44.entities.Products.create(data);
      toast.success('產品已新增');
    }
    queryClient.invalidateQueries({ queryKey: ['allProducts'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setDialogOpen(false);
  };

  const handleCopy = async (p) => {
    const { id, created_date, updated_date, created_by, ...data } = p;
    await base44.entities.Products.create({ ...data, sku: `${data.sku}-copy`, name: `${data.name} (副本)` });
    queryClient.invalidateQueries({ queryKey: ['allProducts'] });
    toast.success('產品已複製');
  };

  const handleDelete = async (p) => {
    await base44.entities.Products.delete(p.id);
    queryClient.invalidateQueries({ queryKey: ['allProducts'] });
    toast.success('產品已刪除');
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, [field]: file_url }));
  };

  return (
    <div>
      <PageHeader
        title="產品管理"
        action={<Button className="bg-primary" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />新增產品</Button>}
      />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜尋產品..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="分類" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分類</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>名稱</TableHead>
              <TableHead>分類</TableHead>
              <TableHead>批發價</TableHead>
              <TableHead>庫存</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell className="text-sm">{p.category}</TableCell>
                <TableCell>HK${p.wholesale_price}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(p)}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editProduct ? '編輯產品' : '新增產品'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
              <div><Label>名稱</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            </div>
            <div>
              <Label>分類</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="選擇分類" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>描述</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>批發價</Label><Input type="number" value={form.wholesale_price} onChange={e => setForm({ ...form, wholesale_price: e.target.value })} /></div>
              <div><Label>最低訂購</Label><Input type="number" value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })} /></div>
              <div><Label>庫存</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>單位</Label><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              <div><Label>原產地</Label><Input value={form.country_of_origin} onChange={e => setForm({ ...form, country_of_origin: e.target.value })} /></div>
            </div>
            <div>
              <Label>狀態</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">啟用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {['image1', 'image2', 'image3'].map((field, i) => (
              <div key={field}>
                <Label>圖片 {i + 1}</Label>
                <div className="flex gap-2 items-center">
                  <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, field)} />
                  {form[field] && <img src={form[field]} alt="" className="w-10 h-10 rounded object-cover" />}
                </div>
              </div>
            ))}
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