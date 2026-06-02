'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import TooltipMui from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import ForumIcon from '@mui/icons-material/Forum';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QuizIcon from '@mui/icons-material/Assignment';
import PetsIcon from '@mui/icons-material/Pets';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LoopIcon from '@mui/icons-material/Loop';
import StarIcon from '@mui/icons-material/Star';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import TimelineIcon from '@mui/icons-material/Timeline';
import PieChartIcon from '@mui/icons-material/PieChart';
import LinkIcon from '@mui/icons-material/Link';

import { createClient } from '@/utils/supabase/client';
import PageLoader from '@/components/PageLoader';
import axios from 'axios';

// Recharts components
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(30, 41, 59, 0.96)',
        border: '1px solid',
        borderColor: (theme) => theme.palette.mode === 'light' ? '#E2E8F0' : '#334155',
        borderRadius: '12px',
        p: 1.5,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
      }}>
        {label && (
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 1, color: (theme) => theme.palette.mode === 'light' ? '#1E293B' : '#F1F5F9', fontSize: '0.85rem' }}>
            {label}
          </Typography>
        )}
        {payload.map((item, idx) => {
          const isWord = item.name.includes('ศัพท์') || item.name.includes('ตัวอย่าง') || item.name.includes('Novice') || item.name.includes('Familiar') || item.name.includes('Mastered');
          return (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color || item.payload?.fill || '#4F46E5' }} />
              <Typography variant="caption" sx={{ color: (theme) => theme.palette.mode === 'light' ? '#64748B' : '#94A3B8', fontWeight: 600, fontSize: '0.75rem' }}>
                {item.name}:
              </Typography>
              <Typography variant="caption" sx={{ color: (theme) => theme.palette.mode === 'light' ? '#0F172A' : '#F8FAFC', fontWeight: 800, fontSize: '0.75rem' }}>
                {item.value} {isWord ? 'คำ' : 'ครั้ง'}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  }
  return null;
};

const translateLevel = (lvl) => {
  if (lvl === 'Beginner') return 'ระดับเริ่มต้น';
  if (lvl === 'Intermediate') return 'ระดับกลาง';
  if (lvl === 'Advanced') return 'ระดับสูง';
  return lvl;
};

