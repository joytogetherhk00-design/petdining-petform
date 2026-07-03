import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id } = await req.json();
    if (!session_id) {
      return Response.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return Response.json({ success: false, status: session.payment_status || '' });
    }

    const customerId = session.metadata?.customer_id || '';
    const customerEmail = session.metadata?.customer_email || user.email || '';
    const creditsAmount = Number(session.metadata?.credits_amount || 0);

    if (!creditsAmount) {
      return Response.json({ error: 'Missing credits amount in metadata' }, { status: 400 });
    }

    // Idempotency check
    const existing = await base44.asServiceRole.entities.CreditTransaction.filter({
      stripe_session_id: session_id,
      status: 'completed',
    });
    if (existing.length > 0) {
      return Response.json({ success: true, already_processed: true, credits_amount: creditsAmount });
    }

    // Find customer by customer_id first, fallback to email
    let customer = null;
    if (customerId) {
      const customers = await base44.asServiceRole.entities.Customers.filter({ customer_id: customerId });
      if (customers.length > 0) customer = customers[0];
    }
    if (!customer && customerEmail) {
      const customers = await base44.asServiceRole.entities.Customers.filter({ user_email: customerEmail });
      if (customers.length > 0) customer = customers[0];
    }

    if (customer) {
      const newBalance = (customer.credits_balance || 0) + creditsAmount;
      await base44.asServiceRole.entities.Customers.update(customer.id, { credits_balance: newBalance });
    }

    // Update transaction status
    const transactions = await base44.asServiceRole.entities.CreditTransaction.filter({ stripe_session_id: session_id });
    if (transactions.length > 0) {
      await base44.asServiceRole.entities.CreditTransaction.update(transactions[0].id, { status: 'completed' });
    } else {
      // Create transaction if not exists (e.g. webhook didn't fire yet)
      await base44.asServiceRole.entities.CreditTransaction.create({
        customer_id: customer?.customer_id || customerId || '',
        customer_email: customerEmail,
        amount: creditsAmount,
        type: 'topup',
        payment_amount: creditsAmount,
        stripe_session_id: session_id,
        status: 'completed',
      });
    }

    return Response.json({ success: true, credits_amount: creditsAmount, new_balance: customer ? (customer.credits_balance || 0) + creditsAmount : null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});