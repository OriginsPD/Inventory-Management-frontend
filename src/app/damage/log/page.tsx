'use client';

import { useState, useEffect } from 'react';
import { fetchDevices, createDeviceDamage } from '@/lib/api';
import { Device } from '@/types/devices';
import { CreateDeviceDamageDto } from '@/types/device-damage';

export default function LogDamagePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [damageForm, setDamageForm] = useState<CreateDeviceDamageDto>({
    deviceId: '',
    issueDescription: '',
    reportedBy: '',
    reportedDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
  });
  const [logDamageLoading, setLogDamageLoading] = useState(false);
  const [logDamageError, setLogDamageError] = useState<string | null>(null);
  const [logDamageSuccess, setLogDamageSuccess] = useState<string | null>(null);


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
    setDamageForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLogDamageLoading(true);
    setLogDamageError(null);
    setLogDamageSuccess(null);
    try {
      if (!damageForm.deviceId || !damageForm.issueDescription) {
        throw new Error("Please fill in all required fields.");
      }
      const loggedDamage = await createDeviceDamage(damageForm);
      setLogDamageSuccess(`Damage logged successfully! Record ID: ${loggedDamage.id}. Device status updated to DAMAGED.`);
      setDamageForm({ // Reset form
        deviceId: '',
        issueDescription: '',
        reportedBy: '',
        reportedDate: new Date().toISOString().slice(0, 16),
      });
      // Refresh devices list to reflect status change
      const updatedDevices = await fetchDevices();
      setDevices(updatedDevices);

    } catch (err: any) {
      setLogDamageError(err.message);
    } finally {
      setLogDamageLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading devices...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Log Device Damage</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4">Record New Damage</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-1">Device</label>
            <select
              id="deviceId"
              name="deviceId"
              value={damageForm.deviceId}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a device</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.imei} (Status: {device.status})
                </option>
              ))}
            </select>
            {devices.length === 0 && <p className="text-sm text-orange-500 mt-1">No devices available.</p>}
          </div>

          <div>
            <label htmlFor="reportedBy" className="block text-sm font-medium text-gray-700 mb-1">Reported By (Optional)</label>
            <input
              type="text"
              id="reportedBy"
              name="reportedBy"
              placeholder="Name of person reporting"
              value={damageForm.reportedBy}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="issueDescription" className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
            <textarea
              id="issueDescription"
              name="issueDescription"
              placeholder="Describe the damage..."
              value={damageForm.issueDescription}
              onChange={handleInputChange}
              rows={4}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="reportedDate" className="block text-sm font-medium text-gray-700 mb-1">Reported Date (Optional)</label>
            <input
              type="datetime-local"
              id="reportedDate"
              name="reportedDate"
              value={damageForm.reportedDate}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="md:col-span-2 p-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={logDamageLoading || devices.length === 0}
          >
            {logDamageLoading ? 'Logging Damage...' : 'Log Damage'}
          </button>
        </form>
        {logDamageError && <p className="text-red-500 text-sm mt-2">{logDamageError}</p>}
        {logDamageSuccess && <p className="text-green-600 text-sm mt-2">{logDamageSuccess}</p>}
      </div>
    </div>
  );
}
