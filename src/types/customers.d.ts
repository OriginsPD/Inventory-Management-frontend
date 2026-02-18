// frontend/src/types/customers.d.ts

export type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CreateCustomerDto = {
  name: string;
  phone?: string;
  email?: string;
};

export type UpdateCustomerDto = {
  name?: string;
  phone?: string;
  email?: string;
};
