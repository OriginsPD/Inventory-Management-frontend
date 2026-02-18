// frontend/src/types/device-replacement.d.ts

export type DeviceReplacement = {
  id: string;
  oldDeviceId: string;
  newDeviceId: string;
  reason: string;
  replacementDate?: string | null;
  createdAt: string;
};

export type CreateDeviceReplacementDto = {
  oldDeviceId: string;
  newDeviceId: string;
  reason: string;
  replacementDate?: string;
};
