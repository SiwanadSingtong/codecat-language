'use client';
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import useSWR from 'swr';
import axios from 'axios';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import { createClient } from '@/utils/supabase/client';

// SWR Fetcher
const fetcher = url => axios.get(url).then(res => res.data);

export default function VocabularyView() {
  const supabase = createClient();

  const [vocabList, setVocabList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

  // Review Mode States
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewInput, setReviewInput] = useState('');
  const [checkingReview, setCheckingReview] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewFinished, setReviewFinished] = useState(false);

  // Fetch current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      if (!currentUser) {
        // Load guest vocab
        const localVocab = localStorage.getItem('guest-vocabularies');
        setVocabList(localVocab ? JSON.parse(localVocab) : []);
      }
    });
  }, [supabase]);

  // SWR for fetching vocabulary list if logged in
  const { data: dbVocab, error: fetchError, isLoading, mutate } = useSWR(
    user ? '/api/vocab' : null,
    fetcher
  );

  // Synchronize database results
  useEffect(() => {
    if (user && dbVocab) {
      setVocabList(dbVocab);
    }
  }, [dbVocab, user]);

  // Filtered List
  const filteredVocab = vocabList.filter(item => 
    item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Start Review Session
  const startReview = () => {
    if (vocabList.length === 0) return;
    
    const shuffled = [...vocabList].sort(() => 0.5 - Math.random());
    const queue = shuffled.slice(0, 5);
    
    setReviewQueue(queue);
    setReviewIdx(0);
    setReviewInput('');
    setReviewResult(null);
    setReviewScore(0);
    setReviewFinished(false);
    setReviewMode(true);
  };

  // Submit Review Answer
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewInput.trim() || checkingReview) return;

    setCheckingReview(true);
    const wordItem = reviewQueue[reviewIdx];
    const direction = wordItem.source_lang === 'th' ? 'th-en' : 'en-th';

    try {
      // Evaluate translation with AI using Axios
      const response = await axios.post('/api/practice/check', {
        word: wordItem.word,
        translation: reviewInput.trim(),
        direction,
      });

      const data = response.data;
      setReviewResult(data);

      if (data.isCorrect) {
        setReviewScore(prev => prev + 1);
        
        // Update correct count in local state
        setVocabList(prev => prev.map(v => 
          v.id === wordItem.id ? { ...v, correct_count: v.correct_count + 1 } : v
        ));
      }
    } catch (error) {
      console.error("Error checking review translation:", error);
    } finally {
      setCheckingReview(false);
    }
  };

  // Move to next review word
  const nextReview = () => {
    if (reviewIdx < reviewQueue.length - 1) {
      setReviewIdx(prev => prev + 1);
      setReviewInput('');
      setReviewResult(null);
    } else {
      setReviewFinished(true);
    }
  };

  // Exit review back to vocabulary list
  const exitReview = () => {
    setReviewMode(false);
    if (user) {
      mutate(); // Trigger SWR refresh
    } else {
      const localVocab = localStorage.getItem('guest-vocabularies');
      setVocabList(localVocab ? JSON.parse(localVocab) : []);
    }
  };

  if (isLoading && user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // --- REVIEW MODE UI ---
  if (reviewMode) {
    if (reviewFinished) {
      return (
        <Box sx={{ maxWidth: 550, mx: 'auto', width: '100%', py: 4 }}>
          <Card sx={{ borderRadius: 4, textAlign: 'center', p: 4 }}>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2, fontWeight: 800, color: 'secondary.main' }}>
                ทบทวนศัพท์เสร็จสิ้น! 🎓
              </Typography>
              <Typography variant="h5" sx={{ mb: 4 }}>
                คุณตอบถูกทั้งหมด <strong>{reviewScore} จาก {reviewQueue.length}</strong> คำ!
              </Typography>

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={exitReview}
                sx={{ py: 1.5, fontWeight: 600, borderRadius: '8px' }}
              >
                กลับไปที่สมุดคำศัพท์
              </Button>
            </CardContent>
          </Card>
        </Box>
      );
    }

    const currentReviewItem = reviewQueue[reviewIdx];
    const reviewDirection = currentReviewItem.source_lang === 'th' ? 'th-en' : 'en-th';
    const reviewPercent = (reviewIdx / reviewQueue.length) * 100;

    return (
      <Box sx={{ maxWidth: 550, mx: 'auto', width: '100%', py: 2 }}>
        {/* Progress Bar */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              ทบทวนคำที่ {reviewIdx + 1} จาก {reviewQueue.length}
            </Typography>
            <IconButton size="small" onClick={exitReview} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <LinearProgress variant="determinate" value={reviewPercent} color="secondary" sx={{ height: 6, borderRadius: 3 }} />
        </Box>

        {/* Practice Card */}
        <Card sx={{ borderRadius: 4, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
              {reviewDirection === 'th-en' ? 'แปลคำศัพท์ภาษาไทย ➔ ภาษาอังกฤษ' : 'แปลคำศัพท์ภาษาอังกฤษ ➔ ภาษาไทย'}
            </Typography>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: 'secondary.main', mb: 4 }}>
              {currentReviewItem.word}
            </Typography>

            <Box component="form" onSubmit={handleReviewSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label={reviewDirection === 'th-en' ? 'พิมพ์คำแปลภาษาอังกฤษที่นี่' : 'ใส่คำแปลภาษาไทยที่นี่'}
                variant="outlined"
                value={reviewInput}
                onChange={(e) => setReviewInput(e.target.value)}
                disabled={checkingReview || reviewResult}
                required
                autoComplete="off"
              />

              {!reviewResult ? (
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  size="large"
                  disabled={checkingReview || !reviewInput.trim()}
                  sx={{ py: 1.5, fontWeight: 600 }}
                >
                  {checkingReview ? 'กำลังตรวจสอบ...' : 'ตรวจสอบคำตอบ'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={nextReview}
                  endIcon={<ChevronRightIcon />}
                  sx={{ py: 1.5, fontWeight: 600 }}
                >
                  คำศัพท์ถัดไป
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Feedback Alert */}
        {reviewResult && (
          <Alert
            severity={reviewResult.isCorrect ? 'success' : 'error'}
            icon={reviewResult.isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
            sx={{ borderRadius: '12px', fontSize: '0.95rem' }}
          >
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
              {reviewResult.isCorrect ? 'ถูกต้อง!' : 'ยังไม่ถูกต้อง'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {reviewResult.feedback}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              คำแปลมาตรฐาน: <strong>{currentReviewItem.translation}</strong>
            </Typography>
          </Alert>
        )}
      </Box>
    );
  }

  // --- BOOK LIST UI ---
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', width: '100%' }}>
      {/* Header Panel */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBookIcon color="primary" /> สมุดคำศัพท์ส่วนตัว
          </Typography>
          <Typography variant="body2" color="text.secondary">
            คำศัพท์ที่คุณเก็บสะสมจากการทำแบบฝึกหัดแปล ทั้งหมด: {vocabList.length} คำ
          </Typography>
        </Box>
        {vocabList.length > 0 && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PlayArrowIcon />}
            onClick={startReview}
            sx={{ fontWeight: 600, borderRadius: '8px' }}
          >
            เริ่มเซสชันทบทวนคำศัพท์ (สุ่ม 5 คำ)
          </Button>
        )}
      </Box>

      {vocabList.length === 0 ? (
        <Card sx={{ borderRadius: 4, py: 6, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              ยังไม่มีคำศัพท์บันทึกอยู่ในสมุด! 📖
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              กรุณาไปที่เมนู 'ฝึกแปลคำศัพท์' เพื่อตอบแบบฝึกหัดแปลภาษา โดยคำศัพท์และคำแปลที่เสร็จสิ้นจะเซฟเข้ามาที่หน้านี้โดยอัตโนมัติ
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Search bar */}
          <TextField
            fullWidth
            placeholder="ค้นหาคำศัพท์ หรือ คำแปลของคุณ..."
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: (theme) => theme.palette.mode === 'light' ? '#FFFFFF' : '#1E293B',
              },
            }}
          />

          {/* Table list */}
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.mode === 'light' ? '#E2E8F0' : '#334155'}`, boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? '#F8FAFC' : '#0F172A' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>รูปแบบการแปล</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>คำศัพท์ตั้งต้น</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>คำแปลที่ถูกต้อง</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">จำนวนครั้งที่ตอบถูก</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVocab.map((row) => (
                  <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      {row.source_lang === 'th' ? (
                        <Chip label="TH ➔ EN" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Chip label="EN ➔ TH" size="small" color="secondary" variant="outlined" sx={{ fontWeight: 600 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '1.05rem' }}>{row.word}</TableCell>
                    <TableCell>{row.translation}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`ตอบถูก ${row.correct_count} ครั้ง`} 
                        size="small" 
                        color={row.correct_count > 0 ? 'success' : 'default'} 
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredVocab.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      ไม่พบคำศัพท์ที่ตรงกับการค้นหา
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
