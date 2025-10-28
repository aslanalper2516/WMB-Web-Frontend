import { apiClient } from './client';
import type { Permission, Role, RolePermission } from '../types';

export const rolePermissionApi = {
  // Permissions
  getPermissions: async (): Promise<Permission[]> => {
    return apiClient.get<Permission[]>('/role-permission/permissions');
  },
  createPermission: async (data: { name: string; description?: string }): Promise<{ message: string; perm: Permission }> => {
    return apiClient.post<{ message: string; perm: Permission }>('/role-permission/permissions', data);
  },
  updatePermission: async (id: string, data: Partial<{ name: string; description?: string }>): Promise<{ message: string; updated: Permission }> => {
    return apiClient.put<{ message: string; updated: Permission }>(`/role-permission/permissions/${id}`, data);
  },
  deletePermission: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/role-permission/permissions/${id}`);
  },

  // Roles
  getRoles: async (): Promise<Role[]> => {
    return apiClient.get<Role[]>('/role-permission/roles');
  },
  createRole: async (data: { name: string; scope?: 'GLOBAL' | 'BRANCH'; branch?: string }): Promise<{ message: string; role: Role }> => {
    return apiClient.post<{ message: string; role: Role }>('/role-permission/roles', data);
  },
  updateRole: async (id: string, data: Partial<{ name: string; scope?: 'GLOBAL' | 'BRANCH'; branch?: string }>): Promise<{ message: string; updated: Role }> => {
    return apiClient.put<{ message: string; updated: Role }>(`/role-permission/roles/${id}`, data);
  },
  deleteRole: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/role-permission/roles/${id}`);
  },

  // Role-Permission Assignments
  assignPermissionToRole: async (data: { roleId: string; permissionId: string; branch?: string }): Promise<{ message: string; result: RolePermission }> => {
    return apiClient.post<{ message: string; result: RolePermission }>(`/role-permission/roles/${data.roleId}/permissions/${data.permissionId}`, data);
  },
  removePermissionFromRole: async (roleId: string, permissionId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/role-permission/roles/${roleId}/permissions/${permissionId}`);
  },
  getRolePermissions: async (roleId: string): Promise<RolePermission[]> => {
    return apiClient.get<RolePermission[]>(`/role-permission/roles/${roleId}/permissions`);
  },
};
