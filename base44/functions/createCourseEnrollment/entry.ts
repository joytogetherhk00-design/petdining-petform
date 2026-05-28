import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cartItem } = await req.json();

    if (!cartItem || !cartItem.course_id || !cartItem.schedule_id) {
      return Response.json({ error: 'Missing required fields: cartItem, course_id, schedule_id' }, { status: 400 });
    }

    // 檢查課程是否還有名額 (enrolled_count calculated dynamically)
    const schedule = await base44.entities.CourseSchedule.get(cartItem.schedule_id);
    if (!schedule) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Count confirmed enrollments for this schedule
    const confirmedEnrollments = await base44.entities.Enrollments.filter({ schedule_id: cartItem.schedule_id, status: 'confirmed' });
    const enrolledCount = confirmedEnrollments.length;

    if (enrolledCount >= (schedule.max_students || 0)) {
      return Response.json({ error: '課程已額滿' }, { status: 400 });
    }

    // 商業客戶檢查 quota
    let paymentMethod = 'stripe';
    let amountPaid = cartItem.price || 0;

    if (user.user_type === 'business') {
      const customers = await base44.entities.Customers.filter({ user_email: user.email });
      if (customers.length > 0) {
        const customer = customers[0];
        if ((customer.quota_remaining || 0) > 0) {
          paymentMethod = 'quota';
          amountPaid = 0;
        }
      }
    }

    const enrollment = await base44.entities.Enrollments.create({
      enrollment_id: `ENR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      course_id: cartItem.course_id || '',
      course_title: cartItem.course_title || '',
      schedule_id: cartItem.schedule_id || '',
      schedule_date: cartItem.schedule_date || '',
      schedule_end: cartItem.schedule_end || '',
      location: cartItem.location || '',
      user_email: user.email || '',
      user_name: user.full_name || '',
      student_name: cartItem.student_name || '',
      student_gender: cartItem.student_gender || '',
      student_phone: cartItem.student_phone || '',
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'quota' ? 'paid' : 'pending',
      amount_paid: amountPaid,
      quota_used: paymentMethod === 'quota',
      status: paymentMethod === 'quota' ? 'confirmed' : 'pending',
      enrollment_date: new Date().toISOString(),
    });

    return Response.json({
      enrollmentId: enrollment.id,
      enrollment: enrollment,
      paymentMethod: paymentMethod,
      amount: amountPaid,
    });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});