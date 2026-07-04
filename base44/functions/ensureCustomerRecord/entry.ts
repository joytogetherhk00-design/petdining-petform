import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Admins don't need a customer record
    if (user.role === 'admin') {
      return Response.json({ customer: null, created: false });
    }

    // Check if user already has a Customer record
    const existing = await base44.asServiceRole.entities.Customers.filter({ user_email: user.email });
    if (existing.length > 0) {
      return Response.json({ customer: existing[0], created: false });
    }

    // Create a pending Customer record for the new user
    const customer = await base44.asServiceRole.entities.Customers.create({
      user_email: user.email,
      email: user.email,
      contact: user.full_name || user.email,
      company_name: user.full_name || '待填寫',
      delivery_address: '待填寫',
      branch_address: '待填寫',
      status: 'pending',
      credits_balance: 0,
      onboarding_completed: false,
    });

    return Response.json({ customer, created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});