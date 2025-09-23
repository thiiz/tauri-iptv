'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Home,
  MonitorPlay,
  Search,
  Settings,
  Tv
} from 'lucide-react';
import { useState } from 'react';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { usePathname, useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Extract profile from pathname
  const profileMatch = pathname.match(/\/dashboard\/([^\/]+)/);
  const currentProfile = profileMatch ? profileMatch[1] : '';

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: `/dashboard/${currentProfile}`
    },
    {
      id: 'channels',
      label: 'Canais',
      icon: Tv,
      path: `/dashboard/${currentProfile}/channels`
    },
    {
      id: 'movies',
      label: 'Filmes',
      icon: Film,
      path: `/dashboard/${currentProfile}/movies`
    },
    {
      id: 'series',
      label: 'Séries',
      icon: MonitorPlay,
      path: `/dashboard/${currentProfile}/series`
    }
  ];

  const userItems = [
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      path: `/dashboard/${currentProfile}/settings`
    }
  ];

  return (
    <div className='bg-background flex h-screen'>
      {/* Sidebar */}
      <div
        className={cn(
          'bg-card flex flex-col border-r transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className='flex h-14 items-center border-b px-4'>
          {!sidebarCollapsed && (
            <div className='flex items-center gap-2'>
              <Tv className='text-primary h-6 w-6' />
              <span className='font-semibold'>IPTV Desktop</span>
            </div>
          )}
          <Button
            variant='ghost'
            size='sm'
            className={cn('ml-auto', sidebarCollapsed && 'mx-auto')}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className='h-4 w-4' />
            ) : (
              <ChevronLeft className='h-4 w-4' />
            )}
          </Button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className='p-4'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
              <Input placeholder='Buscar...' className='pl-8' />
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className='flex-1 px-2'>
          <div className='space-y-1 p-2'>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={pathname.includes(item.path) ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  onClick={() => router.push(item.path)}
                >
                  <Icon className='h-4 w-4' />
                  {!sidebarCollapsed && (
                    <span className='ml-2'>{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>

          <Separator className='my-4' />

          <div className='space-y-1 p-2'>
            {userItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={pathname.includes(item.path) ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  onClick={() => router.push(item.path)}
                >
                  <Icon className='h-4 w-4' />
                  {!sidebarCollapsed && (
                    <span className='ml-2'>{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Theme Toggle */}
        <div className='border-t p-4'>
          <div
            className={cn(
              'flex',
              sidebarCollapsed
                ? 'justify-center'
                : 'items-center justify-between'
            )}
          >
            <ModeToggle />
            {!sidebarCollapsed && (
              <div className='text-muted-foreground text-xs'>
                {currentProfile}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex flex-1 flex-col overflow-hidden'>{children}</div>
    </div>
  );
}
