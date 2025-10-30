import { apiClient } from './client';
import type { 
  Category, 
  CreateCategoryRequest, 
  Product, 
  CreateProductRequest, 
  Kitchen, 
  ProductIngredient,
  CreateProductIngredientRequest,
  ProductPrice,
  CreateProductPriceRequest,
  SalesMethod,
  CreateSalesMethodRequest,
  BranchSalesMethod,
  CurrencyUnit,
} from '../types';

export const categoryProductApi = {
  // Categories
  getCategories: async (): Promise<{ message: string; categories: Category[] }> => {
    return apiClient.get<{ message: string; categories: Category[] }>('/category-product/categories');
  },

  getCategoryById: async (id: string): Promise<{ message: string; category: Category }> => {
    return apiClient.get<{ message: string; category: Category }>(`/category-product/categories/${id}`);
  },

  createCategory: async (data: CreateCategoryRequest): Promise<{ message: string; category: Category }> => {
    return apiClient.post<{ message: string; category: Category }>('/category-product/categories', data);
  },

  updateCategory: async (id: string, data: Partial<CreateCategoryRequest>): Promise<{ message: string; category: Category }> => {
    return apiClient.put<{ message: string; category: Category }>(`/category-product/categories/${id}`, data);
  },

  deleteCategory: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/categories/${id}`);
  },

  // Products
  getProducts: async (): Promise<{ message: string; products: Product[] }> => {
    return apiClient.get<{ message: string; products: Product[] }>('/category-product/products');
  },

  getProductById: async (id: string): Promise<{ message: string; product: Product }> => {
    return apiClient.get<{ message: string; product: Product }>(`/category-product/products/${id}`);
  },

  createProduct: async (data: CreateProductRequest): Promise<{ message: string; product: Product }> => {
    return apiClient.post<{ message: string; product: Product }>('/category-product/products', data);
  },

  updateProduct: async (id: string, data: Partial<CreateProductRequest>): Promise<{ message: string; product: Product }> => {
    return apiClient.put<{ message: string; product: Product }>(`/category-product/products/${id}`, data);
  },

  deleteProduct: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/products/${id}`);
  },

  // Product Ingredients
  getProductIngredients: async (productId?: string): Promise<{ message: string; ingredients: ProductIngredient[] }> => {
    const url = productId ? `/category-product/product-ingredients?product=${productId}` : '/category-product/product-ingredients';
    return apiClient.get<{ message: string; ingredients: ProductIngredient[] }>(url);
  },

  createProductIngredient: async (data: CreateProductIngredientRequest): Promise<{ message: string; ingredient: ProductIngredient }> => {
    return apiClient.post<{ message: string; ingredient: ProductIngredient }>('/category-product/product-ingredients', data);
  },

  updateProductIngredient: async (id: string, data: Partial<CreateProductIngredientRequest>): Promise<{ message: string; ingredient: ProductIngredient }> => {
    return apiClient.put<{ message: string; ingredient: ProductIngredient }>(`/category-product/product-ingredients/${id}`, data);
  },

  deleteProductIngredient: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/product-ingredients/${id}`);
  },

  // Product Prices (routes: /products/:id/prices, /prices/:id)
  getProductPrices: async (productId: string): Promise<{ message: string; prices: ProductPrice[] }> => {
    return apiClient.get<{ message: string; prices: ProductPrice[] }>(`/category-product/products/${productId}/prices`);
  },

  createProductPrice: async (
    productId: string,
    data: { salesMethod: string; price: number; currencyUnit?: string; branch?: string; company?: string }
  ): Promise<{ message: string; price: ProductPrice }> => {
    return apiClient.post<{ message: string; price: ProductPrice }>(`/category-product/products/${productId}/prices`, data);
  },

  updateProductPriceRaw: async (id: string, data: any): Promise<{ message: string; price: ProductPrice }> => {
    return apiClient.put<{ message: string; price: ProductPrice }>(`/category-product/prices/${id}`, data);
  },

  deleteProductPrice: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/prices/${id}`);
  },

  // Sales Methods
  getSalesMethods: async (): Promise<{ message: string; methods: SalesMethod[] }> => {
    return apiClient.get<{ message: string; methods: SalesMethod[] }>('/category-product/sales-methods');
  },

  getSalesMethodById: async (id: string): Promise<{ message: string; salesMethod: SalesMethod }> => {
    return apiClient.get<{ message: string; salesMethod: SalesMethod }>(`/category-product/sales-methods/${id}`);
  },

  createSalesMethod: async (data: CreateSalesMethodRequest): Promise<{ message: string; salesMethod: SalesMethod }> => {
    return apiClient.post<{ message: string; salesMethod: SalesMethod }>('/category-product/sales-methods', data);
  },

  updateSalesMethod: async (id: string, data: Partial<CreateSalesMethodRequest>): Promise<{ message: string; salesMethod: SalesMethod }> => {
    return apiClient.put<{ message: string; salesMethod: SalesMethod }>(`/category-product/sales-methods/${id}`, data);
  },

  deleteSalesMethod: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/sales-methods/${id}`);
  },

  // Branch Sales Methods
  getBranchSalesMethods: async (branchId: string): Promise<{ message: string; salesMethods: BranchSalesMethod[] }> => {
    return apiClient.get<{ message: string; salesMethods: BranchSalesMethod[] }>(`/category-product/branches/${branchId}/sales-methods`);
  },

  assignSalesMethodToBranch: async (branchId: string, data: { salesMethod: string }): Promise<{ message: string; branchSalesMethod: BranchSalesMethod }> => {
    return apiClient.post<{ message: string; branchSalesMethod: BranchSalesMethod }>(`/category-product/branches/${branchId}/sales-methods`, data);
  },

  removeSalesMethodFromBranch: async (branchId: string, salesMethodId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/branches/${branchId}/sales-methods/${salesMethodId}`);
  },

  // Currency Units
  getCurrencyUnits: async (): Promise<{ message: string; units: CurrencyUnit[] }> => {
    return apiClient.get<{ message: string; units: CurrencyUnit[] }>('/category-product/currency-units');
  },

  // Kitchens
  getKitchens: async (branchId?: string, companyId?: string): Promise<{ message: string; kitchens: Kitchen[] }> => {
    let url = '/category-product/kitchens';
    const params = [];
    if (branchId) params.push(`branch=${branchId}`);
    if (companyId) params.push(`company=${companyId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiClient.get<{ message: string; kitchens: Kitchen[] }>(url);
  },

  getKitchenById: async (id: string): Promise<{ message: string; kitchen: Kitchen }> => {
    return apiClient.get<{ message: string; kitchen: Kitchen }>(`/category-product/kitchens/${id}`);
  },

  createKitchen: async (data: { name: string; company: string; branch: string }): Promise<{ message: string; kitchen: Kitchen }> => {
    return apiClient.post<{ message: string; kitchen: Kitchen }>('/category-product/kitchens', data);
  },

  updateKitchen: async (id: string, data: { name?: string }): Promise<{ message: string; kitchen: Kitchen }> => {
    return apiClient.put<{ message: string; kitchen: Kitchen }>(`/category-product/kitchens/${id}`, data);
  },

  deleteKitchen: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/kitchens/${id}`);
  },
};
