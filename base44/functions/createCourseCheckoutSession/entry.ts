import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId, courseId, courseTitle, amount, studentName, scheduleDate, scheduleEnd, location } = await req.json();

    if (!courseId || !courseTitle || !amount) {
      return Response.json({ error: 'Missing required fields: courseId, courseTitle, amount' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');

    // Validate origin against an allowlist of trusted application domains
    const ALLOWED_ORIGINS = [
      'https://petdiningpetform.com',
      'https://www.petdiningpetform.com',
      'https://petdining.biz',
      'https://www.petdining.biz',
      'https://petdininghk.com',
      'https://www.petdininghk.com',
    ];
    const requestOrigin = req.headers.get('origin') || '';
    const appOrigin = ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : (ALLOWED_ORIGINS[0] || 'https://petdiningpetform.com');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'hkd',
            product_data: {
              name: `課程報名：${courseTitle || ''}`,
              description: 'PetForm 課程費用',
            },
            unit_amount: Math.round((amount || 0) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appOrigin}/enrollment/success?enrollment_id=${enrollmentId || ''}`,
      cancel_url: `${appOrigin}/courses?payment=cancelled`,
      metadata: {
        enrollmentId: enrollmentId || '',
        courseId: courseId || '',
        userEmail: user.email || '',
        type: 'course_enrollment',
      },
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});