import { Role } from "./models";

export interface RegisterDto { name: string; email: string; password: string; phone?: string; }
export interface LoginDto { email: string; password: string; }
export interface CreateAddressDto { label: string; street: string; city: string; details?: string; isDefault?: boolean; }
export interface UpdateRoleDto { role: Role; }
export interface CreateCategoryDto { name: string; subcategories?: string[]; }
export interface CreateProductDto {
  name: string; description: string; brand: string; unit: string; price: number; stock: number;
  categoryId: number; subcategoryId: number; images?: string[];
}
