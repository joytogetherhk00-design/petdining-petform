# PetForm 課程系統測試指南

## 測試頁面訪問

訪問測試頁面：`/test-enrollment`

## 測試流程

### 1. 測試數據已準備
- ✅ 3 個測試課程
- ✅ 2 個測試導師
- ✅ Stripe 支付已配置

### 2. 一般用戶報名流程測試

**步驟：**
1. 訪問 `/courses` 課程目錄
2. 選擇任意課程，點擊「立即報名」
3. 系統會創建報名記錄（狀態：pending）
4. 自動跳轉到 Stripe 支付頁面
5. 完成支付後，webhook 會自動更新報名狀態

**預期結果：**
- ✓ 報名記錄創建成功
- ✓ Stripe 支付頁面正常打開
- ✓ 支付完成後狀態變為 `paid` 和 `confirmed`

### 3. 商業客戶 Quota 報名測試

**前提：** 需要使用商業客戶賬戶（`user_type: business`）

**步驟：**
1. 使用商業客戶賬戶登入
2. 訪問 `/courses` 課程目錄
3. 選擇課程，點擊「立即報名」
4. 系統自動識別為 Quota 支付
5. 報名直接確認（無需支付）

**預期結果：**
- ✓ 報名記錄創建成功
- ✓ `payment_method: quota`
- ✓ `payment_status: paid`
- ✓ `status: confirmed`
- ✓ `amount_paid: 0`

### 4. Stripe 支付測試

**測試卡片：**
- 成功支付：`4242 4242 4242 4242`
- 任何未來日期
- 任何 CVC（例如：123）

**流程：**
1. 一般用戶報名課程
2. 跳轉到 Stripe Checkout
3. 使用測試卡片完成支付
4. Stripe webhook 觸發
5. 報名記錄更新為已支付

**Webhook 測試：**
```bash
# 本地測試 webhook
stripe listen --forward-to localhost:1444/functions/stripeWebhook
```

### 5. Admin 審批流程測試

**步驟：**
1. 使用 Admin 賬戶登入
2. 訪問 `/admin/enrollments` 報名管理
3. 查看待審批的報名記錄
4. 點擊「確認」或「取消」按鈕

**預期結果：**
- ✓ 可以看到所有報名記錄
- ✓ 可以審批待處理的報名
- ✓ 狀態更新成功

## 測試頁面功能

訪問 `/test-enrollment` 測試頁面，提供：

1. **用戶信息顯示** - 當前登入用戶詳情
2. **一鍵測試按鈕**：
   - 一般用戶報名測試
   - 商業客戶 Quota 測試
   - Admin 審批測試
3. **實時日誌** - 顯示測試過程
4. **課程列表** - 查看所有可用課程
5. **報名記錄** - 查看個人報名歷史

## 常見問題

### Q: Stripe 支付失敗？
A: 檢查 Stripe 密鑰是否正確設置：
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Q: Webhook 不工作？
A: 確保 webhook endpoint 已配置：
```
https://your-app.base44.app/functions/stripeWebhook
```

### Q: Quota 報名不工作？
A: 檢查用戶的 `user_type` 是否為 `business`

## 數據清理

測試後如需清理數據：
```javascript
// 在瀏覽器控制台執行
const enrollments = await base44.entities.Enrollments.list();
await Promise.all(enrollments.map(e => base44.entities.Enrollments.delete(e.id)));
``