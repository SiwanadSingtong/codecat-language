'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

export default function AuthLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #EEF2F6 0%, #E2E8F0 100%)'
            : 'linear-gradient(135deg, #0B0F19 0%, #111827 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        {children}
      </Container>
    </Box>
  );
}