export default function DashboardView() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [chartKey, setChartKey] = useState(0);

  // Statistics & Gamification States
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState('Beginner');
  const [vocabList, setVocabList] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);

  useEffect(() => {
    setMounted(true);

    async function loadDashboardData(currentUser) {
      try {
        if (currentUser) {
          // 1. Fetch user level & stats from our new API
          const statsRes = await axios.get('/api/user/stats').catch(err => {
            console.warn('Stats API failed (perhaps migrations not run yet):', err);
            return { data: null };
          });

          if (statsRes.data) {
            setXp(statsRes.data.xp || 0);
            setStreak(statsRes.data.streak || 0);
            setLevel(statsRes.data.level || 'Beginner');
            setActivityHistory(statsRes.data.activityHistory || []);
          } else {
            // Fallback to profile table if API fails
            const { data: profile } = await supabase
              .from('profiles')
              .select('level, xp, streak_count')
              .eq('id', currentUser.id)
              .single();
            if (profile) {
              setLevel(profile.level || 'Beginner');
              setXp(profile.xp || 0);
              setStreak(profile.streak_count || 0);
            }
          }

          // 2. Fetch vocabulary list
          const vocabRes = await axios.get('/api/vocab').catch(err => {
            console.error('Failed to fetch vocab list:', err);
            return { data: [] };
          });
          setVocabList(vocabRes.data || []);

        } else {
          // 3. Load guest data from localStorage
          const guestLevel = localStorage.getItem('guest-level') || 'Beginner';
          setLevel(guestLevel);

          const guestVocab = localStorage.getItem('guest-vocabularies');
          const vocabs = guestVocab ? JSON.parse(guestVocab) : [];
          setVocabList(vocabs);

          const guestStatsStr = localStorage.getItem('guest-stats');
          const guestStats = guestStatsStr ? JSON.parse(guestStatsStr) : { xp: 0, streak_count: 0 };
          setXp(guestStats.xp || 0);
          setStreak(guestStats.streak_count || 0);

          const guestHistoryStr = localStorage.getItem('guest-activity-history');
          const guestHistory = guestHistoryStr ? JSON.parse(guestHistoryStr) : {};
          
          // Format guest activity history for chart
          const formattedHistory = Object.keys(guestHistory).map(date => ({
            activity_date: date,
            practices: guestHistory[date].practices || 0,
            reviews: guestHistory[date].reviews || 0
          })).sort((a, b) => a.activity_date.localeCompare(b.activity_date));
          setActivityHistory(formattedHistory);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    }

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      loadDashboardData(currentUser).finally(() => setInitializing(false));
    });
  }, [supabase]);

  // Force chart layout redraw after mounting to trigger entrance animations correctly
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        setChartKey(1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  if (initializing) {
    return <PageLoader message="กำลังประมวลผลความคืบหน้า..." />;
  }

  // XP calculations for Level system
  const xpPerLevel = 100;
  const userLevel = Math.floor(xp / xpPerLevel) + 1;
  const xpInCurrentLevel = xp % xpPerLevel;
  const xpProgressPercent = (xpInCurrentLevel / xpPerLevel) * 100;

  // Process 7-day activity data for the AreaChart
  const getChartData = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates.map(dateStr => {
      const record = activityHistory.find(h => h.activity_date.startsWith(dateStr));
      const displayDate = new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      return {
        name: displayDate,
        'ฝึกสุ่มคำศัพท์': record ? record.practices : 0,
        'ทบทวนศัพท์': record ? record.reviews : 0,
      };
    });
  };

  const chartData = getChartData();

  // Process Vocabulary Mastery data for PieChart
  const hasVocab = vocabList.length > 0;
  const getPieData = () => {
    if (!hasVocab) {
      // Mock data for initial empty view to show animated PieChart with watermark
      return [
        { name: 'คำศัพท์ใหม่ (ตัวอย่าง)', value: 4, color: '#94A3B8' },
        { name: 'เริ่มคุ้นเคย (ตัวอย่าง)', value: 3, color: '#3B82F6' },
        { name: 'จดจำแม่นยำ (ตัวอย่าง)', value: 3, color: '#10B981' }
      ];
    }

    let novice = 0;    // 0 correct reviews
    let familiar = 0;  // 1-2 correct reviews
    let mastered = 0;  // 3+ correct reviews

    vocabList.forEach(v => {
      const count = v.correct_count || 0;
      if (count === 0) novice++;
      else if (count <= 2) familiar++;
      else mastered++;
    });

    return [
      { name: 'คำศัพท์ใหม่ (Novice)', value: novice, color: '#94A3B8' },
      { name: 'เริ่มคุ้นเคย (Familiar)', value: familiar, color: '#3B82F6' },
      { name: 'จดจำแม่นยำ (Mastered)', value: mastered, color: '#10B981' }
    ].filter(item => item.value > 0);
  };

  const pieData = getPieData();

  // Calculate stats summaries
  const totalReviewsCount = vocabList.reduce((sum, item) => sum + (item.correct_count || 0), 0);
  const accuracyPercent = vocabList.length > 0 
    ? Math.round((vocabList.filter(v => v.correct_count > 0).length / vocabList.length) * 100)
    : 0;

  // AI recommendations based on level
  const getAIRecommendations = () => {
    if (level === 'Beginner') {
      return {
        title: 'เป้าหมายแนะนำสำหรับระดับเริ่มต้น (Beginner)',
        tips: [
          'ลองฝึกพิมพ์สนทนากับครู AI สัก 5-10 ประโยคต่อวัน เน้นการทักทายและการตอบคำถามง่ายๆ',
          'ฝึกทำแบบทดสอบสุ่มแปลศัพท์อย่างน้อย 5 คำ เพื่อบันทึกคำศัพท์ใหม่ลงสมุด',
          'ทบทวนสมุดคำศัพท์บ่อยๆ อัลกอริทึมจะช่วยทบทวนคำศัพท์ที่ตอบผิดก่อนโดยอัตโนมัติ'
        ]
      };
    } else if (level === 'Intermediate') {
      return {
        title: 'เป้าหมายแนะนำสำหรับระดับกลาง (Intermediate)',
        tips: [
          'ท้าทายครู AI ในแชทด้วยการตอบประโยคที่ซับซ้อนขึ้น หรือชวนคุยในหัวข้อวิชาการ การท่องเที่ยว',
          'เปลี่ยนโหมดฝึกสุ่มคำศัพท์เป็นแปลอังกฤษเป็นไทยสลับกันเพื่อเพิ่มความคล่องตัว',
          'ตั้งเป้าหมายสะสมคะแนน XP ให้ได้วันละ 50 XP (เทียบเท่าทำแบบฝึกหัด/ทบทวน 5-10 ครั้ง)'
        ]
      };
    } else {
      return {
        title: 'เป้าหมายแนะนำสำหรับระดับสูง (Advanced)',
        tips: [
          'จำลองการสัมภาษณ์งานภาษาอังกฤษกับครู AI เพื่อรับคำวิจารณ์ด้านสำนวนและแกรมมาร์เชิงลึก',
          'ตั้งค่าสุ่มคำศัพท์ระดับสูงเพื่อเรียนรู้ศัพท์เฉพาะทางหรือสำนวนแสลงที่เป็นประโยชน์',
          'รักษาพลังแมวไฟ (Fire Cat Streak) ให้ต่อเนื่อง เพื่อขึ้นแท่นผู้เชี่ยวชาญภาษาอังกฤษระดับสูง'
        ]
      };
    }
  };

  const aiTips = getAIRecommendations();

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      {/* 🚀 Welcome & Level Progression Hero Panel */}
      <Card sx={{
        borderRadius: 5,
        background: (theme) => theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)'
          : 'linear-gradient(135deg, #312E81 0%, #0891B2 100%)',
        color: '#FFFFFF',
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0px 12px 30px rgba(79, 70, 229, 0.2)',
      }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, fontSize: { xs: '2rem', md: '2.8rem' }, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                ยินดีต้อนรับสู่ Catlingo! <PetsIcon sx={{ fontSize: '2.5rem', animation: 'wiggle 2s infinite' }} />
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 400, mb: 3, fontSize: '1.05rem', lineHeight: 1.6 }}>
                พื้นที่อัปเกรดทักษะภาษาอังกฤษของคุณให้เก่งขึ้นด้วยพลังครู AI! ทำแบบฝึกหัดแชท ฝึกแปลคำศัพท์ และดูสถิติการเรียนรู้ของคุณในหน้านี้
              </Typography>
              
              {/* Level Progress Bar inside Hero */}
              <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)', p: 2.5, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEventsIcon fontSize="small" sx={{ color: '#FBBF24' }} /> ระดับความก้าวหน้าการเรียน: เลเวล {userLevel}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {xpInCurrentLevel} / {xpPerLevel} XP
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={xpProgressPercent} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)',
                    }
                  }} 
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8, fontSize: '0.8rem' }}>
                  สะสมอีก {xpPerLevel - xpInCurrentLevel} XP เพื่อเลเวลอัป! (ฝึกแปลศัพท์ได้คำละ +10 XP, ทบทวนศัพท์ได้ +15 XP)
                </Typography>
              </Box>
            </Grid>

            {/* Fire Cat (แมวไฟ) Streak Widget (Restored Emoji Theme) */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                p: 3,
                borderRadius: 4,
                background: (theme) => theme.palette.mode === 'light' 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden',
                color: 'text.primary',
                backdropFilter: 'blur(20px)'
              }}>
                {/* Fire Cat Flame Background decoration */}
                <img 
                  src="/cat_streak.png" 
                  alt="" 
                  style={{ 
                    position: 'absolute',
                    right: -20,
                    bottom: -20,
                    width: 130,
                    height: 130,
                    opacity: 0.08,
                    transform: 'rotate(-10deg)',
                    pointerEvents: 'none'
                  }} 
                />

                {/* Animated Cat Avatar */}
                <Box sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(234, 88, 12, 0.5)',
                  position: 'relative',
                  animation: 'firePulse 2.5s infinite ease-in-out',
                  '@keyframes firePulse': {
                    '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(234, 88, 12, 0.6)' },
                    '70%': { transform: 'scale(1.08)', boxShadow: '0 0 0 12px rgba(234, 88, 12, 0)' },
                    '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(234, 88, 12, 0)' }
                  }
                }}>
                  {/* Cat face image instead of emoji */}
                  <img 
                    src="/cat_streak.png" 
                    alt="Fire Cat Streak" 
                    style={{ 
                      width: '90%', 
                      height: '90%', 
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))'
                    }} 
                  />
                  
                  {/* Fire badge indicator */}
                  <Box sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    animation: 'bounceFlame 1s infinite alternate',
                    '@keyframes bounceFlame': {
                      '0%': { transform: 'translateY(0) scale(1)' },
                      '100%': { transform: 'translateY(-5px) scale(1.15)' }
                    }
                  }}>
                    🔥
                  </Box>
                </Box>

                <Box sx={{ flexGrow: 1, zIndex: 1 }}>
                  <Typography variant="caption" sx={{ color: '#EA580C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    🔥 พลังแมวไฟนำทาง (FIRE CAT STREAK)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {streak} วันต่อเนื่อง! 🔥
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
                    {streak > 0 
                      ? 'เจ้าแมวไฟมีพลังเต็มเปี่ยม! เรียนรู้ต่อเพื่อรักษาพลังไฟ' 
                      : 'เจ้าแมวไฟกำลังหลับอยู่... มาฝึกฝนเพื่อจุดไฟวันนี้กันเลย!'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 📊 Key Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 4, display: 'flex', alignItems: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52, mr: 2 }}>
              <MenuBookIcon sx={{ fontSize: 26 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                คำศัพท์ที่บันทึกสะสม
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {vocabList.length} คำ
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 4, display: 'flex', alignItems: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 52, height: 52, mr: 2 }}>
              <LoopIcon sx={{ fontSize: 26 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                จำนวนครั้งที่ทบทวนศัพท์สำเร็จ
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {totalReviewsCount} ครั้ง
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 4, display: 'flex', alignItems: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 52, height: 52, mr: 2 }}>
              <StarIcon sx={{ fontSize: 26 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                ระดับการทดสอบภาษา
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main' }}>
                {translateLevel(level)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 4, display: 'flex', alignItems: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.main', width: 52, height: 52, mr: 2 }}>
              <SchoolIcon sx={{ fontSize: 26 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                อัตราการจำคำศัพท์ได้
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {accuracyPercent}%
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 📈 Charts Section (Recharts) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* AreaChart: Daily Activity */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon color="primary" /> สถิติการฝึกฝนและทบทวนศัพท์ย้อนหลัง 7 วัน
              </Typography>
              
              {mounted ? (
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      key={`area-${chartKey}`}
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorPractice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorReview" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tickLine={false} style={{ fontSize: '0.8rem', fill: '#64748B' }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} style={{ fontSize: '0.8rem', fill: '#64748B' }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.9rem' }} />
                      <Area
                        type="monotone"
                        dataKey="ฝึกสุ่มคำศัพท์"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPractice)"
                        activeDot={{ r: 6 }}
                        animationDuration={1000}
                        isAnimationActive={true}
                      />
                      <Area
                        type="monotone"
                        dataKey="ทบทวนศัพท์"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorReview)"
                        activeDot={{ r: 6 }}
                        animationDuration={1000}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={40} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* PieChart: Vocabulary Mastery */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PieChartIcon color="secondary" /> ระดับความแม่นยำคำศัพท์
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {!hasVocab 
                  ? 'ตัวอย่างสถิติ (สะสมคำศัพท์ในแบบฝึกหัดเพื่อดูสถิติจริง)' 
                  : 'จำแนกตามจำนวนการตอบทบทวนคำศัพท์ได้ถูกต้อง'}
              </Typography>

              {mounted ? (
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ width: '100%', height: 210 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart key={`pie-${chartKey}`}>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          cornerRadius={8}
                          stroke="none"
                          dataKey="value"
                          isAnimationActive={true}
                          animationDuration={1000}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  {/* Legend representation */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', mt: 1 }}>
                    {pieData.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          {hasVocab ? `${item.value} คำ (${Math.round((item.value / vocabList.length) * 100)}%)` : `${item.value} คำ`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={30} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 💡 AI Coach Tips Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LightbulbIcon sx={{ color: 'amber.main' }} /> {aiTips.title}
              </Typography>
              <Divider sx={{ mb: 2.5 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {aiTips.tips.map((tip, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.08)', color: 'primary.main', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>
                      {idx + 1}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mt: 0.5 }}>
                      {tip}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 🔗 Quick Access Menu */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon color="primary" /> ลัดเข้าเมนูการเรียนรู้
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => router.push('/chat')}
                    startIcon={<ForumIcon />}
                    sx={{ p: 2, justifyContent: 'flex-start', borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                  >
                    แชทฝึกภาษาอังกฤษกับ AI
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => router.push('/practice')}
                    startIcon={<FitnessCenterIcon />}
                    sx={{ p: 2, justifyContent: 'flex-start', borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                  >
                    ฝึกแปลสุ่มคำศัพท์
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => router.push('/vocab')}
                    startIcon={<MenuBookIcon />}
                    sx={{ p: 2, justifyContent: 'flex-start', borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                  >
                    ดูสมุดคำศัพท์ส่วนตัว
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => router.push('/placement-test')}
                    startIcon={<QuizIcon />}
                    sx={{ p: 2, justifyContent: 'flex-start', borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                  >
                    ทดสอบวัดระดับเลเวล
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
