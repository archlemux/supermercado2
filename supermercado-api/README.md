# Supermercado en Línea: API REST

API REST (Node + TypeScript + Express) del proyecto **Supermercado en Línea** (plataforma e-commerce de abarrotes). Cubre los requisitos RF-01 a RF-06: registro e inicio de sesión, perfil y direcciones, roles y permisos, categorías y subcategorías, búsqueda con filtros y ficha de producto. Los datos viven en **arrays en memoria**: se reinician cada vez que se reinicia el servidor.

## Requisitos

- Node.js 18 o superior
- npm

## Cómo correr el proyecto

```bash
npm install
npm run dev      # desarrollo (recarga automática) en http://localhost:3000
# o bien
npm run build    # compila a /dist
npm start        # ejecuta la versión compilada
```

Puerto configurable con la variable `PORT` (por defecto 3000). URL base: `http://localhost:3000/api/v1`

## Scripts npm

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor en modo desarrollo con `ts-node-dev` |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta `dist/server.js` |

## Dependencias

- Producción: `express`
- Desarrollo: `typescript`, `ts-node-dev`, `@types/node`, `@types/express`

## Estructura

```
src/
  models.ts      # User, Address, Product, Category, roles
  dtos.ts        # DTOs de entrada (registro, login, producto, categoría...)
  store.ts       # datos en memoria (usuarios, categorías, productos, sesiones)
  security.ts    # hash de contraseñas con scrypt
  auth.ts        # requireAuth y requireRole (RF-03)
  errors.ts      # HttpError
  routes/        # auth.ts, users.ts, categories.ts, products.ts
  app.ts         # configuración de Express y manejo de errores
  server.ts      # arranque del servidor
public/index.html  # página web de demostración que usa la API (servida por el backend)
frontend/stockflow-catalogo.html  # catálogo del equipo de frontend (datos propios, aún no conectado a la API)
postman/Supermercado.postman_collection.json
```

## Autenticación y roles

`POST /auth/login` devuelve un token que se envía como `Authorization: Bearer <token>`. Los tokens se guardan en memoria. Roles: `CLIENTE`, `ADMINISTRADOR`, `REPARTIDOR`. Todo registro público crea un `CLIENTE`; solo un administrador puede cambiar el rol de un usuario.

Usuarios de demostración:

| Rol | Correo | Contraseña |
|---|---|---|
| ADMINISTRADOR | admin@supermercado.com | Admin123 |
| CLIENTE | cliente@supermercado.com | Cliente123 |
| REPARTIDOR | repartidor@supermercado.com | Repartidor123 |

## Endpoints

| RF | Método | Ruta | Token / rol | Estado |
|---|---|---|---|---|
| RF-01 | POST | `/api/v1/auth/register` | No | ✅ Implementado |
| RF-01 | POST | `/api/v1/auth/login` | No | ✅ Implementado |
| RF-02 | GET | `/api/v1/users/me` | Sí | ✅ Implementado |
| RF-02 | GET | `/api/v1/users/me/addresses` | Sí | ✅ Implementado |
| RF-02 | POST | `/api/v1/users/me/addresses` | Sí | ✅ Implementado |
| RF-02 | PATCH | `/api/v1/users/me` | Sí | 📄 Solo documentado |
| RF-02 | DELETE | `/api/v1/users/me/addresses/:addressId` | Sí | 📄 Solo documentado |
| RF-02 | GET | `/api/v1/users/me/payment-methods` | Sí | 📄 Solo documentado |
| RF-02 | POST | `/api/v1/users/me/payment-methods` | Sí | 📄 Solo documentado |
| RF-03 | PATCH | `/api/v1/users/:id/role` | Sí, ADMINISTRADOR | ✅ Implementado |
| RF-04 | GET | `/api/v1/categories` | No | ✅ Implementado |
| RF-04 | POST | `/api/v1/categories` | Sí, ADMINISTRADOR | ✅ Implementado |
| RF-04 | POST | `/api/v1/categories/:id/subcategories` | Sí, ADMINISTRADOR | 📄 Solo documentado |
| RF-05 | GET | `/api/v1/products` (filtros) | No | ✅ Implementado |
| RF-06 | GET | `/api/v1/products/:id` (ficha) | No | ✅ Implementado |
| RF-06 | POST | `/api/v1/products` | Sí, ADMINISTRADOR | ✅ Implementado |
| RF-06 | DELETE | `/api/v1/products/:id` | Sí, ADMINISTRADOR | ✅ Implementado |
| RF-06 | PATCH | `/api/v1/products/:id` | Sí, ADMINISTRADOR | 📄 Solo documentado |

