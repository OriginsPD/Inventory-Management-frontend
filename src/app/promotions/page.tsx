'use client';

import { useState, useEffect } from 'react';
import { fetchDevices, fetchPromotions, createPromotion } from '@/lib/api';
import { Device } from '@/types/devices';
import { Promotion, CreatePromotionDto } from '@/types/promotions';

export default function PromotionsPage() {
  const [inStockDevices, setInStockDevices] = useState<Device[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [promoForm, setPromoForm] = useState<CreatePromotionDto>({
    deviceId: '',
    promotionType: '',
    approvedBy: '',
    promotionDate: new Date().toISOString().slice(0, 16),
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDevices, fetchedPromos] = await Promise.all([
          fetchDevices(),
          fetchPromotions(),
        ]);
        setInStockDevices(fetchedDevices.filter(d => d.status === 'IN_STOCK'));
        setPromotions(fetchedPromos);
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
    setPromoForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createPromotion(promoForm);
      setPromotions(prev => [created, ...prev]);
      setSuccess(`Promotion created successfully for device ${promoForm.deviceId}`);
      setPromoForm({
        deviceId: '',
        promotionType: '',
        approvedBy: '',
        promotionDate: new Date().toISOString().slice(0, 16),
      });
      // Refresh stock
      const updatedDevices = await fetchDevices();
      setInStockDevices(updatedDevices.filter(d => d.status === 'IN_STOCK'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getDeviceImei = (id: string) => {
    // This is simple but inefficient, ideally we join on backend or map on load
    return id.substring(0, 8) + '...';
  };

  if (loading) return <div className="p-6 text-gray-600">Loading promotions...</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Promotions Tracking</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">New Promotional Move</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Asset (IN_STOCK)</label>
            <select
              name="deviceId"
              value={promoForm.deviceId}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Choose a device...</option>
              {inStockDevices.map(d => (
                <option key={d.id} value={d.id}>{d.imei} (SN: {d.serialNumber || 'N/A'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Type</label>
            <input
              type="text"
              name="promotionType"
              placeholder="e.g. Influencer Gift, Demo Unit"
              value={promoForm.promotionType}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
            <input
              type="text"
              name="approvedBy"
              placeholder="Approver name"
              value={promoForm.approvedBy}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="datetime-local"
              name="promotionDate"
              value={promoForm.promotionDate}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || inStockDevices.length === 0}
            className="md:col-span-2 bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Mark as Promotional'}
          </button>
        </form>
        {error && <p className="mt-4 text-red-600 text-sm font-medium">{error}</p>}
        {success && <p className="mt-4 text-green-600 text-sm font-medium">{success}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Promotion History</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Asset ID</th>
              <th className="px-6 py-4 text-left">Type</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-left">Approver</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 text-sm">
            {promotions.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No promotional moves recorded.</td></tr>
            ) : (
              promotions.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-blue-600">{p.deviceId}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{p.promotionType}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(p.promotionDate || p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-700">{p.approvedBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
