export const ROLES = ["CLIENTE", "ADMINISTRADOR", "REPARTIDOR"] as const;
export type Role = (typeof ROLES)[number];

export interface Address {
  id: number;
  label: string; // Casa, Trabajo...
  street: string;
  city: string;
  details?: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: number;
  type: "TARJETA" | "PSE" | "EFECTIVO";
  alias: string;
  last4?: string;
  isDefault: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: Role;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}

export type PublicUser = Omit<User, "passwordHash">;

export interface Subcategory { id: number; name: string; }
export interface Category { id: number; name: string; subcategories: Subcategory[]; }

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  brand: string;
  unit: string; // 500 g, 1 L...
  price: number; // COP
  stock: number;
  categoryId: number;
  subcategoryId: number;
  images: string[];
}
