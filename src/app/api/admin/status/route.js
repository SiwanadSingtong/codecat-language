import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

import { usageStats, logGeminiRequest } from '@/utils/gemini';

export { usageStats };

async function isAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return user.email === adminEmail;
}

async function pingDeepSeekAPI() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    return {
      status: 'not_configured',
      message: 'DEEPSEEK_API_KEY ยังไม่ได้ตั้งค่าในระบบ',
      latencyMs: null,
    };
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'ping' }
        ],
        max_tokens: 5,
        stream: false
      })
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      const status = response.status;
      const msg = `DeepSeek API error: ${status} - ${errorText}`;
      logGeminiRequest(false, new Error(msg));

      if (status === 429 || errorText.toLowerCase().includes('quota') || errorText.toLowerCase().includes('rate limit')) {
        return {
          status: 'quota_exceeded',
          message: 'Rate Limit / Quota หมดชั่วคราว (429)',
          latencyMs,
          error: errorText,
        };
      }
      if (status === 401 || errorText.toLowerCase().includes('invalid key') || errorText.toLowerCase().includes('invalid_key')) {
        return {
          status: 'invalid_key',
          message: 'API Key ไม่ถูกต้องหรือยังไม่ได้เปิดใช้งาน (401)',
          latencyMs,
          error: errorText,
        };
      }
      return {
        status: 'error',
        message: `เกิดข้อผิดพลาดจาก API: ${status}`,
        latencyMs,
        error: errorText,
      };
    }

    const data = await response.json();
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

    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย',
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
    pingResult = await pingDeepSeekAPI();
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const keyConfigured = !!(apiKey && apiKey !== 'your_deepseek_api_key_here');
  const maskedKey = keyConfigured
    ? `${apiKey.slice(0, 6)}${'*'.repeat(Math.max(0, apiKey.length - 10))}${apiKey.slice(-4)}`
    : null;

  return NextResponse.json({
    keyConfigured,
    maskedKey,
    model: 'deepseek-chat',
    ping: pingResult,
    usage: usageStats,
    serverTime: new Date().toISOString(),
  });
}
