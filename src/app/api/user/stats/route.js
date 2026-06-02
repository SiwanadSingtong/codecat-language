import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, message: 'Not authenticated' }, { status: 401 });
    }

    // 1. Fetch profile stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('xp, streak_count, last_active_date, level')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // If table is not upgraded yet, fall back gracefully to default stats
      console.warn('Could not fetch profiles stats (perhaps table schema not upgraded yet):', profileError);
    }

    const xp = profile?.xp || 0;
    const streak = profile?.streak_count || 0;
    const lastActive = profile?.last_active_date || null;
    const level = profile?.level || 'Beginner';

    // 2. Fetch last 7 days of activity logs
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateLimitStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('activity_date, practices, reviews')
      .eq('user_id', user.id)
      .gte('activity_date', dateLimitStr)
      .order('activity_date', { ascending: true });

    if (logsError) {
      console.warn('Could not fetch activity_logs (perhaps schema not upgraded yet):', logsError);
    }

    return NextResponse.json({
      authenticated: true,
      xp,
      streak,
      lastActive,
      level,
      activityHistory: logs || [],
    });
  } catch (error) {
    console.error('Error in GET /api/user/stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, message: 'Not authenticated' }, { status: 401 });
    }

    const { type } = await request.json(); // type: 'practice' | 'review'
    if (!type || (type !== 'practice' && type !== 'review')) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    // 1. Fetch current profile to calculate streak & XP
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, streak_count, last_active_date')
      .eq('id', user.id)
      .single();

    let currentXp = profile?.xp || 0;
    let currentStreak = profile?.streak_count || 0;
    let lastActiveDate = profile?.last_active_date || null;

    // XP calculation
    const xpIncrement = type === 'practice' ? 10 : 15;
    const newXp = currentXp + xpIncrement;

    // Date calculations in UTC-based ISO string split
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    let newStreak = currentStreak;
    if (!lastActiveDate) {
      // First activity ever
      newStreak = 1;
    } else if (lastActiveDate === todayStr) {
      // Already active today, streak remains unchanged
      newStreak = currentStreak;
    } else if (lastActiveDate === yesterdayStr) {
      // Active yesterday, increment streak
      newStreak = currentStreak + 1;
    } else {
      // Active earlier than yesterday, streak broken, reset to 1
      newStreak = 1;
    }

    // Update profile table
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        xp: newXp,
        streak_count: newStreak,
        last_active_date: todayStr,
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Failed to update user profile stats:', profileUpdateError);
    }

    // 2. Log activity in activity_logs table
    // Try to find if log exists for today
    const { data: existingLog } = await supabase
      .from('activity_logs')
      .select('id, practices, reviews')
      .eq('user_id', user.id)
      .eq('activity_date', todayStr)
      .single();

    if (existingLog) {
      // Update existing record
      const updateData = {};
      if (type === 'practice') {
        updateData.practices = (existingLog.practices || 0) + 1;
      } else {
        updateData.reviews = (existingLog.reviews || 0) + 1;
      }

      await supabase
        .from('activity_logs')
        .update(updateData)
        .eq('id', existingLog.id);
    } else {
      // Insert new record
      const insertData = {
        user_id: user.id,
        activity_date: todayStr,
        practices: type === 'practice' ? 1 : 0,
        reviews: type === 'review' ? 1 : 0,
      };

      await supabase
        .from('activity_logs')
        .insert(insertData);
    }

    return NextResponse.json({
      success: true,
      xp: newXp,
      streak: newStreak,
      lastActive: todayStr,
    });
  } catch (error) {
    console.error('Error in POST /api/user/stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
