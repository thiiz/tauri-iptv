'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/profiles': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Profiles', link: '/dashboard/profiles' }
  ],
  '/dashboard/settings': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Settings', link: '/dashboard/settings' }
  ]
  // Add more custom mappings as needed
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);

    // Handle profile-based routes (/dashboard/[profile]/...)
    if (segments[0] === 'dashboard' && segments[1] && segments.length > 2) {
      const profileId = segments[1];
      const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', link: '/dashboard' },
        { title: 'Profile', link: `/dashboard/${profileId}` }
      ];

      // Add remaining segments
      for (let i = 2; i < segments.length; i++) {
        const segment = segments[i];
        const title = formatSegmentTitle(segment);
        const path = `/dashboard/${profileId}/${segments.slice(2, i + 1).join('/')}`;
        breadcrumbs.push({ title, link: path });
      }

      return breadcrumbs;
    }

    // Handle simple dashboard routes
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: formatSegmentTitle(segment),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}

function formatSegmentTitle(segment: string): string {
  // Handle IDs and special cases
  if (segment.match(/^\d+$/)) {
    return `ID: ${segment}`;
  }

  // Handle kebab-case and camelCase
  return segment
    .replace(/([A-Z])/g, ' $1')
    .replace(/-/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}
