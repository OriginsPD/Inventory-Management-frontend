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
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Device Models', href: '/device-models', icon: Layers },
    { name: 'Devices', href: '/devices', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Dispatch', href: '/dispatch', icon: Send },
    { name: 'Testing', href: '/testing/start', icon: CheckSquare },
    { name: 'Damage Log', href: '/damage/log', icon: AlertTriangle },
    { name: 'Replacements', href: '/replacements', icon: RefreshCw },
    { name: 'Promotions', href: '/promotions', icon: Send },
    { name: 'Reports', href: '/reports', icon: BarChart },
    { name: 'Audit Trail', href: '/audit', icon: Shield },
  ];

  return (
    <aside className="w-64 bg-zinc-950 text-zinc-400 h-screen fixed left-0 top-0 overflow-y-auto flex flex-col border-r border-zinc-800">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-950">
            <Package size={20} />
          </div>
          <span className="text-xl font-bold text-zinc-100 tracking-tight">IMS Pro</span>
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
                    ? "bg-zinc-800 text-zinc-100 shadow-sm" 
                    : "hover:bg-zinc-900 hover:text-zinc-200"
                )}
              >
                <item.icon size={18} className={cn(
                  "transition-colors",
                  isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-900">
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium">Internal Core Stable</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;



