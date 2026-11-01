import { Category, Product, User } from "./models";
import { hashPassword } from "./security";

// Datos en memoria: se reinician al reiniciar el servidor.
export const categories: Category[] = [
  { id: 1, name: "Despensa", subcategories: [{ id: 1, name: "Arroz y granos" }, { id: 2, name: "Aceites" }] },
  { id: 2, name: "Lácteos y huevos", subcategories: [{ id: 3, name: "Leches" }, { id: 4, name: "Quesos" }] },
  { id: 3, name: "Bebidas", subcategories: [{ id: 5, name: "Gaseosas" }, { id: 6, name: "Café y té" }] }
];

export const products: Product[] = [
  { id: 1, sku: "SKU-0001", name: "Arroz Roa x 500g", description: "Arroz blanco de grano largo, ideal para el almuerzo diario.", brand: "Roa", unit: "500 g", price: 2400, stock: 150, categoryId: 1, subcategoryId: 1, images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300"] },
  { id: 2, sku: "SKU-0002", name: "Aceite Premier 1L", description: "Aceite vegetal para cocinar y freír.", brand: "Premier", unit: "1 L", price: 9800, stock: 85, categoryId: 1, subcategoryId: 2, images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300"] },
  { id: 3, sku: "SKU-0003", name: "Leche Alquería x 1L", description: "Leche entera UHT.", brand: "Alquería", unit: "1 L", price: 4100, stock: 300, categoryId: 2, subcategoryId: 3, images: ["https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300"] },
  { id: 4, sku: "SKU-0004", name: "Queso Colanta x 500g", description: "Queso campesino fresco.", brand: "Colanta", unit: "500 g", price: 12800, stock: 45, categoryId: 2, subcategoryId: 4, images: ["https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300"] },
  { id: 5, sku: "SKU-0005", name: "Gaseosa Coca-Cola 1.5L", description: "Gaseosa sabor cola.", brand: "Coca-Cola", unit: "1.5 L", price: 5200, stock: 90, categoryId: 3, subcategoryId: 5, images: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300"] },
  { id: 6, sku: "SKU-0006", name: "Café Sello Rojo 500g", description: "Café tostado y molido.", brand: "Sello Rojo", unit: "500 g", price: 14500, stock: 0, categoryId: 3, subcategoryId: 6, images: ["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300"] }
];

// Usuarios de demostración (uno por rol)
export const users: User[] = [
  { id: 1, name: "Administrador", email: "admin@supermercado.com", passwordHash: hashPassword("Admin123"), role: "ADMINISTRADOR", addresses: [], paymentMethods: [] },
  { id: 2, name: "Cliente Demo", email: "cliente@supermercado.com", passwordHash: hashPassword("Cliente123"), role: "CLIENTE", addresses: [], paymentMethods: [] },
  { id: 3, name: "Repartidor Demo", email: "repartidor@supermercado.com", passwordHash: hashPassword("Repartidor123"), role: "REPARTIDOR", addresses: [], paymentMethods: [] }
];

export const sessions = new Map<string, number>(); // token -> userId

export const seq = { user: 3, category: 3, subcategory: 6, product: 6, address: 0 };
