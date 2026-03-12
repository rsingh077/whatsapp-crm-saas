'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  MessageSquare,
  Users,
  Zap,
  BarChart3,
  Settings,
  Send,
  Hotel,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/guests', label: 'Guests', icon: Users },
  { href: '/campaigns', label: 'Campaigns', icon: Send },
  { href: '/automation', label: 'Automation', icon: Zap },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const bottomNavItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex h-screen flex-col border-r bg-sidebar transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-[240px]',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-whatsapp text-white">
            <Hotel className="h-5 w-5" />
          </div>
          {!collapsed && <span className="text-lg font-bold">HotelCRM</span>}
        </div>

        {/* Organization */}
        {!collapsed && session?.user?.orgName && (
          <div className="border-b px-4 py-3">
            <p className="truncate text-xs font-medium text-muted-foreground">WORKSPACE</p>
            <p className="truncate text-sm font-semibold">{session.user.orgName}</p>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-2">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-whatsapp/10 text-whatsapp-dark'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                    collapsed && 'justify-center px-2',
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-whatsapp-dark')} />
                  {!collapsed && item.label}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>
        </ScrollArea>

        {/* Bottom section */}
        <div className="border-t px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-whatsapp/10 text-whatsapp-dark'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                  collapsed && 'justify-center px-2',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}

          <Separator className="my-2" />

          {/* User profile */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2',
              collapsed && 'justify-center px-2',
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback className="bg-whatsapp/20 text-xs text-whatsapp-dark">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{session?.user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{session?.user?.role}</p>
              </div>
            )}
            {!collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn('mt-1 w-full', collapsed && 'px-2')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
