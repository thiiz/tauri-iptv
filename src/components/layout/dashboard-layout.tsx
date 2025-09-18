'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useIPTVStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Film,
  History,
  Home,
  MonitorPlay,
  Search,
  Settings,
  Star,
  Tv
} from 'lucide-react';
import { useState } from 'react';
import { ModeToggle } from './ThemeToggle/theme-toggle';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { currentView, setCurrentView, userProfile, serverInfo } = useIPTVStore();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'channels', label: 'Canais', icon: Tv },
    { id: 'movies', label: 'Filmes', icon: Film },
    { id: 'shows', label: 'Séries', icon: MonitorPlay },
  ];

  const userItems = [
    { id: 'favorites', label: 'Favoritos', icon: Star },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="flex h-14 items-center border-b px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Tv className="h-6 w-6 text-primary" />
              <span className="font-semibold">IPTV Desktop</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn("ml-auto", sidebarCollapsed && "mx-auto")}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-8" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 p-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  onClick={() => setCurrentView(item.id as any)}
                >
                  <Icon className="h-4 w-4" />
                  {!sidebarCollapsed && (
                    <span className="ml-2">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1 p-2">
            {userItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  onClick={() => setCurrentView(item.id as any)}
                >
                  <Icon className="h-4 w-4" />
                  {!sidebarCollapsed && (
                    <span className="ml-2">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        {/* User Info */}
        {!sidebarCollapsed && userProfile && (
          <div className="border-t p-4">
            <div className="text-sm">
              <div className="font-medium">{userProfile.username}</div>
              <div className="text-muted-foreground">
                Expira: {new Date(userProfile.expDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        <div className="border-t p-4">
          <div className={cn("flex", sidebarCollapsed ? "justify-center" : "justify-between items-center")}>
            <ModeToggle />
            {!sidebarCollapsed && serverInfo && (
              <div className="text-xs text-muted-foreground">
                {serverInfo.url}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}