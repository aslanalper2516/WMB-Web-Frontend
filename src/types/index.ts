// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
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
  branch?: string;
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
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  _id: string;
  name: string;
  address?: string;
  phone: string;
  email: string;
  province?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  company: string;
  tables: number;
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
}

export interface CreateBranchRequest {
  name: string;
  address?: string;
  phone: string;
  email: string;
  province?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  company: string;
  tables: number;
}

// Category Product Types
export interface Category {
  _id: string;
  name: string;
  description?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  kitchen?: string;
  defaultSalesMethod?: string;
  branch?: string;
  company?: string;
  price: number;
  currency: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Kitchen {
  _id: string;
  name: string;
  description?: string;
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
  parent?: string;
  company: string;
  branch: string;
}

export interface CurrencyUnit {
  _id: string;
  name: string;
  symbol: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  category: string;
  kitchen: string;
  defaultSalesMethod: string;
  branch: string;
  company: string;
}

export interface CreateKitchenRequest {
  name: string;
  company: string;
  branch: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesMethodRequest {
  name: string;
  description?: string;
}

export interface CreateProductPriceRequest {
  product: string;
  price: number;
  currency: string;
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
