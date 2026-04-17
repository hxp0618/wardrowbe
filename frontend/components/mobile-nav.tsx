'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Home, Shirt, Sparkles, LayoutGrid, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { nameKey: 'home' as const, href: '/dashboard', icon: Home },
  { nameKey: 'wardrobe' as const, href: '/dashboard/wardrobe', icon: Shirt },
  { nameKey: 'suggest' as const, href: '/dashboard/suggest', icon: Sparkles },
  { nameKey: 'outfits' as const, href: '/dashboard/outfits', icon: LayoutGrid },
  { nameKey: 'settings' as const, href: '/dashboard/settings', icon: Settings },
];

export function MobileNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {navigation.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.nameKey}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{t(item.nameKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
