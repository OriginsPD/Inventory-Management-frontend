// frontend/src/types/device-damage.d.ts

export type DeviceDamage = {
  id: string;
  deviceId: string;
  issueDescription: string;
  reportedBy?: string | null;
  reportedDate?: string | null;
  createdAt: string;
};

export type CreateDeviceDamageDto = {
  deviceId: string;
  issueDescription: string;
  reportedBy?: string;
  reportedDate?: string;
};
