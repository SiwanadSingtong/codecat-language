'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';

import { createClient } from '@/utils/supabase/client';

const QUESTIONS = [
  {
    id: 1,
    question: "He ___ a very talented English teacher.",
    options: ["am", "is", "are", "be"],
    correct: "is",
  },
  {
    id: 2,
    question: "I ___ studying grammar rules at the moment.",
    options: ["is", "am", "are", "be"],
    correct: "am",
  },
  {
    id: 3,
    question: "My classmates ___ helpful and friendly.",
    options: ["is", "am", "are", "be"],
    correct: "are",
  },
  {
    id: 4,
    question: "Sarah, along with her friends, ___ arriving soon.",
    options: ["is", "are", "am", "be"],
    correct: "is",
  },
  {
    id: 5,
    question: "They ___ excited about the upcoming lessons.",
    options: ["is", "am", "are", "be"],
    correct: "are",
  }
];

const translateLevel = (lvl) => {
  if (lvl === 'Beginner') return 'ระดับเริ่มต้น (Beginner)';
  if (lvl === 'Intermediate') return 'ระดับกลาง (Intermediate)';
  if (lvl === 'Advanced') return 'ระดับสูง (Advanced)';
  return lvl;
};

export default function PlacementTestView() {
  const router = useRouter();
  const supabase = createClient();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState({});
  const [testComplete, setTestComplete] = useState(false);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalLevel, setFinalLevel] = useState('Beginner');
  const [score, setScore] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase]);

  const handleOptionChange = (e) => {
    setSelectedAnswer(e.target.value);
  };

  const handleNext = () => {
    // Save current answer
    setAnswers({ ...answers, [currentIdx]: selectedAnswer });

    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedAnswer(answers[currentIdx + 1] || '');
    } else {
      // Calculate final score
      let correctCount = 0;
      QUESTIONS.forEach((q, idx) => {
        const userAns = idx === currentIdx ? selectedAnswer : answers[idx];
        if (userAns === q.correct) {
          correctCount++;
        }
      });

      // Determine level
      let level = 'Beginner';
      if (correctCount >= 3 && correctCount <= 4) {
        level = 'Intermediate';
      } else if (correctCount === 5) {
        level = 'Advanced';
      }

      setScore(correctCount);
      setFinalLevel(level);
      setTestComplete(true);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setSelectedAnswer(answers[currentIdx - 1] || '');
    }
  };

  const handleSaveResult = async () => {
    setSubmitting(true);
    if (user) {
      // Update in Supabase profiles
      const { error } = await supabase
        .from('profiles')
        .update({ level: finalLevel })
        .eq('id', user.id);
      
      if (error) {
        console.error("Error updating profile level:", error);
      }
    } else {
      // Save in LocalStorage for Guest
      localStorage.setItem('guest-level', finalLevel);
    }

    // Trigger local updates
    window.dispatchEvent(new Event('user-level-changed'));
    setSubmitting(false);
    router.push('/chat');
  };

  const activeQuestion = QUESTIONS[currentIdx];
  const progressPercent = ((currentIdx) / QUESTIONS.length) * 100;

  if (testComplete) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%', py: 4 }}>
        <Card sx={{ borderRadius: 4, textAlign: 'center', p: 4 }}>
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2, fontWeight: 800, color: 'primary.main' }}>
              ทดสอบเสร็จสิ้น! 🎉
            </Typography>
            <Typography variant="h5" sx={{ mb: 3 }}>
              คะแนนของคุณ: <strong>{score} / {QUESTIONS.length}</strong>
            </Typography>
            
            <Alert severity="info" sx={{ mb: 4, display: 'flex', justifyContent: 'center', fontSize: '1.1rem', borderRadius: '10px' }}>
              ระดับที่แนะนำสำหรับคุณ: <strong>{translateLevel(finalLevel)}</strong>
            </Alert>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              {finalLevel === 'Beginner' && "ไม่ต้องกังวล! เราจะเริ่มต้นฝึกฝนจากส่วนที่สำคัญที่สุด โดยครู AI จะช่วยสอนการใช้ 'is/am/are' และแก้ไขประโยคของคุณให้ถูกต้องอย่างเป็นกันเอง"}
              {finalLevel === 'Intermediate' && "เยี่ยมยอด! คุณมีพื้นฐานไวยากรณ์ที่ดีพอสมควร ครู AI จะช่วยขัดเกลาบทสนทนาของคุณให้ไหลลื่นเป็นธรรมชาติมากยิ่งขึ้น"}
              {finalLevel === 'Advanced' && "สุดยอดมาก! คุณมีความแม่นยำทางไวยากรณ์ในระดับที่สูงมาก คุณสามารถสนทนาภาษาอังกฤษกับครู AI ได้อย่างราบรื่นรวดเร็ว"}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={submitting}
              onClick={handleSaveResult}
              sx={{ py: 1.8, fontSize: '1.1rem', fontWeight: 600 }}
            >
              {submitting ? 'กำลังบันทึก...' : 'เริ่มเรียนรู้กับครู AI เลย'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%', py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            คำถามข้อที่ {currentIdx + 1} จาก {QUESTIONS.length}
          </Typography>
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
            ทำไปแล้ว {Math.round(progressPercent)}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 4 }} />
      </Box>

      <Card sx={{ borderRadius: 4, mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, lineHeight: 1.4 }}>
            {activeQuestion.question}
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup value={selectedAnswer} onChange={handleOptionChange}>
              <Grid container spacing={2}>
                {activeQuestion.options.map((opt) => (
                  <Grid size={{ xs: 12 }} key={opt}>
                    <Box
                      sx={{
                        border: (theme) => `2px solid ${
                          selectedAnswer === opt 
                            ? theme.palette.primary.main 
                            : theme.palette.mode === 'light' ? '#E2E8F0' : '#334155'
                        }`,
                        borderRadius: '12px',
                        px: 3,
                        py: 2,
                        cursor: 'pointer',
                        bgcolor: selectedAnswer === opt ? 'action.selected' : 'transparent',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: selectedAnswer === opt ? 'primary.main' : 'text.disabled',
                        },
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onClick={() => setSelectedAnswer(opt)}
                    >
                      <FormControlLabel
                        value={opt}
                        control={<Radio />}
                        label={opt}
                        sx={{ m: 0, width: '100%', '.MuiFormControlLabel-label': { fontSize: '1.05rem', fontWeight: 500, ml: 1 } }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleBack}
          disabled={currentIdx === 0}
          sx={{ px: 4, py: 1.2, fontWeight: 600 }}
        >
          ย้อนกลับ
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
          disabled={!selectedAnswer}
          sx={{ px: 4, py: 1.2, fontWeight: 600 }}
        >
          {currentIdx === QUESTIONS.length - 1 ? 'เสร็จสิ้น' : 'ถัดไป'}
        </Button>
      </Box>
    </Box>
  );
}
