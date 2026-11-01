import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { HttpError } from "./errors";
import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import productRoutes from "./routes/products";
import userRoutes from "./routes/users";

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public"))); // página web de demostración

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);

app.use((req, _res, next) => next(new HttpError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`)));

// Manejo centralizado de errores
app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { status: err.status, message: err.message, details: err.details } });
  } else if (err.type === "entity.parse.failed") {
    res.status(400).json({ error: { status: 400, message: "JSON inválido en el cuerpo de la petición" } });
  } else {
    console.error(err);
    res.status(500).json({ error: { status: 500, message: "Error interno del servidor" } });
  }
});

export default app;
