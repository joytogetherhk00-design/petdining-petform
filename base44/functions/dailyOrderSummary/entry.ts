import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get yesterday's date range
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayStart.toISOString().slice(0, 10);

    // Fetch all orders from yesterday
    const allOrders = await base44.asServiceRole.entities.Orders.list('-order_date');
    const yesterdayOrders = allOrders.filter(o => {
      if (!o.order_date) return false;
      return o.order_date.slice(0, 10) === yesterdayStr;
    });

    if (yesterdayOrders.length === 0) {
      console.log(`No orders on ${yesterdayStr}, skipping email.`);
      return Response.json({ message: 'No orders to report', date: yesterdayStr });
    }

    // Fetch order items for each order
    const orderDetails = await Promise.all(
      yesterdayOrders.map(async (order) => {
        const items = await base44.asServiceRole.entities.OrderItems.filter({ order_id: order.id });
        return { order, items };
      })
    );

    const managerEmails = ['info@petdininghk.com'];

    // Build email HTML
    // Calculate total from OrderItems (Orders entity has no 'total' field)
    const allOrderTotals = orderDetails.map(({ items }) =>
      items.reduce((sum, item) => sum + (item.subtotal || item.price * item.qty || 0), 0)
    );
    const totalAmount = allOrderTotals.reduce((sum, t) => sum + t, 0);
    const statusLabels = { pending: '待處理', confirmed: '已確認', shipped: '已出貨', completed: '已完成' };

    let ordersHtml = orderDetails.map(({ order, items }) => {
      const itemRows = items.map(item =>
        `<tr>
          <td style="padding:4px 8px;border:1px solid #e5e7eb;">${item.product_name}</td>
          <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;">${item.qty}</td>
          <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;">HK$${item.price}</td>
          <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;">HK$${item.subtotal?.toLocaleString()}</td>
        </tr>`
      ).join('');

      return `
        <div style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <div style="background:#f97316;color:#fff;padding:10px 16px;font-weight:600;">
            訂單 ${order.order_number} &nbsp;|&nbsp; ${order.customer_id} &nbsp;|&nbsp; ${statusLabels[order.status] || order.status}
          </div>
          <div style="padding:12px 16px;">
            ${order.delivery_address ? `<p style="margin:0 0 8px;font-size:13px;color:#6b7280;">送貨地址：${order.delivery_address}</p>` : ''}
            ${order.notes ? `<p style="margin:0 0 8px;font-size:13px;color:#6b7280;">備註：${order.notes}</p>` : ''}
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:left;">產品</th>
                  <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;">數量</th>
                  <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;">單價</th>
                  <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;">小計</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <p style="text-align:right;font-weight:700;margin:8px 0 0;font-size:14px;">
              總計：HK$${items.reduce((sum, item) => sum + (item.subtotal || item.price * item.qty || 0), 0).toLocaleString()}
              ${order.credits_used ? ` &nbsp;(Credits: ${order.credits_used})` : ''}
            </p>
          </div>
        </div>`;
    }).join('');

    const emailBody = `
      <div style="font-family:sans-serif;max-width:700px;margin:auto;color:#1f2937;">
        <h2 style="color:#f97316;">每日訂單摘要 — ${yesterdayStr}</h2>
        <p>昨日共 <strong>${yesterdayOrders.length}</strong> 筆訂單，總金額 <strong>HK$${totalAmount.toLocaleString()}</strong>。</p>
        ${ordersHtml}
        <p style="font-size:12px;color:#9ca3af;margin-top:24px;">此為系統自動發送，請勿回覆。</p>
      </div>`;

    // Send to all recipients
    await Promise.all(
      managerEmails.map(email =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `每日訂單摘要 ${yesterdayStr} — ${yesterdayOrders.length} 筆訂單`,
          body: emailBody,
        })
      )
    );

    console.log(`Daily summary sent to ${managerEmails.join(', ')} for ${yesterdayOrders.length} orders on ${yesterdayStr}`);
    return Response.json({ success: true, date: yesterdayStr, orders: yesterdayOrders.length, recipients: managerEmails });

  } catch (error) {
    console.error('dailyOrderSummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});