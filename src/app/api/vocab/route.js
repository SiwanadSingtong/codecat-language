import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabase
      .from('vocabularies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/vocab:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing vocabulary id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('vocabularies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/vocab:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { word, translation, source_lang, isCorrect } = await request.json();

    if (!word || !translation || !source_lang) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if the word already exists for this user to avoid duplication
    const { data: existing } = await supabase
      .from('vocabularies')
      .select('id, correct_count')
      .eq('user_id', user.id)
      .eq('word', word)
      .single();

    if (existing) {
      // Update correct count if user got it right
      const newCount = isCorrect ? (existing.correct_count + 1) : existing.correct_count;
      await supabase
        .from('vocabularies')
        .update({ correct_count: newCount, translation })
        .eq('id', existing.id);
    } else {
      // Insert new vocabulary record
      await supabase.from('vocabularies').insert({
        user_id: user.id,
        word: word,
        translation: translation,
        source_lang: source_lang,
        correct_count: isCorrect ? 1 : 0,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/vocab:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
