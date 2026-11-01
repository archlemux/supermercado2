import { Router } from "express";
import { currentUser, requireAuth, requireRole, toPublic } from "../auth";
import { CreateAddressDto, UpdateRoleDto } from "../dtos";
import { HttpError } from "../errors";
import { Address, ROLES } from "../models";
import { seq, users } from "../store";

const router = Router();
router.use(requireAuth);

// RF-02: GET /api/v1/users/me
router.get("/me", (_req, res) => {
  res.json(toPublic(currentUser(res)));
});

// RF-02: GET /api/v1/users/me/addresses
router.get("/me/addresses", (_req, res) => {
  const user = currentUser(res);
  res.json({ data: user.addresses, total: user.addresses.length });
});

// RF-02: POST /api/v1/users/me/addresses  (direcciones múltiples)
router.post("/me/addresses", (req, res) => {
  const body = req.body as Partial<CreateAddressDto>;
  const errors: string[] = [];
  if (typeof body.label !== "string" || !body.label.trim()) errors.push("label: texto requerido (ej. Casa)");
  if (typeof body.street !== "string" || body.street.trim().length < 5) errors.push("street: mínimo 5 caracteres");
  if (typeof body.city !== "string" || !body.city.trim()) errors.push("city: texto requerido");
  if (body.details !== undefined && typeof body.details !== "string") errors.push("details: texto");
  if (body.isDefault !== undefined && typeof body.isDefault !== "boolean") errors.push("isDefault: boolean");
  if (errors.length) throw new HttpError(400, "Datos inválidos", errors);

  const user = currentUser(res);
  if (user.addresses.length >= 5) throw new HttpError(409, "Máximo 5 direcciones por usuario");
  const makeDefault = body.isDefault === true || user.addresses.length === 0;
  if (makeDefault) user.addresses.forEach((a) => (a.isDefault = false));
  const address: Address = {
    id: ++seq.address, label: (body.label as string).trim(), street: (body.street as string).trim(),
    city: (body.city as string).trim(), details: body.details, isDefault: makeDefault
  };
  user.addresses.push(address);
  res.status(201).json(address);
});

// RF-03: PATCH /api/v1/users/:id/role  (solo administrador)
router.patch("/:id/role", requireRole("ADMINISTRADOR"), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "El id debe ser un entero positivo");
  const { role } = req.body as Partial<UpdateRoleDto>;
  if (!ROLES.includes(role as never)) throw new HttpError(400, "Datos inválidos", [`role: uno de ${ROLES.join(", ")}`]);
  const target = users.find((u) => u.id === id);
  if (!target) throw new HttpError(404, `Usuario ${id} no encontrado`);
  target.role = role as UpdateRoleDto["role"];
  res.json(toPublic(target));
});

export default router;
