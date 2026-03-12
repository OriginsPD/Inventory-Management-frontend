// frontend/src/types/devices.d.ts

import { DeviceModel } from "./device-models";

export type DeviceStatus = 'IN_STOCK' | 'DISPATCHED' | 'TESTING' | 'DAMAGED' | 'REPLACED' | 'PROMOTIONAL' | 'RMA';
export type SimPlanStatus = 'ACTIVE' | 'DEACTIVATED';

export type Device = {
  id: string;
  identifier: string;
  modelId: string;
  status: DeviceStatus;
  carrier?: string;
  msisdn?: string | null;
  activationDate?: string;
  simPlanStatus?: SimPlanStatus | null;
  simPlanStatusChangedAt?: string | null;
  firmwareVersion?: string;
  hardwareRevision?: string;
  pairedDeviceId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  modelName?: string;
  brand?: string;
  assetType?: string;
};

export type CreateDeviceDto = {
  identifier: string;
  modelId: string;
  status?: DeviceStatus;
  carrier?: string;
  msisdn?: string;
  activationDate?: string;
  simPlanStatus?: SimPlanStatus;
  firmwareVersion?: string;
  hardwareRevision?: string;
  pairedDeviceId?: string | null;
};

export type UpdateDeviceDto = {
  identifier?: string;
  modelId?: string;
  status?: DeviceStatus;
  carrier?: string;
  msisdn?: string;
  activationDate?: string;
  simPlanStatus?: SimPlanStatus;
  firmwareVersion?: string;
  hardwareRevision?: string;
  pairedDeviceId?: string | null;
};

export type StockRefillDto = {
  modelId: string;
  quantity?: number;
  identifiers?: string[];
  pairedIdentifiers?: string[];
  msisdns?: string[];
  carrier?: string;
  msisdn?: string;
  activationDate?: string;
  simPlanStatus?: SimPlanStatus;
  firmwareVersion?: string;
  hardwareRevision?: string;
};

export type BulkUploadRelationshipDto = {
  relationships: { primaryIdentifier: string; linkedIdentifier: string; linkedMsisdn?: string }[];
  createMissing: boolean;
  defaultPrimaryModelId?: string;
  defaultLinkedModelId?: string;
};

export type BulkUploadReport = {
  totalRows: number;
  relationshipsCreated: number;
  devicesCreated: number;
  rowsSkipped: number;
  errors: string[];
};

export type RefillReport = {
  totalRows: number;
  devicesCreated: number;
  rowsSkipped: number;
  errors: string[];
};
