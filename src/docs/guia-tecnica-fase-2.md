# Guía Técnica Fase 2 — Tiens Catalog

## Propósito
Consolidar las decisiones técnicas cerradas para implementar la Fase 2 sin mezclar esta guía con el calendario operativo. El plan de 15 días vive en [plan-operativo-fase-2.md](plan-operativo-fase-2.md).

## Decisiones cerradas
- Base de datos: PostgreSQL en DigitalOcean.
- Storage de imágenes: DigitalOcean Spaces.
- Publicación: `is_active` + `published_at`.
- Perú es el país semilla. Mientras un país no tenga localización propia, el producto reutiliza el contenido y los assets de PE de forma explícita y controlada.
- `ecommerceUrl` es solo redirección externa.
- Contenido flexible: `benefits`, `applications`, `usage`, `restrictions`, `recommendations` y `technicalInfo` se almacenan como JSONB.
- `metadataBase` se resuelve por environment; valor de producción previsto: `https://vivetiens.com`.
- SEO multi-país por subpaths regionales (`/pe`, `/ec`, etc.).
- `canonical`, `Open Graph`, `hreflang` y metadata se generan dinámicamente por región y producto con `generateMetadata`.
- `next/image` debe aceptar el CDN de assets regionales, incluyendo `cdn.vivetiens.com`.
- Roles iniciales: `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `ASSISTANT`.
- Auth mínima: email/password + sesión.

## Environments recomendados
Usar variables de entorno para evitar hardcodear dominios o CDNs.

### Variables sugeridas
- `SITE_URL`: URL canónica del sitio por entorno.
- `ASSET_CDN_URL`: host de imágenes por entorno.
- `DATABASE_URL`: conexión a PostgreSQL.
- `SESSION_SECRET`: secreto para sesiones.
- `STORAGE_BUCKET` o equivalente: identificador del Space.
- `STORAGE_REGION` o equivalente: región del storage.

### Convención
- Local: `SITE_URL=http://localhost:3000`
- Staging: URL propia del entorno de pruebas.
- Producción: `SITE_URL=https://vivetiens.com`

## Modelo de contenido
### Fuente de verdad
El JSON del mock sigue siendo la fuente de arranque de Fase 1 y el insumo de migración inicial.

### Recomendación de persistencia
- `benefits`, `applications`, `usage`, `restrictions`, `recommendations`: JSONB como arreglo de strings.
- `technicalInfo`: JSONB como objeto clave/valor.
- `seo` en la BD: campos atómicos cuando se persista el contenido.
- Si más adelante se necesita búsqueda avanzada o edición granular, se normalizan campos puntuales sin romper el modelo base.

## JSONB vs HTML sanitizado
### Recomendación
No guardar HTML como formato maestro.

### Motivo
- JSONB permite editar, traducir y validar con menos fricción.
- HTML sanitizado sirve para render, no para autoridad del dato.
- El front puede transformar JSONB en listas, acordeones o bloques enriquecidos.

### Cuándo usar HTML
Solo como formato derivado o de salida, nunca como origen principal.

## Reglas de negocio técnicas
- `sku` único.
- `slug` único.
- `price` mayor que cero.
- `currency` de 3 caracteres.
- `ecommerceUrl` con `https://`.
- Si `product_country.is_active = true`, el registro debe estar completo para publicación propia de ese país.
- Durante el piloto, la disponibilidad por país puede resolverse con fallback a PE cuando todavía no exista localización propia.

## SEO y multi-país
- La URL pública se mantiene por subpath regional.
- Cada producto debe resolver metadata específica por país e idioma.
- `generateMetadata` debe producir `title`, `description`, `openGraph`, `alternates` con `hreflang` y `canonical` por país y producto.

## Imágenes
- Las imágenes de producto pueden variar por país.
- Durante el piloto, si no existe imagen propia del país, se reutiliza la de PE y el front debe resolver la URL con el país efectivo de fallback.
- El front debe aceptar imágenes locales y/o CDN regional.
- `next/image` debe incluir el dominio del CDN configurado por entorno.
- Cuando el asset venga de Spaces, la URL se guarda como URL final del recurso.

## Roles y acceso
- `ASSISTANT`: opciones más restringidas (por ejemplo, solo ver).

## Arranque del Día 1
### Objetivo
Cerrar la base técnica mínima para poder implementar migraciones y seed.

### Entregables del Día 1
- DDL final de las tablas base.
- Reglas de validación de datos.
- Definición exacta de mapeo mock → BD.
- Lista de variables de entorno.
- Criterio de publicación por país.

### Checklist técnico
- Confirmar esquema final de `product`, `product_country`, `product_translation`, `product_image`, `category` y relaciones.
- Definir índices y restricciones.
- Alinear el importador desde `catalog.fase1.mock.json`.
- Dejar documentado el contrato de environments.
- Validar que el plan operativo sigue el orden Día 1 → Día 15.

## Referencias
- [plan-operativo-fase-2.md](plan-operativo-fase-2.md)
- [backend.md](backend.md)
- [modelo-datos-fase2.md](modelo-datos-fase2.md)
- [contrato-minimo-datos-fase-1.md](contrato-minimo-datos-fase-1.md)
