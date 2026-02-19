'use client';

import { useState, useEffect } from 'react';
import { fetchDeviceReplacements, fetchDevices } from '@/lib/api';
import { DeviceReplacement } from '@/types/device-replacement';
import { Device } from '@/types/devices';

export default function ReplacementHistoryPage() {
  const [replacements, setReplacements] = useState<DeviceReplacement[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedReplacements, fetchedDevices] = await Promise.all([
          fetchDeviceReplacements(),
          fetchDevices(),
        ]);
        setReplacements(fetchedReplacements);
        setDevices(fetchedDevices);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getDeviceImei = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.imei : 'N/A';
  };

  if (loading) return <div className="p-6">Loading replacement history...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Device Replacement History</h1>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        {replacements.length === 0 ? (
          <p className="text-gray-600">No device replacement records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Replacement ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Old Device IMEI
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Device IMEI
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Replacement Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {replacements.map((replacement) => (
                  <tr key={replacement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{replacement.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getDeviceImei(replacement.oldDeviceId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getDeviceImei(replacement.newDeviceId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{replacement.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{replacement.replacementDate ? new Date(replacement.replacementDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(replacement.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



