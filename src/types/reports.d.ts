// frontend/src/types/reports.d.ts

export type InventoryByModelReport = {
  modelId: string;
  modelName: string;
  brand: string;
  minStock: number;
  totalStock: number;
};

export type StatusDistributionReport = {
  status: string;
  count: number;
};

export type DispatchReportSummary = {
  id: string;
  dispatchDate: string;
  dispatchedBy: string;
  location?: string | null;
  deviceId: string;
  customerId: string;
  signOffPath?: string | null;
  items?: string | null;
};

export type DamageReportSummary = {
  id: string;
  deviceId: string;
  issueDescription: string;
  reportedBy?: string | null;
  reportedDate?: string | null;
};
