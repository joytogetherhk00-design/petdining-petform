import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import DragDropUpload from '@/components/shared/DragDropUpload';
import { toast } from 'sonner';
import { CheckCircle2, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';

const REQUIRED_FIELDS = ['company_name', 'contact', 'phone', 'email', 'delivery_address', 'branch_address', 'br_address', 'br_document_url'];

export default function Apply() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [form, setForm] = useState({
    logo_url: '',
    company_name: '',
    contact: '',
    phone: '',
    email: '',
    delivery_address: '',
    branch_address: '',
    br_address: '',
    br_document_url: '',
    notes: '',
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target?.value ?? e }));

  const validate = () => {
    for (const field of REQUIRED_FIELDS) {
      if (!form[field]) {
        toast.error('請填寫所有必填欄位 (*)');
        return false;
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('請輸入有效電郵地址');
      return false;
    }
    if (!agreedToPrivacy) {
      toast.error('請先同意私隱條款');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    await base44.entities.Application.create({
      ...form,
      status: 'pending',
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">申請已提交！</h2>
            <p className="text-muted-foreground text-sm">
              感謝您申請 PetDining PetForm。<br />
              我們會盡快審核您的資料，批准後將即時透過電郵通知您。
            </p>
            <p className="text-sm">
              如有查詢，請 WhatsApp：
              <a href="https://wa.me/85298673497" className="text-primary font-semibold ml-1">9867 3497</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <PawPrint className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">PetDining PetForm</h1>
          <p className="text-muted-foreground mt-1 text-sm">B2B 批發採購平台 — 開戶申請</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">開戶申請表</CardTitle>
            <p className="text-xs text-muted-foreground">請填寫以下資料，我們將盡快審核並通知您</p>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Logo */}
            <div>
              <Label className="mb-1.5 block">公司 Logo</Label>
              <DragDropUpload value={form.logo_url} onChange={set('logo_url')} accept="image/*" label="上傳 Logo" hint="PNG / JPG（可選）" />
            </div>

            <Field label="公司名稱" required>
              <Input value={form.company_name} onChange={set('company_name')} placeholder="例：Happy Paws Café Ltd." />
            </Field>

            <Field label="聯絡人姓名" required>
              <Input value={form.contact} onChange={set('contact')} placeholder="例：陳大文" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="電話 / WhatsApp" required>
                <Input value={form.phone} onChange={set('phone')} placeholder="例：9123 4567" />
              </Field>
              <Field label="電郵地址" required>
                <Input type="email" value={form.email} onChange={set('email')} placeholder="例：info@café.com" />
              </Field>
            </div>

            <Field label="送貨地址" required>
              <Textarea value={form.delivery_address} onChange={set('delivery_address')} placeholder="請輸入送貨地址" rows={2} />
            </Field>

            <Field label="分店地址" required>
              <Textarea value={form.branch_address} onChange={set('branch_address')} placeholder="請輸入分店地址" rows={2} />
            </Field>

            <Field label="商業登記地址" required>
              <Textarea value={form.br_address} onChange={set('br_address')} placeholder="請輸入商業登記地址" rows={2} />
            </Field>

            {/* BR Document */}
            <div>
              <Label className="mb-1.5 block">
                商業登記文件 <span className="text-destructive">*</span>
              </Label>
              <DragDropUpload
                value={form.br_document_url}
                onChange={set('br_document_url')}
                accept="image/*,.pdf"
                label="上傳商業登記 (BR)"
                hint="PNG / JPG / PDF，最大 10MB"
              />
            </div>

            <Field label="備註（可選）">
              <Textarea value={form.notes} onChange={set('notes')} placeholder="其他補充資料..." rows={2} />
            </Field>

            <div className="flex items-start space-x-2 py-2">
              <Checkbox
                id="privacy"
                checked={agreedToPrivacy}
                onCheckedChange={setAgreedToPrivacy}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="privacy"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  我已閱讀並同意{' '}
                  <Link to="/privacy" target="_blank" className="text-primary underline">
                    私隱條款
                  </Link>
                </label>
              </div>
            </div>

            <Button
              className="w-full bg-primary h-11 text-base font-semibold"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '提交申請'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              已有帳戶？{' '}
              <a href="/" className="text-primary underline">立即登入</a>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          如有查詢：WhatsApp{' '}
          <a href="https://wa.me/85298673497" className="text-primary">9867 3497</a>
          {' '}｜{' '}
          <a href="mailto:info@petdininghk.com" className="text-primary">info@petdininghk.com</a>
        </p>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <Label className="mb-1 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}