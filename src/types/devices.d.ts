// frontend/src/types/devices.d.ts

import { DeviceModel } from "./device-models";

export type DeviceStatus = 'IN_STOCK' | 'DISPATCHED' | 'TESTING' | 'DAMAGED' | 'REPLACED' | 'PROMOTIONAL' | 'RMA';

export type Device = {
  id: string;
  identifier: string;
  modelId: string;
  status: DeviceStatus;
  carrier?: string;
  activationDate?: string;
  planExpiryDate?: string;
  firmwareVersion?: string;
  hardwareRevision?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  modelName?: string;
  brand?: string;
};

export type CreateDeviceDto = {
  identifier: string;
  modelId: string;
  status?: DeviceStatus;
  carrier?: string;
  activationDate?: string;
  planExpiryDate?: string;
  firmwareVersion?: string;
  hardwareRevision?: string;
};

export type UpdateDeviceDto = {
  identifier?: string;
  modelId?: string;
  status?: DeviceStatus;
  carrier?: string;
  activationDate?: string;
  planExpiryDate?: string;
  firmwareVersion?: string;
  hardwareRevision?: string;
};

export type StockRefillDto = {
  modelId: string;
  quantity?: number;
  identifiers?: string[];
  carrier?: string;
  activationDate?: string;
  planExpiryDate?: string;
};
