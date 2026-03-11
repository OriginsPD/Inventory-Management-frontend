'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Send,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
  BarChart,
  Shield,
  Users,
  Layers,
  RotateCcw,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

const Sidebar = () => {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Device Models', href: '/device-models', icon: Layers },
    { name: 'Devices', href: '/devices', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Dispatch', href: '/dispatch', icon: Send },
    { name: 'Testing', href: '/testing/start', icon: CheckSquare },
    { name: 'Damage Log', href: '/damage/log', icon: AlertTriangle },
    { name: 'Replacements', href: '/replacements', icon: RefreshCw },
    { name: 'RMA', href: '/rma', icon: RotateCcw },
    { name: 'Promotions', href: '/promotions', icon: Send },
    { name: 'Reports', href: '/reports', icon: BarChart },
    { name: 'Audit Trail', href: '/audit', icon: Shield },
  ];

  return (
    <aside className="w-64 glass h-screen fixed left-0 top-0 overflow-y-auto flex flex-col border-r transition-colors duration-300">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 mb-10 px-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-primary-foreground shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
            <Package size={20} />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">IMS Pro</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/30 ring-1 ring-primary/40"
                    : "text-zinc-500 hover:bg-orange-50/80 hover:text-primary dark:text-slate-400 dark:hover:bg-primary/10"
                )}
              >
                <item.icon size={18} className={cn(
                  "transition-colors",
                  isActive ? "text-white" : "text-zinc-400 group-hover:text-primary"
                )} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}

          {(session?.user as any)?.role === 'ADMIN' && (
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group",
                pathname.startsWith('/admin/users')
                  ? "bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/30 ring-1 ring-primary/40"
                  : "text-zinc-500 hover:bg-orange-50/80 hover:text-primary dark:text-slate-400 dark:hover:bg-primary/10"
              )}
            >
              <UserCog size={18} className={cn(
                "transition-colors",
                pathname.startsWith('/admin/users') ? "text-white" : "text-zinc-400 group-hover:text-primary"
              )} />
              <span className="text-sm font-medium">User Management</span>
            </Link>
          )}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border/50">
        <div className="bg-white/40 dark:bg-white/5 rounded-xl p-4 border border-white/30 dark:border-white/10 backdrop-blur-sm">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-500 font-medium">Internal Core Stable</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
