// frontend/src/lib/api.ts
import { DeviceModel, CreateDeviceModelDto, UpdateDeviceModelDto } from '@/types/device-models';
import { Device, CreateDeviceDto, UpdateDeviceDto, StockRefillDto, BulkUploadRelationshipDto, BulkUploadReport, RefillReport } from '@/types/devices';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customers';
import { Dispatch, CreateDispatchDto } from '@/types/dispatches';
import { DeviceTest, StartDeviceTestDto, CompleteDeviceTestDto } from '@/types/device-testing';
import { DeviceDamage, CreateDeviceDamageDto } from '@/types/device-damage';
import { DeviceReplacement, CreateDeviceReplacementDto } from '@/types/device-replacement';
import { InventoryByModelReport, StatusDistributionReport, DispatchReportSummary, DamageReportSummary } from '@/types/reports';
import { AuditLog } from '@/types/audit';
import { Promotion, CreatePromotionDto } from '@/types/promotions';
import { User } from '@/types/users';
import { RmaRecord, CreateRmaDto as CreateRmaRecordDto } from '@/types/rma';
import { logger } from '@/lib/logger';

import { authClient } from './auth-client';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
        // Fallback for non-JSON responses
        if (response.status === 401) errorMessage = "Session expired. Please login again.";
        if (response.status === 403) errorMessage = "You do not have permission to perform this action.";
        if (response.status === 404) errorMessage = "The requested resource was not found.";
        if (response.status >= 500) errorMessage = "Internal server error. Please try again later.";
    }
    
    logger.error({
      msg: 'API Request Failed',
      url: response.url,
      status: response.status,
      error: errorMessage,
    });

    throw new Error(errorMessage);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

const getAuthHeaders = (): Record<string, string> => {

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (typeof window !== 'undefined') {

        // Better Auth uses cookies, but we can also check for session token if stored

        const token = localStorage.getItem('better-auth.session-token');

        if (token) {

            headers['Authorization'] = `Bearer ${token}`;

        }

    }

    return headers;

};



const authenticatedFetch = (url: string, options: RequestInit = {}) => {

    return fetch(url, {

        ...options,

        headers: {

            ...getAuthHeaders(),

            ...options.headers,

        },

        credentials: 'include', // Crucial for cookies

    });

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

  const response = await authenticatedFetch(`${API_BASE_URL}/device-models`);

  return handleResponse(response);

};



export const createDeviceModel = async (data: CreateDeviceModelDto): Promise<DeviceModel> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/device-models`, {

    method: 'POST',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};



export const updateDeviceModel = async (id: string, data: UpdateDeviceModelDto): Promise<DeviceModel> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/device-models/${id}`, {

    method: 'PATCH',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};



export const deleteDeviceModel = async (id: string): Promise<{ message: string }> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/device-models/${id}`, {

    method: 'DELETE',

  });

  return handleResponse(response);

};



// --- Devices API ---

export const fetchDevices = async (params?: { status?: string; modelId?: string; search?: string; limit?: number; offset?: number }): Promise<Device[]> => {
  let url = `${API_BASE_URL}/devices`;
  if (params) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.modelId) searchParams.set('modelId', params.modelId);
    if (params.search) searchParams.set('search', params.search);
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }
  const response = await authenticatedFetch(url);
  return handleResponse(response);

};



export const createDevice = async (data: CreateDeviceDto): Promise<Device> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/devices`, {

    method: 'POST',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};



export const updateDevice = async (id: string, data: UpdateDeviceDto): Promise<Device> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/devices/${id}`, {

    method: 'PATCH',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};



export const deleteDevice = async (id: string): Promise<{ message: string }> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/devices/${id}`, {

    method: 'DELETE',

  });

  return handleResponse(response);

};



export const refillStock = async (data: StockRefillDto): Promise<RefillReport> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/devices/refill`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const createBulkRelationships = async (data: { primaryIdentifier: string, linkedIdentifier: string }[]): Promise<{ created: number, skipped: number, errors: string[] }> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/devices/relationships/bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const bulkUploadRelationships = async (data: BulkUploadRelationshipDto): Promise<BulkUploadReport> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/devices/relationships/bulk-upload`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const fetchDeviceRelationships = async (id: string): Promise<any[]> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/devices/${id}/relationships`);
  return handleResponse(response);
};




// --- Customers API ---

export const fetchCustomers = async (): Promise<Customer[]> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/customers`);

  return handleResponse(response);

};



export const createCustomer = async (data: CreateCustomerDto): Promise<Customer> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/customers`, {

    method: 'POST',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};



export const updateCustomer = async (id: string, data: UpdateCustomerDto): Promise<Customer> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/customers/${id}`, {

    method: 'PATCH',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};



export const deleteCustomer = async (id: string): Promise<{ message: string }> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/customers/${id}`, {

    method: 'DELETE',

  });

  return handleResponse(response);

};



// --- Dispatches API ---

export const fetchDispatches = async (): Promise<Dispatch[]> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/dispatches`);

  return handleResponse(response);

};



