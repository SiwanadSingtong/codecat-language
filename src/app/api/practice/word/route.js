import { NextResponse } from 'next/server';
import { generatePracticeWordsBatch } from '@/utils/gemini';

export async function POST(request) {
  try {
    const { level, direction, count } = await request.json();

    const data = await generatePracticeWordsBatch(level || 'Beginner', direction || 'th-en', count || 10);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/practice/word route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
