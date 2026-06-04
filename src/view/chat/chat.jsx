'use client';
import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import SchoolIcon from '@mui/icons-material/School';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import { useSnackbar } from 'notistack';
import axios from 'axios';

import { createClient } from '@/utils/supabase/client';
import PageLoader from '@/components/PageLoader';

/**
 * Renders message content with proper line breaks and word wrapping.
 * Splits on \n so AI multi-line responses (paragraphs, lists) display correctly.
 */
function MessageContent({ text }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

export default function ChatView() {
  const supabase = createClient();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [level, setLevel] = useState('Beginner');
  const [initializing, setInitializing] = useState(true);
  const [scenario, setScenario] = useState('general');

  const { enqueueSnackbar } = useSnackbar();

  // Vocabulary Extraction Modal States
  const [vocabOpen, setVocabOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedVocab, setExtractedVocab] = useState([]);
  const [savingVocab, setSavingVocab] = useState(false);

  const handleExtractVocab = async () => {
    if (messages.length <= 1) {
      enqueueSnackbar('กรุณาสนทนากับครู AI สักครู่ก่อนเริ่มดึงคำศัพท์ครับ', { variant: 'warning' });
      return;
    }

    setExtracting(true);
    setVocabOpen(true);
    try {
      // Filter history to send only unextracted messages
      const filteredHistory = messages.filter(msg => !msg.extracted);

      const response = await axios.post('/api/vocab/extract', {
        history: filteredHistory
      });
      const data = response.data;
      if (Array.isArray(data)) {
        setExtractedVocab(data.map(v => ({ ...v, selected: true })));
      } else {
        throw new Error('รูปแบบข้อมูลคำศัพท์ไม่ถูกต้อง');
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar('เกิดข้อผิดพลาดในการดึงคำศัพท์: ' + (error.response?.data?.error || error.message), { variant: 'error' });
      setVocabOpen(false);
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveVocab = async () => {
    const toSave = extractedVocab.filter(v => v.selected);
    if (toSave.length === 0) {
      enqueueSnackbar('กรุณาเลือกคำศัพท์อย่างน้อย 1 คำเพื่อบันทึกครับ', { variant: 'warning' });
      return;
    }

    setSavingVocab(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const item of toSave) {
        if (user) {
          try {
            await axios.post('/api/vocab', {
              word: item.word,
              translation: item.translation,
              source_lang: item.source_lang || 'en',
              isCorrect: false
            });
            successCount++;
          } catch (e) {
            console.error(e);
            failCount++;
          }
        } else {
          try {
            const localVocab = localStorage.getItem('guest-vocabularies');
            let vocabList = localVocab ? JSON.parse(localVocab) : [];
            
            const existingIdx = vocabList.findIndex(v => v.word.toLowerCase() === item.word.toLowerCase());
            if (existingIdx > -1) {
              vocabList[existingIdx].translation = item.translation;
            } else {
              vocabList.push({
                id: crypto.randomUUID(),
                word: item.word,
                translation: item.translation,
                source_lang: item.source_lang || 'en',
                correct_count: 0,
                created_at: new Date().toISOString()
              });
            }
            localStorage.setItem('guest-vocabularies', JSON.stringify(vocabList));
            successCount++;
          } catch (e) {
            console.error(e);
            failCount++;
          }
        }
      }

      if (successCount > 0) {
        enqueueSnackbar(`บันทึกคำศัพท์สำเร็จ ${successCount} คำครับ! 🎉`, { variant: 'success' });
        
        if (user) {
          try {
            await supabase
              .from('chat_messages')
              .update({ extracted: true })
              .eq('user_id', user.id)
              .eq('scenario', scenario)
              .eq('extracted', false);
          } catch (dbErr) {
            console.error("Error updating messages in database:", dbErr);
          }
        }
        
        const updatedMessages = messages.map(msg => ({ ...msg, extracted: true }));
        setMessages(updatedMessages);
        
        if (!user) {
          localStorage.setItem(`guest-chat-history-${scenario}`, JSON.stringify(updatedMessages));
        }
      }
      if (failCount > 0) {
        enqueueSnackbar(`เกิดข้อผิดพลาดในการบันทึก ${failCount} คำ`, { variant: 'error' });
      }
      setVocabOpen(false);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('เกิดข้อผิดพลาดในการบันทึกคำศัพท์ครับ', { variant: 'error' });
    } finally {
      setSavingVocab(false);
    }
  };

  const handleToggleSelectAll = (checked) => {
    setExtractedVocab(prev => prev.map(v => ({ ...v, selected: checked })));
  };

  const handleToggleSelectWord = (index, checked) => {
    setExtractedVocab(prev => prev.map((v, i) => i === index ? { ...v, selected: checked } : v));
  };

  const loadHistory = async (currentUser, activeScenario = 'general') => {
    if (!currentUser) {
      // Load guest history for this scenario
      const localHist = localStorage.getItem(`guest-chat-history-${activeScenario}`);
      if (localHist) {
        setMessages(JSON.parse(localHist));
      } else {
        const greetings = {
          general: "สวัสดีครับ! ผมคือครูสอนภาษาอังกฤษ Catlingo AI มาร่วมฝึกสนทนาและแก้ไขไวยากรณ์ภาษาอังกฤษกันเลยครับ! วันนี้อยากคุยเรื่องอะไรดีครับ?",
          cafe: "Welcome to Catlingo Cafe! ☕ What can I get started for you today? (ยินดีต้อนรับสู่ร้านกาแฟครับ! วันนี้รับเครื่องดื่มหรือขนมอะไรดีครับ?)",
          job_interview: "Hello! Thank you for coming in today. I am the HR Manager. Let's begin the interview. Can you please introduce yourself and tell me about your background? (สวัสดีครับ ขอบคุณที่มาสัมภาษณ์งานวันนี้ ผมเป็นผู้จัดการฝ่ายบุคคล เรามาเริ่มการสัมภาษณ์กันเลยครับ ช่วยแนะนำตัวเองและเล่าภูมิหลังคร่าวๆ หน่อยครับ)",
          gaming: "Hey! Glad to have you on the team. Let's win this match! Are you ready? What position or hero are you playing? (เฮ้! ดีใจที่มีคุณอยู่ในทีม มาชนะเกมนี้กันเถอะ พร้อมหรือยังครับ? คุณเล่นฮีโร่ตัวไหนหรือตำแหน่งอะไร?)",
          hotel: "Welcome to the Catlingo Grand Hotel! 🏨 How may I assist you with your check-in or request today? (ยินดีต้อนรับสู่โรงแรมคัทลิงโกแกรนด์ครับ! มีอะไรให้ผมช่วยเหลือเรื่องเช็คอินหรือบริการวันนี้ไหมครับ?)",
          airport: "Good day! Passport and boarding pass, please. Are you traveling for business or pleasure? (สวัสดีครับ ขอหนังสือเดินทางและบอร์ดดิ้งพาสด้วยครับ คุณเดินทางเพื่อธุรกิจหรือท่องเที่ยวครับ?)",
          restaurant: "Welcome to our restaurant! 🍽️ Ready to order, or do you need a few more minutes with the menu? (ยินดีต้อนรับสู่ร้านอาหารของเราครับ! พร้อมสั่งอาหารหรือยังครับ หรือขอเวลาดูเมนูอีกสักครู่ดีครับ?)"
        };
        const initialText = greetings[activeScenario] || greetings.general;
        const initialGreeting = [
          {
            role: 'model',
            content: initialText,
            created_at: new Date().toISOString(),
            extracted: true
          }
        ];
        setMessages(initialGreeting);
        localStorage.setItem(`guest-chat-history-${activeScenario}`, JSON.stringify(initialGreeting));
      }
      return;
    }

    // Fetch user profile level
    const { data: profile } = await supabase
      .from('profiles')
      .select('level')
      .eq('id', currentUser.id)
      .single();
    if (profile) {
      setLevel(profile.level || 'Beginner');
    }

    // Fetch chat messages filtered by scenario
    const { data: dbMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('scenario', activeScenario)
      .order('created_at', { ascending: true });

    if (dbMessages && dbMessages.length > 0) {
      setMessages(dbMessages);
    } else {
      const greetings = {
        general: `สวัสดีครับ! ผมคือครูสอนภาษาอังกฤษ Catlingo AI ระดับภาษาของคุณคือ ${profile?.level || 'Beginner'} มาร่วมฝึกสนทนากันครับ! วันนี้อยากคุยเรื่องอะไรดีครับ?`,
        cafe: "Welcome to Catlingo Cafe! ☕ What can I get started for you today? (ยินดีต้อนรับสู่ร้านกาแฟครับ! วันนี้รับเครื่องดื่มหรือขนมอะไรดีครับ?)",
        job_interview: "Hello! Thank you for coming in today. I am the HR Manager. Let's begin the interview. Can you please introduce yourself and tell me about your background? (สวัสดีครับ ขอบคุณที่มาสัมภาษณ์งานวันนี้ ผมเป็นผู้จัดการฝ่ายบุคคล เรามาเริ่มการสัมภาษณ์กันเลยครับ ช่วยแนะนำตัวเองและเล่าภูมิหลังคร่าวๆ หน่อยครับ)",
        gaming: "Hey! Glad to have you on the team. Let's win this match! Are you ready? What position or hero are you playing? (เฮ้! ดีใจที่มีคุณอยู่ในทีม มาชนะเกมนี้กันเถอะ พร้อมหรือยังครับ? คุณเล่นฮีโร่ตัวไหนหรือตำแหน่งอะไร?)",
        hotel: "Welcome to the Catlingo Grand Hotel! 🏨 How may I assist you with your check-in or request today? (ยินดีต้อนรับสู่โรงแรมคัทลิงโกแกรนด์ครับ! มีอะไรให้ผมช่วยเหลือเรื่องเช็คอินหรือบริการวันนี้ไหมครับ?)",
        airport: "Good day! Passport and boarding pass, please. Are you traveling for business or pleasure? (สวัสดีครับ ขอหนังสือเดินทางและบอร์ดดิ้งพาสด้วยครับ คุณเดินทางเพื่อธุรกิจหรือท่องเที่ยวครับ?)",
        restaurant: "Welcome to our restaurant! 🍽️ Ready to order, or do you need a few more minutes with the menu? (ยินดีต้อนรับสู่ร้านอาหารของเราครับ! พร้อมสั่งอาหารหรือยังครับ หรือขอเวลาดูเมนูอีกสักครู่ดีครับ?)"
      };
      const initialText = greetings[activeScenario] || greetings.general;
      const initialGreeting = [
        {
          role: 'model',
          content: initialText,
          created_at: new Date().toISOString(),
          extracted: true
        }
      ];
      setMessages(initialGreeting);
      // Save initial greeting to Supabase
      await supabase.from('chat_messages').insert({
        user_id: currentUser.id,
        role: 'model',
        content: initialText,
        scenario: activeScenario,
        extracted: true
      });
    }
  };

  const clearChat = async (targetScenario = scenario) => {
    setLoading(true);
    try {
      let initialText = "";
      if (targetScenario === 'general') {
        initialText = `สวัสดีครับ! ผมคือครูสอนภาษาอังกฤษ Catlingo AI มาร่วมฝึกสนทนาและแก้ไขไวยากรณ์ภาษาอังกฤษกันเลยครับ! วันนี้อยากคุยเรื่องอะไรดีครับ?`;
      } else if (targetScenario === 'cafe') {
        initialText = `Welcome to Catlingo Cafe! ☕ What can I get started for you today? (ยินดีต้อนรับสู่ร้านกาแฟครับ! วันนี้รับเครื่องดื่มหรือขนมอะไรดีครับ?)`;
      } else if (targetScenario === 'job_interview') {
        initialText = `Hello! Thank you for coming in today. I am the HR Manager. Let's begin the interview. Can you please introduce yourself and tell me about your background? (สวัสดีครับ ขอบคุณที่มาสัมภาษณ์งานวันนี้ ผมเป็นผู้จัดการฝ่ายบุคคล เรามาเริ่มการสัมภาษณ์กันเลยครับ ช่วยแนะนำตัวเองและเล่าภูมิหลังคร่าวๆ หน่อยครับ)`;
      } else if (targetScenario === 'gaming') {
        initialText = `Hey! Glad to have you on the team. Let's win this match! Are you ready? What position or hero are you playing? (เฮ้! ดีใจที่มีคุณอยู่ในทีม มาชนะเกมนี้กันเถอะ พร้อมหรือยังครับ? คุณเล่นฮีโร่ตัวไหนหรือตำแหน่งอะไร?)`;
      } else if (targetScenario === 'hotel') {
        initialText = `Welcome to the Catlingo Grand Hotel! 🏨 How may I assist you with your check-in or request today? (ยินดีต้อนรับสู่โรงแรมคัทลิงโกแกรนด์ครับ! มีอะไรให้ผมช่วยเหลือเรื่องเช็คอินหรือบริการวันนี้ไหมครับ?)`;
      } else if (targetScenario === 'airport') {
        initialText = `Good day! Passport and boarding pass, please. Are you traveling for business or pleasure? (สวัสดีครับ ขอหนังสือเดินทางและบอร์ดดิ้งพาสด้วยครับ คุณเดินทางเพื่อธุรกิจหรือท่องเที่ยวครับ?)`;
      } else if (targetScenario === 'restaurant') {
        initialText = `Welcome to our restaurant! 🍽️ Ready to order, or do you need a few more minutes with the menu? (ยินดีต้อนรับสู่ร้านอาหารของเราครับ! พร้อมสั่งอาหารหรือยังครับ หรือขอเวลาดูเมนูอีกสักครู่ดีครับ?)`;
      }

      const initialGreeting = [
        {
          role: 'model',
          content: initialText,
          created_at: new Date().toISOString(),
          extracted: true
        }
      ];

      setMessages(initialGreeting);

      if (user) {
        // Delete chat messages ONLY for this user and this scenario in Supabase
        await supabase.from('chat_messages').delete().eq('user_id', user.id).eq('scenario', targetScenario);
        // Save the new greeting to Supabase
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          role: 'model',
          content: initialText,
          scenario: targetScenario,
          extracted: true
        });
      } else {
        localStorage.setItem(`guest-chat-history-${targetScenario}`, JSON.stringify(initialGreeting));
      }
    } catch (err) {
      console.error("Error clearing chat:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = async (newScenario) => {
    setScenario(newScenario);
    setLoading(true);
    try {
      await loadHistory(user, newScenario);
    } catch (err) {
      console.error("Error changing scenario:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load user profile and chat history
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      if (currentUser) {
        loadHistory(currentUser, scenario).finally(() => setInitializing(false));
      } else {
        loadHistory(null, scenario).finally(() => setInitializing(false));
      }
    });
  }, [supabase]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessageText = inputValue.trim();
    setInputValue('');
    setLoading(true);

    const newUserMessage = {
      role: 'user',
      content: userMessageText,
      created_at: new Date().toISOString(),
      extracted: false
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    // If guest, save locally for the active scenario
    if (!user) {
      localStorage.setItem(`guest-chat-history-${scenario}`, JSON.stringify(updatedMessages));
    }

    try {
      // Use Axios to POST
      const response = await axios.post('/api/chat', {
        history: updatedMessages,
        level: level,
        scenario: scenario,
      });

      const data = response.data;

      if (data.response) {
        const aiMessage = {
          role: 'model',
          content: data.response,
          created_at: new Date().toISOString(),
          extracted: false
        };
        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);

        if (!user) {
          localStorage.setItem(`guest-chat-history-${scenario}`, JSON.stringify(finalMessages));
        }
      } else {
        throw new Error(data.error || 'Failed to generate response');
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: 'model',
        content: `ขออภัยด้วยครับ พอดีเกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message} กรุณาลองใหม่อีกครั้งครับ!`,
        created_at: new Date().toISOString()
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return <PageLoader message="กำลังโหลดประวัติการสนทนา..." />;
  }

  const hasNewMessages = messages.length > 1 && messages.slice(1).some(msg => !msg.extracted);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%', maxWidth: 800, mx: 'auto', width: '100%' }}>
      {/* Grammar Hint Box */}
      <Alert severity="info" icon={<SchoolIcon fontSize="inherit" />} sx={{ mb: 2, borderRadius: '12px' }}>
        <AlertTitle sx={{ fontWeight: 700 }}>ระบบดูแลไวยากรณ์โดยครู AI (Grammar Guard)</AlertTitle>
        คุณสามารถพิมพ์พูดคุยได้อย่างอิสระ หากมีการใช้ไวยากรณ์ผิดพลาด โดยเฉพาะการใช้ <strong>is, am, are</strong> ครู AI จะช่วยชี้แนะและอธิบายแก้ไขให้อย่างอบอุ่นครับ
      </Alert>

      {/* Roleplay Scenarios & Clear Chat Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200, flexGrow: 1, maxWidth: { sm: 300 } }}>
          <InputLabel id="scenario-select-label">สถานการณ์การสนทนา</InputLabel>
          <Select
            labelId="scenario-select-label"
            id="scenario-select"
            value={scenario}
            label="สถานการณ์การสนทนา"
            onChange={(e) => handleScenarioChange(e.target.value)}
            disabled={loading}
            sx={{ borderRadius: '10px' }}
          >
            <MenuItem value="general">💬 คุยทั่วไป (General)</MenuItem>
            <MenuItem value="cafe">☕ ในร้านกาแฟ (Cafe Barista)</MenuItem>
            <MenuItem value="job_interview">💼 สัมภาษณ์งาน (Job Interview)</MenuItem>
            <MenuItem value="gaming">🎮 เล่นเกมร่วมทีม (Gaming Teammate)</MenuItem>
            <MenuItem value="hotel">🏨 เช็คอินโรงแรม (Hotel Front Desk)</MenuItem>
            <MenuItem value="airport">✈️ สนามบินและด่านศุลกากร (Airport Customs)</MenuItem>
            <MenuItem value="restaurant">🍽️ สั่งอาหารร้านอาหาร (Restaurant Diner)</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title={!hasNewMessages ? "ไม่มีคำศัพท์ใหม่ให้ดึง กรุณาแชทเพิ่มเติมเพื่อเรียนรู้คำศัพท์ใหม่ก่อนครับ" : ""}>
            <span>
              <Button
                variant="contained"
                color="secondary"
                size="medium"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleExtractVocab}
                disabled={loading || !hasNewMessages}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
              >
                ดึงคำศัพท์จากแชท
              </Button>
            </span>
          </Tooltip>

          <Button
            variant="outlined"
            color="error"
            size="medium"
            startIcon={<DeleteSweepIcon />}
            onClick={() => clearChat(scenario)}
            disabled={loading}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            ล้างแชท / เริ่มใหม่
          </Button>
        </Box>
      </Box>

      {/* Message Window */}
      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          p: 3,
          mb: 2,
          overflowY: 'auto',
          borderRadius: '12px',
          border: (theme) => `1px solid ${theme.palette.mode === 'light' ? '#E2E8F0' : '#334155'}`,
          bgcolor: (theme) => theme.palette.mode === 'light' ? '#FFFFFF' : '#111827',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxHeight: 'calc(100vh - 300px)',
          minHeight: 400,
        }}
      >
        {messages.map((msg, index) => {
          const isAI = msg.role === 'model';
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignSelf: isAI ? 'flex-start' : 'flex-end',
                flexDirection: isAI ? 'row' : 'row-reverse',
                gap: 1.5,
                maxWidth: '80%',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: isAI ? 'secondary.main' : 'primary.main',
                  width: 36,
                  height: 36,
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                }}
              >
                {isAI ? <SmartToyIcon /> : <PersonIcon />}
              </Avatar>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isAI ? 'flex-start' : 'flex-end',
                  // Critical: minWidth:0 allows the flex child to shrink below its content size
                  // so maxWidth:80% on the parent is actually respected
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: isAI ? '4px 10px 10px 10px' : '10px 4px 10px 10px',
                    bgcolor: (theme) =>
                      isAI
                        ? theme.palette.mode === 'light' ? '#F1F5F9' : '#1E293B'
                        : theme.palette.primary.main,
                    color: (theme) =>
                      isAI
                        ? theme.palette.text.primary
                        : theme.palette.primary.contrastText,
                    boxShadow: 'none',
                    lineHeight: 1.6,
                    // Break long words/URLs so they don't overflow the bubble
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  <Typography variant="body1" component="div" sx={{ lineHeight: 1.6 }}>
                    <MessageContent text={msg.content} />
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1, fontSize: '0.7rem' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          );
        })}
        {loading && (
          <Box sx={{ display: 'flex', alignSelf: 'flex-start', gap: 1.5, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}><SmartToyIcon /></Avatar>
            <Paper sx={{ p: 2, borderRadius: '4px 10px 10px 10px', bgcolor: (theme) => theme.palette.mode === 'light' ? '#F1F5F9' : '#1E293B' }}>
              <CircularProgress size={20} color="secondary" />
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Paper>

      {/* Input Box */}
      <Box component="form" onSubmit={handleSend} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="พิมพ์ข้อความภาษาอังกฤษของคุณที่นี่..."
          variant="outlined"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
          autoComplete="off"
          slotProps={{
            htmlInput: {
              spellCheck: 'false',
              autoCorrect: 'off',
              autoCapitalize: 'off',
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: (theme) => theme.palette.mode === 'light' ? '#FFFFFF' : '#1E293B',
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !inputValue.trim()}
          endIcon={<SendIcon />}
          sx={{
            borderRadius: '12px',
            px: 3,
            fontWeight: 700,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            height: '56px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          }}
        >
          ส่งข้อความ
        </Button>
      </Box>

      {/* Vocabulary Extraction Dialog */}
      <Dialog
        open={vocabOpen}
        onClose={() => !savingVocab && !extracting && setVocabOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              p: 1,
              bgcolor: (theme) => theme.palette.mode === 'light' ? '#FFFFFF' : '#1E293B',
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="secondary" />
          ดึงคำศัพท์จากแชท
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          {extracting ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress color="secondary" />
              <Typography variant="body2" color="text.secondary" align="center">
                กำลังวิเคราะห์ประวัติแชทและดึงคำศัพท์ด้วย AI...
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                พบคำศัพท์ที่น่าสนใจจากบทสนทนาของคุณดังนี้ เลือกคำที่ต้องการเพื่อเพิ่มเข้าคลังคำศัพท์ของคุณ:
              </Typography>

              {extractedVocab.length > 0 ? (
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={extractedVocab.every(v => v.selected)}
                        indeterminate={extractedVocab.some(v => v.selected) && !extractedVocab.every(v => v.selected)}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>เลือกทั้งหมด</Typography>}
                    sx={{ mb: 1 }}
                  />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, maxHeight: 300, overflowY: 'auto', pr: 0.5 }}>
                    {extractedVocab.map((item, index) => (
                      <Paper
                        key={index}
                        variant="outlined"
                        onClick={() => handleToggleSelectWord(index, !item.selected)}
                        sx={{
                          p: 1.5,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          borderColor: (theme) => theme.palette.mode === 'light' ? '#E2E8F0' : '#334155',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: (theme) => theme.palette.mode === 'light' ? '#F8FAFC' : '#0F172A',
                          },
                          transition: 'all 0.2s ease',
                          userSelect: 'none',
                        }}
                      >
                        <Checkbox
                          checked={!!item.selected}
                          sx={{ pointerEvents: 'none' }}
                          color="primary"
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {item.word}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.translation}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                  ไม่พบคำศัพท์ที่แนะนำในบทสนทนานี้
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1.5, gap: 1 }}>
          <Button
            onClick={() => setVocabOpen(false)}
            variant="outlined"
            color="inherit"
            disabled={savingVocab || extracting}
            sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none' }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSaveVocab}
            variant="contained"
            color="primary"
            disabled={savingVocab || extracting || extractedVocab.filter(v => v.selected).length === 0}
            sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none' }}
          >
            {savingVocab ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <span>กำลังบันทึก...</span>
              </Box>
            ) : (
              'บันทึกเข้าคลังคำศัพท์'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
