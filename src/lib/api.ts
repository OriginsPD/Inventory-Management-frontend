// frontend/src/lib/api.ts
import { DeviceModel, CreateDeviceModelDto, UpdateDeviceModelDto } from '@/types/device-models';
import { Device, CreateDeviceDto, UpdateDeviceDto, StockRefillDto } from '@/types/devices';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customers';
import { Dispatch, CreateDispatchDto } from '@/types/dispatches';
import { DeviceTest, StartDeviceTestDto, CompleteDeviceTestDto } from '@/types/device-testing';
import { DeviceDamage, CreateDeviceDamageDto } from '@/types/device-damage';
import { DeviceReplacement, CreateDeviceReplacementDto } from '@/types/device-replacement';
import { InventoryByModelReport, StatusDistributionReport, DispatchReportSummary, DamageReportSummary } from '@/types/reports';
import { AuditLog } from '@/types/audit';
import { Promotion, CreatePromotionDto } from '@/types/promotions';
import { logger } from '@/lib/logger';

import { authClient } from './auth-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    const errorMessage = errorData.message || response.statusText;
    
    logger.error({
      msg: 'API Request Failed',
      url: response.url,
      status: response.status,
      error: errorMessage,
    });

    throw new Error(errorMessage);
  }
  return response.json();
};

const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    return headers;
};

// --- Auth API ---
export const login = async (email: string, password: string): Promise<any> => {
  const { data, error } = await authClient.signIn.email({
      email,
      password,
  });

  if (error) {
      throw new Error(error.message || 'Login failed');
  }
  return data;
};

export const signup = async (email: string, password: string, name: string): Promise<any> => {
    const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
    });
  
    if (error) {
        throw new Error(error.message || 'Signup failed');
    }
    return data;
  };

// --- Device Models API ---
export const fetchDeviceModels = async (): Promise<DeviceModel[]> => {
  const response = await fetch(`${API_BASE_URL}/device-models`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const createDeviceModel = async (data: CreateDeviceModelDto): Promise<DeviceModel> => {
  const response = await fetch(`${API_BASE_URL}/device-models`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateDeviceModel = async (id: string, data: UpdateDeviceModelDto): Promise<DeviceModel> => {
  const response = await fetch(`${API_BASE_URL}/device-models/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteDeviceModel = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/device-models/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// --- Devices API ---
export const fetchDevices = async (): Promise<Device[]> => {
  const response = await fetch(`${API_BASE_URL}/devices`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const createDevice = async (data: CreateDeviceDto): Promise<Device> => {
  const response = await fetch(`${API_BASE_URL}/devices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateDevice = async (id: string, data: UpdateDeviceDto): Promise<Device> => {
  const response = await fetch(`${API_BASE_URL}/devices/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteDevice = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/devices/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const refillStock = async (data: StockRefillDto): Promise<Device[]> => {
  const response = await fetch(`${API_BASE_URL}/devices/refill`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// --- Customers API ---
export const fetchCustomers = async (): Promise<Customer[]> => {
  const response = await fetch(`${API_BASE_URL}/customers`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const createCustomer = async (data: CreateCustomerDto): Promise<Customer> => {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateCustomer = async (id: string, data: UpdateCustomerDto): Promise<Customer> => {
  const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteCustomer = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// --- Dispatches API ---
export const fetchDispatches = async (): Promise<Dispatch[]> => {
  const response = await fetch(`${API_BASE_URL}/dispatches`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const createDispatch = async (data: CreateDispatchDto): Promise<Dispatch> => {
  const response = await fetch(`${API_BASE_URL}/dispatches`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// --- Device Testing API ---
export const fetchDeviceTests = async (): Promise<DeviceTest[]> => {
  const response = await fetch(`${API_BASE_URL}/testing`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const startDeviceTest = async (data: StartDeviceTestDto): Promise<DeviceTest> => {
  const response = await fetch(`${API_BASE_URL}/testing/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const completeDeviceTest = async (data: CompleteDeviceTestDto): Promise<DeviceTest> => {
  const response = await fetch(`${API_BASE_URL}/testing/complete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// --- Device Damage API ---
export const fetchDeviceDamages = async (): Promise<DeviceDamage[]> => {
  const response = await fetch(`${API_BASE_URL}/damage`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const createDeviceDamage = async (data: CreateDeviceDamageDto): Promise<DeviceDamage> => {
  const response = await fetch(`${API_BASE_URL}/damage`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// --- Device Replacement API ---
export const fetchDeviceReplacements = async (): Promise<DeviceReplacement[]> => {
  const response = await fetch(`${API_BASE_URL}/replacement`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const createDeviceReplacement = async (data: CreateDeviceReplacementDto): Promise<DeviceReplacement> => {
  const response = await fetch(`${API_BASE_URL}/replacement`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// --- Reports API ---
export const fetchInventoryByModelReport = async (): Promise<InventoryByModelReport[]> => {
  const response = await fetch(`${API_BASE_URL}/reports/inventory-by-model`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const fetchStatusDistributionReport = async (): Promise<StatusDistributionReport[]> => {
  const response = await fetch(`${API_BASE_URL}/reports/status-distribution`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const fetchDispatchReportSummary = async (startDate?: string, endDate?: string): Promise<DispatchReportSummary[]> => {
  let url = `${API_BASE_URL}/reports/dispatches`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const fetchDamageReportSummary = async (): Promise<DamageReportSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/reports/damage-summary`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

// --- Audit API ---
export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  const response = await fetch(`${API_BASE_URL}/audit`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

// --- Promotions API ---
export const fetchPromotions = async (): Promise<Promotion[]> => {
  const response = await fetch(`${API_BASE_URL}/promotions`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const createPromotion = async (data: CreatePromotionDto): Promise<Promotion> => {
  const response = await fetch(`${API_BASE_URL}/promotions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};