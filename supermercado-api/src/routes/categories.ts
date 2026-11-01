import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { CreateCategoryDto } from "../dtos";
import { HttpError } from "../errors";
import { Category } from "../models";
import { categories, seq } from "../store";

const router = Router();

// RF-04: GET /api/v1/categories  (categorías con sus subcategorías)
router.get("/", (_req, res) => {
  res.json({ data: categories, total: categories.length });
});

// RF-04: POST /api/v1/categories  (solo administrador)
router.post("/", requireAuth, requireRole("ADMINISTRADOR"), (req, res) => {
  const body = req.body as Partial<CreateCategoryDto>;
  const errors: string[] = [];
  if (typeof body.name !== "string" || body.name.trim().length < 3) errors.push("name: texto de mínimo 3 caracteres");
  if (body.subcategories !== undefined && (!Array.isArray(body.subcategories) || body.subcategories.some((s) => typeof s !== "string" || !s.trim()))) {
    errors.push("subcategories: arreglo de textos no vacíos");
  }
  if (errors.length) throw new HttpError(400, "Datos inválidos", errors);

  const name = (body.name as string).trim();
  if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) throw new HttpError(409, "Ya existe una categoría con ese nombre");
  const category: Category = {
    id: ++seq.category, name,
    subcategories: (body.subcategories ?? []).map((s) => ({ id: ++seq.subcategory, name: s.trim() }))
  };
  categories.push(category);
  res.status(201).json(category);
});

export default router;
