import { apiClient } from './client';
import type { 
  UserCompanyBranch, 
  CreateUserCompanyBranchRequest, 
  UpdateUserCompanyBranchRequest 
} from '../types';

export const userCompanyBranchApi = {
  // Assign user to company/branch
  assignUserToCompanyBranch: async (
    data: CreateUserCompanyBranchRequest
  ): Promise<{ message: string; userCompanyBranch: UserCompanyBranch }> => {
    // branch null ise field'ı gönderme (backend için)
    const requestData: any = {
      user: data.user,
      company: data.company,
      isManager: data.isManager,
      managerType: data.managerType
    };
    
    // branch sadece varsa gönder (null değil)
    if (data.branch) {
      requestData.branch = data.branch;
    }
    
    return apiClient.post<{ message: string; userCompanyBranch: UserCompanyBranch }>(
      '/companies-branches/user-company-branches',
      requestData
    );
  },

  // Get user company branches with optional filters
  getUserCompanyBranches: async (filters?: {
    userId?: string;
    companyId?: string;
    branchId?: string;
  }): Promise<{ message: string; userCompanyBranches: UserCompanyBranch[] }> => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('user', filters.userId);
    if (filters?.companyId) params.append('company', filters.companyId);
    if (filters?.branchId) params.append('branch', filters.branchId);
    
    const queryString = params.toString();
    const url = queryString 
      ? `/companies-branches/user-company-branches?${queryString}`
      : '/companies-branches/user-company-branches';
    
    return apiClient.get<{ message: string; userCompanyBranches: UserCompanyBranch[] }>(url);
  },

  // Get user company branch by ID
  getUserCompanyBranchById: async (
    id: string
  ): Promise<{ message: string; userCompanyBranch: UserCompanyBranch }> => {
    return apiClient.get<{ message: string; userCompanyBranch: UserCompanyBranch }>(
      `/companies-branches/user-company-branches/${id}`
    );
  },

  // Update user company branch
  updateUserCompanyBranch: async (
    id: string,
    data: UpdateUserCompanyBranchRequest
  ): Promise<{ message: string; userCompanyBranch: UserCompanyBranch }> => {
    return apiClient.put<{ message: string; userCompanyBranch: UserCompanyBranch }>(
      `/companies-branches/user-company-branches/${id}`,
      data
    );
  },

  // Delete user company branch
  deleteUserCompanyBranch: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/companies-branches/user-company-branches/${id}`);
  },

  // Get user's all company and branch assignments
  getUserCompanies: async (
    userId: string
  ): Promise<{ message: string; userCompanyBranches: UserCompanyBranch[] }> => {
    return apiClient.get<{ message: string; userCompanyBranches: UserCompanyBranch[] }>(
      `/companies-branches/users/${userId}/companies`
    );
  },

  // Get company's users (with optional branch filter)
  getCompanyUsers: async (
    companyId: string,
    branchId?: string
  ): Promise<{ message: string; userCompanyBranches: UserCompanyBranch[] }> => {
    const url = branchId
      ? `/companies-branches/companies/${companyId}/users?branch=${branchId}`
      : `/companies-branches/companies/${companyId}/users`;
    
    return apiClient.get<{ message: string; userCompanyBranches: UserCompanyBranch[] }>(url);
  },
};

