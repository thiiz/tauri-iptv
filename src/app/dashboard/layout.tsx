import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset } from '@/components/ui/sidebar';
import { ProfileProvider } from '@/contexts/profile-context';
import { SidebarProviderClient } from '@/components/layout/sidebar-provider-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn'
};

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <KBar>
      <ProfileProvider>
        <SidebarProviderClient>
          <AppSidebar />
          <SidebarInset>
            <Header />
            {/* page main content */}
            {children}
            {/* page main content ends */}
          </SidebarInset>
        </SidebarProviderClient>
      </ProfileProvider>
    </KBar>
  );
}
