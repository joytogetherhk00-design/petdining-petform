import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background p-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Link to="/apply">
          <Button variant="outline" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回申請頁面
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">私隱條款</CardTitle>
            <p className="text-sm text-muted-foreground">最後更新日期：2026 年 5 月 27 日</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            
            <section>
              <h2 className="font-semibold text-base mb-2">1. 資料控制者</h2>
              <p>PetDining PetForm / Golden Flame International Limited</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">2. 收集的個人資料</h2>
              <p>我們可能收集以下類型的個人資料：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>姓名及聯絡人姓名</li>
                <li>公司名稱及商業登記資料</li>
                <li>聯絡電話及電郵地址</li>
                <li>送貨地址及分店地址</li>
                <li>商業登記文件 (BR)</li>
                <li>訂單記錄及交易資料</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">3. 收集資料的目的</h2>
              <p>我們收集您的個人資料用於以下用途：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>處理您的批發帳戶申請</li>
                <li>提供客戶服務及支援</li>
                <li>處理訂單及送貨安排</li>
                <li>發送產品資訊及優惠通知（如經您同意）</li>
                <li>遵守香港法例及稅務要求</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">4. 資料保存</h2>
              <p>根據香港法例要求，您的個人資料及交易記錄將保存 <strong>7 年</strong>。保存期屆滿後，我們將安全地刪除或銷毀相關資料。</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">5. 您的權利</h2>
              <p>根據《個人資料（私隱）條例》，您有權：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>查閱我們持有的您的個人資料</li>
                <li>要求修正不準確的資料</li>
                <li>要求刪除不再需要的資料（法律另有規定除外）</li>
                <li>撤回對直接促銷的同意</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">6. 資料保安</h2>
              <p>我們採取適當的技術和管理措施，保護您的個人資料免受未經授權的訪問、使用、披露或破壞。</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">7. 聯絡查詢</h2>
              <p>如對本私隱條款有任何疑問，或希望行使您的個人資料權利，請聯絡我們：</p>
              <ul className="mt-2 space-y-1">
                <li>電郵：<a href="mailto:info@petdininghk.com" className="text-primary underline">info@petdininghk.com</a></li>
                <li>WhatsApp：<a href="https://wa.me/85298673497" className="text-primary underline">9867 3497</a></li>
              </ul>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}