**Implementados: 12. Solo documentados: 6.** El detalle completo (params, body, respuestas) está en el documento de inventario de endpoints.

### Filtros de `GET /products` (RF-05)

`search` (nombre o marca), `categoryId`, `subcategoryId`, `brand`, `minPrice`, `maxPrice`, `inStock` (`true`/`false`), `page` (def. 1) y `limit` (def. 10, máx. 100).

## Ejemplos con curl

```bash
B=http://localhost:3000/api/v1

# RF-01: registro y login
curl -X POST $B/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Brayan","email":"brayan@test.com","password":"Clave1234","phone":"3001234567"}'

TOKEN=$(curl -s -X POST $B/auth/login -H "Content-Type: application/json" \
  -d '{"email":"cliente@supermercado.com","password":"Cliente123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

ADMIN=$(curl -s -X POST $B/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@supermercado.com","password":"Admin123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# RF-02: perfil y direcciones
curl $B/users/me -H "Authorization: Bearer $TOKEN"
curl -X POST $B/users/me/addresses -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"label":"Casa","street":"Calle 100 # 15-20","city":"Bogotá"}'
curl $B/users/me/addresses -H "Authorization: Bearer $TOKEN"

# RF-03: cambiar rol (solo administrador)
curl -X PATCH $B/users/2/role -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"role":"REPARTIDOR"}'

# RF-04: categorías con subcategorías
curl $B/categories
curl -X POST $B/categories -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"name":"Aseo","subcategories":["Detergentes","Papel"]}'

# RF-05: búsqueda y filtros
curl "$B/products?search=leche&inStock=true"
curl "$B/products?brand=Roa&minPrice=1000&maxPrice=3000&categoryId=1"

# RF-06: ficha de producto y alta
curl $B/products/3
curl -X POST $B/products -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"name":"Detergente Fab 1kg","description":"Detergente en polvo","brand":"Fab","unit":"1 kg","price":9500,"stock":30,"categoryId":1,"subcategoryId":1}'
curl -X DELETE $B/products/7 -H "Authorization: Bearer $ADMIN"
```

## Ver el supermercado en el navegador

Con el servidor encendido (`npm run dev`), abre **http://localhost:3000**. La página `public/index.html` consume la API: catálogo con filtros (RF-04 y RF-05), ficha de producto (RF-06), registro e inicio de sesión (RF-01), perfil y direcciones (RF-02), y un panel de administración (RF-03, RF-04 y RF-06). Abajo tiene un registro con cada llamada a la API y su respuesta.

## Errores

Formato único de error:

```json
{ "error": { "status": 400, "message": "Datos inválidos", "details": ["price: número mayor que 0"] } }
```

Códigos: `400` (validación), `401` (sin token o token inválido), `403` (rol sin permiso), `404` (no encontrado), `409` (conflicto: correo, categoría o producto duplicado), `500` (error interno).

## Postman

Importar `postman/Supermercado.postman_collection.json`. Ejecutar primero **POST login administrador** y **POST login cliente**, que guardan los tokens en las variables `adminToken` y `clientToken`; luego se puede correr toda la colección con el Collection Runner.
