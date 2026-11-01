import { randomUUID } from "crypto";
import { Router } from "express";
import { toPublic } from "../auth";
import { LoginDto, RegisterDto } from "../dtos";
import { HttpError } from "../errors";
import { User } from "../models";
import { hashPassword, verifyPassword } from "../security";
import { seq, sessions, users } from "../store";

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// RF-01: POST /api/v1/auth/register
router.post("/register", (req, res) => {
  const body = req.body as Partial<RegisterDto>;
  const errors: string[] = [];
  if (typeof body.name !== "string" || body.name.trim().length < 2) errors.push("name: texto de mínimo 2 caracteres");
  if (typeof body.email !== "string" || !EMAIL_RE.test(body.email)) errors.push("email: correo con formato válido");
  if (typeof body.password !== "string" || body.password.length < 8 || !/[A-Za-z]/.test(body.password) || !/\d/.test(body.password)) {
    errors.push("password: mínimo 8 caracteres con letras y números");
  }
  if (body.phone !== undefined && (typeof body.phone !== "string" || !/^\d{7,15}$/.test(body.phone))) errors.push("phone: entre 7 y 15 dígitos");
  if (errors.length) throw new HttpError(400, "Datos inválidos", errors);

  const email = (body.email as string).trim().toLowerCase();
  if (users.some((u) => u.email === email)) throw new HttpError(409, "Ya existe una cuenta con ese correo");

  // Todo registro público nace como CLIENTE; solo un administrador puede cambiar el rol (RF-03)
  const user: User = {
    id: ++seq.user, name: (body.name as string).trim(), email, phone: body.phone,
    passwordHash: hashPassword(body.password as string), role: "CLIENTE", addresses: [], paymentMethods: []
  };
  users.push(user);
  res.status(201).json(toPublic(user));
});

// RF-01: POST /api/v1/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body as Partial<LoginDto>;
  if (typeof email !== "string" || typeof password !== "string") {
    throw new HttpError(400, "Datos inválidos", ["email: texto requerido", "password: texto requerido"]);
  }
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) throw new HttpError(401, "Correo o contraseña incorrectos");
  const token = randomUUID();
  sessions.set(token, user.id);
  res.json({ token, user: toPublic(user) });
});

export default router;
