import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId, courseId, courseTitle, amount } = await req.json();

    if (!enrollmentId || !courseId || !courseTitle || !amount) {
      return Response.json({ 
        error: 'Missing required fields: enrollmentId, courseId, courseTitle, amount' 
      }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // 創建 Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'hkd',
            product_data: {
              name: `課程報名：${courseTitle}`,
              description: 'PetForm 課程費用',
            },
            unit_amount: Math.round(amount * 100), // Stripe 使用最小單位（仙）
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/courses?payment=success`,
      cancel_url: `${req.headers.get('origin')}/courses?payment=cancelled`,
      metadata: {
        enrollmentId,
        courseId,
        userEmail: user.email,
        type: 'course_enrollment',
      },
    });

    return Response.json({ 
      url: session.url,
      sessionId: session.id 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});