'use client';
import React, { useContext } from 'react';
import { usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

import { ColorModeContext } from './ThemeRegistry/ThemeRegistry';

const translateLevel = (lvl) => {
  if (lvl === 'Beginner') return 'ระดับเริ่มต้น';
  if (lvl === 'Intermediate') return 'ระดับกลาง';
  if (lvl === 'Advanced') return 'ระดับสูง';
  return lvl;
};

export default function Navbar({ drawerWidth, handleDrawerToggle, level }) {
  const pathname = usePathname();
  const colorMode = useContext(ColorModeContext);

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        boxShadow: 'none',
        bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        borderBottom: (theme) => `1px solid ${theme.palette.mode === 'light' ? '#E2E8F0' : '#334155'}`,
        color: 'text.primary',
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
            {pathname === '/' && 'แผงควบคุม'}
            {pathname === '/placement-test' && 'ทดสอบวัดระดับภาษาอังกฤษ'}
            {pathname === '/chat' && 'คุยแชทฝึกภาษาอังกฤษกับครู AI'}
            {pathname === '/practice' && 'ฝึกสุ่มแปลคำศัพท์'}
            {pathname === '/vocab' && 'สมุดคำศัพท์ส่วนตัว'}
            {pathname === '/admin' && 'แผงผู้ดูแลระบบ'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Display user level status in header */}
          <Chip 
            label={`ระดับ: ${translateLevel(level)}`}
            variant="outlined" 
            color="primary" 
            sx={{ fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
          />

          {/* Light/Dark mode toggler */}
          <IconButton onClick={colorMode.toggleColorMode} color="inherit">
            {colorMode.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
