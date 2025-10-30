// Auth Types
export interface User {
  id: string;
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string | { _id: string; name: string };
  branch?: string | { _id: string; name: string };
  company?: string | { _id: string; name: string };
  createdAt: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  branch?: string;
  company?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  branch?: string;
  company?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  sessionToken: string;
}

// Permission Types
export interface Permission {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  _id: string;
  name: string;
  scope: 'GLOBAL' | 'BRANCH';
  branch?: string | Branch;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  _id: string;
  role: string;
  permission: string;
  branch?: string;
  createdAt: string;
  updatedAt: string;
}

// Company Branch Types
export interface Company {
  _id: string;
  name: string;
  address?: string;
  phone: string;
  email: string;
  province?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  manager?: string | User;
  managerEmail?: string;
  managerPhone?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  _id: string;
  name: string;
  phone: string;
  email: string;
  company: string | Company;
  tables: number;
  province?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  address: string;
  manager?: string | User;
  managerEmail?: string;
  managerPhone?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  name: string;
  phone: string;
  email: string;
  province?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  address?: string;
  manager?: string; // User ID
  managerEmail?: string;
  managerPhone?: string;
}

export interface CreateBranchRequest {
  name: string;
  phone: string;
  email: string;
  company: string;
  tables: number;
  province?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  address: string;
  manager?: string; // User ID
  managerEmail?: string;
  managerPhone?: string;
}

// Category Product Types
export interface Category {
  _id: string;
  name: string;
  company?: string | Company;
  parent?: string | Category;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  defaultSalesMethod: string | { _id: string; name: string };
  company?: string | Company;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Kitchen {
  _id: string;
  name: string;
  description?: string;
  company: string | Company;
  branch: string | Branch;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductIngredient {
  _id: string;
  product: string;
  ingredient: string;
  amount: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPrice {
  _id: string;
  product: string;
  salesMethod: string | { _id: string; name: string };
  price: number;
  currencyUnit: string | { _id: string; name: string };
  branch: string | { _id: string; name: string };
  company: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  company: string;
  parent?: string;
  description?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  defaultSalesMethod: string;
  company: string;
  isActive?: boolean;
}

export interface CreateKitchenRequest {
  name: string;
  company: string;
  branch: string;
  isActive?: boolean;
}

export interface CreateProductIngredientRequest {
  product: string;
  ingredient: string;
  amount: number;
  unit: string;
}

export interface AmountUnit {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyUnit {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAmountUnitRequest {
  name: string;
}

export interface CreateCurrencyUnitRequest {
  name: string;
}

export interface SalesMethod {
  _id: string;
  name: string;
  description?: string;
  parent?: string | SalesMethod;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesMethodRequest {
  name: string;
  description?: string;
  parent?: string;
}

export interface CreateProductPriceRequest {
  salesMethod: string;
  price: number;
  currencyUnit: string;
  branch?: string;
  company?: string;
}

export interface BranchSalesMethod {
  _id: string;
  branch: string;
  salesMethod: SalesMethod;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchSalesMethodRequest {
  branch: string;
  salesMethod: string;
}

// Menu Types
export interface Menu {
  _id: string;
  name: string;
  description?: string;
  company: string | Company;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuBranch {
  _id: string;
  menu: string | Menu;
  branch: string | Branch;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  _id: string;
  menu: string | Menu;
  category: string | Category;
  parent?: string | MenuCategory;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuProduct {
  _id: string;
  menu: string | Menu;
  category: string | Category;
  product: string | Product;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductKitchen {
  _id: string;
  product: string | Product;
  kitchen: string | Kitchen;
  branch: string | Branch;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuRequest {
  name: string;
  description?: string;
  company: string;
}

export interface CreateMenuBranchRequest {
  menu: string;
  branch: string;
}

export interface CreateMenuCategoryRequest {
  menu: string;
  category: string;
  parent?: string;
  order?: number;
}

export interface CreateMenuProductRequest {
  menu: string;
  category: string;
  product: string;
  order?: number;
}

export interface CreateProductKitchenRequest {
  product: string;
  kitchen: string;
  branch: string;
}

export interface MenuStructure {
  menu: Menu;
  categories: (MenuCategory & { products: MenuProduct[] })[];
}
