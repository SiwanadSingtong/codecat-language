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

  // Load user profile and chat history
  useEffect(() => {
    async function loadHistory(currentUser) {
      if (!currentUser) {
        // Load guest history
        const localHist = localStorage.getItem('guest-chat-history');
        if (localHist) {
          setMessages(JSON.parse(localHist));
        } else {
          // Default initial greeting
          const initialGreeting = [
            {
              role: 'model',
              content: "สวัสดีครับ! ผมคือครูสอนภาษาอังกฤษ Catlingo AI มาร่วมสนทนาภาษาอังกฤษกันเลยครับ! ไม่ต้องกลัวที่จะแต่งประโยคผิดนะ ผมจะช่วยตรวจแก้ไวยากรณ์ให้โดยเฉพาะการใช้ 'is, am, are' ให้ถูกต้องเองครับ วันนี้อยากคุยเรื่องอะไรดีครับ?",
              created_at: new Date().toISOString()
            }
          ];
          setMessages(initialGreeting);
          localStorage.setItem('guest-chat-history', JSON.stringify(initialGreeting));
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

      // Fetch chat messages
      const { data: dbMessages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });

      if (dbMessages && dbMessages.length > 0) {
        setMessages(dbMessages);
      } else {
        const initialGreeting = [
          {
            role: 'model',
            content: `สวัสดีครับ! ผมคือครูสอนภาษาอังกฤษ Catlingo AI ระดับภาษาของคุณคือ ${profile?.level || 'Beginner'} มาร่วมฝึกสนทนากันครับ! ผมจะคอยช่วยแนะนำและตรวจแก้ไวยากรณ์ (เช่น 'is/am/are') วันนี้อยากคุยเรื่องอะไรดีครับ?`,
            created_at: new Date().toISOString()
          }
        ];
        setMessages(initialGreeting);
        // Save initial greeting to Supabase
        await supabase.from('chat_messages').insert({
          user_id: currentUser.id,
          role: 'model',
          content: initialGreeting[0].content,
        });
      }
    }

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      loadHistory(currentUser).finally(() => setInitializing(false));
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
      created_at: new Date().toISOString()
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    // If guest, save locally
    if (!user) {
      localStorage.setItem('guest-chat-history', JSON.stringify(updatedMessages));
    }

    try {
      // Use Axios to POST
      const response = await axios.post('/api/chat', {
        history: updatedMessages,
        level: level,
      });

      const data = response.data;

      if (data.response) {
        const aiMessage = {
          role: 'model',
          content: data.response,
          created_at: new Date().toISOString()
        };
        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);

        if (!user) {
          localStorage.setItem('guest-chat-history', JSON.stringify(finalMessages));
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%', maxWidth: 800, mx: 'auto', width: '100%' }}>
      {/* Grammar Hint Box */}
      <Alert severity="info" icon={<SchoolIcon fontSize="inherit" />} sx={{ mb: 2, borderRadius: '12px' }}>
        <AlertTitle sx={{ fontWeight: 700 }}>ระบบดูแลไวยากรณ์โดยครู AI (Grammar Guard)</AlertTitle>
        คุณสามารถพิมพ์พูดคุยได้อย่างอิสระ หากมีการใช้ไวยากรณ์ผิดพลาด โดยเฉพาะการใช้ <strong>is, am, are</strong> ครู AI จะช่วยชี้แนะและอธิบายแก้ไขให้อย่างอบอุ่นครับ
      </Alert>

      {/* Message Window */}
      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          p: 3,
          mb: 2,
          overflowY: 'auto',
          borderRadius: 4,
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
                    borderRadius: isAI ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
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
            <Paper sx={{ p: 2, borderRadius: '4px 16px 16px 16px', bgcolor: (theme) => theme.palette.mode === 'light' ? '#F1F5F9' : '#1E293B' }}>
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
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: (theme) => theme.palette.mode === 'light' ? '#FFFFFF' : '#1E293B',
            },
          }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={loading || !inputValue.trim()}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: '12px',
            p: 1.5,
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
