'use client';

import { useState, useEffect } from 'react';
import { 
  fetchInventoryByModelReport, 
  fetchStatusDistributionReport, 
  fetchDispatchReportSummary, 
  fetchDamageReportSummary 
} from '@/lib/api';
import { 
  InventoryByModelReport, 
  StatusDistributionReport, 
  DispatchReportSummary, 
  DamageReportSummary 
} from '@/types/reports';

export default function ReportsPage() {
  const [inventoryReport, setInventoryByModel] = useState<InventoryByModelReport[]>([]);
  const [statusReport, setStatusDistribution] = useState<StatusDistributionReport[]>([]);
  const [dispatchReport, setDispatchSummary] = useState<DispatchReportSummary[]>([]);
  const [damageReport, setDamageSummary] = useState<DamageReportSummary[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const [inv, stat, disp, dmg] = await Promise.all([
          fetchInventoryByModelReport(),
          fetchStatusDistributionReport(),
          fetchDispatchReportSummary(),
          fetchDamageReportSummary(),
        ]);
        setInventoryByModel(inv);
        setStatusDistribution(stat);
        setDispatchSummary(disp);
        setDamageSummary(dmg);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) return <div className="p-6 text-gray-600">Generating reports...</div>;
  if (error) return <div className="p-6 text-red-500 font-medium">Error loading reports: {error}</div>;

  const totalDevices = statusReport.reduce((acc, curr) => acc + Number(curr.count), 0);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Inventory Reports</h1>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Assets</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalDevices}</p>
        </div>
        {statusReport.map((stat) => (
          <div key={stat.status} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium capitalize">{stat.status.replace(/_/g, ' ')}</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stat.count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory By Model */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-4">Inventory By Model</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {inventoryReport.length === 0 ? (
              <p className="text-gray-500 italic">No inventory data available.</p>
            ) : (
              inventoryReport.map((item) => (
                <div key={item.modelId} className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">{item.brand} {item.modelName}</span>
                    <span className="text-gray-900 font-bold">{item.totalStock}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(Number(item.totalStock) / totalDevices) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Damage Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-4">Recent Damage Logs</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {damageReport.length === 0 ? (
              <p className="text-gray-500 italic">No damage reports logged.</p>
            ) : (
              damageReport.map((dmg) => (
                <div key={dmg.id} className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-red-800">Record ID: {dmg.id.substring(0, 8)}...</span>
                    <span className="text-xs text-red-600">{dmg.reportedDate ? new Date(dmg.reportedDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <p className="text-sm text-red-700 italic">"{dmg.issueDescription}"</p>
                  <p className="text-xs text-red-500 mt-2 text-right">— Reported by: {dmg.reportedBy || 'Unknown'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dispatch History Table (Summary) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-4">Dispatch Summary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatcher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assets Dispatched</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dispatchReport.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 italic">No dispatches recorded yet.</td>
                </tr>
              ) : (
                dispatchReport.slice(0, 10).map((dispatch) => (
                  <tr key={dispatch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(dispatch.dispatchDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dispatch.dispatchedBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dispatch.location || 'Central Warehouse'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dispatch.id.substring(0, 8)}...</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
