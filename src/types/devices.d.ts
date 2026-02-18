// frontend/src/types/devices.d.ts

import { DeviceModel } from "./device-models"; // Assuming DeviceModel is already defined

export type DeviceStatus = 'IN_STOCK' | 'DISPATCHED' | 'TESTING' | 'DAMAGED' | 'REPLACED' | 'PROMOTIONAL';

export type Device = {
  id: string;
  imei: string;
  serialNumber?: string | null;
  modelId: string;
  status: DeviceStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  // Potentially include the full DeviceModel object here if desired for display
  // deviceModel?: DeviceModel;
};

export type CreateDeviceDto = {
  imei: string;
  serialNumber?: string;
  modelId: string;
  status?: DeviceStatus;
};

export type UpdateDeviceDto = {
  imei?: string;
  serialNumber?: string;
  modelId?: string;
  status?: DeviceStatus;
};

export type StockRefillDto = {
  modelId: string;
  quantity: number;
};
