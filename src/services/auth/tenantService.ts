import axios, { AxiosError } from 'axios';

// Define a type for tenant creation/updating
export interface TenantData {
  name: string;
  // Add more fields if needed
}

// Define a type for a tenant (returned from API)
export interface Tenant {
  id: number;
  name: string;
  // Add more fields based on your backend API
}

const tenantService = {
  // Get all tenants
  getTenants: async (): Promise<Tenant[]> => {
    try {
      const response = await axios.get<Tenant[]>('/api/tenants');
      return response.data;
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw error;
    }
  },

  // Get a specific tenant by ID
  getTenant: async (tenantId: number | string): Promise<Tenant> => {
    try {
      const response = await axios.get<Tenant>(`/api/tenants/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tenant #${tenantId}:`, error);
      throw error;
    }
  },

  // Create a new tenant
  createTenant: async (tenantData: TenantData): Promise<Tenant> => {
    try {
      const response = await axios.post<Tenant>('/api/tenants', tenantData);
      return response.data;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  },

  // Update an existing tenant
  updateTenant: async (tenantId: number | string, tenantData: TenantData): Promise<Tenant> => {
    try {
      const response = await axios.put<Tenant>(`/api/tenants/${tenantId}`, tenantData);
      return response.data;
    } catch (error) {
      console.error(`Error updating tenant #${tenantId}:`, error);
      throw error;
    }
  },

  // Delete a tenant
  deleteTenant: async (tenantId: number | string): Promise<boolean> => {
    try {
      await axios.delete(`/api/tenants/${tenantId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting tenant #${tenantId}:`, error);
      throw error;
    }
  }
};

export default tenantService;
