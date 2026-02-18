'use client';

import { useState, useEffect } from 'react';
import { fetchStatusDistributionReport, fetchInventoryByModelReport } from '@/lib/api';
import { StatusDistributionReport, InventoryByModelReport } from '@/types/reports';
import Link from 'next/link';

export default function Home() {
  const [statusReport, setStatusReport] = useState<StatusDistributionReport[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryByModelReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [stat, inv] = await Promise.all([
          fetchStatusDistributionReport(),
          fetchInventoryByModelReport()
        ]);
        setStatusReport(stat);
        setInventoryReport(inv);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const getCount = (status: string) => {
    return statusReport.find(s => s.status === status)?.count || 0;
  };

  const totalAssets = statusReport.reduce((acc, curr) => acc + Number(curr.count), 0);

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Assets</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalAssets}</p>
          <div className="mt-4 text-blue-600 text-sm font-medium">All registered devices</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">In Stock</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{getCount('IN_STOCK')}</p>
          <div className="mt-4 text-gray-500 text-sm">Available for dispatch</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Dispatched</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{getCount('DISPATCHED')}</p>
          <div className="mt-4 text-gray-500 text-sm">Currently with customers</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Under Testing</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{getCount('TESTING')}</p>
          <div className="mt-4 text-gray-500 text-sm">Technician assigned</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Levels by Model</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b">
                  <th className="pb-3">Model</th>
                  <th className="pb-3">Brand</th>
                  <th className="pb-3 text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventoryReport.length === 0 ? (
                  <tr><td colSpan={3} className="py-4 text-center text-gray-500">No stock data</td></tr>
                ) : (
                  inventoryReport.slice(0, 5).map((item) => (
                    <tr key={item.modelId}>
                      <td className="py-3 text-sm font-medium text-gray-700">{item.modelName}</td>
                      <td className="py-3 text-sm text-gray-500">{item.brand}</td>
                      <td className="py-3 text-sm text-gray-900 font-bold text-right">{item.totalStock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <Link href="/reports" className="text-blue-600 text-sm font-medium hover:underline">View full report →</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <Link href="/dispatch" className="flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors">
              Dispatch Asset
            </Link>
            <Link href="/devices" className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors">
              Add New Stock
            </Link>
            <Link href="/testing/start" className="flex items-center justify-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium transition-colors">
              Start QC Test
            </Link>
            <Link href="/damage/log" className="flex items-center justify-center p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors">
              Report Damage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
