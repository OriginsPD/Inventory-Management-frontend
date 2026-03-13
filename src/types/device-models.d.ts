// frontend/src/types/device-models.d.ts

export type DeviceModelAssetType = 'TRACKER' | 'SIM' | 'PERIPHERAL' | 'DASH_CAM' | 'SD_CARD' | 'PANIC_BUTTON' | 'FUEL_SENSOR' | 'KEYFOB' | 'TRAVEL_ADAPTER';


export type DeviceModel = {
  id: string;
  name: string;
  brand: string;
  category?: string;
  assetType: DeviceModelAssetType;
  minStock: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CreateDeviceModelDto = {
  name: string;
  brand: string;
  category?: string;
  assetType?: DeviceModelAssetType;
  minStock?: number;
};

export type UpdateDeviceModelDto = {
  name?: string;
  brand?: string;
  category?: string;
  assetType?: DeviceModelAssetType;
  minStock?: number;
};
