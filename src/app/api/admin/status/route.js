import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { usageStats, logGeminiRequest } from '@/utils/gemini';

export { usageStats };

async function isAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return user.email === adminEmail;
}

async function pingGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      status: 'not_configured',
      message: 'GEMINI_API_KEY ยังไม่ได้ตั้งค่าในระบบ',
      latencyMs: null,
    };
  }

  const start = Date.now();
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    await model.generateContent('ping');
    const latencyMs = Date.now() - start;
    logGeminiRequest(true);
    return {
      status: 'ok',
      message: 'API ทำงานปกติ',
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const msg = error.message || '';
    logGeminiRequest(false, error);

    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
      return {
        status: 'quota_exceeded',
        message: 'Rate Limit / Quota หมดชั่วคราว (429)',
        latencyMs,
        error: msg,
      };
    }
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
      return {
        status: 'invalid_key',
        message: 'API Key ไม่ถูกต้องหรือยังไม่ได้เปิดใช้งาน',
        latencyMs,
        error: msg,
      };
    }
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ',
      latencyMs,
      error: msg,
    };
  }
}

export async function GET(request) {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const url = new URL(request.url);
  const ping = url.searchParams.get('ping') === 'true';

  let pingResult = null;
  if (ping) {
    pingResult = await pingGeminiAPI();
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const keyConfigured = !!(apiKey && apiKey !== 'your_gemini_api_key_here');
  const maskedKey = keyConfigured
    ? `${apiKey.slice(0, 6)}${'*'.repeat(Math.max(0, apiKey.length - 10))}${apiKey.slice(-4)}`
    : null;

  return NextResponse.json({
    keyConfigured,
    maskedKey,
    model: 'gemini-2.5-flash-lite',
    ping: pingResult,
    usage: usageStats,
    serverTime: new Date().toISOString(),
  });
}
