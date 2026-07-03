import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { slip_id } = await req.json();
    if (!slip_id) return Response.json({ error: 'slip_id required' }, { status: 400 });

    const slip = await base44.asServiceRole.entities.SlipUploads.get(slip_id);
    if (!slip) return Response.json({ error: 'Slip not found' }, { status: 404 });

    // Get signed URL if possible
    let slipLink = slip.slip_url;
    try {
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: slip.slip_url, expires_in: 86400 });
      if (signed?.signed_url) slipLink = signed.signed_url;
    } catch {}

    const emailBody = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1f2937;">
        <h2 style="color:#f97316;">📋 新 FPS 轉帳入數紙上傳通知</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;">客戶編號</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${slip.customer_id}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;">公司名稱</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${slip.company_name || '-'}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;">電郵</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${slip.user_email}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;">轉帳金額</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-weight:700;color:#f97316;">HK$${slip.amount ? slip.amount.toLocaleString() : '-'}</td>
          </tr>
        </table>
        <p>
          <a href="${slipLink}" style="display:inline-block;padding:10px 20px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
            查看入數紙截圖
          </a>
        </p>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px;">請前往管理後台審批此充值申請。</p>
      </div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'info@petdininghk.com',
      subject: `📋 新FPS充值申請 — ${slip.company_name || slip.customer_id} HK$${slip.amount || ''}`,
      body: emailBody,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('notifyFpsTopup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});