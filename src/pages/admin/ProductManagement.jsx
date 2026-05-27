import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import OriginBadge, { ORIGINS } from '@/components/shared/OriginBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Pencil, Copy, Trash2, EyeOff, Check, X } from 'lucide-react';
import ImageUploadRow from '@/components/admin/ImageUploadRow';
import MeatBadge, { MEAT_TYPES } from '@/components/shared/MeatBadge';
import { toast } from 'sonner';

// Inline editable cell
function InlineCell({ value, type = 'text', onSave, options, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');
  const inputRef = useRef(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = async () => {
    setEditing(false);
    if (val !== (value ?? '')) {
      await onSave(type === 'number' ? Number(val) : val);
    }
  };

  const cancel = () => { setVal(value ?? ''); setEditing(false); };

  if (type === 'select' && editing) {
    return (
      <Select value={val} onValueChange={async v => { setVal(v); setEditing(false); await onSave(v); }}>
        <SelectTrigger className="h-7 text-xs w-full min-w-[90px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type={type}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          onBlur={commit}
          className="h-7 text-xs w-full min-w-[70px] max-w-[120px]"
        />
      </div>
    );
  }

  return (
    <span
      className={`cursor-pointer hover:bg-muted/60 rounded px-1 py-0.5 transition-colors group flex items-center gap-1 ${className}`}
      onClick={() => { setVal(value ?? ''); setEditing(true); }}
    >
      <span>{value ?? <span className="text-muted-foreground text-xs italic">—</span>}</span>
      <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
    </span>
  );
}

const emptyProduct = {
  sku: '', name: '', category: '', meat_type: '', description: '',
  wholesale_price: '', min_order: 1, unit: '件', stock: 0,
  net_weight: '', nutrition_info: '',
  image1: '', image2: '', image3: '',
  country_of_origin: '', status: 'active', is_visible: true
};

export default function ProductManagement() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [meatFilter, setMeatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [quickForm, setQuickForm] = useState({ sku: '', name: '', category: '', wholesale_price: '', stock: 0, unit: '件' });
  const [uploadingField, setUploadingField] = useState(null);
  const [formErrors, setFormErrors] = useState({});
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
    const matchOrigin = originFilter === 'all' || p.country_of_origin === originFilter;
    const matchMeat = meatFilter === 'all' || p.meat_type === meatFilter;
    return matchSearch && matchCat && matchOrigin && matchMeat;
  });

  const openAdd = () => { setEditProduct(null); setForm(emptyProduct); setFormErrors({}); setDialogOpen(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ ...emptyProduct, ...p, wholesale_price: p.wholesale_price || '' }); setFormErrors({}); setDialogOpen(true); };

  const handleSave = async () => {
    const errors = {};
    if (!form.sku) errors.sku = true;
    if (!form.name) errors.name = true;
    if (!form.category) errors.category = true;
    if (!form.country_of_origin) errors.country_of_origin = true;
    if (!form.wholesale_price) errors.wholesale_price = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('請填寫所有必填欄位 (*)');
      return;
    }
    setFormErrors({});
    const data = {
      ...form,
      wholesale_price: Number(form.wholesale_price),
      min_order: Number(form.min_order),
      stock: Number(form.stock),
      is_visible: form.is_visible !== false,
    };
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

  const handleQuickSave = async () => {
    if (!quickForm.sku || !quickForm.name || !quickForm.category || !quickForm.wholesale_price) {
      toast.error('請填寫所有必填欄位');
      return;
    }
    await base44.entities.Products.create({
      ...quickForm,
      wholesale_price: Number(quickForm.wholesale_price),
      stock: Number(quickForm.stock),
      min_order: 1,
      status: 'active',
      is_visible: true,
    });
    toast.success('產品已快速新增');
    queryClient.invalidateQueries({ queryKey: ['allProducts'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setQuickForm({ sku: '', name: '', category: '', wholesale_price: '', stock: 0, unit: '件' });
    setQuickDialogOpen(false);
  };

  const handleInlineUpdate = async (productId, field, value) => {
    await base44.entities.Products.update(productId, { [field]: value });
    queryClient.invalidateQueries({ queryKey: ['allProducts'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.success('已更新');
  };

  const handleImageUpload = async (file, field) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, [field]: file_url }));
      toast.success('圖片已上傳');
    } catch (err) {
      toast.error('上傳失敗，請重試');
    } finally {
      setUploadingField(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="產品管理"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setQuickDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />⚡ 快速新增</Button>
            <Button className="bg-primary" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />完整新增</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜尋產品..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="全部分類" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分類</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={originFilter} onValueChange={setOriginFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="全部產地" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部產地</SelectItem>
            {ORIGINS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={meatFilter} onValueChange={setMeatFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="全部肉類" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部肉類</SelectItem>
            {MEAT_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
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
              <TableHead>肉類</TableHead>
              <TableHead>產地</TableHead>
              <TableHead>批發價</TableHead>
              <TableHead>庫存</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>顯示</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className={p.is_visible === false ? 'opacity-50' : ''}>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    {p.image1
                      ? <img src={p.image1} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                      : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 text-muted-foreground text-xs">無</div>
                    }
                    <InlineCell value={p.sku} onSave={v => handleInlineUpdate(p.id, 'sku', v)} className="font-mono text-sm" />
                  </div>
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <InlineCell value={p.name} onSave={v => handleInlineUpdate(p.id, 'name', v)} />
                </TableCell>
                <TableCell>
                  <InlineCell
                    value={p.category}
                    type="select"
                    options={categories.map(c => ({ value: c.name, label: c.name }))}
                    onSave={v => handleInlineUpdate(p.id, 'category', v)}
                  />
                </TableCell>
                <TableCell>
                  <InlineCell
                    value={p.meat_type}
                    type="select"
                    options={[{ value: '', label: '—' }, ...MEAT_TYPES.map(m => ({ value: m.value, label: m.label }))]}
                    onSave={v => handleInlineUpdate(p.id, 'meat_type', v)}
                  />
                  {p.meat_type && <MeatBadge meatType={p.meat_type} />}
                </TableCell>
                <TableCell>
                  <InlineCell
                    value={p.country_of_origin}
                    type="select"
                    options={[{ value: '', label: '—' }, ...ORIGINS.map(o => ({ value: o, label: o }))]}
                    onSave={v => handleInlineUpdate(p.id, 'country_of_origin', v)}
                  />
                  {p.country_of_origin && <OriginBadge origin={p.country_of_origin} size="sm" />}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <span className="text-xs text-muted-foreground">HK$</span>
                    <InlineCell value={p.wholesale_price} type="number" onSave={v => handleInlineUpdate(p.id, 'wholesale_price', v)} />
                  </div>
                </TableCell>
                <TableCell>
                  <InlineCell value={p.stock} type="number" onSave={v => handleInlineUpdate(p.id, 'stock', v)} />
                </TableCell>
                <TableCell>
                  <InlineCell
                    value={p.status}
                    type="select"
                    options={[{ value: 'active', label: '啟用' }, { value: 'inactive', label: '停用' }]}
                    onSave={v => handleInlineUpdate(p.id, 'status', v)}
                  />
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={p.is_visible !== false}
                    onCheckedChange={v => handleInlineUpdate(p.id, 'is_visible', v)}
                    className="scale-75"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)} title="完整編輯"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(p)}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Quick Add Dialog */}
      <Dialog open={quickDialogOpen} onOpenChange={setQuickDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>⚡ 快速新增產品</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>SKU *</Label><Input value={quickForm.sku} onChange={e => setQuickForm({ ...quickForm, sku: e.target.value })} placeholder="e.g. PD-001" /></div>
              <div><Label>產品名稱 *</Label><Input value={quickForm.name} onChange={e => setQuickForm({ ...quickForm, name: e.target.value })} placeholder="產品名稱" /></div>
            </div>
            <div>
              <Label>分類 *</Label>
              <Select value={quickForm.category} onValueChange={v => setQuickForm({ ...quickForm, category: v })}>
                <SelectTrigger><SelectValue placeholder="選擇分類" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>批發價 (HKD) *</Label><Input type="number" value={quickForm.wholesale_price} onChange={e => setQuickForm({ ...quickForm, wholesale_price: e.target.value })} placeholder="0" /></div>
              <div><Label>庫存</Label><Input type="number" value={quickForm.stock} onChange={e => setQuickForm({ ...quickForm, stock: e.target.value })} /></div>
              <div><Label>單位</Label><Input value={quickForm.unit} onChange={e => setQuickForm({ ...quickForm, unit: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickDialogOpen(false)}>取消</Button>
            <Button className="bg-primary" onClick={handleQuickSave}>快速新增</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editProduct ? '編輯產品' : '新增產品'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {/* Basic */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={formErrors.sku ? 'text-destructive' : ''}>SKU *</Label>
                <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className={formErrors.sku ? 'border-destructive' : ''} />
                {formErrors.sku && <p className="text-xs text-destructive mt-1">必填</p>}
              </div>
              <div>
                <Label className={formErrors.name ? 'text-destructive' : ''}>產品名稱 *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={formErrors.name ? 'border-destructive' : ''} />
                {formErrors.name && <p className="text-xs text-destructive mt-1">必填</p>}
              </div>
            </div>

            {/* Category + Meat + Origin */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={formErrors.category ? 'text-destructive' : ''}>分類 *</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className={formErrors.category ? 'border-destructive' : ''}><SelectValue placeholder="選擇分類" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-xs text-destructive mt-1">必填</p>}
              </div>
              <div>
                <Label>肉類 Series</Label>
                <Select value={form.meat_type} onValueChange={v => setForm({ ...form, meat_type: v })}>
                  <SelectTrigger><SelectValue placeholder="選擇肉類" /></SelectTrigger>
                  <SelectContent>
                    {MEAT_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className={formErrors.country_of_origin ? 'text-destructive' : ''}>產地 *</Label>
              <Select value={form.country_of_origin} onValueChange={v => setForm({ ...form, country_of_origin: v })}>
                <SelectTrigger className={formErrors.country_of_origin ? 'border-destructive' : ''}><SelectValue placeholder="選擇產地" /></SelectTrigger>
                <SelectContent>
                  {ORIGINS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              {formErrors.country_of_origin && <p className="text-xs text-destructive mt-1">必填</p>}
            </div>

            {/* Price + Min Order + Stock */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className={formErrors.wholesale_price ? 'text-destructive' : ''}>批發價 *</Label>
                <Input type="number" value={form.wholesale_price} onChange={e => setForm({ ...form, wholesale_price: e.target.value })} className={formErrors.wholesale_price ? 'border-destructive' : ''} />
                {formErrors.wholesale_price && <p className="text-xs text-destructive mt-1">必填</p>}
              </div>
              <div><Label>最低訂購</Label><Input type="number" value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })} /></div>
              <div><Label>庫存</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
            </div>

            {/* Unit + Net Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>單位</Label><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              <div><Label>淨重</Label><Input value={form.net_weight} placeholder="e.g. 100g" onChange={e => setForm({ ...form, net_weight: e.target.value })} /></div>
            </div>

            {/* Description */}
            <div><Label>產品描述</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>

            {/* Nutrition */}
            <div><Label>營養資料</Label><Textarea rows={2} value={form.nutrition_info} placeholder="蛋白質、脂肪、水分..." onChange={e => setForm({ ...form, nutrition_info: e.target.value })} /></div>

            {/* Status + Visibility */}
            <div className="grid grid-cols-2 gap-3">
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
              <div className="flex flex-col gap-1">
                <Label>客戶端顯示</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Switch
                    checked={form.is_visible !== false}
                    onCheckedChange={v => setForm({ ...form, is_visible: v })}
                  />
                  <span className="text-sm text-muted-foreground">{form.is_visible !== false ? '顯示' : '隱藏'}</span>
                </div>
              </div>
            </div>

            {/* Images */}
            <ImageUploadRow field="image1" label="圖片 1" value={form.image1} uploading={uploadingField === 'image1'} onUpload={handleImageUpload} />
            <ImageUploadRow field="image2" label="圖片 2" value={form.image2} uploading={uploadingField === 'image2'} onUpload={handleImageUpload} />
            <ImageUploadRow field="image3" label="圖片 3" value={form.image3} uploading={uploadingField === 'image3'} onUpload={handleImageUpload} />
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