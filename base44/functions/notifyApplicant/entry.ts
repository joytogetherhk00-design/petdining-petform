import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { application_id, action, rejection_reason, plan, region } = await req.json();

    const apps = await base44.asServiceRole.entities.Application.filter({ id: application_id });
    if (!apps.length) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }
    const app = apps[0];

    if (action === 'approve') {
      const customers = await base44.asServiceRole.entities.Customers.list();
      const regionCode = region || 'PDK';
      const existing = customers.filter(c => (c.customer_id || '').startsWith(regionCode));
      const customerId = `${regionCode}${String(1000 + existing.length + 1)}`;

      const planMap = {
        plan_a: { credits: 1000, name: '計劃 A' },
        plan_b: { credits: 1000, name: '計劃 B' },
        plan_c: { credits: 1500, name: '計劃 C' },
        plan_d: { credits: 1500, name: '計劃 D' },
      };
      const selectedPlan = planMap[plan] || planMap['plan_a'];

      await base44.asServiceRole.entities.Customers.create({
        customer_id: customerId,
        account_number: customerId,
        company_name: app.company_name || '',
        contact: app.contact || '',
        phone: app.phone || '',
        email: app.email || '',
        delivery_address: app.delivery_address || '',
        branch_address: app.branch_address || '',
        br_address: app.br_address || '',
        logo_url: app.logo_url || '',
        br_document_url: app.br_document_url || '',
        status: 'active',
        plan: plan || 'plan_a',
        monthly_credits: selectedPlan.credits,
        credits_balance: selectedPlan.credits,
        approved_date: new Date().toISOString().split('T')[0],
        user_email: app.email || '',
        onboarding_completed: false,
        quota_remaining: 0,
        monthly_quota: 0,
      });

      const now = new Date();
      await base44.asServiceRole.entities.CreditsLog.create({
        customer_id: customerId,
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        allocated: selectedPlan.credits,
        used: 0,
        remaining: selectedPlan.credits,
        type: 'allocation',
        status: 'active',
      });

      await base44.asServiceRole.entities.Application.update(app.id, {
        status: 'approved',
        customer_id: customerId,
        plan: plan || 'plan_a',
        region: regionCode,
      });

      const users = await base44.asServiceRole.entities.User.filter({ email: app.email });
      if (users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, {
          user_type: 'business',
          customer_id: customerId,
        });
      }

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: app.email || '',
        subject: '🎉 PetDining PetForm 帳戶申請已獲批准',
        body: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1f2937;">
            <div style="background:#f97316;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">🎉 申請已獲批准！</h1>
            </div>
            <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
              <p>親愛的 <strong>${app.contact || ''}</strong>，</p>
              <p>您的 <strong>PetDining PetForm</strong> 帳戶申請已獲批准！以下是您的帳戶詳情：</p>
              <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
                <p style="margin:4px 0;"><strong>帳戶編號：</strong>${customerId}</p>
                <p style="margin:4px 0;"><strong>計劃：</strong>${selectedPlan.name}</p>
                <p style="margin:4px 0;"><strong>每月 Credits：</strong>${(selectedPlan.credits || 0).toLocaleString()}</p>
              </div>
              <a href="https://www.petdining.biz" style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:8px 0;">立即登入</a>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="font-size:13px;color:#6b7280;">如有查詢，請 WhatsApp：<a href="https://wa.me/85298673497">9867 3497</a> 或電郵：info@petdininghk.com</p>
            </div>
          </div>
        `,
        from_name: 'PetDining PetForm',
      });

      return Response.json({ success: true, action: 'approved', customer_id: customerId });

    } else if (action === 'reject') {
      await base44.asServiceRole.entities.Application.update(app.id, {
        status: 'rejected',
        rejection_reason: rejection_reason || '',
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: app.email || '',
        subject: 'PetDining PetForm 帳戶申請結果',
        body: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1f2937;">
            <div style="background:#6b7280;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">帳戶申請未獲批准</h1>
            </div>
            <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
              <p>親愛的 <strong>${app.contact || ''}</strong>，</p>
              <p>感謝您申請 PetDining PetForm 帳戶。很遺憾，您的申請目前未能獲批。</p>
              ${rejection_reason ? `<div style="background:#fef2f2;border:1px solid #fca5a5;padding:12px 16px;border-radius:8px;margin:16px 0;"><strong>原因：</strong>${rejection_reason}</div>` : ''}
              <p>如有疑問，請聯絡我們：WhatsApp <a href="https://wa.me/85298673497">9867 3497</a> | Email：info@petdininghk.com</p>
            </div>
          </div>
        `,
        from_name: 'PetDining PetForm',
      });

      return Response.json({ success: true, action: 'rejected' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('notifyApplicant error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});