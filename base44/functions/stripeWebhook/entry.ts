import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      return Response.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    if (event.type !== 'checkout.session.completed') {
      return Response.json({ received: true });
    }

    const session = event.data.object;
    if (session.payment_status !== 'paid') {
      return Response.json({ received: true });
    }

    const base44 = createClientFromRequest(req);
    const metadata = session.metadata || {};

    // 課程報名支付
    if (metadata.type === 'course_enrollment') {
      const enrollmentId = metadata.enrollmentId || '';

      if (!enrollmentId) {
        return Response.json({ error: 'Missing enrollmentId' }, { status: 400 });
      }

      const existingEnrollment = await base44.asServiceRole.entities.Enrollments.get(enrollmentId);
      if (!existingEnrollment) {
        return Response.json({ error: 'Enrollment not found' }, { status: 404 });
      }

      // Idempotency
      if (existingEnrollment.payment_status === 'paid') {
        return Response.json({ received: true, already_processed: true });
      }

      await base44.asServiceRole.entities.Enrollments.update(enrollmentId, {
        payment_status: 'paid',
        status: 'confirmed',
        stripe_session_id: session.id || '',
      });

      // enrolled_count is now calculated dynamically — no update needed

      // 課程時間表詳情
      let scheduleDetails = '';
      if (existingEnrollment.schedule_id) {
        const schedules = await base44.asServiceRole.entities.CourseSchedule.filter({ schedule_id: existingEnrollment.schedule_id });
        if (schedules.length > 0) {
          const schedule = schedules[0];
          const startDate = new Date(schedule.start_datetime || '').toLocaleString('zh-HK', { dateStyle: 'full', timeStyle: 'short' });
          const endDate = new Date(schedule.end_datetime || '').toLocaleString('zh-HK', { timeStyle: 'short' });
          scheduleDetails = `
            <div style="background:#eff6ff;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #3b82f6;">
              <p style="margin:4px 0;color:#1e40af;font-weight:600;">📅 課程時間及地點</p>
              <p style="margin:8px 0;"><strong>日期：</strong>${startDate}</p>
              <p style="margin:4px 0;"><strong>地點：</strong>${schedule.location || existingEnrollment.location || '待定'}</p>
            </div>
          `;
        }
      }

      // 確認郵件
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: existingEnrollment.user_email || '',
          subject: `✅ 課程報名已確認 - ${existingEnrollment.course_title || ''}`,
          body: `
<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1f2937;">
  <div style="background:#10b981;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">✅ 報名已確認</h1>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p>親愛的 <strong>${existingEnrollment.student_name || existingEnrollment.user_name || ''}</strong>，</p>
    <p>感謝您報名參加我們的課程！您的報名已獲確認。</p>
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:4px 0;"><strong>📚 課程名稱：</strong>${existingEnrollment.course_title || ''}</p>
      <p style="margin:4px 0;"><strong>🔖 報名編號：</strong>#${existingEnrollment.enrollment_id || existingEnrollment.id || ''}</p>
      <p style="margin:4px 0;"><strong>💰 支付狀態：</strong>✅ 已支付</p>
      ${existingEnrollment.amount_paid ? `<p style="margin:4px 0;"><strong>支付金額：</strong>HK$${(existingEnrollment.amount_paid || 0).toLocaleString()}</p>` : ''}
    </div>
    ${scheduleDetails}
    <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #f59e0b;">
      <p style="margin:0;color:#92400e;font-size:14px;"><strong>📌 溫馨提示：</strong><br>我們的團隊會在課程開始前 1-2 天透過 WhatsApp 或電郵與您聯絡。</p>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="font-size:13px;color:#6b7280;">如有查詢：WhatsApp <a href="https://wa.me/85298673497">9867 3497</a> | Email：info@petdininghk.com</p>
  </div>
</div>`,
          from_name: 'PetDining PetForm',
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      return Response.json({ received: true, enrollment_updated: enrollmentId, type: 'course_enrollment' });
    }

    // Credits 充值邏輯
    const customerId = metadata.customer_id || '';
    const creditsAmount = Number(metadata.credits_amount || 0);

    if (!customerId || !creditsAmount) {
      return Response.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // Idempotency
    const existing = await base44.asServiceRole.entities.CreditTransaction.filter({
      stripe_session_id: session.id,
      status: 'completed',
    });
    if (existing.length > 0) {
      return Response.json({ received: true, already_processed: true });
    }

    const customers = await base44.asServiceRole.entities.Customers.filter({ customer_id: customerId });
    if (!customers.length) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }
    const customer = customers[0];
    const newBalance = (customer.credits_balance || 0) + creditsAmount;

    await base44.asServiceRole.entities.Customers.update(customer.id, { credits_balance: newBalance });

    const transactions = await base44.asServiceRole.entities.CreditTransaction.filter({ stripe_session_id: session.id });
    if (transactions.length > 0) {
      await base44.asServiceRole.entities.CreditTransaction.update(transactions[0].id, { status: 'completed' });
    }

    return Response.json({ received: true, credits_added: creditsAmount, new_balance: newBalance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});