'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navItems } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useIPTVStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  IconBell,
  IconChevronRight,
  IconCreditCard,
  IconPhotoUp,
  IconUserCircle,
  IconSearch,
  IconSettings,
  IconHome,
  IconMenu2,
  IconX,
  IconMovie,
  IconDeviceTv,
  IconHeartRateMonitor
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
import { Input } from '@/components/ui/input';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
export const company = {
  name: 'Acme Inc',
  logo: IconPhotoUp,
  plan: 'Enterprise'
};

const tenants = [
  { id: '1', name: 'Acme Inc' },
  { id: '2', name: 'Beta Corp' },
  { id: '3', name: 'Gamma Ltd' }
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { currentProfileId } = useIPTVStore();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const router = useRouter();

  // Helper function to build correct URLs with profile ID
  const buildUrl = (url: string) => {
    // Se URL for /dashboard/profile, redirecionar para /dashboard/profiles
    if (url === '/dashboard/profile') {
      return `/dashboard/profiles`;
    }

    // If URL starts with /dashboard/ and we have a current profile
    if (
      url.startsWith('/dashboard/') &&
      currentProfileId &&
      !url.includes('[profile]')
    ) {
      // Replace /dashboard/ with /dashboard/[profile]/
      return url.replace('/dashboard/', `/dashboard/${currentProfileId}/`);
    }
    return url;
  };

  const handleSwitchTenant = (_tenantId: string) => {
    // Tenant switching functionality would be implemented here
  };

  const activeTenant = tenants[0];

  // Extract profile from pathname
  const profileMatch = pathname.match(/\/dashboard\/([^\/]+)/);
  const currentProfile = profileMatch ? profileMatch[1] : '';

  // Navigation items with profile-aware paths
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: IconHome,
      path: `/dashboard/${currentProfile}`
    },
    {
      id: 'channels',
      label: 'Canais',
      icon: IconDeviceTv,
      path: `/dashboard/${currentProfile}/channels`
    },
    {
      id: 'movies',
      label: 'Filmes',
      icon: IconMovie,
      path: `/dashboard/${currentProfile}/movies`
    },
    {
      id: 'series',
      label: 'Séries',
      icon: IconHeartRateMonitor,
      path: `/dashboard/${currentProfile}/series`
    }
  ];

  const userItems = [
    {
      id: 'settings',
      label: 'Configurações',
      icon: IconSettings,
      path: `/dashboard/${currentProfile}/settings`
    }
  ];

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar
      collapsible='icon'
      className={cn(
        'transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarHeader>
        <div className='flex h-14 items-center border-b px-4'>
          {!sidebarCollapsed && (
            <div className='flex items-center gap-2'>
              <IconDeviceTv className='text-primary h-6 w-6' />
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
              <IconChevronRight className='h-4 w-4' />
            ) : (
              <IconMenu2 className='h-4 w-4' />
            )}
          </Button>
        </div>
        {!sidebarCollapsed && (
          <div className='p-4'>
            <div className='relative'>
              <IconSearch className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
              <Input
                placeholder='Buscar...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <ScrollArea className='flex-1 px-2'>
          <div className='space-y-1 p-2'>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={pathname.includes(item.path)}
                  >
                    <Link href={item.path}>
                      <Icon className='h-4 w-4' />
                      {!sidebarCollapsed && (
                        <span className='ml-2'>{item.label}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </div>

          {!sidebarCollapsed && <Separator className='my-4' />}

          <div className='space-y-1 p-2'>
            {userItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={pathname.includes(item.path)}
                  >
                    <Link href={item.path}>
                      <Icon className='h-4 w-4' />
                      {!sidebarCollapsed && (
                        <span className='ml-2'>{item.label}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </div>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
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
                {currentProfile || 'Sem perfil'}
              </div>
            )}
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
