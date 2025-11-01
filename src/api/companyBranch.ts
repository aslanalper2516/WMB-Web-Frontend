import { apiClient } from './client';
import type { Company, CreateCompanyRequest, Branch, CreateBranchRequest, Kitchen } from '../types';

export const companyBranchApi = {
  // Companies
  getCompanies: async (): Promise<{ message: string; companies: Company[] }> => {
    return apiClient.get<{ message: string; companies: Company[] }>('/companies-branches/companies');
  },

  getCompanyById: async (id: string): Promise<{ message: string; company: Company }> => {
    return apiClient.get<{ message: string; company: Company }>(`/companies-branches/companies/${id}`);
  },

  createCompany: async (data: CreateCompanyRequest): Promise<{ message: string; company: Company }> => {
    return apiClient.post<{ message: string; company: Company }>('/companies-branches/companies', data);
  },

  updateCompany: async (id: string, data: Partial<CreateCompanyRequest>): Promise<{ message: string; company: Company }> => {
    return apiClient.put<{ message: string; company: Company }>(`/companies-branches/companies/${id}`, data);
  },

  deleteCompany: async (id: string): Promise<{ message: string; company: Company }> => {
    return apiClient.delete<{ message: string; company: Company }>(`/companies-branches/companies/${id}`);
  },

  getDeletedCompanies: async (): Promise<{ message: string; deletedCompanies: Company[] }> => {
    return apiClient.get<{ message: string; deletedCompanies: Company[] }>('/companies-branches/companies/deleted/all');
  },

  restoreCompany: async (id: string): Promise<{ message: string; restored: Company }> => {
    return apiClient.patch<{ message: string; restored: Company }>(`/companies-branches/companies/${id}/restore`);
  },

  // Branches
  getBranches: async (companyId?: string): Promise<{ message: string; branches: Branch[] }> => {
    const url = companyId ? `/companies-branches/branches?company=${companyId}` : '/companies-branches/branches';
    return apiClient.get<{ message: string; branches: Branch[] }>(url);
  },

  getBranchById: async (id: string): Promise<{ message: string; branch: Branch }> => {
    return apiClient.get<{ message: string; branch: Branch }>(`/companies-branches/branches/${id}`);
  },

  createBranch: async (data: CreateBranchRequest): Promise<{ message: string; branch: Branch }> => {
    return apiClient.post<{ message: string; branch: Branch }>('/companies-branches/branches', data);
  },

  updateBranch: async (id: string, data: Partial<CreateBranchRequest>): Promise<{ message: string; branch: Branch }> => {
    return apiClient.put<{ message: string; branch: Branch }>(`/companies-branches/branches/${id}`, data);
  },

  updateBranchTables: async (id: string, tables: number): Promise<{ message: string; branch: Branch }> => {
    return apiClient.patch<{ message: string; branch: Branch }>(`/companies-branches/branches/${id}/tables`, { tables });
  },

  deleteBranch: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/companies-branches/branches/${id}`);
  },

  getDeletedBranches: async (): Promise<{ message: string; deletedBranches: Branch[] }> => {
    return apiClient.get<{ message: string; deletedBranches: Branch[] }>('/companies-branches/branches/deleted/all');
  },

  restoreBranch: async (id: string): Promise<{ message: string; restored: Branch }> => {
    return apiClient.patch<{ message: string; restored: Branch }>(`/companies-branches/branches/${id}/restore`);
  },

  // Addresses
  getAddresses: async (type: 'province' | 'district' | 'neighborhood' | 'street', parentId?: string): Promise<{ message: string; addresses: { id: string; name: string }[] }> => {
    const url = parentId 
      ? `/companies-branches/addresses/${type}?parentId=${parentId}`
      : `/companies-branches/addresses/${type}`;
    return apiClient.get<{ message: string; addresses: { id: string; name: string }[] }>(url);
  },
    // Kitchens
  getKitchens: async (branchId: string): Promise<{ message: string; kitchens: Kitchen[] }> => {
  return apiClient.get<{ message: string; kitchens: Kitchen[] }>(`/companies-branches/branches/${branchId}/kitchens`);
  },

  // Managers
  getCompanyManagers: async (companyId: string): Promise<{ message: string; managers: any[] }> => {
    return apiClient.get<{ message: string; managers: any[] }>(`/companies-branches/companies/${companyId}/managers`);
  },

  getBranchManagers: async (branchId: string): Promise<{ message: string; managers: any[] }> => {
    return apiClient.get<{ message: string; managers: any[] }>(`/companies-branches/branches/${branchId}/managers`);
  },
};
