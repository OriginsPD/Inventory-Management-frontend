// frontend/src/types/dispatches.d.ts

export type Dispatch = {
  id: string;
  deviceId: string;
  customerId: string;
  dispatchDate: string;
  dispatchedBy: string;
  location?: string | null;
  createdAt: string;
};

export type CreateDispatchDto = {
  deviceId: string;
  customerId: string;
  dispatchDate: string;
  dispatchedBy: string;
  location?: string;
};
