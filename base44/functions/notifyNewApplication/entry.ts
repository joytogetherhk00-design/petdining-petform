import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_name, contact, email, phone } = await req.json();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'info@petdininghk.com',
      subject: `新帳戶申請 - ${company_name || '未知公司'}`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1f2937;">
          <div style="background:#f97316;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">📋 新帳戶申請通知</h1>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
            <p>有新用戶申請開戶，請登入後台審批：</p>
            <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>公司名稱：</strong>${company_name || '-'}</p>
              <p style="margin:4px 0;"><strong>聯絡人：</strong>${contact || '-'}</p>
              <p style="margin:4px 0;"><strong>電郵：</strong>${email || '-'}</p>
              <p style="margin:4px 0;"><strong>電話：</strong>${phone || '-'}</p>
            </div>
            <a href="https://www.petdining.biz/admin/applications" style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">前往後台審批</a>
          </div>
        </div>
      `,
      from_name: 'PetDining PetForm System',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('notifyNewApplication error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});