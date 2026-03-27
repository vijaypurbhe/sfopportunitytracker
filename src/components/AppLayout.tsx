import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, LayoutDashboard, Kanban, List, Building2,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles, ShieldCheck
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/opportunities', icon: List, label: 'Opportunities' },
  { to: '/accounts', icon: Building2, label: 'Accounts' },
  { to: '/gates', icon: ShieldCheck, label: 'Approval Gates' },
  { to: '/ai-insights', icon: Sparkles, label: 'AI Insights' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const queryClient = useQueryClient();

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  // Realtime notifications
  useState(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r transition-all duration-300 bg-sidebar text-sidebar-foreground",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex items-center gap-2 p-4 border-b border-sidebar-border">
          <BarChart3 className="h-7 w-7 text-sidebar-primary shrink-0" />
          {!collapsed && <span className="text-lg font-bold text-sidebar-primary-foreground">Pipeline CRM</span>}
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}>
                <div className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="flex-1">{item.label}</span>
                  )}
                  {!collapsed && item.label === 'Notifications' && unreadCount && unreadCount > 0 ? (
                    <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center text-xs">
                      {unreadCount}
                    </Badge>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-2 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span className="ml-2">Collapse</span></>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
