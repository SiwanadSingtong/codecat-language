'use client';
import React, { useState, useEffect, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChatIcon from '@mui/icons-material/Chat';
import PracticeIcon from '@mui/icons-material/FitnessCenter';
import VocabIcon from '@mui/icons-material/MenuBook';
import QuizIcon from '@mui/icons-material/Assignment';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import { ColorModeContext } from './ThemeRegistry/ThemeRegistry';
import { createClient } from '@/utils/supabase/client';

const drawerWidth = 260;

const translateLevel = (lvl) => {
  if (lvl === 'Beginner') return 'ระดับเริ่มต้น';
  if (lvl === 'Intermediate') return 'ระดับกลาง';
  if (lvl === 'Advanced') return 'ระดับสูง';
  return lvl;
};

export default function MainLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const colorMode = useContext(ColorModeContext);
  const supabase = createClient();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [level, setLevel] = useState('Beginner');
  const [isAdmin, setIsAdmin] = useState(false);

  // Load auth user and profile details
  useEffect(() => {
    async function getProfile(currentUser) {
      if (!currentUser) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (data) {
        setLevel(data.level || 'Beginner');
      }
      // Check admin: compare email against env var
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (adminEmail && currentUser.email === adminEmail) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          getProfile(currentUser);
        } else {
          const guestLevel = localStorage.getItem('guest-level') || 'Beginner';
          setLevel(guestLevel);
        }
      }
    );

    // Initial check
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      if (currentUser) {
        getProfile(currentUser);
      } else {
        const guestLevel = localStorage.getItem('guest-level') || 'Beginner';
        setLevel(guestLevel);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Synchronize placement test updates
  useEffect(() => {
    const handleLevelChange = () => {
      if (user) {
        supabase.from('profiles').select('level').eq('id', user.id).single().then(({ data }) => {
          if (data) setLevel(data.level);
        });
      } else {
        setLevel(localStorage.getItem('guest-level') || 'Beginner');
      }
    };
    window.addEventListener('user-level-changed', handleLevelChange);
    return () => window.removeEventListener('user-level-changed', handleLevelChange);
  }, [user, supabase]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { text: 'แผงควบคุม', icon: <DashboardIcon />, path: '/' },
    { text: 'ทดสอบวัดระดับ', icon: <QuizIcon />, path: '/placement-test' },
    { text: 'คุยแชทฝึกภาษา', icon: <ChatIcon />, path: '/chat' },
    { text: 'ฝึกแปลคำศัพท์', icon: <PracticeIcon />, path: '/practice' },
    { text: 'สมุดคำศัพท์ส่วนตัว', icon: <VocabIcon />, path: '/vocab' },
  ];

  const adminMenuItems = isAdmin
    ? [{ text: 'แผงผู้ดูแลระบบ', icon: <AdminPanelSettingsIcon />, path: '/admin', isAdmin: true }]
    : [];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar 
          src="/favicon.ico" 
          alt="Catlingo Logo" 
          sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 'bold' }}
        >
          CL
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #4F46E5 30%, #06B6D4 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Catlingo
        </Typography>
      </Box>
      <Divider sx={{ opacity: 0.1 }} />

      {/* Navigation List */}
      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  router.push(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '10px',
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.main' : 'action.hover',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.contrastText' : 'text.secondary', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: isActive ? 600 : 500 }}>
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* Admin Menu Items */}
        {adminMenuItems.length > 0 && (
          <>
            <Divider sx={{ my: 1.5, opacity: 0.15 }} />
            {adminMenuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => {
                      router.push(item.path);
                      if (isMobile) setMobileOpen(false);
                    }}
                    sx={{
                      borderRadius: '10px',
                      bgcolor: isActive
                        ? 'linear-gradient(135deg, #4F46E5, #7C3AED)'
                        : 'transparent',
                      background: isActive
                        ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                        : 'transparent',
                      color: isActive ? '#fff' : 'text.secondary',
                      border: isActive ? 'none' : '1px dashed',
                      borderColor: 'divider',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4F46E520 0%, #7C3AED20 100%)',
                        color: 'primary.main',
                        borderColor: 'primary.main',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive ? '#fff' : 'primary.main', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>
                          {item.text}
                        </Typography>
                      }
                    />
                    <Chip label="Admin" size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </>
        )}
      </List>

      <Divider sx={{ opacity: 0.1 }} />

      {/* User Info Block */}
      <Box sx={{ p: 2 }}>
        {user ? (
          <Box sx={{ 
            p: 2, 
            borderRadius: '12px', 
            bgcolor: (theme) => theme.palette.mode === 'light' ? '#F1F5F9' : '#1E293B',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                <PersonIcon />
              </Avatar>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, noWrap: true, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.email.split('@')[0]}
                </Typography>
                <Chip 
                  label={translateLevel(level)} 
                  size="small" 
                  color="secondary" 
                  sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600 }} 
                />
              </Box>
            </Box>
            <Button
              variant="outlined"
              color="error"
              size="small"
              fullWidth
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ mt: 1, borderRadius: '8px' }}
            >
              ออกจากระบบ
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<LoginIcon />}
            onClick={() => router.push('/login')}
            sx={{ borderRadius: '8px', py: 1 }}
          >
            เข้าสู่ระบบ / สมัครสมาชิก
          </Button>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top App Bar */}
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
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
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

      {/* Navigation Drawers */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: (theme) => `1px solid ${theme.palette.mode === 'light' ? '#E2E8F0' : '#334155'}`,
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth, 
              borderRight: (theme) => `1px solid ${theme.palette.mode === 'light' ? '#E2E8F0' : '#334155'}`,
              bgcolor: 'background.paper',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
