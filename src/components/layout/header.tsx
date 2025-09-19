'use client';

import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '../breadcrumbs';
import { ProfileSwitcher } from '../profile/profile-switcher';
import SearchInput from '../search-input';
import { ThemeSelector } from '../theme-selector';
import { Separator } from '../ui/separator';
import { SidebarTrigger } from '../ui/sidebar';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import CtaGithub from './cta-github';

export default function Header() {
  const router = useRouter();

  const handleManageProfiles = () => {
    router.push('/dashboard/profiles');
  };

  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <ProfileSwitcher onManageProfiles={handleManageProfiles} />
        <CtaGithub />
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <ModeToggle />
        <ThemeSelector />
      </div>
    </header>
  );
}
