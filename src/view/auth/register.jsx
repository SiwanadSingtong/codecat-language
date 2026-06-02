'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';

// Icons
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { createClient } from '@/utils/supabase/client';

export default function RegisterView() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  const handleGuest = () => {
    router.push('/');
  };

  return (
    <Card sx={{ borderRadius: 4, backdropFilter: 'blur(16px)', bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.8)', border: (theme) => `1px solid ${theme.palette.mode === 'light' ? '#E2E8F0' : '#334155'}` }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ mb: 3, textAlignment: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #4F46E5 30%, #06B6D4 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
            สมัครสมาชิก
          </Typography>
          <Typography variant="body2" color="text.secondary">
            สร้างบัญชีผู้ใช้เพื่อเก็บข้อมูลและสถิติการเรียนของคุณแบบถาวร
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }}>
            สมัครสมาชิกสำเร็จแล้ว! กำลังนำคุณไปหน้าเข้าสู่ระบบ...
          </Alert>
        )}

        <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="อีเมล"
            variant="outlined"
            type="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }
            }}
          />

          <TextField
            label="รหัสผ่าน"
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }
            }}
          />

          <TextField
            label="ยืนยันรหัสผ่าน"
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            required
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600, mt: 1 }}
          >
            {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนบัญชี'}
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            มีบัญชีผู้ใช้อยู่แล้ว?{' '}
            <Link href="/login" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
              เข้าสู่ระบบ
            </Link>
          </Typography>
        </Box>

        <Divider sx={{ my: 3, opacity: 0.1 }} />

        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          size="large"
          endIcon={<PlayArrowIcon />}
          onClick={handleGuest}
          sx={{ py: 1.2, fontWeight: 600, borderRadius: '8px' }}
        >
          ใช้งานแบบไม่เข้าสู่ระบบ (บุคคลทั่วไป)
        </Button>
      </CardContent>
    </Card>
  );
}
