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

// Icons
import SchoolIcon from '@mui/icons-material/School';
import ForumIcon from '@mui/icons-material/Forum';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QuizIcon from '@mui/icons-material/Assignment';
import PetsIcon from '@mui/icons-material/Pets';

import { createClient } from '@/utils/supabase/client';

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
  const [level, setLevel] = useState('Beginner');
  const [vocabCount, setVocabCount] = useState(0);

  useEffect(() => {
    async function loadDashboardData(currentUser) {
      if (currentUser) {
        // Fetch level
        const { data: profile } = await supabase
          .from('profiles')
          .select('level')
          .eq('id', currentUser.id)
          .single();
        if (profile) setLevel(profile.level || 'Beginner');

        // Fetch vocab count
        const { count } = await supabase
          .from('vocabularies')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id);
        
        setVocabCount(count || 0);
      } else {
        // Load guest data
        const guestLevel = localStorage.getItem('guest-level') || 'Beginner';
        setLevel(guestLevel);

        const guestVocab = localStorage.getItem('guest-vocabularies');
        setVocabCount(guestVocab ? JSON.parse(guestVocab).length : 0);
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      loadDashboardData(user);
    });
  }, [supabase]);

  const features = [
    {
      title: 'คุยแชทฝึกภาษากับครู AI',
      desc: 'ฝึกฝนการสนทนาภาษาอังกฤษกับครู AI แบบเสมือนจริง พูดคุยได้ทุกเรื่องตามสไตล์คุณ โดยครู AI จะคอยตรวจแก้ไวยากรณ์ให้ถูกต้องโดยเฉพาะการใช้ is/am/are อย่างเป็นกันเอง',
      icon: <ForumIcon sx={{ fontSize: 32 }} />,
      color: '#4F46E5',
      path: '/chat',
    },
    {
      title: 'แบบฝึกหัดสุ่มแปลภาษา',
      desc: 'ทดสอบคลังคำศัพท์ในสมองของคุณ โดยครู AI จะสุ่มคำศัพท์ภาษาอังกฤษให้คุณแปลไทย หรือสุ่มคำศัพท์ไทยให้คุณแปลอังกฤษ และตรวจคำแปลให้อย่างยืดหยุ่นด้วยระบบ AI',
      icon: <FitnessCenterIcon sx={{ fontSize: 32 }} />,
      color: '#06B6D4',
      path: '/practice',
    },
    {
      title: 'สมุดคำศัพท์ส่วนตัว',
      desc: 'รวบรวมคำศัพท์ทั้งหมดที่คุณเคยผ่านการทดสอบแปลในหน้าแบบฝึกหัดมาบันทึกไว้ในสมุดคำศัพท์ และคุณสามารถสุ่มคำศัพท์เหล่านั้นกลับมาทบทวนทำแบบทดสอบย้อนหลังได้อีกด้วย',
      icon: <MenuBookIcon sx={{ fontSize: 32 }} />,
      color: '#10B981',
      path: '/vocab',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      {/* Hero Welcome Banner */}
      <Card sx={{
        borderRadius: 4,
        background: (theme) => theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)'
          : 'linear-gradient(135deg, #312E81 0%, #0891B2 100%)',
        color: '#FFFFFF',
        mb: 4,
        overflow: 'hidden',
        boxShadow: '0px 10px 30px rgba(79, 70, 229, 0.15)',
      }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '2.2rem', md: '3rem' }, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                ยินดีต้อนรับสู่ Catlingo! <PetsIcon sx={{ fontSize: { xs: '2.2rem', md: '3rem' } }} />
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, mb: 3, lineHeight: 1.5, fontSize: '1.1rem' }}>
                พื้นที่เรียนรู้ภาษาอังกฤษส่วนตัวของคุณด้วยพลัง AI ร่วมพูดคุยโต้ตอบ ทำแบบฝึกหัดคำศัพท์ และสร้างพจนานุกรมคำศัพท์เพื่ออัปเลเวลทักษะการสื่อสารของคุณให้เก่งขึ้นไปอีกขั้น!
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => router.push('/chat')}
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: 'primary.main',
                    fontWeight: 700,
                    px: 3,
                    py: 1.2,
                    '&:hover': { bgcolor: '#F1F5F9' },
                  }}
                >
                  เริ่มคุยกับครู AI
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/placement-test')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.7)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    px: 3,
                    py: 1.2,
                    '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  ทดสอบวัดระดับภาษา
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* User Stats Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" /> พัฒนาการของคุณ
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <QuizIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      ระดับภาษาอังกฤษปัจจุบัน
                    </Typography>
                    <Chip 
                      label={translateLevel(level)} 
                      color="primary" 
                      sx={{ fontWeight: 700, mt: 0.5, fontSize: '0.95rem' }} 
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 2.5, opacity: 0.1 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                    <MenuBookIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      คำศัพท์สะสมในสมุดศัพท์
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {vocabCount} คำ
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => router.push('/placement-test')}
                sx={{ mt: 4, fontWeight: 600, py: 1 }}
              >
                ทำแบบวัดระดับอีกครั้ง
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Navigation Cards */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3}>
            {features.map((feat) => (
              <Grid size={{ xs: 12 }} key={feat.title}>
                <Card sx={{
                  borderRadius: 4,
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: feat.color,
                  },
                  cursor: 'pointer',
                }}
                onClick={() => router.push(feat.path)}
                >
                  <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                    <Avatar sx={{ bgcolor: feat.color, color: '#FFFFFF', width: 56, height: 56 }}>
                      {feat.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {feat.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.4 }}>
                        {feat.desc}
                      </Typography>
                      <Button
                        color="primary"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ p: 0, fontWeight: 700, '&:hover': { background: 'none' } }}
                      >
                        เข้าใช้งานระบบ
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
