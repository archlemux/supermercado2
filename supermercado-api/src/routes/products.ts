import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { CreateProductDto } from "../dtos";
import { HttpError } from "../errors";
import { Product } from "../models";
import { categories, products, seq } from "../store";

const router = Router();

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "El id debe ser un entero positivo");
  return id;
}

// RF-06: ficha del producto con categoría, subcategoría y disponibilidad
function toDetail(p: Product) {
  const category = categories.find((c) => c.id === p.categoryId);
  const subcategory = category?.subcategories.find((s) => s.id === p.subcategoryId);
  return {
    ...p,
    category: category ? { id: category.id, name: category.name } : null,
    subcategory: subcategory ?? null,
    available: p.stock > 0
  };
}

function optionalNumber(raw: unknown, name: string): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (raw === "" || !Number.isFinite(n) || n < 0) throw new HttpError(400, `${name} debe ser un número mayor o igual a 0`);
  return n;
}

// RF-05: GET /api/v1/products?search=&categoryId=&subcategoryId=&brand=&minPrice=&maxPrice=&inStock=&page=&limit=
router.get("/", (req, res) => {
  const q = req.query;
  const page = q.page === undefined ? 1 : Number(q.page);
  const limit = q.limit === undefined ? 10 : Number(q.limit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(400, "page y limit deben ser enteros positivos (limit máximo 100)");
  }
  const categoryId = optionalNumber(q.categoryId, "categoryId");
  const subcategoryId = optionalNumber(q.subcategoryId, "subcategoryId");
  const minPrice = optionalNumber(q.minPrice, "minPrice");
  const maxPrice = optionalNumber(q.maxPrice, "maxPrice");
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) throw new HttpError(400, "minPrice no puede ser mayor que maxPrice");
  if (q.inStock !== undefined && q.inStock !== "true" && q.inStock !== "false") throw new HttpError(400, "inStock debe ser true o false");

  const search = typeof q.search === "string" ? q.search.trim().toLowerCase() : "";
  const brand = typeof q.brand === "string" ? q.brand.trim().toLowerCase() : "";
  const result = products.filter((p) =>
    (categoryId === undefined || p.categoryId === categoryId) &&
    (subcategoryId === undefined || p.subcategoryId === subcategoryId) &&
    (!brand || p.brand.toLowerCase() === brand) &&
    (minPrice === undefined || p.price >= minPrice) &&
    (maxPrice === undefined || p.price <= maxPrice) &&
    (q.inStock === undefined || (q.inStock === "true" ? p.stock > 0 : p.stock === 0)) &&
    (!search || p.name.toLowerCase().includes(search) || p.brand.toLowerCase().includes(search))
  );
  const start = (page - 1) * limit;
  res.json({ data: result.slice(start, start + limit).map(toDetail), page, limit, total: result.length });
});

// RF-06: GET /api/v1/products/:id
router.get("/:id", (req, res) => {
  const id = parseId(req.params.id);
  const product = products.find((p) => p.id === id);
  if (!product) throw new HttpError(404, `Producto ${id} no encontrado`);
  res.json(toDetail(product));
});

// POST /api/v1/products  (solo administrador)
router.post("/", requireAuth, requireRole("ADMINISTRADOR"), (req, res) => {
  const b = req.body as Partial<CreateProductDto>;
  const errors: string[] = [];
  if (typeof b.name !== "string" || b.name.trim().length < 3) errors.push("name: mínimo 3 caracteres");
  if (typeof b.description !== "string" || !b.description.trim()) errors.push("description: texto requerido");
  if (typeof b.brand !== "string" || !b.brand.trim()) errors.push("brand: texto requerido");
  if (typeof b.unit !== "string" || !b.unit.trim()) errors.push("unit: texto requerido (ej. 500 g)");
  if (typeof b.price !== "number" || b.price <= 0) errors.push("price: número mayor que 0");
  if (!Number.isInteger(b.stock) || (b.stock as number) < 0) errors.push("stock: entero mayor o igual a 0");
  if (b.images !== undefined && (!Array.isArray(b.images) || b.images.some((i) => typeof i !== "string"))) errors.push("images: arreglo de URLs");
  const category = categories.find((c) => c.id === b.categoryId);
  if (!category) errors.push("categoryId: la categoría no existe");
  else if (!category.subcategories.some((s) => s.id === b.subcategoryId)) errors.push("subcategoryId: no pertenece a la categoría indicada");
  if (errors.length) throw new HttpError(400, "Datos inválidos", errors);

  const name = (b.name as string).trim();
  if (products.some((p) => p.name.toLowerCase() === name.toLowerCase())) throw new HttpError(409, "Ya existe un producto con ese nombre");
  const id = ++seq.product;
  const product: Product = {
    id, sku: `SKU-${String(id).padStart(4, "0")}`, name, description: (b.description as string).trim(),
    brand: (b.brand as string).trim(), unit: (b.unit as string).trim(), price: b.price as number, stock: b.stock as number,
    categoryId: b.categoryId as number, subcategoryId: b.subcategoryId as number, images: b.images ?? []
  };
  products.push(product);
  res.status(201).json(toDetail(product));
});

// DELETE /api/v1/products/:id  (solo administrador)
router.delete("/:id", requireAuth, requireRole("ADMINISTRADOR"), (req, res) => {
  const id = parseId(req.params.id);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new HttpError(404, `Producto ${id} no encontrado`);
  products.splice(index, 1);
  res.status(204).send();
});

export default router;
