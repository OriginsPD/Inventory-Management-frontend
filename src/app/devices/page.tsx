'use client';

import { useState, useEffect } from 'react';
import { fetchDevices, fetchDeviceModels, refillStock } from '@/lib/api';
import { Device, DeviceStatus, StockRefillDto } from '@/types/devices';
import { DeviceModel } from '@/types/device-models';
import Link from 'next/link'; // For potentially linking to device details

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [refillForm, setRefillForm] = useState<StockRefillDto>({ modelId: '', quantity: 1 });
  const [refillLoading, setRefillLoading] = useState(false);
  const [refillError, setRefillError] = useState<string | null>(null);
  const [refillSuccess, setRefillSuccess] = useState<string | null>(null);

  const statuses: DeviceStatus[] = ['IN_STOCK', 'DISPATCHED', 'TESTING', 'DAMAGED', 'REPLACED', 'PROMOTIONAL'];

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDevices, fetchedModels] = await Promise.all([
          fetchDevices(),
          fetchDeviceModels(),
        ]);
        setDevices(fetchedDevices);
        setDeviceModels(fetchedModels);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRefillChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setRefillForm(prev => ({ ...prev, [name]: name === 'quantity' ? parseInt(value) : value }));
  };

  const handleRefillSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRefillLoading(true);
    setRefillError(null);
    setRefillSuccess(null);
    try {
      if (!refillForm.modelId) {
        throw new Error("Please select a device model for refill.");
      }
      if (refillForm.quantity <= 0) {
        throw new Error("Quantity must be positive.");
      }
      const createdDevices = await refillStock(refillForm);
      setDevices(prev => [...prev, ...createdDevices]);
      setRefillSuccess(`Successfully added ${createdDevices.length} devices.`);
      setRefillForm({ modelId: '', quantity: 1 });
    } catch (err: any) {
      setRefillError(err.message);
    } finally {
      setRefillLoading(false);
    }
  };


  const getModelName = (modelId: string) => {
    const model = deviceModels.find(m => m.id === modelId);
    return model ? `${model.brand} ${model.name}` : modelId;
  };

  const filteredDevices = devices.filter(device => {
    const matchesStatus = filterStatus === 'ALL' || device.status === filterStatus;
    const matchesSearch = searchTerm === '' || device.imei.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });


  if (loading) return <div className="p-6">Loading devices...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Devices Inventory</h1>

      {/* Stock Refill Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add Stock</h2>
        <form onSubmit={handleRefillSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="modelId" className="block text-sm font-medium text-gray-700 mb-1">Device Model</label>
            <select
              id="modelId"
              name="modelId"
              value={refillForm.modelId}
              onChange={handleRefillChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a model</option>
              {deviceModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.brand} {model.name} ({model.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              placeholder="Quantity"
              value={refillForm.quantity}
              onChange={handleRefillChange}
              min="1"
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="p-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            disabled={refillLoading}
          >
            {refillLoading ? 'Adding...' : 'Refill Stock'}
          </button>
        </form>
        {refillError && <p className="text-red-500 text-sm mt-2">{refillError}</p>}
        {refillSuccess && <p className="text-green-600 text-sm mt-2">{refillSuccess}</p>}
      </div>


      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full md:w-auto">
          <label htmlFor="search" className="sr-only">Search by IMEI</label>
          <input
            type="text"
            id="search"
            placeholder="Search by IMEI"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-full md:w-auto">
          <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Devices List Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Existing Devices</h2>
        {filteredDevices.length === 0 ? (
          <p className="text-gray-600">No devices found matching criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IMEI
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serial Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevices.map((device) => (
                  <tr key={device.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.imei}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getModelName(device.modelId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          device.status === 'IN_STOCK' ? 'bg-green-100 text-green-800' :
                          device.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                          device.status === 'DAMAGED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {device.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.serialNumber || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(device.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/devices/${device.id}`} className="text-blue-600 hover:text-blue-900">View/Edit</Link>
                    </td>
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
