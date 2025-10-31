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
  UpdateSalesMethodRequest,
  BranchSalesMethod,
  CurrencyUnit,
  SalesMethodCategory,
  CreateSalesMethodCategoryRequest,
  UpdateSalesMethodCategoryRequest,
  IngredientCategory,
  CreateIngredientCategoryRequest,
  UpdateIngredientCategoryRequest,
  Ingredient,
  CreateIngredientRequest,
  UpdateIngredientRequest,
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

  // Ingredient Categories
  getIngredientCategories: async (companyId?: string): Promise<{ message: string; categories: IngredientCategory[] }> => {
    let url = '/category-product/ingredient-categories';
    if (companyId) url += `?company=${companyId}`;
    return apiClient.get<{ message: string; categories: IngredientCategory[] }>(url);
  },

  getIngredientCategoryById: async (id: string): Promise<{ message: string; category: IngredientCategory }> => {
    return apiClient.get<{ message: string; category: IngredientCategory }>(`/category-product/ingredient-categories/${id}`);
  },

  createIngredientCategory: async (data: CreateIngredientCategoryRequest): Promise<{ message: string; category: IngredientCategory }> => {
    return apiClient.post<{ message: string; category: IngredientCategory }>('/category-product/ingredient-categories', data);
  },

  updateIngredientCategory: async (id: string, data: UpdateIngredientCategoryRequest): Promise<{ message: string; category: IngredientCategory }> => {
    return apiClient.put<{ message: string; category: IngredientCategory }>(`/category-product/ingredient-categories/${id}`, data);
  },

  deleteIngredientCategory: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/ingredient-categories/${id}`);
  },

  // Ingredients
  getIngredients: async (companyId?: string, categoryId?: string): Promise<{ message: string; ingredients: Ingredient[] }> => {
    let url = '/category-product/ingredients';
    const params = [];
    if (companyId) params.push(`company=${companyId}`);
    if (categoryId) params.push(`category=${categoryId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiClient.get<{ message: string; ingredients: Ingredient[] }>(url);
  },

  getIngredientById: async (id: string): Promise<{ message: string; ingredient: Ingredient }> => {
    return apiClient.get<{ message: string; ingredient: Ingredient }>(`/category-product/ingredients/${id}`);
  },

  createIngredient: async (data: CreateIngredientRequest): Promise<{ message: string; ingredient: Ingredient }> => {
    return apiClient.post<{ message: string; ingredient: Ingredient }>('/category-product/ingredients', data);
  },

  updateIngredient: async (id: string, data: UpdateIngredientRequest): Promise<{ message: string; ingredient: Ingredient }> => {
    return apiClient.put<{ message: string; ingredient: Ingredient }>(`/category-product/ingredients/${id}`, data);
  },

  deleteIngredient: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/ingredients/${id}`);
  },

  // Product Ingredients (routes: /products/:id/ingredients, /product-ingredients/:id)
  getProductIngredients: async (productId: string, branchId?: string): Promise<{ message: string; ingredients: ProductIngredient[] }> => {
    let url = `/category-product/products/${productId}/ingredients`;
    if (branchId) url += `?branch=${branchId}`;
    return apiClient.get<{ message: string; ingredients: ProductIngredient[] }>(url);
  },

  createProductIngredient: async (productId: string, data: CreateProductIngredientRequest): Promise<{ message: string; ingredient: ProductIngredient }> => {
    return apiClient.post<{ message: string; ingredient: ProductIngredient }>(`/category-product/products/${productId}/ingredients`, data);
  },

  getProductIngredientById: async (id: string): Promise<{ message: string; ingredient: ProductIngredient }> => {
    return apiClient.get<{ message: string; ingredient: ProductIngredient }>(`/category-product/product-ingredients/${id}`);
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
    data: { salesMethod: string; price: number; currencyUnit: string; branch?: string; company?: string }
  ): Promise<{ message: string; price: ProductPrice }> => {
    return apiClient.post<{ message: string; price: ProductPrice }>(`/category-product/products/${productId}/prices`, data);
  },

  updateProductPriceRaw: async (id: string, data: any): Promise<{ message: string; price: ProductPrice }> => {
    return apiClient.put<{ message: string; price: ProductPrice }>(`/category-product/prices/${id}`, data);
  },

  deleteProductPrice: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/prices/${id}`);
  },

  // Sales Method Categories
  getSalesMethodCategories: async (): Promise<{ message: string; categories: SalesMethodCategory[] }> => {
    return apiClient.get<{ message: string; categories: SalesMethodCategory[] }>('/category-product/sales-method-categories');
  },

  getSalesMethodCategoryById: async (id: string): Promise<{ message: string; category: SalesMethodCategory }> => {
    return apiClient.get<{ message: string; category: SalesMethodCategory }>(`/category-product/sales-method-categories/${id}`);
  },

  createSalesMethodCategory: async (data: CreateSalesMethodCategoryRequest): Promise<{ message: string; category: SalesMethodCategory }> => {
    return apiClient.post<{ message: string; category: SalesMethodCategory }>('/category-product/sales-method-categories', data);
  },

  updateSalesMethodCategory: async (id: string, data: UpdateSalesMethodCategoryRequest): Promise<{ message: string; category: SalesMethodCategory }> => {
    return apiClient.put<{ message: string; category: SalesMethodCategory }>(`/category-product/sales-method-categories/${id}`, data);
  },

  deleteSalesMethodCategory: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/category-product/sales-method-categories/${id}`);
  },

  getCategorySalesMethods: async (categoryId: string): Promise<{ message: string; methods: SalesMethod[] }> => {
    return apiClient.get<{ message: string; methods: SalesMethod[] }>(`/category-product/sales-method-categories/${categoryId}/methods`);
  },

  // Sales Methods
  getSalesMethods: async (categoryId?: string): Promise<{ message: string; methods: SalesMethod[] }> => {
    const url = categoryId ? `/category-product/sales-methods?category=${categoryId}` : '/category-product/sales-methods';
    return apiClient.get<{ message: string; methods: SalesMethod[] }>(url);
  },

  getSalesMethodById: async (id: string): Promise<{ message: string; salesMethod: SalesMethod }> => {
    return apiClient.get<{ message: string; salesMethod: SalesMethod }>(`/category-product/sales-methods/${id}`);
  },

  createSalesMethod: async (data: CreateSalesMethodRequest): Promise<{ message: string; salesMethod: SalesMethod }> => {
    return apiClient.post<{ message: string; salesMethod: SalesMethod }>('/category-product/sales-methods', data);
  },

  updateSalesMethod: async (id: string, data: UpdateSalesMethodRequest): Promise<{ message: string; salesMethod: SalesMethod }> => {
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

  assignSalesMethodsToBranch: async (branchId: string, data: { salesMethods: string[] }): Promise<{ message: string; assigned: BranchSalesMethod[]; errors?: Array<{ salesMethodId: string; error: string }> }> => {
    return apiClient.post<{ message: string; assigned: BranchSalesMethod[]; errors?: Array<{ salesMethodId: string; error: string }> }>(`/category-product/branches/${branchId}/sales-methods`, data);
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