export const fetchDispatchItems = async (id: string): Promise<Device[]> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/dispatches/${id}/items`);

  return handleResponse(response);

};



export const createDispatch = async (data: CreateDispatchDto): Promise<Dispatch> => {



  const response = await authenticatedFetch(`${API_BASE_URL}/dispatches`, {



    method: 'POST',



    body: JSON.stringify(data),



  });



  return handleResponse(response);



};







export const updateDispatch = async (id: string, data: Pick<CreateDispatchDto, 'location' | 'signOffPath'>): Promise<Dispatch> => {



  const response = await authenticatedFetch(`${API_BASE_URL}/dispatches/${id}`, {



    method: 'PATCH',



    body: JSON.stringify(data),



  });



  return handleResponse(response);



};







export const deleteDispatch = async (id: string): Promise<{ message: string }> => {



  const response = await authenticatedFetch(`${API_BASE_URL}/dispatches/${id}`, {



    method: 'DELETE',



  });



  return handleResponse(response);



};



// --- Device Testing API ---

export const fetchDeviceTests = async (): Promise<DeviceTest[]> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/testing`);

  return handleResponse(response);

};



export const startDeviceTest = async (data: StartDeviceTestDto): Promise<DeviceTest> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/testing/start`, {

    method: 'POST',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};



export const completeDeviceTest = async (data: CompleteDeviceTestDto): Promise<DeviceTest> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/testing/complete`, {

    method: 'POST',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};



// --- Device Damage API ---

export const fetchDeviceDamages = async (): Promise<DeviceDamage[]> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/damage`);

  return handleResponse(response);

};



export const createDeviceDamage = async (data: CreateDeviceDamageDto): Promise<DeviceDamage> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/damage`, {

    method: 'POST',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};



// --- Device Replacement API ---

export const fetchDeviceReplacements = async (): Promise<DeviceReplacement[]> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/replacement`);

  return handleResponse(response);

};



export const createDeviceReplacement = async (data: CreateDeviceReplacementDto): Promise<DeviceReplacement> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/replacement`, {

    method: 'POST',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};



// --- Reports API ---

export const fetchInventoryByModelReport = async (): Promise<InventoryByModelReport[]> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/reports/inventory-by-model`);

  return handleResponse(response);

};



export const fetchStatusDistributionReport = async (): Promise<StatusDistributionReport[]> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/reports/status-distribution`);

  return handleResponse(response);

};



export const fetchDispatchReportSummary = async (startDate?: string, endDate?: string): Promise<DispatchReportSummary[]> => {

  let url = `${API_BASE_URL}/reports/dispatches`;

  const params = new URLSearchParams();

  if (startDate) params.append('startDate', startDate);

  if (endDate) params.append('endDate', endDate);

  if (params.toString()) url += `?${params.toString()}`;

  

  const response = await authenticatedFetch(url);

  return handleResponse(response);

};



export const fetchDamageReportSummary = async (): Promise<DamageReportSummary[]> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/reports/damage-summary`);

  return handleResponse(response);

};



// --- Audit API ---

export const fetchAuditLogs = async (params?: {
  entity?: string; action?: string; from?: string; to?: string; page?: number; limit?: number;
}): Promise<{ data: AuditLog[]; total: number; page: number; pages: number }> => {
  const searchParams = new URLSearchParams();
  if (params?.entity) searchParams.set('entity', params.entity);
  if (params?.action) searchParams.set('action', params.action);
  if (params?.from) searchParams.set('from', params.from);
  if (params?.to) searchParams.set('to', params.to);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const response = await authenticatedFetch(`${API_BASE_URL}/audit?${searchParams.toString()}`);
  return handleResponse(response);
};



// --- Promotions API ---

export const fetchPromotions = async (): Promise<Promotion[]> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/promotions`);

  return handleResponse(response);

};



export const createPromotion = async (data: CreatePromotionDto): Promise<Promotion> => {

  const response = await authenticatedFetch(`${API_BASE_URL}/promotions`, {

    method: 'POST',

    body: JSON.stringify(data),

  });

  return handleResponse(response);

};

export const deletePromotion = async (id: string): Promise<{ message: string }> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/promotions/${id}`, { method: 'DELETE' });
  return handleResponse(response);
};

// --- Users API ---

export const fetchUsers = async (): Promise<User[]> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/users`);
  return handleResponse(response);
};

export const updateUserRole = async (id: string, role: string): Promise<User> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return handleResponse(response);
};

// --- RMA API ---

export const fetchRmaRecords = async (): Promise<RmaRecord[]> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/rma`);
  return handleResponse(response);
};

export const createRmaRecord = async (data: CreateRmaRecordDto): Promise<RmaRecord> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/rma`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// --- Reports Extended API ---

export const fetchTestingSummary = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/reports/testing-summary`);
  return handleResponse(response);
};

export const fetchReplacementsSummary = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/reports/replacements-summary`);
  return handleResponse(response);
};

export const fetchStockTrend = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/reports/stock-trend`);
  return handleResponse(response);
};

export const fetchDispatchTrend = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/reports/dispatch-trend`);
  return handleResponse(response);
};
