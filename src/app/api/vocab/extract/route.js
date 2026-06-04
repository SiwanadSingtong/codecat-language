import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

async function callDeepSeek(messages, systemInstruction) {
  const currentKey = process.env.DEEPSEEK_API_KEY;
  if (!currentKey) {
    throw new Error("DEEPSEEK_API_KEY is not defined");
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages
      ],
      temperature: 0.3,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (data?.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  throw new Error("Invalid response format from DeepSeek API");
}

export async function POST(request) {
  try {
    const { history } = await request.json();
    if (!history || !Array.isArray(history) || history.length === 0) {
      return NextResponse.json({ error: 'History is required' }, { status: 400 });
    }

    const conversationText = history
      .map(msg => `${msg.role === 'model' ? 'Teacher' : 'Student'}: ${msg.content}`)
      .join('\n');

    const systemInstruction = `
You are an expert English-Thai language teacher.
Analyze the provided conversation history between an English teacher and a student.
Extract 4 to 7 useful English vocabulary words (nouns, verbs, adjectives, adverbs) or very short 1-2 word collocations that were used in the conversation.
Provide their correct Thai translations.

CRITICAL RULES:
1. ONLY extract single words or very short 1-2 word terms/collocations (e.g., "chaotic", "trap", "video games", "favorite").
2. DO NOT extract long clauses, full sentences, or long phrases (e.g., DO NOT extract "working from home", "my favorite hero is Junkrat", "I like playing video games").
3. Return ONLY a valid JSON array of objects, with no markdown code fences, no backticks, no leading text, and no trailing text.

Each object must have exactly this structure:
{
  "word": "English word or phrase",
  "translation": "Thai translation",
  "source_lang": "en"
}
`;

    const messages = [
      { role: 'user', content: `Conversation to analyze:\n${conversationText}` }
    ];

    const responseText = await callDeepSeek(messages, systemInstruction);
    
    // Parse the extracted JSON array
    let cleanJSON = responseText.trim();
    if (cleanJSON.startsWith('```')) {
      cleanJSON = cleanJSON.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const vocabList = JSON.parse(cleanJSON);
    return NextResponse.json(vocabList);
  } catch (error) {
    console.error('Error in /api/vocab/extract:', error);
    return NextResponse.json({ error: 'Failed to extract vocabulary', details: error.message }, { status: 500 });
  }
}
