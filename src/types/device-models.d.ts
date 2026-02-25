// frontend/src/types/device-models.d.ts

export type AssetType = 'TRACKER' | 'SIM' | 'PERIPHERAL';

export type DeviceModel = {
  id: string;
  name: string;
  brand: string;
  category?: string;
  assetType: AssetType;
  minStock: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CreateDeviceModelDto = {
  name: string;
  brand: string;
  category?: string;
  assetType?: AssetType;
  minStock?: number;
};

export type UpdateDeviceModelDto = {
  name?: string;
  brand?: string;
  category?: string;
  assetType?: AssetType;
  minStock?: number;
};
