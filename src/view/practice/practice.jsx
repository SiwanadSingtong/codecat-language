'use client';
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import TranslateIcon from '@mui/icons-material/Translate';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

import { createClient } from '@/utils/supabase/client';

const translateLevel = (lvl) => {
  if (lvl === 'Beginner') return 'ระดับเริ่มต้น';
  if (lvl === 'Intermediate') return 'ระดับกลาง';
  if (lvl === 'Advanced') return 'ระดับสูง';
  return lvl;
};

export default function PracticeView() {
  const supabase = createClient();

  const [level, setLevel] = useState('Beginner');
  const [direction, setDirection] = useState('th-en'); // th-en, en-th, or random
  const [activeDirection, setActiveDirection] = useState('th-en'); // actual direction for the current word
  const [currentWord, setCurrentWord] = useState(null);
  const [translationInput, setTranslationInput] = useState('');
  const [loadingWord, setLoadingWord] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState(null); // { isCorrect, feedback, correctTranslation }
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Load user level
        supabase.from('profiles').select('level').eq('id', user.id).single().then(({ data }) => {
          if (data) setLevel(data.level || 'Beginner');
        });
      } else {
        setLevel(localStorage.getItem('guest-level') || 'Beginner');
      }
    });
  }, [supabase]);

  // Load a new word
  const loadNewWord = async () => {
    setLoadingWord(true);
    setTranslationInput('');
    setResult(null);
    setShowHint(false);
    
    // Choose actual direction randomly if "random" is selected
    const activeDir = direction === 'random'
      ? (Math.random() > 0.5 ? 'th-en' : 'en-th')
      : direction;
    setActiveDirection(activeDir);
    
    try {
      const response = await axios.post('/api/practice/word', { level, direction: activeDir });
      const data = response.data;
      if (data && data.word) {
        setCurrentWord(data);
      } else {
        throw new Error("Failed to load word");
      }
    } catch (error) {
      console.error("Error loading practice word:", error);
    } finally {
      setLoadingWord(false);
    }
  };

  // Load word automatically on mount/config change
  useEffect(() => {
    loadNewWord();
  }, [level, direction]);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!translationInput.trim() || checking || !currentWord) return;

    setChecking(true);
    setResult(null);

    try {
      const response = await axios.post('/api/practice/check', {
        word: currentWord.word,
        translation: translationInput.trim(),
        direction: activeDirection,
      });

      const data = response.data;
      setResult(data);

      // Save locally if guest
      if (!user && data) {
        const localVocab = localStorage.getItem('guest-vocabularies');
        let vocabList = localVocab ? JSON.parse(localVocab) : [];
        
        const existingIdx = vocabList.findIndex(v => v.word === currentWord.word);
        const correctTranslation = data.correctTranslation || (activeDirection === 'th-en' ? 'translation' : 'คำแปล');
        
        if (existingIdx > -1) {
          vocabList[existingIdx].correct_count += data.isCorrect ? 1 : 0;
          vocabList[existingIdx].translation = correctTranslation;
        } else {
          vocabList.push({
            id: crypto.randomUUID(),
            word: currentWord.word,
            translation: correctTranslation,
            source_lang: activeDirection === 'th-en' ? 'th' : 'en',
            correct_count: data.isCorrect ? 1 : 0,
            created_at: new Date().toISOString(),
          });
        }
        localStorage.setItem('guest-vocabularies', JSON.stringify(vocabList));
      }
    } catch (error) {
      console.error("Error checking translation:", error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 650, mx: 'auto', width: '100%', py: 2 }}>
      {/* Settings Grid */}
      <Card sx={{ borderRadius: 4, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            การตั้งค่าหมวดหมู่การฝึกฝน
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="direction-select-label">รูปแบบการแปล</InputLabel>
                <Select
                  labelId="direction-select-label"
                  value={direction}
                  label="รูปแบบการแปล"
                  onChange={(e) => setDirection(e.target.value)}
                  disabled={loadingWord}
                >
                  <MenuItem value="th-en">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TranslateIcon fontSize="small" color="primary" />
                      <Typography variant="body2">ภาษาไทย ➔ ภาษาอังกฤษ</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="en-th">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TranslateIcon fontSize="small" color="secondary" />
                      <Typography variant="body2">ภาษาอังกฤษ ➔ ภาษาไทย</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="random">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShuffleIcon fontSize="small" color="action" />
                      <Typography variant="body2">สุ่มรูปแบบการแปล (ไทย/อังกฤษ)</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="level-select-label">ระดับคำศัพท์</InputLabel>
                <Select
                  labelId="level-select-label"
                  value={level}
                  label="ระดับคำศัพท์"
                  onChange={(e) => setLevel(e.target.value)}
                  disabled={loadingWord}
                >
                  <MenuItem value="Beginner">ระดับเริ่มต้น (Beginner)</MenuItem>
                  <MenuItem value="Intermediate">ระดับกลาง (Intermediate)</MenuItem>
                  <MenuItem value="Advanced">ระดับสูง (Advanced)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Practice Card */}
      <Card sx={{ borderRadius: 4, position: 'relative', overflow: 'visible', mb: 3 }}>
        {/* Level Indicator Ribbon */}
        <Box sx={{
          position: 'absolute',
          top: 16,
          right: 16,
        }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
            ระดับ: {translateLevel(level)}
          </Typography>
        </Box>

        <CardContent sx={{ p: 4, mt: 1 }}>
          {loadingWord ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
              <CircularProgress color="primary" />
              <Typography variant="body2" color="text.secondary">
                ครู AI กำลังสุ่มและสร้างคำศัพท์...
              </Typography>
            </Box>
          ) : currentWord ? (
            <Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontSize: '0.9rem', fontWeight: 600 }}>
                กรุณาแปลคำศัพท์ / ประโยคนี้ (แปลเป็น{activeDirection === 'th-en' ? 'ภาษาอังกฤษ' : 'ภาษาไทย'}):
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
                <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: 'primary.main', wordBreak: 'break-word' }}>
                  {currentWord.word}
                </Typography>
                <Tooltip title="สุ่มคำใหม่ (ข้ามคำนี้)">
                  <IconButton 
                    onClick={loadNewWord} 
                    disabled={loadingWord || checking}
                    color="secondary"
                    sx={{ border: '1px solid', borderColor: 'divider' }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Hint Toggle */}
              {currentWord.hint && (
                <Box sx={{ mb: 3 }}>
                  <Button
                    startIcon={<LightbulbIcon />}
                    variant="text"
                    color="secondary"
                    onClick={() => setShowHint(!showHint)}
                    sx={{ p: 0, '&:hover': { background: 'none' } }}
                  >
                    {showHint ? 'ซ่อนคำใบ้' : 'แสดงคำใบ้'}
                  </Button>
                  {showHint && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic', pl: 1, borderLeft: '3px solid #06B6D4' }}>
                      คำใบ้: {currentWord.hint}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Translation Form */}
              <Box component="form" onSubmit={handleCheck} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label={activeDirection === 'th-en' ? 'พิมพ์คำแปลภาษาอังกฤษที่นี่' : 'ใส่คำแปลภาษาไทยที่นี่'}
                  variant="outlined"
                  value={translationInput}
                  onChange={(e) => setTranslationInput(e.target.value)}
                  disabled={checking || result}
                  required
                  autoComplete="off"
                />

                {!result ? (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={checking || !translationInput.trim()}
                    sx={{ py: 1.5, fontWeight: 600 }}
                  >
                    {checking ? 'กำลังให้ครู AI ตรวจคำตอบ...' : 'ส่งคำแปล'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={loadNewWord}
                    endIcon={<DoubleArrowIcon />}
                    sx={{ py: 1.5, fontWeight: 600 }}
                  >
                    สุ่มคำถัดไป
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            <Typography color="error">เกิดข้อผิดพลาดในการโหลดคำศัพท์ กรุณากดสุ่มคำศัพท์อีกครั้ง</Typography>
          )}
        </CardContent>
      </Card>

      {/* Checking Result Alert */}
      {result && (
        <Card sx={{
          borderRadius: 4,
          border: (theme) => `1px solid ${
            result.isCorrect 
              ? theme.palette.success.main 
              : theme.palette.error.main
          }`,
          bgcolor: (theme) => 
            theme.palette.mode === 'light' 
              ? result.isCorrect ? '#F0FDF4' : '#FEF2F2'
              : result.isCorrect ? 'rgba(21, 128, 61, 0.1)' : 'rgba(185, 28, 28, 0.1)'
        }}>
          <CardContent sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ mt: 0.5 }}>
              {result.isCorrect ? (
                <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
              ) : (
                <CancelIcon color="error" sx={{ fontSize: 32 }} />
              )}
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: result.isCorrect ? 'success.main' : 'error.main' }}>
                {result.isCorrect ? 'ถูกต้องแล้ว! เก่งมากครับ' : 'คำแปลยังไม่ถูกต้อง'}
              </Typography>
              
              <Typography variant="body2" color="text.primary" sx={{ mb: 1.5, fontWeight: 500 }}>
                {result.feedback}
              </Typography>

              {result.correctTranslation && (
                <Typography variant="body1" color="text.primary" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
                  คำแปลที่ถูกต้อง:{' '}
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: 'secondary.main',
                      bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(236, 72, 153, 0.08)' : 'rgba(236, 72, 153, 0.15)',
                      px: 2,
                      py: 0.5,
                      borderRadius: '8px',
                      border: '1px dashed',
                      borderColor: 'secondary.main',
                      display: 'inline-block',
                    }}
                  >
                    {result.correctTranslation}
                  </Typography>
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                <InfoIcon color="action" sx={{ fontSize: 18 }} />
                <Typography variant="caption" color="text.secondary">
                  {user ? 'คำศัพท์นี้ถูกบันทึกไว้ในสมุดคำศัพท์ส่วนตัวเรียบร้อยแล้ว' : 'บันทึกคำศัพท์ไว้ในสมุดคำศัพท์ของบุคคลทั่วไปชั่วคราว'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
