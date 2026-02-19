'use client';

import { useState, useEffect } from 'react';
import { fetchDeviceDamages, fetchDevices } from '@/lib/api';
import { DeviceDamage } from '@/types/device-damage';
import { Device } from '@/types/devices';

export default function DamageHistoryPage() {
  const [deviceDamages, setDeviceDamages] = useState<DeviceDamage[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDeviceDamages, fetchedDevices] = await Promise.all([
          fetchDeviceDamages(),
          fetchDevices(),
        ]);
        setDeviceDamages(fetchedDeviceDamages);
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

  if (loading) return <div className="p-6">Loading damage history...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Device Damage History</h1>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        {deviceDamages.length === 0 ? (
          <p className="text-gray-600">No device damage records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Damage ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device IMEI
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Logged At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {deviceDamages.map((damage) => (
                  <tr key={damage.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{damage.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getDeviceImei(damage.deviceId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{damage.issueDescription}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{damage.reportedBy || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{damage.reportedDate ? new Date(damage.reportedDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(damage.createdAt).toLocaleDateString()}</td>
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



