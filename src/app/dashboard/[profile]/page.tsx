import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { notFound } from 'next/navigation';

interface DashboardPageProps {
  params: Promise<{
    profile: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { profile } = await params;

  // No server-side profile validation - let the client handle it
  // This avoids IndexedDB access on the server

  return <DashboardContent />;
}

// Disable static generation for dynamic profiles
export const dynamic = 'force-dynamic';
