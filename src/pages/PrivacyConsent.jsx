import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PrivacyConsent() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // 如果已經接受，直接跳轉
      if (currentUser.privacy_accepted) {
        // 根據用戶類型跳轉到不同頁面
        if (currentUser.role === 'admin') {
          navigate('/admin');
        } else if (currentUser.user_type === 'business') {
          navigate('/products');
        } else {
          navigate('/courses');
        }
        return;
      }
    } catch (error) {
      // 未登入，跳轉到登入頁
      navigate('/');
    }
  };



  const handleAccept = async () => {
    if (!accepted) {
      toast.error('請先勾選同意');
      return;
    }

    setIsUpdating(true);
    try {
      await base44.auth.updateMe({
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
      });

      toast.success('感謝您的確認');
      
      // 根據用戶類型跳轉
      if (user?.role === 'admin') {
        navigate('/admin');
      } else if (user?.user_type === 'business') {
        navigate('/products');
      } else {
        navigate('/courses');
      }
    } catch (error) {
      toast.error('更新失敗：' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            🐾 PetDining PetForm
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            私隱政策及資料收集聲明
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="h-[500px] w-full overflow-y-auto rounded-md border p-6 bg-muted/30">
              <div className="space-y-6 text-sm leading-relaxed">
                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">📋 資料收集</h3>
                  <p className="mb-2">我們收集以下個人資料：</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>姓名、電郵地址、聯絡電話</li>
                    <li>公司名稱、商業登記文件（如適用）</li>
                    <li>訂單及消費記錄</li>
                    <li>IP 位置、設備資訊</li>
                    <li>課程報名及出席記錄</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">🎯 資料用途</h3>
                  <p className="mb-2">我們使用您的資料作以下用途：</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>處理訂單及提供客戶服務</li>
                    <li>管理課程報名及發送課堂通知</li>
                    <li>發送優惠及產品資訊（如您同意接收）</li>
                    <li>遵守香港法例及監管要求</li>
                    <li>改進我們的服務及用戶體驗</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">🔒 資料保存</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>保存期：7 年（由最後一次交易或互動起計）</li>
                    <li>我們會採取適當的保安措施保護您的資料</li>
                    <li>不會向第三方出售或出租您的個人資料</li>
                    <li>仅在法律要求或必要時向服務供應商披露資料</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">👤 用戶權利</h3>
                  <p className="mb-2">根據《個人資料（私隱）條例》，您有權：</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>查閱我們持有的您的個人資料</li>
                    <li>要求修正不準確的個人資料</li>
                    <li>要求刪除您的個人資料（受法律限制）</li>
                    <li>隨時取消訂閱促銷資訊</li>
                    <li>撤回您的同意（但不影響撤回前的資料處理）</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">📞 聯絡方式</h3>
                  <p className="mb-2">如對私隱政策有任何查詢或投訴，請聯絡我們：</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>電郵：info@petdininghk.com</li>
                    <li>WhatsApp：9867 3497</li>
                    <li>辦公時間：星期一至五 9:00-18:00</li>
                  </ul>
                </section>

                <section className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    最後更新日期：2026 年 5 月 27 日
                  </p>
                </section>
              </div>
            </div>

            <div 
              className="flex items-center space-x-3 py-4 border-t cursor-pointer select-none"
              onClick={() => setAccepted(prev => !prev)}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${accepted ? 'bg-primary border-primary' : 'border-gray-400 bg-white'}`}>
                {accepted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-sm font-medium leading-none">
                我已閱讀並同意私隱政策及資料收集聲明
              </span>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleAccept}
              disabled={!accepted || isUpdating}
            >
              {isUpdating ? (
                '處理中...'
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  確認同意
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}