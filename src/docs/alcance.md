# Alcance — Tiens Landing Productos

## Propósito
Documentar el alcance necesario para completar la Fase 2 del proyecto (Mantenedor + API + Base de Datos) y dejar constancia del estado actual de la Fase 1.

## Resumen del estado actual
- Fase 1 funcional: Landing (listado) y detalle de producto implementados y desplegados con Next.js (App Router).
- Rutas actuales: raíz con redirección a `/pe`, landing por país en `/{country}` y detalle en `/{country}/producto/[slug]`.
- Datos: `src/mock-data/catalog.fase1.mock.json` como fuente local principal.
- Imágenes: servidas desde el CDN de DigitalOcean Spaces; la carpeta `public/product-assets/` queda como fuente local de conversión (`raw/` y `optimized/`).
- Observación: el header muestra un enlace a `/admin` pero no existe ruta de mantenedor en el proyecto.

## Verificación de alineación con la Fase 1
- Alineado: la landing y el detalle existen, están construidos con App Router y dependen de datos locales del repo.
- Alineado: el detalle ya usa `generateStaticParams()` para pre-renderizar productos por país.
- Parcialmente alineado: la base multi-país existe en la estructura de datos y en las rutas, pero el contenido real disponible en el JSON está cargado solo para `pe`; los demás países usan fallback a `pe`.
- Parcialmente alineado: existe base multi-idioma en la estructura, pero hoy solo se observa contenido en `es`.
- Desalineado respecto al documento técnico: la documentación de diseño habla de `/pe/productos`, mientras la implementación actual expone `/pe` como landing.
- Desalineado respecto al alcance futuro: no existe aún mantenedor ni ruta `/admin` funcional.

## Alcance — Entregables principales (Fase 2)
1. Backoffice / Mantenedor
   - UI para CRUD de productos (crear, editar, eliminar, activar/desactivar).
   - Gestión por país y por idioma (precio, textos, imágenes, ecommerceUrl).
   - Subida de imágenes con almacenamiento en cloud (DigitalOcean Spaces o S3 compatible).
   - Roles básicos y permisos (admin, editor).

2. API REST
   - Endpoints para listar, obtener, crear, actualizar y borrar productos.
   - Endpoints para subir/gestionar imágenes y listas por país/idioma.
   - Validación de payloads (p. ej. Zod) y control básico de errores.
   - Autenticación mínima para el admin (token / sesión).

3. Base de Datos
   - PostgreSQL gestionada (ej. DigitalOcean Managed DB).
   - Modelo mínimo: Product, ProductCountry, ProductTranslation, ProductImage, Audit/History.
   - Migraciones y script de seed que importe `src/mock-data/catalog.fase1.mock.json`.

4. Integración Frontend
   - Consumir la API en vez del JSON estático; mantener las rutas públicas actuales.
   - Asegurar pre-rendering correcto (`generateStaticParams()` para landing y detalle).
   - Mejoras: `metadataBase`, configuración de dominios para `next/image` si se usa CDN/Spaces.

5. Infraestructura y despliegue
   - Hosting front (Vercel recomendado) y backend/DB/Spaces en DigitalOcean (según propuesta).
   - CI: build + migraciones automáticas en staging.

6. Observabilidad y QA
   - Eventos para CTA (click comprar), vistas de producto y errores básicos.
   - Smoke tests: build, lint, y pruebas de endpoints críticos.

## Criterios de aceptación (mínimos)
- El admin permite crear/editar productos y publicar cambios visibles en la landing (o tras publicación explícita).
- Las páginas públicas sirven contenido por país: `/ec`, `/mx`, `/bo`, `/co` no deben mostrar contenido de `pe` sin un fallback documentado.
- Subida de imágenes y servicio desde Spaces/CDN funcionando.
- Build y lint pasan en CI; endpoints críticos responden correctamente en staging.

## Requisitos del cliente previos al inicio
- Provisionamiento o acceso a: credenciales Vercel (o destino), DigitalOcean (DB + Spaces), y cuentas necesarias.
- Contenido por producto: textos por idioma, precios por país, `ecommerceUrl` y archivos de imagen.
- Confirmación de lista de países y reglas de fallback/moneda.

## Riesgos y mitigaciones
- Datos multi-país incompletos: definir fallback claro y/o completar datos antes de la publicación. (Mitigación: importar mock y marcar productos incompletos en admin).
- Enlaces externos inseguros (`ecommerceUrl`): sanitizar y validar URLs en API y UI.
- Rutas pre-render mal configuradas: agregar `generateStaticParams()` y/o ISR según necesidad.
- Migración de paths de imágenes: plan de migración para actualizar las rutas a Spaces (scripts de update en DB).

## Prioridad de trabajo (pasos iniciales recomendados)
1. Definir modelo de datos y migraciones; preparar script de import desde el JSON actual.
2. Provisionar DB (staging) y Storage (Spaces) y compartir credenciales.
3. Implementar API básica con autenticación y validación.
4. Scaffolding del admin (login, CRUD producto, subida de imágenes).
5. Integrar frontend a la API, ajustar SSG/ISR y `metadataBase`.
6. QA y despliegue a staging; revisión con el cliente.

## Estimación y costo (resumen)
- Tiempo estimado Fase 2 (propuesta): ~15 días.
- Costo estimado según propuesta: USD $300 (revisar condiciones del contrato adjunto).

## Exclusiones (confirmadas)
- No incluye desarrollo de e-commerce ni integraciones en tiempo real con tiendas externas.
- No incluye copywriting ni creación de assets (cliente entrega textos/imágenes).

---
Documento generado automáticamente desde el repositorio como resumen de alcance para Fase 2.

## Referencias
 - Ver también: [frontend.md](frontend.md), [backend.md](backend.md), [modelo-datos-fase2.md](modelo-datos-fase2.md), [workflow-git.md](workflow-git.md)
 - Contrato mínimo de datos (mock Fase 1): [contrato-minimo-datos-fase-1.md](contrato-minimo-datos-fase-1.md)
 - Diseño / tokens: [design-system.md](design-system.md)
 - Estructura del proyecto: [estructura-proyecto.md](estructura-proyecto.md)
 - Propuesta técnica y comercial: [Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md](Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md)
