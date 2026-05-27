import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DragDropUpload from '@/components/shared/DragDropUpload';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    logo_url: '',
    company_name: '',
    contact: '',
    phone: '',
    email: '',
    delivery_address: '',
    br_address: '',
    branch_address: '',
    br_document_url: '',
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Pre-fill email from user
  useEffect(() => {
    if (user?.email) {
      setForm(f => ({ ...f, email: f.email || user.email }));
    }
  }, [user]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target?.value ?? e }));

  const validate = () => {
    const required = ['company_name', 'contact', 'phone', 'email', 'delivery_address', 'br_address', 'branch_address', 'br_document_url'];
    for (const field of required) {
      if (!form[field]?.trim?.() && !form[field]) {
        toast.error('請填寫所有必填欄位');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    // Find existing pending customer record by user email
    const existing = await base44.entities.Customers.filter({ user_email: user.email });
    let customerRecord;

    if (existing.length > 0) {
      customerRecord = existing[0];
      await base44.entities.Customers.update(existing[0].id, {
        ...form,
        onboarding_completed: true,
        status: 'pending',
      });
    } else {
      customerRecord = await base44.entities.Customers.create({
        ...form,
        status: 'pending',
        onboarding_completed: true,
        user_email: user.email,
        credits_balance: 0,
      });
    }

    // 更新用戶的 user_type 為 business
    await base44.entities.User.update(user.id, {
      user_type: 'business',
      customer_id: customerRecord.customer_id,
    });

    queryClient.invalidateQueries({ queryKey: ['customer'] });
    toast.success('資料已提交，等待審批！');
    navigate('/pending');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">歡迎加入 PetDining PetForm</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">請填寫以下資料以完成開戶申請</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo */}
          <div>
            <Label className="mb-1.5 block">公司 Logo</Label>
            <DragDropUpload
              value={form.logo_url}
              onChange={set('logo_url')}
              accept="image/*"
              label="上傳 Logo"
              hint="PNG / JPG"
            />
          </div>

          {/* Company Name */}
          <div>
            <Label>公司名稱 <span className="text-destructive">*</span></Label>
            <Input className="mt-1" value={form.company_name} onChange={set('company_name')} placeholder="請輸入公司名稱" />
          </div>

          {/* Contact */}
          <div>
            <Label>聯絡人 <span className="text-destructive">*</span></Label>
            <Input className="mt-1" value={form.contact} onChange={set('contact')} placeholder="請輸入聯絡人姓名" />
          </div>

          {/* Phone */}
          <div>
            <Label>電話 <span className="text-destructive">*</span></Label>
            <Input className="mt-1" value={form.phone} onChange={set('phone')} placeholder="請輸入電話號碼" />
          </div>

          {/* Email */}
          <div>
            <Label>電郵 <span className="text-destructive">*</span></Label>
            <Input className="mt-1" type="email" value={form.email} onChange={set('email')} placeholder="請輸入電郵地址" />
          </div>

          {/* Delivery Address */}
          <div>
            <Label>送貨地址 <span className="text-destructive">*</span></Label>
            <Textarea className="mt-1" value={form.delivery_address} onChange={set('delivery_address')} placeholder="請輸入送貨地址" rows={2} />
          </div>

          {/* BR Address */}
          <div>
            <Label>商業登記地址 <span className="text-destructive">*</span></Label>
            <Textarea className="mt-1" value={form.br_address} onChange={set('br_address')} placeholder="請輸入商業登記地址" rows={2} />
          </div>

          {/* Branch Address */}
          <div>
            <Label>分店地址 <span className="text-destructive">*</span></Label>
            <Textarea className="mt-1" value={form.branch_address} onChange={set('branch_address')} placeholder="請輸入分店地址" rows={2} />
          </div>

          {/* BR Document */}
          <div>
            <Label className="mb-1.5 block">商業登記文件 <span className="text-destructive">*</span></Label>
            <DragDropUpload
              value={form.br_document_url}
              onChange={set('br_document_url')}
              accept="image/*,.pdf"
              label="上傳商業登記 (BR)"
              hint="PNG / JPG / PDF，最大 10MB"
            />
          </div>

          <Button
            className="w-full bg-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中...' : '提交申請'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}