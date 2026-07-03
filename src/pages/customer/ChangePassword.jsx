import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePassword({ userId, isMandatory = false, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('新密碼與確認密碼不符');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('新密碼最少需要 8 個字元');
      return;
    }
    setLoading(true);
    try {
      await base44.auth.changePassword({
        userId,
        currentPassword,
        newPassword,
      });
      toast.success('密碼已成功更改');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.status === 401) {
        toast.error('目前密碼不正確');
      } else {
        toast.error('更改密碼失敗，請重試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={isMandatory ? 'border-orange-300 bg-orange-50' : ''}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4" />
          {isMandatory ? '⚠️ 請立即更改臨時密碼' : '更改密碼'}
        </CardTitle>
        {isMandatory && (
          <p className="text-sm text-orange-700 mt-1">
            您的帳戶使用的是臨時密碼，請立即設定個人密碼以保障帳戶安全。
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>目前密碼{isMandatory ? '（臨時密碼）' : ''}</Label>
            <div className="relative mt-1">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                placeholder="輸入目前密碼"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>新密碼</Label>
            <div className="relative mt-1">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                placeholder="最少 8 個字元"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>確認新密碼</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="再次輸入新密碼"
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full bg-primary" disabled={loading}>
            {loading ? '更改中...' : '確認更改密碼'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}