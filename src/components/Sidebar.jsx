'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChatIcon from '@mui/icons-material/Chat';
import PracticeIcon from '@mui/icons-material/FitnessCenter';
import VocabIcon from '@mui/icons-material/MenuBook';
import QuizIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const translateLevel = (lvl) => {
  if (lvl === 'Beginner') return 'ระดับเริ่มต้น';
  if (lvl === 'Intermediate') return 'ระดับกลาง';
  if (lvl === 'Advanced') return 'ระดับสูง';
  return lvl;
};

export default function Sidebar({
  drawerWidth,
  mobileOpen,
  handleDrawerToggle,
  isMobile,
  user,
  level,
  isAdmin,
  handleLogout
}) {
  const router = useRouter();
  const pathname = usePathname();

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
                  if (isMobile) handleDrawerToggle();
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
                      if (isMobile) handleDrawerToggle();
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
  );
}
