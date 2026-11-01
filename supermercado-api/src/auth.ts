import { NextFunction, Request, Response } from "express";
import { HttpError } from "./errors";
import { PublicUser, Role, User } from "./models";
import { sessions, users } from "./store";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) throw new HttpError(401, "Falta el token. Usa: Authorization: Bearer <token>");
  const userId = sessions.get(header.slice(7));
  const user = users.find((u) => u.id === userId);
  if (!user) throw new HttpError(401, "Token inválido o expirado");
  res.locals.user = user;
  next();
}

export const requireRole = (...roles: Role[]) => (_req: Request, res: Response, next: NextFunction): void => {
  if (!roles.includes(currentUser(res).role)) throw new HttpError(403, `Acceso denegado. Rol requerido: ${roles.join(" o ")}`);
  next();
};

export const currentUser = (res: Response): User => res.locals.user as User;

export function toPublic(user: User): PublicUser {
  const { passwordHash, ...rest } = user;
  return rest;
}
