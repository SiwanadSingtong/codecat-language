import { NextResponse } from 'next/server';
import { checkPracticeTranslation } from '@/utils/gemini';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const { word, translation, direction, knownTranslation } = await request.json();

    if (!word || !translation || !direction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call Gemini to check the translation (pass knownTranslation as fallback answer)
    const result = await checkPracticeTranslation(word, translation, direction, knownTranslation || null);

    // Save to Supabase if authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Determine the source language
      const source_lang = direction === 'th-en' ? 'th' : 'en';

      // Insert word into vocabulary list. We save the correct translation returned by AI
      // as the target translation reference.
      const correctTranslation = result.correctTranslation || (direction === 'th-en' ? 'translation' : 'คำแปล');
      
      // Let's check if the word already exists for this user to avoid duplication
      const { data: existing } = await supabase
        .from('vocabularies')
        .select('id, correct_count')
        .eq('user_id', user.id)
        .eq('word', word)
        .single();

      if (existing) {
        // Update correct count if user got it right
        const newCount = result.isCorrect ? (existing.correct_count + 1) : existing.correct_count;
        await supabase
          .from('vocabularies')
          .update({ correct_count: newCount, translation: correctTranslation })
          .eq('id', existing.id);
      } else {
        await supabase.from('vocabularies').insert({
          user_id: user.id,
          word: word,
          translation: correctTranslation,
          source_lang: source_lang,
          correct_count: result.isCorrect ? 1 : 0,
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/practice/check route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
