import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail, MessageCircle } from 'lucide-react';

export default function LoginGate() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">此頁面需要登入才能訪問</h2>
          <p className="text-muted-foreground text-sm">請使用您的帳戶 Email 及密碼登入</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
          <p className="text-sm font-medium text-amber-800 mb-1">⚠️ 未有帳戶？</p>
          <p className="text-xs text-amber-700">本平台不開放自助註冊，新客戶請聯絡我們申請開戶。</p>
        </div>

        <div className="bg-muted rounded-xl p-5 space-y-3 text-left">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">申請開戶 Email</p>
              <a href="mailto:info@petdininghk.com" className="font-medium text-primary hover:underline">
                info@petdininghk.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">WhatsApp</p>
              <a href="https://wa.me/85298673497" target="_blank" rel="noopener noreferrer" className="font-medium text-green-600 hover:underline">
                +852 9867 3497
              </a>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={() => base44.auth.redirectToLogin(window.location.href)}>
          以 Email 登入
        </Button>
      </div>
    </div>
  );
}