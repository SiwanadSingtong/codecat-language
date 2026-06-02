'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import PetsIcon from '@mui/icons-material/Pets';

/**
 * PageLoader — แสดงขณะโหลดข้อมูลในหน้าต่างๆ
 * @param {string} message - ข้อความที่จะแสดง (optional)
 * @param {'full'|'content'} variant - 'full' = เต็มหน้าจอ, 'content' = เฉพาะส่วน content
 */
export default function PageLoader({ message = 'กำลังโหลดข้อมูล...', variant = 'content' }) {
  const minHeight = variant === 'full' ? '80vh' : '40vh';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        gap: 3,
        py: 6,
      }}
    >
      {/* Animated paw icon */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Pulse ring */}
        <Box
          sx={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: (theme) =>
              theme.palette.mode === 'light'
                ? 'rgba(79, 70, 229, 0.12)'
                : 'rgba(99, 102, 241, 0.15)',
            animation: 'pageloader-pulse 1.5s ease-in-out infinite',
            '@keyframes pageloader-pulse': {
              '0%': { transform: 'scale(0.8)', opacity: 1 },
              '100%': { transform: 'scale(1.6)', opacity: 0 },
            },
          }}
        />
        {/* Paw icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
            boxShadow: '0 8px 24px rgba(79,70,229,0.3)',
            animation: 'pageloader-bounce 1.2s ease-in-out infinite',
            '@keyframes pageloader-bounce': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-8px)' },
            },
          }}
        >
          <PetsIcon sx={{ color: '#fff', fontSize: 30 }} />
        </Box>
      </Box>

      {/* Shimmer skeleton bars */}
      <Box sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton variant="rounded" height={12} sx={{ borderRadius: 6, animationDuration: '1s' }} />
        <Skeleton variant="rounded" height={12} width="80%" sx={{ borderRadius: 6, animationDuration: '1.2s' }} />
        <Skeleton variant="rounded" height={12} width="60%" sx={{ borderRadius: 6, animationDuration: '1.4s' }} />
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontWeight: 500,
          opacity: 0.7,
          animation: 'pageloader-fade 1.5s ease-in-out infinite alternate',
          '@keyframes pageloader-fade': {
            from: { opacity: 0.4 },
            to: { opacity: 0.9 },
          },
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}
