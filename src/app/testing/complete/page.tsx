'use client';

import { useState, useEffect } from 'react';
import { fetchDevices, fetchDeviceTests, completeDeviceTest } from '@/lib/api';
import { Device } from '@/types/devices';
import { DeviceTest, CompleteDeviceTestDto, TestResult } from '@/types/device-testing';

export default function CompleteTestPage() {
  const [testingDevices, setTestingDevices] = useState<Device[]>([]);
  const [pendingTests, setPendingTests] = useState<DeviceTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [completeForm, setCompleteForm] = useState<CompleteDeviceTestDto>({
    testId: '',
    result: 'PASS', // Default to PASS
    notes: '',
  });
  const [completeTestLoading, setCompleteTestLoading] = useState(false);
  const [completeTestError, setCompleteTestError] = useState<string | null>(null);
  const [completeTestSuccess, setCompleteTestSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDevices, fetchedTests] = await Promise.all([
          fetchDevices(),
          fetchDeviceTests(),
        ]);
        const devicesInTesting = fetchedDevices.filter(d => d.status === 'TESTING');
        setTestingDevices(devicesInTesting);
        
        // Filter tests that are associated with devices in 'TESTING' status and don't have a result yet
        const testsWithoutResult = fetchedTests.filter(
            (test) => devicesInTesting.some(device => device.id === test.deviceId) && !test.result
        );
        setPendingTests(testsWithoutResult);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompleteForm(prev => ({ ...prev, [name]: value as TestResult })); // Cast value to TestResult
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCompleteTestLoading(true);
    setCompleteTestError(null);
    setCompleteTestSuccess(null);
    try {
      if (!completeForm.testId || !completeForm.result) {
        throw new Error("Please select a test and its result.");
      }
      const completedTest = await completeDeviceTest(completeForm);
      setCompleteTestSuccess(`Test ID ${completedTest.id} completed as ${completedTest.result}. Device status updated.`);
      setCompleteForm({ // Reset form
        testId: '',
        result: 'PASS',
        notes: '',
      });
      // Refresh data to reflect changes
      const [updatedDevices, updatedTests] = await Promise.all([
        fetchDevices(),
        fetchDeviceTests(),
      ]);
      const devicesInTesting = updatedDevices.filter(d => d.status === 'TESTING');
      setTestingDevices(devicesInTesting);
      const testsWithoutResult = updatedTests.filter(
          (test) => devicesInTesting.some(device => device.id === test.deviceId) && !test.result
      );
      setPendingTests(testsWithoutResult);

    } catch (err: any) {
      setCompleteTestError(err.message);
    } finally {
      setCompleteTestLoading(false);
    }
  };

  const getDeviceImei = (deviceId: string) => {
    const device = testingDevices.find(d => d.id === deviceId);
    return device ? device.imei : 'N/A';
  };

  if (loading) return <div className="p-6">Loading pending tests...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Complete Device Test</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4">Complete Test Result</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="testId" className="block text-sm font-medium text-gray-700 mb-1">Select Test</label>
            <select
              id="testId"
              name="testId"
              value={completeForm.testId}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a test to complete</option>
              {pendingTests.map(test => (
                <option key={test.id} value={test.id}>
                  Test ID: {test.id.substring(0, 8)}... - Device IMEI: {getDeviceImei(test.deviceId)} - Handed To: {test.handedTo}
                </option>
              ))}
            </select>
            {pendingTests.length === 0 && <p className="text-sm text-orange-500 mt-1">No pending tests to complete.</p>}
          </div>

          <div>
            <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-1">Test Result</label>
            <select
              id="result"
              name="result"
              value={completeForm.result}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Add any notes about the test result..."
              value={completeForm.notes}
              onChange={handleInputChange}
              rows={3}
              className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <button
            type="submit"
            className="md:col-span-2 p-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            disabled={completeTestLoading || pendingTests.length === 0}
          >
            {completeTestLoading ? 'Completing Test...' : 'Complete Test'}
          </button>
        </form>
        {completeTestError && <p className="text-red-500 text-sm mt-2">{completeTestError}</p>}
        {completeTestSuccess && <p className="text-green-600 text-sm mt-2">{completeTestSuccess}</p>}
      </div>
    </div>
  );
}
