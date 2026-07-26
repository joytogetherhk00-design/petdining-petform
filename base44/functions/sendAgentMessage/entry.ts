import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { message, conversation_id } = body;

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Authenticate the caller — only logged-in users may send messages
    let user;
    try {
      user = await base44.auth.me();
    } catch (_) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let conversation;
    if (conversation_id) {
      // Reuse existing conversation — enforce ownership via metadata
      conversation = await base44.asServiceRole.agents.getConversation(conversation_id);
      const owner = conversation?.metadata?.user_email || conversation?.metadata?.owner_email;
      if (!owner || owner !== user.email) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // Create new conversation, tag with the authenticated user's email
      conversation = await base44.asServiceRole.agents.createConversation({
        agent_name: 'petdining_cs',
        metadata: { source: 'website_chat', user_email: user.email }
      });
    }

    const response = await base44.asServiceRole.agents.addMessage(conversation, { 
      role: 'user', 
      content: message 
    });

    return Response.json({
      conversation_id: conversation.id,
      content: response?.content || '',
    });
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});