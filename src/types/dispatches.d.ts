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
  signOffPath?: string;
  notes?: string;
};
