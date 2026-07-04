import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { customer_id, action } = await req.json();

    const customers = await base44.asServiceRole.entities.Customers.filter({ id: customer_id });
    if (!customers.length) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }
    const customer = customers[0];

    if (action === 'approve') {
      const wasNotActive = customer.status !== 'active';
      await base44.asServiceRole.entities.Customers.update(customer_id, {
        status: 'active',
        approved_date: new Date().toISOString().split('T')[0],
      });

      // Send email only when transitioning from non-active to active
      if (wasNotActive && customer.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: customer.email,
          subject: '🎉 PetDining PetForm 帳戶已獲批准',
          body: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1f2937;">
              <div style="background:#f97316;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:24px;">🎉 帳戶已獲批准！</h1>
              </div>
              <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                <p>親愛的 <strong>${customer.contact || customer.company_name || '客戶'}</strong>，</p>
                <p>您的 <strong>PetDining PetForm</strong> 帳戶已獲批准！您現在可以登入系統瀏覽產品目錄及落訂單。</p>
                <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
                  <p style="margin:4px 0;"><strong>帳戶編號：</strong>${customer.customer_id || '-'}</p>
                  <p style="margin:4px 0;"><strong>公司名稱：</strong>${customer.company_name || '-'}</p>
                  ${customer.temp_password ? `<p style="margin:8px 0 4px;border-top:1px solid #e5e7eb;padding-top:8px;"><strong>臨時登入密碼：</strong><span style="font-family:monospace;background:#fff3cd;padding:2px 6px;border-radius:4px;">${customer.temp_password}</span></p><p style="margin:4px 0;font-size:12px;color:#dc2626;">⚠️ 首次登入後請立即更改密碼</p>` : ''}
                </div>
                <a href="https://www.petdining.biz" style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:8px 0;">立即登入</a>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                <p style="font-size:13px;color:#6b7280;">如有查詢，請 WhatsApp：<a href="https://wa.me/85298673497">9867 3497</a> 或電郵：info@petdininghk.com</p>
              </div>
            </div>
          `,
          from_name: 'PetDining PetForm',
        });
      }

      return Response.json({ success: true, action: 'approved', email_sent: wasNotActive && !!customer.email });

    } else if (action === 'suspend') {
      await base44.asServiceRole.entities.Customers.update(customer_id, { status: 'suspended' });
      return Response.json({ success: true, action: 'suspended' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('notifyCustomerStatus error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});