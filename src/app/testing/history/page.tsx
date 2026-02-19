'use client';

import { useState, useEffect } from 'react';
import { fetchDeviceTests, fetchDevices } from '@/lib/api';
import { DeviceTest } from '@/types/device-testing';
import { Device } from '@/types/devices';

export default function TestHistoryPage() {
  const [deviceTests, setDeviceTests] = useState<DeviceTest[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDeviceTests, fetchedDevices] = await Promise.all([
          fetchDeviceTests(),
          fetchDevices(),
        ]);
        setDeviceTests(fetchedDeviceTests);
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

  if (loading) return <div className="p-6">Loading test history...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Device Test History</h1>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        {deviceTests.length === 0 ? (
          <p className="text-gray-600">No device test records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device IMEI
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handed To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {deviceTests.map((test) => (
                  <tr key={test.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{test.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getDeviceImei(test.deviceId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.handedTo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(test.testDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          test.result === 'PASS' ? 'bg-green-100 text-green-800' :
                          test.result === 'FAIL' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-foreground'
                      }`}>
                        {test.result || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.notes || 'N/A'}</td>
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



