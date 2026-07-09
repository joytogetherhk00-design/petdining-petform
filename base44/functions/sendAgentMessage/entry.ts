import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { message, conversation_id } = body;

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    let conversation;
    if (conversation_id) {
      // Reuse existing conversation
      conversation = await base44.asServiceRole.agents.getConversation(conversation_id);
    } else {
      // Create new conversation
      conversation = await base44.asServiceRole.agents.createConversation({ 
        agent_name: 'petdining_cs',
        metadata: { source: 'website_chat' }
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