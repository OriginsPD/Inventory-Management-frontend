'use client';

import { useState, useEffect } from 'react';
import { fetchDevices, startDeviceTest } from '@/lib/api';
import { Device } from '@/types/devices';
import { StartDeviceTestDto } from '@/types/device-testing';

export default function StartTestPage() {
  const [eligibleDevices, setEligibleDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [testForm, setTestForm] = useState<StartDeviceTestDto>({
    deviceId: '',
    handedTo: '',
    authCode: '',
  });
  const [startTestLoading, setStartTestLoading] = useState(false);
  const [startTestError, setStartTestError] = useState<string | null>(null);
  const [startTestSuccess, setStartTestSuccess] = useState<string | null>(null);


  useEffect(() => {
    async function loadData() {
      try {
        const fetchedDevices = await fetchDevices();
        setEligibleDevices(fetchedDevices.filter(d => d.status === 'IN_STOCK' || d.status === 'DISPATCHED'));
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
    setTestForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStartTestLoading(true);
    setStartTestError(null);
    setStartTestSuccess(null);
    try {
      if (!testForm.deviceId || !testForm.handedTo) {
        throw new Error("Please fill in all required fields.");
      }
      const startedTest = await startDeviceTest(testForm);
      setStartTestSuccess(`Test started successfully! Test ID: ${startedTest.id}. Device status updated to TESTING.`);
      setTestForm({ // Reset form
        deviceId: '',
        handedTo: '',
        authCode: '',
      });
      // Refresh devices list to reflect status change (device moved to TESTING)
      const updatedDevices = await fetchDevices();
      setEligibleDevices(updatedDevices.filter(d => d.status === 'IN_STOCK' || d.status === 'DISPATCHED'));

    } catch (err: any) {
      setStartTestError(err.message);
    } finally {
      setStartTestLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading eligible devices...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Start Device Test</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4">Start New Test</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-1">Device (IN_STOCK or DISPATCHED)</label>
            <select
              id="deviceId"
              name="deviceId"
              value={testForm.deviceId}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a device</option>
              {eligibleDevices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.imei} (Current Status: {device.status})
                </option>
              ))}
            </select>
            {eligibleDevices.length === 0 && <p className="text-sm text-orange-500 mt-1">No eligible devices available for testing.</p>}
          </div>

          <div>
            <label htmlFor="handedTo" className="block text-sm font-medium text-gray-700 mb-1">Handed To</label>
            <input
              type="text"
              id="handedTo"
              name="handedTo"
              placeholder="Name of person receiving device for test"
              value={testForm.handedTo}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 mb-1">Auth Code (Optional)</label>
            <input
              type="text"
              id="authCode"
              name="authCode"
              placeholder="Authorization code if applicable"
              value={testForm.authCode}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="md:col-span-2 p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={startTestLoading || eligibleDevices.length === 0}
          >
            {startTestLoading ? 'Starting Test...' : 'Start Test'}
          </button>
        </form>
        {startTestError && <p className="text-red-500 text-sm mt-2">{startTestError}</p>}
        {startTestSuccess && <p className="text-green-600 text-sm mt-2">{startTestSuccess}</p>}
      </div>
    </div>
  );
}
