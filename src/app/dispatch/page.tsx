'use client';

import { useState, useEffect } from 'react';
import { fetchDevices, fetchCustomers, createDispatch } from '@/lib/api';
import { Device } from '@/types/devices';
import { Customer } from '@/types/customers';
import { CreateDispatchDto } from '@/types/dispatches';

export default function DispatchPage() {
  const [inStockDevices, setInStockDevices] = useState<Device[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dispatchForm, setDispatchForm] = useState<CreateDispatchDto>({
    deviceId: '',
    customerId: '',
    dispatchDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    dispatchedBy: '',
    location: '',
  });
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);


  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDevices, fetchedCustomers] = await Promise.all([
          fetchDevices(),
          fetchCustomers(),
        ]);
        setInStockDevices(fetchedDevices.filter(d => d.status === 'IN_STOCK'));
        setCustomers(fetchedCustomers);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDispatchForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDispatchLoading(true);
    setDispatchError(null);
    setDispatchSuccess(null);
    try {
      if (!dispatchForm.deviceId || !dispatchForm.customerId || !dispatchForm.dispatchedBy || !dispatchForm.dispatchDate) {
        throw new Error("Please fill in all required fields.");
      }
      const createdDispatch = await createDispatch(dispatchForm);
      setDispatchSuccess(`Dispatch created successfully! ID: ${createdDispatch.id}`);
      setDispatchForm({ // Reset form and update device list
        deviceId: '',
        customerId: '',
        dispatchDate: new Date().toISOString().slice(0, 16),
        dispatchedBy: '',
        location: '',
      });
      // Refresh devices to reflect status change
      const updatedDevices = await fetchDevices();
      setInStockDevices(updatedDevices.filter(d => d.status === 'IN_STOCK'));

    } catch (err: any) {
      setDispatchError(err.message);
    } finally {
      setDispatchLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading dispatch data...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dispatch Device</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Dispatch</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-1">Device (IN_STOCK)</label>
            <select
              id="deviceId"
              name="deviceId"
              value={dispatchForm.deviceId}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a device</option>
              {inStockDevices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.imei} (Status: {device.status})
                </option>
              ))}
            </select>
            {inStockDevices.length === 0 && <p className="text-sm text-orange-500 mt-1">No IN_STOCK devices available for dispatch.</p>}
          </div>

          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              id="customerId"
              name="customerId"
              value={dispatchForm.customerId}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email || 'N/A'})
                </option>
              ))}
            </select>
            {customers.length === 0 && <p className="text-sm text-orange-500 mt-1">No customers available. Please add some first.</p>}
          </div>

          <div>
            <label htmlFor="dispatchDate" className="block text-sm font-medium text-gray-700 mb-1">Dispatch Date</label>
            <input
              type="datetime-local"
              id="dispatchDate"
              name="dispatchDate"
              value={dispatchForm.dispatchDate}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="dispatchedBy" className="block text-sm font-medium text-gray-700 mb-1">Dispatched By</label>
            <input
              type="text"
              id="dispatchedBy"
              name="dispatchedBy"
              placeholder="Name of dispatcher"
              value={dispatchForm.dispatchedBy}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="Dispatch location"
              value={dispatchForm.location}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="md:col-span-2 p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={dispatchLoading || inStockDevices.length === 0 || customers.length === 0}
          >
            {dispatchLoading ? 'Dispatching...' : 'Dispatch Device'}
          </button>
        </form>
        {dispatchError && <p className="text-red-500 text-sm mt-2">{dispatchError}</p>}
        {dispatchSuccess && <p className="text-green-600 text-sm mt-2">{dispatchSuccess}</p>}
      </div>
    </div>
  );
}
