import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

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

    // 檢查是否是課程報名支付
    if (metadata.type === 'course_enrollment') {
      const enrollmentId = metadata.enrollmentId;
      
      if (!enrollmentId) {
        return Response.json({ error: 'Missing enrollmentId' }, { status: 400 });
      }

      // Idempotency check
      const existingEnrollment = await base44.asServiceRole.entities.Enrollments.get(enrollmentId);
      if (!existingEnrollment) {
        return Response.json({ error: 'Enrollment not found' }, { status: 404 });
      }

      if (existingEnrollment.payment_status === 'paid') {
        return Response.json({ received: true, already_processed: true });
      }

      // 獲取報名記錄
      const enrollment = await base44.asServiceRole.entities.Enrollments.get(enrollmentId);
      
      // 更新報名記錄為已支付
      await base44.asServiceRole.entities.Enrollments.update(enrollmentId, {
        payment_status: 'paid',
        status: 'confirmed',
        stripe_session_id: session.id,
      });

      // 更新課程已報名人數
      if (enrollment?.course_id) {
        const course = await base44.asServiceRole.entities.Courses.get(enrollment.course_id);
        await base44.asServiceRole.entities.Courses.update(enrollment.course_id, {
          enrolled_count: (course.enrolled_count || 0) + 1
        });
      }

      // 發送確認郵件給用戶
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: enrollment.user_email,
          subject: `✅ 課程報名已確認 - ${enrollment.course_title}`,
          body: `
<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1f2937;">
  <div style="background:#10b981;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">✅ 報名已確認</h1>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p>親愛的 <strong>${enrollment.student_name || enrollment.user_name}</strong>，</p>
    <p>感謝您報名參加我們的課程！您的報名已獲確認。</p>
    
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:4px 0;"><strong>課程名稱：</strong>${enrollment.course_title}</p>
      <p style="margin:4px 0;"><strong>報名編號：</strong>#${enrollment.enrollment_id || enrollment.id}</p>
      <p style="margin:4px 0;"><strong>支付狀態：</strong>✅ 已支付</p>
      ${enrollment.payment_method === 'quota' ? '<p style="margin:4px 0;"><strong>支付方式：</strong>Quota（商業客戶名額）</p>' : ''}
      ${enrollment.amount_paid ? `<p style="margin:4px 0;"><strong>支付金額：</strong>HK$${enrollment.amount_paid.toLocaleString()}</p>` : ''}
    </div>

    <p>我們的團隊會在課程開始前與您聯絡，提供進一步詳情。</p>
    
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="font-size:13px;color:#6b7280;">如有查詢，請聯絡我們：<br>
    WhatsApp：<a href="https://wa.me/85298673497">9867 3497</a><br>
    Email：info@petdininghk.com</p>
  </div>
</div>
          `,
          from_name: 'PetDining PetForm',
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      return Response.json({ 
        received: true, 
        enrollment_updated: enrollmentId,
        type: 'course_enrollment'
      });
    }

    // 原有的 Credits 處理邏輯
    const customerId = metadata.customer_id;
    const creditsAmount = Number(metadata.credits_amount);

    if (!customerId || !creditsAmount) {
      return Response.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // Idempotency check
    const existing = await base44.asServiceRole.entities.CreditTransaction.filter({
      stripe_session_id: session.id,
      status: 'completed',
    });
    if (existing.length > 0) {
      return Response.json({ received: true, already_processed: true });
    }

    // Find customer and add credits
    const customers = await base44.asServiceRole.entities.Customers.filter({ customer_id: customerId });
    if (!customers.length) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }
    const customer = customers[0];
    const newBalance = (customer.credits_balance || 0) + creditsAmount;

    await base44.asServiceRole.entities.Customers.update(customer.id, {
      credits_balance: newBalance,
    });

    // Update transaction to completed
    const transactions = await base44.asServiceRole.entities.CreditTransaction.filter({
      stripe_session_id: session.id,
    });
    if (transactions.length > 0) {
      await base44.asServiceRole.entities.CreditTransaction.update(transactions[0].id, {
        status: 'completed',
      });
    }

    return Response.json({ received: true, credits_added: creditsAmount, new_balance: newBalance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});