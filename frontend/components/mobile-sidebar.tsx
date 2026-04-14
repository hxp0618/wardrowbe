'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { X, Home, Shirt, Sparkles, Layers, History, BarChart3, Brain, Settings, Users, Bell, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { nameKey: 'dashboard' as const, href: '/dashboard', icon: Home },
  { nameKey: 'wardrobe' as const, href: '/dashboard/wardrobe', icon: Shirt },
  { nameKey: 'suggestOutfit' as const, href: '/dashboard/suggest', icon: Sparkles },
  { nameKey: 'pairings' as const, href: '/dashboard/pairings', icon: Layers },
  { nameKey: 'history' as const, href: '/dashboard/history', icon: History },
  { nameKey: 'familyFeed' as const, href: '/dashboard/family/feed', icon: HeartHandshake },
  { nameKey: 'analytics' as const, href: '/dashboard/analytics', icon: BarChart3 },
  { nameKey: 'aiLearning' as const, href: '/dashboard/learning', icon: Brain },
];

const secondaryNavigation = [
  { nameKey: 'family' as const, href: '/dashboard/family', icon: Users },
  { nameKey: 'notifications' as const, href: '/dashboard/notifications', icon: Bell },
  { nameKey: 'settings' as const, href: '/dashboard/settings', icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const pathname = usePathname();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <div className={cn('lg:hidden', !open && 'pointer-events-none')}>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-card transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          type="button"
          className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <span className="sr-only">{tc('close')}</span>
          <X className="h-6 w-6" />
        </button>

        <div className="flex h-full flex-col gap-y-5 overflow-y-auto px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
              <img src="/logo.svg" alt={tc('appName')} className="h-8 w-8" />
              <span className="text-xl font-bold">{tc('appName')}</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <li key={item.nameKey}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                          {t(item.nameKey)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li>
                <div className="text-xs font-semibold leading-6 text-muted-foreground">
                  {t('settingsSection')}
                </div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {secondaryNavigation.map((item) => {
                    const matchesPath = pathname === item.href || pathname.startsWith(item.href + '/');
                    const claimedByPrimary = navigation.some(
                      (primary) => pathname === primary.href || pathname.startsWith(primary.href + '/')
                    );
                    const isActive = matchesPath && !claimedByPrimary;
                    return (
                      <li key={item.nameKey}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                          {t(item.nameKey)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
