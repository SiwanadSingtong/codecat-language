import React from 'react';
import MainLayout from '@/components/MainLayout';

export const dynamic = 'force-dynamic';

export default function PageLayout({ children }) {
  return <MainLayout>{children}</MainLayout>;
}
