'use client';

import { useState, useEffect } from 'react';
import { fetchDeviceModels, createDeviceModel } from '@/lib/api';
import { DeviceModel, CreateDeviceModelDto } from '@/types/device-models';

export default function DeviceModelsPage() {
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newModel, setNewModel] = useState<CreateDeviceModelDto>({ name: '', brand: '', category: '' });

  useEffect(() => {
    async function getDeviceModels() {
      try {
        const data = await fetchDeviceModels();
        setDeviceModels(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    getDeviceModels();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewModel(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      const created = await createDeviceModel(newModel);
      setDeviceModels(prev => [...prev, created]);
      setNewModel({ name: '', brand: '', category: '' }); // Reset form
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-6">Loading device models...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Device Models</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Device Model</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Model Name"
            value={newModel.name}
            onChange={handleInputChange}
            className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="text"
            name="brand"
            placeholder="Brand"
            value={newModel.brand}
            onChange={handleInputChange}
            className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="text"
            name="category"
            placeholder="Category (optional)"
            value={newModel.category}
            onChange={handleInputChange}
            className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="md:col-span-3 p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Model
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Existing Device Models</h2>
        {deviceModels.length === 0 ? (
          <p className="text-gray-600">No device models found. Add one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deviceModels.map((model) => (
                  <tr key={model.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.brand}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.category || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(model.createdAt).toLocaleDateString()}</td>
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
