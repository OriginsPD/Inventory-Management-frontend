export interface RmaRecord {
  id: string;
  deviceId: string;
  reason: string;
  vendorReference: string | null;
  returnedBy: string;
  rmaDate: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface CreateRmaDto {
  deviceId: string;
  reason: string;
  vendorReference?: string;
  returnedBy: string;
  rmaDate: string;
}
