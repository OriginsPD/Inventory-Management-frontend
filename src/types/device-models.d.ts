// frontend/src/types/device-models.d.ts

export type DeviceModel = {
  id: string;
  name: string;
  brand: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CreateDeviceModelDto = {
  name: string;
  brand: string;
  category?: string;
};

export type UpdateDeviceModelDto = {
  name?: string;
  brand?: string;
  category?: string;
};
