import { NextResponse } from 'next/server';
import { getTeacherResponse } from '@/utils/gemini';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const { history, level } = await request.json();

    if (!history || !Array.isArray(history) || history.length === 0) {
      return NextResponse.json({ error: 'History is required and must be a non-empty array' }, { status: 400 });
    }

    // Call Gemini utility
    const aiResponseText = await getTeacherResponse(history, level || 'Beginner');

    // Attempt to save to Supabase if authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const userMessage = history[history.length - 1];
      
      // Save user message
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content: userMessage.content,
      });

      // Save AI message
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'model',
        content: aiResponseText,
      });
    }

    return NextResponse.json({ response: aiResponseText });
  } catch (error) {
    console.error('Error in /api/chat route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
