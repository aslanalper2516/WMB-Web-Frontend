import { apiClient } from './client';
import type { User, LoginRequest, RegisterRequest, UpdateUserRequest, AuthResponse } from '../types';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  // Register
  register: async (userData: RegisterRequest): Promise<{ message: string; user: User }> => {
    return apiClient.post<{ message: string; user: User }>('/auth/register', userData);
  },

  // Logout
  logout: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/logout');
  },

  // Get current user
  me: async (): Promise<{ user: User }> => {
    return apiClient.get<{ user: User }>('/auth/me');
  },

  // Get all users (admin only)
  getUsers: async (): Promise<{ message: string; users: User[] }> => {
    return apiClient.get<{ message: string; users: User[] }>('/auth/users');
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<{ message: string; user: User }> => {
    return apiClient.get<{ message: string; user: User }>(`/auth/users/${userId}`);
  },

  // Update user
  updateUser: async (userId: string, userData: UpdateUserRequest): Promise<{ message: string; user: User }> => {
    return apiClient.put<{ message: string; user: User }>(`/auth/users/${userId}`, userData);
  },

  // Delete user
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/auth/users/${userId}`);
  },

  // Update own profile
  updateProfile: async (userData: { name?: string; email?: string }): Promise<{ message: string; user: User }> => {
    return apiClient.put<{ message: string; user: User }>('/auth/profile', userData);
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>('/auth/change-password', { oldPassword, newPassword });
  },
};
