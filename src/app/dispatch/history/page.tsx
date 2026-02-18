'use client';

import { useState, useEffect } from 'react';
import { fetchDispatches, fetchDevices, fetchCustomers } from '@/lib/api';
import { Dispatch } from '@/types/dispatches';
import { Device } from '@/types/devices';
import { Customer } from '@/types/customers';

export default function DispatchHistoryPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDispatches, fetchedDevices, fetchedCustomers] = await Promise.all([
          fetchDispatches(),
          fetchDevices(),
          fetchCustomers(),
        ]);
        setDispatches(fetchedDispatches);
        setDevices(fetchedDevices);
        setCustomers(fetchedCustomers);
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

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'N/A';
  };

  if (loading) return <div className="p-6">Loading dispatch history...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dispatch History</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        {dispatches.length === 0 ? (
          <p className="text-gray-600">No dispatch records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispatch ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device IMEI
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispatched By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispatch Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dispatches.map((dispatch) => (
                  <tr key={dispatch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dispatch.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getDeviceImei(dispatch.deviceId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCustomerName(dispatch.customerId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dispatch.dispatchedBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(dispatch.dispatchDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dispatch.location || 'N/A'}</td>
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
