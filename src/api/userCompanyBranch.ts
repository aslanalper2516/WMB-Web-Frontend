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
  ): Promise<{ message: string; assignment: UserCompanyBranch }> => {
    // branch null ise field'ı gönderme (backend için)
    const requestData: any = {
      user: data.user,
      company: data.company
    };
    
    // branch sadece varsa gönder (null değil)
    if (data.branch) {
      requestData.branch = data.branch;
    }
    
    return apiClient.post<{ message: string; assignment: UserCompanyBranch }>(
      '/companies-branches/user-company-branches',
      requestData
    );
  },

  // Get user company branches with optional filters
  getUserCompanyBranches: async (filters?: {
    userId?: string;
    companyId?: string;
    branchId?: string;
  }): Promise<{ message: string; assignments: UserCompanyBranch[] }> => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('user', filters.userId);
    if (filters?.companyId) params.append('company', filters.companyId);
    if (filters?.branchId) params.append('branch', filters.branchId);
    
    const queryString = params.toString();
    const url = queryString 
      ? `/companies-branches/user-company-branches?${queryString}`
      : '/companies-branches/user-company-branches';
    
    return apiClient.get<{ message: string; assignments: UserCompanyBranch[] }>(url);
  },

  // Get user company branch by ID
  getUserCompanyBranchById: async (
    id: string
  ): Promise<{ message: string; assignment: UserCompanyBranch }> => {
    return apiClient.get<{ message: string; assignment: UserCompanyBranch }>(
      `/companies-branches/user-company-branches/${id}`
    );
  },

  // Update user company branch
  updateUserCompanyBranch: async (
    id: string,
    data: UpdateUserCompanyBranchRequest
  ): Promise<{ message: string; assignment: UserCompanyBranch }> => {
    // Backend'de branch null olarak gönderilebilir
    const requestData: any = {};
    if (data.branch !== undefined) {
      requestData.branch = data.branch;
    }
    if (data.isActive !== undefined) {
      requestData.isActive = data.isActive;
    }
    
    return apiClient.put<{ message: string; assignment: UserCompanyBranch }>(
      `/companies-branches/user-company-branches/${id}`,
      requestData
    );
  },

  // Delete user company branch
  deleteUserCompanyBranch: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/companies-branches/user-company-branches/${id}`);
  },

  // Get user's all company and branch assignments
  getUserCompanies: async (
    userId: string
  ): Promise<{ message: string; assignments: UserCompanyBranch[] }> => {
    return apiClient.get<{ message: string; assignments: UserCompanyBranch[] }>(
      `/companies-branches/users/${userId}/companies`
    );
  },

  // Get company's users (with optional branch filter)
  getCompanyUsers: async (
    companyId: string,
    branchId?: string
  ): Promise<{ message: string; assignments: UserCompanyBranch[] }> => {
    const url = branchId
      ? `/companies-branches/companies/${companyId}/users?branch=${branchId}`
      : `/companies-branches/companies/${companyId}/users`;
    
    return apiClient.get<{ message: string; assignments: UserCompanyBranch[] }>(url);
  },
};

