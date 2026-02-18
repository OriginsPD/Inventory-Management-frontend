'use client';

import { useState, useEffect } from 'react';
import { fetchDevices, createDeviceReplacement } from '@/lib/api';
import { Device } from '@/types/devices';
import { CreateDeviceReplacementDto } from '@/types/device-replacement';

export default function ReplacementPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replacementForm, setReplacementForm] = useState<CreateDeviceReplacementDto>({
    oldDeviceId: '',
    newDeviceId: '',
    reason: '',
    replacementDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
  });
  const [replacementLoading, setReplacementLoading] = useState(false);
  const [replacementError, setReplacementError] = useState<string | null>(null);
  const [replacementSuccess, setReplacementSuccess] = useState<string | null>(null);


  useEffect(() => {
    async function loadData() {
      try {
        const fetchedDevices = await fetchDevices();
        setDevices(fetchedDevices);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReplacementForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReplacementLoading(true);
    setReplacementError(null);
    setReplacementSuccess(null);
    try {
      if (!replacementForm.oldDeviceId || !replacementForm.newDeviceId || !replacementForm.reason) {
        throw new Error("Please fill in all required fields.");
      }
      if (replacementForm.oldDeviceId === replacementForm.newDeviceId) {
          throw new Error("Old and new device cannot be the same.");
      }

      const processedReplacement = await createDeviceReplacement(replacementForm);
      setReplacementSuccess(`Replacement processed successfully! Record ID: ${processedReplacement.id}. Statuses updated.`);
      setReplacementForm({ // Reset form
        oldDeviceId: '',
        newDeviceId: '',
        reason: '',
        replacementDate: new Date().toISOString().slice(0, 16),
      });
      // Refresh devices list
      const updatedDevices = await fetchDevices();
      setDevices(updatedDevices);

    } catch (err: any) {
      setReplacementError(err.message);
    } finally {
      setReplacementLoading(false);
    }
  };

  const inStockDevices = devices.filter(d => d.status === 'IN_STOCK');
  const replaceableDevices = devices.filter(d => d.status !== 'REPLACED');


  if (loading) return <div className="p-6">Loading devices...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Device Replacement</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4">Process New Replacement</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="oldDeviceId" className="block text-sm font-medium text-gray-700 mb-1">Old Device (To be Replaced)</label>
            <select
              id="oldDeviceId"
              name="oldDeviceId"
              value={replacementForm.oldDeviceId}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select device to replace</option>
              {replaceableDevices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.imei} (Current Status: {device.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="newDeviceId" className="block text-sm font-medium text-gray-700 mb-1">New Device (IN_STOCK Replacement)</label>
            <select
              id="newDeviceId"
              name="newDeviceId"
              value={replacementForm.newDeviceId}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select replacement device</option>
              {inStockDevices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.imei} (Status: {device.status})
                </option>
              ))}
            </select>
            {inStockDevices.length === 0 && <p className="text-sm text-orange-500 mt-1">No IN_STOCK devices available for replacement.</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason for Replacement</label>
            <textarea
              id="reason"
              name="reason"
              placeholder="Explain why the device is being replaced..."
              value={replacementForm.reason}
              onChange={handleInputChange}
              rows={3}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="replacementDate" className="block text-sm font-medium text-gray-700 mb-1">Replacement Date (Optional)</label>
            <input
              type="datetime-local"
              id="replacementDate"
              name="replacementDate"
              value={replacementForm.replacementDate}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="md:col-span-2 p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={replacementLoading || replaceableDevices.length === 0 || inStockDevices.length === 0}
          >
            {replacementLoading ? 'Processing...' : 'Process Replacement'}
          </button>
        </form>
        {replacementError && <p className="text-red-500 text-sm mt-2">{replacementError}</p>}
        {replacementSuccess && <p className="text-green-600 text-sm mt-2">{replacementSuccess}</p>}
      </div>
    </div>
  );
}
