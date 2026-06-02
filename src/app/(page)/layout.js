'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

const drawerWidth = 260;

export default function PageLayout({ children }) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const supabase = createClient();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [level, setLevel] = useState('Beginner');
  const [isAdmin, setIsAdmin] = useState(false);

  // Load auth user and profile details
  useEffect(() => {
    async function getProfile(currentUser) {
      if (!currentUser) return;
      const { data } = await supabase
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navbar (Top App Bar) */}
      <Navbar
        drawerWidth={drawerWidth}
        handleDrawerToggle={handleDrawerToggle}
        level={level}
      />

      {/* Sidebar (Navigation Drawer) */}
      <Sidebar
        drawerWidth={drawerWidth}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        isMobile={isMobile}
        user={user}
        level={level}
        isAdmin={isAdmin}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          // ml: { md: `${drawerWidth}px` },
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
