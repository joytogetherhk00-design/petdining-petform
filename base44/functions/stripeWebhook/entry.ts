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
          subject: `課程報名確認 - ${enrollment.course_title}`,
          body: `
尊敬的 ${enrollment.student_name || enrollment.user_name}，

感謝您報名參加我們的課程！

【課程資料】
課程名稱：${enrollment.course_title}
報名編號：#${enrollment.enrollment_id || enrollment.id}
支付金額：HK${enrollment.amount_paid?.toLocaleString()}

我們的團隊會盡快與您確認課程詳情。

如有任何疑問，請隨時聯絡我們。

PetDining PetForm 團隊
          `,
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