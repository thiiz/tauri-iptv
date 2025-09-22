'use client';

import { useEffect, useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';

interface SidebarProviderClientProps {
  children: React.ReactNode;
}

export function SidebarProviderClient({
  children
}: SidebarProviderClientProps) {
  const [defaultOpen, setDefaultOpen] = useState<boolean>(true);

  useEffect(() => {
    // Get sidebar state from localStorage on client side
    const savedState = localStorage.getItem('sidebar_state');
    if (savedState !== null) {
      setDefaultOpen(savedState === 'true');
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    // Save sidebar state to localStorage
    localStorage.setItem('sidebar_state', String(open));
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen} onOpenChange={handleOpenChange}>
      {children}
    </SidebarProvider>
  );
}
