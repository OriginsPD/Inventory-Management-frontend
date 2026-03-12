// frontend/src/types/dispatches.d.ts

export type SubscriptionType = 'B2C' | 'B2B';

export type Dispatch = {
  id: string;
  deviceId: string;
  customerId: string;
  dispatchDate: string;
  installationDate?: string | null;
  dispatchedBy: string;
  location?: string | null;
  subscriptionType?: SubscriptionType | null;
  subscriptionPlan?: string | null;
  technicianAssigned?: string | null;
  sourcePortal?: string | null;
  targetPortal?: string | null;
  signOffPath?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type CreateDispatchDto = {
  deviceId?: string;
  deviceIds?: string[];
  customerId: string;
  dispatchDate: string;
  installationDate?: string;
  dispatchedBy: string;
  location?: string;
  subscriptionType?: SubscriptionType;
  subscriptionPlan?: string;
  technicianAssigned?: string;
  sourcePortal?: string;
  targetPortal?: string;
  signOffPath?: string;
  notes?: string;
};
