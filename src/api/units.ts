import { apiClient } from './client';
import type { AmountUnit, CurrencyUnit, SalesMethod, CreateAmountUnitRequest, CreateCurrencyUnitRequest, CreateSalesMethodRequest } from '../types';

export const unitsApi = {
  // Amount Units
  getAmountUnits: async (): Promise<{ message: string; units: AmountUnit[] }> => {
    return apiClient.get<{ message: string; units: AmountUnit[] }>('/category-product/amount-units');
  },
  createAmountUnit: async (data: CreateAmountUnitRequest): Promise<{ message: string; unit: AmountUnit }> => {
    return apiClient.post<{ message: string; unit: AmountUnit }>('/category-product/amount-units', data);
  },
  updateAmountUnit: async (id: string, data: Partial<CreateAmountUnitRequest>): Promise<{ message: string; unit: AmountUnit }> => {
    return apiClient.put<{ message: string; unit: AmountUnit }>(`/category-product/amount-units/${id}`, data);
  },
  deleteAmountUnit: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/amount-units/${id}`);
  },

  // Currency Units
  getCurrencyUnits: async (): Promise<{ message: string; units: CurrencyUnit[] }> => {
    return apiClient.get<{ message: string; units: CurrencyUnit[] }>('/category-product/currency-units');
  },
  createCurrencyUnit: async (data: CreateCurrencyUnitRequest): Promise<{ message: string; unit: CurrencyUnit }> => {
    return apiClient.post<{ message: string; unit: CurrencyUnit }>('/category-product/currency-units', data);
  },
  updateCurrencyUnit: async (id: string, data: Partial<CreateCurrencyUnitRequest>): Promise<{ message: string; unit: CurrencyUnit }> => {
    return apiClient.put<{ message: string; unit: CurrencyUnit }>(`/category-product/currency-units/${id}`, data);
  },
  deleteCurrencyUnit: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/currency-units/${id}`);
  },

  // Sales Methods
  getSalesMethods: async (): Promise<{ message: string; methods: SalesMethod[] }> => {
    return apiClient.get<{ message: string; methods: SalesMethod[] }>('/category-product/sales-methods');
  },
  createSalesMethod: async (data: CreateSalesMethodRequest): Promise<{ message: string; method: SalesMethod }> => {
    return apiClient.post<{ message: string; method: SalesMethod }>('/category-product/sales-methods', data);
  },
  updateSalesMethod: async (id: string, data: Partial<CreateSalesMethodRequest>): Promise<{ message: string; method: SalesMethod }> => {
    return apiClient.put<{ message: string; method: SalesMethod }>(`/category-product/sales-methods/${id}`, data);
  },
  deleteSalesMethod: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/sales-methods/${id}`);
  },
};
