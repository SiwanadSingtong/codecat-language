import { NextResponse } from 'next/server';
import { generatePracticeWord } from '@/utils/gemini';

export async function POST(request) {
  try {
    const { level, direction, exclude } = await request.json();

    const data = await generatePracticeWord(level || 'Beginner', direction || 'th-en', exclude);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/practice/word route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
