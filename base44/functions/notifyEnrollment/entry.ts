import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { enrollmentId, notificationType } = await req.json();

    if (!enrollmentId) {
      return Response.json({ error: 'Missing enrollmentId' }, { status: 400 });
    }

    const enrollments = await base44.asServiceRole.entities.Enrollments.filter({ id: enrollmentId });
    if (!enrollments.length) {
      return Response.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const enrollment = enrollments[0];

    // 獲取課程詳情
    const courses = await base44.asServiceRole.entities.Courses.filter({ course_id: enrollment.course_id });
    const course = courses[0];

    // 獲取時間表詳情
    let scheduleDetails = '';
    if (enrollment.schedule_id) {
      const schedules = await base44.asServiceRole.entities.CourseSchedule.filter({ schedule_id: enrollment.schedule_id });
      if (schedules.length > 0) {
        const schedule = schedules[0];
        const startDate = new Date(schedule.start_datetime).toLocaleString('zh-HK', {
          dateStyle: 'full',
          timeStyle: 'short',
        });
        const endDate = new Date(schedule.end_datetime).toLocaleString('zh-HK', {
          timeStyle: 'short',
        });
        scheduleDetails = `
【課程時間】
${startDate} - ${endDate}
【上課地點】
${schedule.location || enrollment.location || '待定'}
        `.trim();
      }
    }

    if (notificationType === 'confirmation') {
      // 發送確認通知
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
      <p style="margin:4px 0;"><strong>支付狀態：</strong>${enrollment.payment_status === 'paid' ? '✅ 已支付' : '⏳ 待支付'}</p>
      ${enrollment.payment_method === 'quota' ? '<p style="margin:4px 0;"><strong>支付方式：</strong>Quota（商業客戶名額）</p>' : ''}
      ${enrollment.amount_paid ? `<p style="margin:4px 0;"><strong>支付金額：</strong>HK$${enrollment.amount_paid.toLocaleString()}</p>` : ''}
    </div>

    ${scheduleDetails ? `<div style="background:#eff6ff;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #3b82f6;">${scheduleDetails.replace(/\n/g, '<br>')}</div>` : ''}

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

      return Response.json({ success: true, message: '確認通知已發送' });

    } else if (notificationType === 'reminder') {
      // 發送提醒通知
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: enrollment.user_email,
        subject: `📅 課程提醒 - ${enrollment.course_title}`,
        body: `
<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1f2937;">
  <div style="background:#3b82f6;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">📅 課程提醒</h1>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p>親愛的 <strong>${enrollment.student_name || enrollment.user_name}</strong>，</p>
    <p>溫馨提醒，您已報名參加以下課程：</p>
    
    <div style="background:#eff6ff;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #3b82f6;">
      <p style="margin:4px 0;"><strong>課程名稱：</strong>${enrollment.course_title}</p>
      ${scheduleDetails ? `<div style="margin-top:12px;">${scheduleDetails.replace(/\n/g, '<br>')}</div>` : ''}
    </div>

    <p>請預留時間出席，我們期待見到您！</p>
    
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="font-size:13px;color:#6b7280;">如有查詢，請聯絡我們：<br>
    WhatsApp：<a href="https://wa.me/85298673497">9867 3497</a><br>
    Email：info@petdininghk.com</p>
  </div>
</div>
        `,
        from_name: 'PetDining PetForm',
      });

      return Response.json({ success: true, message: '提醒通知已發送' });

    } else if (notificationType === 'completion') {
      // 發送完成通知
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: enrollment.user_email,
        subject: `🎉 課程完成確認 - ${enrollment.course_title}`,
        body: `
<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1f2937;">
  <div style="background:#8b5cf6;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">🎉 恭喜完成課程！</h1>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p>親愛的 <strong>${enrollment.student_name || enrollment.user_name}</strong>，</p>
    <p>恭喜您已完成 <strong>${enrollment.course_title}</strong> 課程！</p>
    
    <div style="background:#f5f3ff;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:4px 0;"><strong>課程名稱：</strong>${enrollment.course_title}</p>
      <p style="margin:4px 0;"><strong>完成日期：</strong>${new Date().toLocaleDateString('zh-HK')}</p>
    </div>

    <p>感謝您的參與，期待在未來的課程中再見！</p>
    
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="font-size:13px;color:#6b7280;">如有查詢，請聯絡我們：<br>
    WhatsApp：<a href="https://wa.me/85298673497">9867 3497</a><br>
    Email：info@petdininghk.com</p>
  </div>
</div>
        `,
        from_name: 'PetDining PetForm',
      });

      return Response.json({ success: true, message: '完成通知已發送' });
    }

    return Response.json({ error: 'Invalid notification type' }, { status: 400 });

  } catch (error) {
    console.error('notifyEnrollment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});