'use client';

import Link from 'next/link';
import { Home, Package, Send, CheckSquare, AlertTriangle, RefreshCw, BarChart, Shield, User } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 overflow-y-auto flex flex-col">
      <div className="p-4 flex-1">
        <h1 className="text-2xl font-bold mb-8 text-blue-500">IMS Admin</h1>
        <nav className="space-y-2">
          <Link href="/" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/device-models" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <Package size={20} />
            <span>Device Models</span>
          </Link>
          <Link href="/devices" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <Package size={20} />
            <span>Devices</span>
          </Link>
          <Link href="/customers" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <User size={20} />
            <span>Customers</span>
          </Link>
          <Link href="/dispatch" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <Send size={20} />
            <span>Dispatch</span>
          </Link>
          <Link href="/testing/start" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <CheckSquare size={20} />
            <span>Start Test</span>
          </Link>
          <Link href="/testing/complete" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <CheckSquare size={20} />
            <span>Complete Test</span>
          </Link>
          <Link href="/damage/log" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <AlertTriangle size={20} />
            <span>Log Damage</span>
          </Link>
          <Link href="/replacements" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <RefreshCw size={20} />
            <span>Replacements</span>
          </Link>
          <Link href="/promotions" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <Send size={20} />
            <span>Promotions</span>
          </Link>
          <Link href="/reports" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <BarChart size={20} />
            <span>Reports</span>
          </Link>
          <Link href="/audit" className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-md transition-colors">
            <Shield size={20} />
            <span>Audit Trail</span>
          </Link>
        </nav>
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700 text-center">
        <p className="text-xs text-gray-500">Inventory Management System v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
