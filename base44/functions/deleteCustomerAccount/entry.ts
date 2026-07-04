import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { customer_id } = await req.json();

    const customers = await base44.asServiceRole.entities.Customers.filter({ id: customer_id });
    if (!customers.length) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }
    const customer = customers[0];

    // Delete the Customer record
    await base44.asServiceRole.entities.Customers.delete(customer_id);

    // Find and delete the associated User record by email
    const userEmail = customer.email || customer.user_email;
    if (userEmail) {
      const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
      if (users.length > 0) {
        for (const u of users) {
          await base44.asServiceRole.entities.User.delete(u.id);
        }
      }
    }

    return Response.json({ success: true, deleted_user_email: userEmail });
  } catch (error) {
    console.error('deleteCustomerAccount error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});