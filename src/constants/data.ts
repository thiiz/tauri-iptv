import { NavItem } from '@/types';

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [] // Empty array as there are no child items for Dashboard
  },

  {
    title: 'Series',
    url: '/dashboard/series',
    icon: 'media',
    shortcut: ['s', 'e'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Account',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Profiles',
        url: '/dashboard/profiles',
        icon: 'userPen',
        shortcut: ['p', 'r']
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: 'settings',
        shortcut: ['s', 's']
      }
    ]
  }
];
