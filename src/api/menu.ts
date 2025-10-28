import { apiClient } from './client';
import type { 
  Menu,
  CreateMenuRequest,
  MenuBranch,
  CreateMenuBranchRequest,
  MenuCategory,
  CreateMenuCategoryRequest,
  MenuProduct,
  CreateMenuProductRequest,
  ProductKitchen,
  CreateProductKitchenRequest,
  MenuStructure,
  Category,
  Product,
  Branch,
  Kitchen
} from '../types';

export const menuApi = {
  // Menus
  getMenus: async (companyId?: string): Promise<{ message: string; menus: Menu[] }> => {
    const url = companyId ? `/menus/menus?company=${companyId}` : '/menus/menus';
    return apiClient.get<{ message: string; menus: Menu[] }>(url);
  },

  getMenuById: async (id: string): Promise<{ message: string; menu: Menu }> => {
    return apiClient.get<{ message: string; menu: Menu }>(`/menus/menus/${id}`);
  },

  createMenu: async (data: CreateMenuRequest): Promise<{ message: string; menu: Menu }> => {
    return apiClient.post<{ message: string; menu: Menu }>('/menus/menus', data);
  },

  updateMenu: async (id: string, data: Partial<CreateMenuRequest>): Promise<{ message: string; menu: Menu }> => {
    return apiClient.put<{ message: string; menu: Menu }>(`/menus/menus/${id}`, data);
  },

  deleteMenu: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/menus/menus/${id}`);
  },

  getMenuStructure: async (id: string): Promise<{ message: string; structure: MenuStructure }> => {
    return apiClient.get<{ message: string; structure: MenuStructure }>(`/menus/menus/${id}/structure`);
  },

  // Menu Branches
  assignMenuToBranch: async (menuId: string, branchId: string): Promise<{ message: string; assignment: MenuBranch }> => {
    return apiClient.post<{ message: string; assignment: MenuBranch }>(`/menus/menus/${menuId}/branches`, { branch: branchId });
  },

  getMenuBranches: async (menuId: string): Promise<{ message: string; menuBranches: MenuBranch[] }> => {
    return apiClient.get<{ message: string; menuBranches: MenuBranch[] }>(`/menus/menus/${menuId}/branches`);
  },

  unassignMenuFromBranch: async (menuId: string, branchId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/menus/menus/${menuId}/branches/${branchId}`);
  },

  removeMenuFromBranch: async (menuId: string, branchId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/menus/menus/${menuId}/branches/${branchId}`);
  },

  getBranchMenus: async (branchId: string): Promise<{ message: string; menus: MenuBranch[] }> => {
    return apiClient.get<{ message: string; menus: MenuBranch[] }>(`/menus/branches/${branchId}/menus`);
  },

  // Menu Categories
  addCategoryToMenu: async (menuId: string, categoryId: string, parentId?: string): Promise<{ message: string; menuCategory: MenuCategory }> => {
    const data: any = { category: categoryId };
    if (parentId) {
      data.parent = parentId;
    }
    return apiClient.post<{ message: string; menuCategory: MenuCategory }>(`/menus/menus/${menuId}/categories`, data);
  },

  getMenuCategories: async (menuId: string): Promise<{ message: string; menuCategories: MenuCategory[] }> => {
    return apiClient.get<{ message: string; menuCategories: MenuCategory[] }>(`/menus/menus/${menuId}/categories`);
  },

  removeCategoryFromMenu: async (menuId: string, categoryId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/menus/menus/${menuId}/categories/${categoryId}`);
  },

  updateCategoryOrder: async (menuId: string, categoryId: string, order: number): Promise<{ message: string; menuCategory: MenuCategory }> => {
    return apiClient.put<{ message: string; menuCategory: MenuCategory }>(`/menus/menus/${menuId}/categories/${categoryId}/order`, { order });
  },

  getAvailableCategories: async (menuId: string): Promise<{ message: string; categories: Category[] }> => {
    return apiClient.get<{ message: string; categories: Category[] }>(`/menus/menus/${menuId}/available-categories`);
  },

  // Menu Products
  addProductToMenuCategory: async (menuId: string, categoryId: string, productId: string): Promise<{ message: string; menuProduct: MenuProduct }> => {
    return apiClient.post<{ message: string; menuProduct: MenuProduct }>(`/menus/menus/${menuId}/products`, { category: categoryId, product: productId });
  },

  addProductToMenu: async (menuId: string, data: { category: string; product: string; order?: number }): Promise<{ message: string; menuProduct: MenuProduct }> => {
    return apiClient.post<{ message: string; menuProduct: MenuProduct }>(`/menus/menus/${menuId}/products`, data);
  },

  getMenuProducts: async (menuId: string, categoryId?: string): Promise<{ message: string; menuProducts: MenuProduct[] }> => {
    const url = categoryId ? `/menus/menus/${menuId}/products?category=${categoryId}` : `/menus/menus/${menuId}/products`;
    return apiClient.get<{ message: string; menuProducts: MenuProduct[] }>(url);
  },

  getCategoryProducts: async (menuId: string, categoryId: string): Promise<{ message: string; products: MenuProduct[] }> => {
    return apiClient.get<{ message: string; products: MenuProduct[] }>(`/menus/menus/${menuId}/categories/${categoryId}/products`);
  },

  removeProductFromMenuCategory: async (menuId: string, categoryId: string, productId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/menus/menus/${menuId}/products/${productId}?category=${categoryId}`);
  },

  removeProductFromMenu: async (menuId: string, categoryId: string, productId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/menus/menus/${menuId}/products/${productId}?category=${categoryId}`);
  },

  updateProductOrder: async (menuId: string, categoryId: string, productId: string, order: number): Promise<{ message: string; menuProduct: MenuProduct }> => {
    return apiClient.put<{ message: string; menuProduct: MenuProduct }>(`/menus/menus/${menuId}/products/${productId}/order?category=${categoryId}`, { order });
  },

  getAvailableProducts: async (menuId: string, categoryId: string): Promise<{ message: string; products: Product[] }> => {
    return apiClient.get<{ message: string; products: Product[] }>(`/menus/menus/${menuId}/available-products?category=${categoryId}`);
  },

  // Product Kitchens
  assignProductToKitchen: async (productId: string, kitchenId: string, branchId: string): Promise<{ message: string; assignment: ProductKitchen }> => {
    return apiClient.post<{ message: string; assignment: ProductKitchen }>(`/menus/products/${productId}/kitchens`, { kitchen: kitchenId, branch: branchId });
  },

  getProductKitchens: async (productId: string, branchId?: string): Promise<{ message: string; kitchens: ProductKitchen[] }> => {
    const url = branchId ? `/menus/products/${productId}/kitchens?branch=${branchId}` : `/menus/products/${productId}/kitchens`;
    return apiClient.get<{ message: string; kitchens: ProductKitchen[] }>(url);
  },

  unassignProductFromKitchen: async (productId: string, kitchenId: string, branchId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/menus/products/${productId}/kitchens/${kitchenId}?branch=${branchId}`);
  },

  removeProductFromKitchen: async (productId: string, kitchenId: string, branchId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/menus/products/${productId}/kitchens/${kitchenId}?branch=${branchId}`);
  },

  getKitchenProducts: async (kitchenId: string): Promise<{ message: string; products: ProductKitchen[] }> => {
    return apiClient.get<{ message: string; products: ProductKitchen[] }>(`/menus/kitchens/${kitchenId}/products`);
  },
};
