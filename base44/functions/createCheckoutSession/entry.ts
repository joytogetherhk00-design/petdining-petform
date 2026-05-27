import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, customer_id, success_url, cancel_url } = await req.json();

    if (!amount || amount < 1000) {
      return Response.json({ error: '最低充值金額為 HK$1,000' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'hkd',
      line_items: [
        {
          price_data: {
            currency: 'hkd',
            product_data: {
              name: 'PetDining Credits 充值',
              description: `充值 ${amount.toLocaleString()} Credits (HK$${amount.toLocaleString()})`,
            },
            unit_amount: amount * 100, // cents
          },
          quantity: 1,
        },
      ],
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        customer_id: customer_id,
        customer_email: user.email,
        credits_amount: String(amount),
      },
    });

    // Create a pending transaction record
    await base44.asServiceRole.entities.CreditTransaction.create({
      customer_id: customer_id,
      customer_email: user.email,
      amount: amount,
      type: 'topup',
      payment_amount: amount,
      stripe_session_id: session.id,
      status: 'pending',
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});