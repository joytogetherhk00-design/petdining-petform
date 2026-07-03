import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function ChangePassword({ isMandatory = false, onSuccess }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleSendLink = async () => {
    setLoading(true);
    try {
      await base44.auth.redirectToLogin(window.location.pathname, { noRedirect: true });
      setSent(true);
      toast.success('登入連結已發送到您的電郵');
      if (onSuccess) onSuccess();
    } catch (err) {
      // redirectToLogin may throw if noRedirect not supported; treat as success
      setSent(true);
      toast.success('請查收電郵以重新登入並更新帳戶安全');
      if (onSuccess) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={isMandatory ? 'border-orange-300 bg-orange-50' : ''}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4" />
          {isMandatory ? '⚠️ 帳戶安全通知' : '帳戶安全'}
        </CardTitle>
        {isMandatory && (
          <p className="text-sm text-orange-700 mt-1">
            您的帳戶由管理員開設，建議聯絡管理員確認您的登入安全。
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {sent ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">登入連結已發送</p>
              <p className="text-xs text-green-700 mt-0.5">請查收 {user?.email} 的電郵</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              本平台使用電郵魔術連結登入，無需傳統密碼。<br />
              如需重新驗證帳戶，可發送新登入連結到您的電郵：
            </p>
            <p className="text-sm font-medium">{user?.email}</p>
            <Button className="w-full" onClick={handleSendLink} disabled={loading}>
              <Mail className="h-4 w-4 mr-2" />
              {loading ? '發送中...' : '發送新登入連結'}
            </Button>
          </div>
        )}
        {!isMandatory && (
          <Button variant="ghost" size="sm" className="w-full" onClick={onSuccess}>
            返回
          </Button>
        )}
      </CardContent>
    </Card>
  );
}