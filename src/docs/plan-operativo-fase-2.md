# Plan Operativo Fase 2 — Mantenedor + API + BD (15 días)

## Propósito
Plan de trabajo de 15 días para implementar la Fase 2: API CRUD, admin interno, persistencia en PostgreSQL y gestión de imágenes en DigitalOcean Spaces, partiendo del mock actual.

## Supuestos cerrados
- Base de datos: PostgreSQL local para los primeros ciclos de validación; PostgreSQL en DigitalOcean cuando el modelo y el importador estén estables.
- Storage de imágenes: DigitalOcean Spaces.
- Países iniciales: pe, ec, bo, co, mx, br, ar, pa, us, ve.
- Monedas confirmadas: BRL, ARS, PAB, USD, VES; para los países ya existentes se mantiene la moneda oficial de cada mercado.
- `metadataBase`: https://vivetiens.com.
- Estrategia SEO/URL: subpaths regionales (`/pe`, `/ec`, etc.) con canonical, Open Graph, `hreflang` y metadata generados por `generateMetadata`.
- `next/image` deberá permitir el dominio/CDN de assets regionales, incluyendo `cdn.vivetiens.com`.
 - Roles: SUPER_ADMIN, ADMIN (por país), EDITOR, ASSISTANT.
 - Roles y responsabilidades:
	 - SUPER_ADMIN: Acceso a todos los países
	 - ADMIN: administrador con acceso a todas las opciones dentro de un país
	 - EDITOR: sólo puede subir información de los productos
	 - ASSISTANT: opciones más restringidas (por ejemplo, solo ver)
 - Auth mínima: email/password + sesión.
- Comportamiento de producto: Perú es el país semilla; mientras un país no tenga localización propia, reutiliza temporalmente el contenido y los assets de PE.
- `ecommerceUrl` es únicamente redirección externa.
- Campos flexibles (`benefits`, `applications`, `usage`, `restrictions`, `recommendations`, `technicalInfo`) se almacenan inicialmente como JSONB.

---

## Criterios de aceptación generales
- API pública y admin operativos en staging.
- Seed importado desde el mock y verificado por país.
- Subida y entrega de imágenes desde Spaces funcionando.
- Autenticación y roles implementados.
- Smoke tests y despliegue a producción automatizable.

---

## Orden de implementación (resumido)
1. Definir DDL y migraciones; preparar mapeo desde JSON.
2. Provisionar Spaces desde el inicio y mover la BD a DigitalOcean cuando el modelo esté estable.
3. Implementar repository + seed importer.
4. Implementar API read-only, luego CRUD y admin UI.
5. Integrar upload de imágenes y CDN.
6. QA, smoke tests y despliegue a staging y producción.

---

## Plan diario (15 días)

Día 1 — Definición técnica y kickoff
- Objetivo: cerrar modelo físico, reglas y artefactos de migración.
- Tareas: revisar `modelo-datos-fase2.md`, ajustar DDL, definir campos JSONB, definir monedas por país, preparar checklist de entregables.
- Entregable: DDL final + lista de validaciones Zod/Schema.
- Responsable: Dev
- **ESTADO: ✓ COMPLETADO**

Día 2 — Provisionamiento infra y accesos
- Objetivo: dejar listo el entorno local de BD y Spaces para validar el mantenedor sin depender aún de la BD remota.
- Tareas: levantar PostgreSQL local para desarrollo, crear Space, generar credenciales y variables de entorno, documentar accesos y dejar definido el paso posterior a DigitalOcean.
- Entregable: entorno local funcional + credenciales de Spaces en vault/archivo seguro.
- Responsable: Dev
- **ESTADO: ✓ COMPLETADO**

Checklist manual Día 2
- Confirmar acceso a la cuenta/proyecto de DigitalOcean para Spaces: hecho.
- Levantar o verificar PostgreSQL local para desarrollo: hecho (`tiens_catalog_dev`, usuario `tiens_app`).
- Crear o verificar el proyecto de staging para Fase 2 cuando corresponda mover la BD: pendiente de habilitar cuando el modelo esté estable.
- Crear el usuario/rol de aplicación para la base de datos local o de staging según el entorno que se pruebe: `tiens_app`.
- Registrar el `DATABASE_URL` y validar que apunte al entorno local de desarrollo: pendiente de completar en `.env`.
- Crear el Space para assets de staging: hecho.
- Generar las credenciales del Space (`DO_SPACES_KEY` y `DO_SPACES_SECRET`): hecho.
- Confirmar el endpoint/CDN del Space y su región: `https://tiens-assets-staging.nyc3.cdn.digitaloceanspaces.com` / `nyc3`.
- Definir las variables de entorno mínimas para la app: documentadas en `.env.example`.
- Guardar credenciales en un lugar seguro y accesible solo al equipo autorizado: hecho.
- Probar conexión a la base de datos desde una máquina local o herramienta de administración: pendiente de verificación final.
- Probar escritura/lectura básica en el Space con un archivo pequeño: hecho.
- Documentar nombres, URLs, credenciales y responsables de acceso: en curso en este documento.
- Dejar anotado qué queda pendiente para mover la BD a DigitalOcean y, después, automatizar con `doctl` o Terraform: pendiente de ejecución posterior.

## Resultado de la ejecución del Día 2
- Recurso de DigitalOcean: proyecto `tiens-catalog`.
- BD local: `tiens_catalog_dev` con usuario `tiens_app`.
- Space: `tiens-assets-staging`.
- Región: `nyc3`.
- CDN: `https://tiens-assets-staging.nyc3.cdn.digitaloceanspaces.com`.
- Estado funcional: carga y lectura de imágenes verificadas correctamente en local.

## Pendiente técnico
- Completar `DATABASE_URL` en el entorno local.
- Mantener las credenciales reales fuera del repositorio.
- Mover la BD a DigitalOcean cuando el modelo y el importador se estabilicen.
- Automatizar provisioning con `doctl` o Terraform en una iteración posterior.

Día 3 — Migraciones y DDL
- Objetivo: crear migraciones y ejecutar DDL en la base local de validación.
- Tareas: agregar migraciones SQL (CREATE TABLEs, índices, constraints), ejecutar en local, comprobar integridad.
- Entregable: migraciones aplicadas en la base local y listas para promover a staging cuando corresponda.
- Responsable: Dev
 - **ESTADO: ✓ COMPLETADO**

Día 4 — Script importador JSON → BD (prototipo)
- Objetivo: escribir script que mapea `catalog.fase1.mock.json` al modelo físico.
- Tareas: mapear products → product, product_country, product_translation, product_image; insertar países/idiomas; pruebas con subset de productos.
- Entregable: script runnable `scripts/import_mock.js` y logs.
- Responsable: Dev
 - **ESTADO: ✓ COMPLETADO**

Día 5 — Importador completo + verificación de datos
- Objetivo: correr importador completo y validar resultados por país.
- Tareas: ejecutar import en staging, comprobar conteo de registros, validar fallback a PE y registrar qué países siguen sin localización propia.
- Entregable: reporte de import, discrepancias y cobertura real por país.
- Responsable: Dev / QA
 - **ESTADO: ✓ COMPLETADO**

Día 6 — API pública (lectura) y endpoints básicos
- Objetivo: exponer `GET /api/products?country=&lang=` y `GET /api/products/:id`.
- Tareas: implementar route handlers, service layer, pruebas unitarias básicas.
- Entregable: endpoints funcionando en staging.
- Responsable: Dev
 - **ESTADO: ✓ COMPLETADO**

Día 7 — Admin scaffolding (UI) y rutas
- Objetivo: scaffolding del admin en `/admin` dentro de Next.js.
- Tareas: layout admin, autenticación UI (login), rutas: `/admin/products`, `/admin/products/new`, `/admin/products/[id]`.
- Entregable: UI navegable (sin CRUD completo).
- Responsable: Dev
 - **ESTADO: ✓ COMPLETADO**

Día 8 — Autenticación y roles
- Objetivo: implementar login, sesión y control de roles.
 - Tareas: endpoints de auth (login/logout), middleware de sesión, protección de rutas admin, seed de usuario SUPER_ADMIN y ADMIN.
- Entregable: función de login + middleware role-based.
- Responsable: Dev
 - **ESTADO: ✓ COMPLETADO**

Día 9 — CRUD de productos (API + admin)
- Objetivo: implementar creación, edición y borrado de productos desde API y admin UI.
- Tareas: endpoints `POST/PUT/DELETE /api/admin/products`, formularios en UI, validaciones Zod.
- Entregable: CRUD funcional en staging.
- Responsable: Dev
 - **ESTADO: ✓ COMPLETADO**


Día 10 — Gestión de imágenes (upload a Spaces) y vinculaciones
- Objetivo: integrar upload de imágenes desde admin hacia Spaces y guardar URLs en BD.
- Tareas: endpoints de upload, política CORS de Space, test uploads desde UI, marcar imagen principal.
- Entregable: imágenes subidas y accesibles via CDN/Space.
- Responsable: Dev
 - **ESTADO: ✓ COMPLETADO**

Resultado de validación técnica local Día 10
- Typecheck sin errores: `npx tsc --noEmit`.
- Suite API local verde con variables de entorno cargadas: `npm run test:api`.
- Smoke tests administrativos verdes: `tests/admin.ecommerce-id.test.ts`, `tests/admin.navigation.test.ts`, `tests/admin.seed-alignment.test.ts`.
- Verificación SQL en base local: `product_image` contiene URLs absolutas (`absolute_count = 37`) y no rutas locales (`local_count = 0`).

Checklist manual Día 10 (Spaces + CORS)
- Confirmar que `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_BUCKET`, `DO_SPACES_REGION`, `DO_SPACES_ENDPOINT` y `NEXT_PUBLIC_SPACES_CDN_URL` estén definidos en el entorno activo.
- Verificar que el bucket del Space permita lectura pública de objetos para servirlos por CDN.
- Aplicar política CORS del Space para el dominio admin de cada entorno:
	- Allowed origins: URL del admin (`http://localhost:3000` en local, dominio de staging/prod según corresponda).
	- Allowed methods: `GET`, `PUT`, `POST`, `HEAD`.
	- Allowed headers: `*`.
	- Max age: `3600`.
- Subir imágenes desde `/admin/regional-configurations/[productCountryId]/edit` y validar respuesta `200`.
- Verificar en BD (`product_image.url`) que las nuevas filas guarden URL absoluta CDN y no rutas locales.
- Probar en UI: marcar principal y eliminar para confirmar reordenamiento e integridad de `is_primary`.

Día 11 — Import Excel / data enrichment + QA de contenido
- Objetivo: si entregas Excel, mapear y enriquecer datos antes de import final.
- Tareas: script para convertir Excel → JSON → BD, validar campos faltantes por país, revisar SEO/CTAs.
- Entregable: import enriquecido y reporte de faltantes.
- Responsable: Dev / QA

Día 12 — Integración frontend y SSG/ISR adjustments
- Objetivo: migrar frontend para consumir API y mantener pre-render correcto.
- Tareas: actualizar `generateStaticParams()` o pasar a fallback+ISR según volumen, probar listing y detalle en staging.
- Entregable: frontend consumiendo API en staging.
- Responsable: Dev
 - **ESTADO: ✓ COMPLETADO**


Día 13 — Tests, observabilidad y smoke tests
- Objetivo: pruebas de integración, endpoints y eventos mínimos (vistas, CTA).
- Tareas: escribir tests E2E simples, configurar logging, instrumentar eventos básicos en DB o endpoint `/api/events`.
- Entregable: suite de smoke tests y dashboard básico de logs.
- Responsable: QA / Dev

Día 14 — Preparación despliegue y CI
- Objetivo: pipeline CI para staging y producción, migraciones en deploy.
- Tareas: configurar Github Actions (o CI elegido) para build, test y despliegue; asegurar migraciones automáticas o controlables.
- Entregable: pipeline de despliegue y documentación de rollback.
- Responsable: Dev

Día 15 — Despliegue a producción y cierre
- Objetivo: publicar en producción, validar flows y entregar guía de uso.
- Tareas: desplegar a producción, correr smoke tests, documento de handover (credenciales, variables env, runbooks), validar compra redirección.
- Entregable: Fase 2 desplegada en producción y readme de operación.
- Responsable: Dev / QA

---

## Dependencias críticas
- Credenciales DO para DB y Spaces.
- Lista final de países ya definida en el mock actual y ampliada con BR, AR, PA, US, VE.
- Acceso a dominio/metadataBase si aplica.
- Excel original con datos (opcional, recomendado para enriquecimiento).

## Riesgos y mitigaciones (breve)
- Datos incompletos por país → mitigar con import parcial y marcar contenido "draft/oculto".
- Uploads a Spaces mal configurados → test temprano con CORS y políticas.
- Falta de validación → usar Zod para esquema en el service layer.

---

## Preguntas pendientes (confirmar antes de arrancar)
1. ¿Deseas que el admin incluya un control de publicación (draft vs published) o usamos `is_active` + `published_at`?  
2. ¿El Excel adjunto es la versión final para seed/enriquecimiento, o habrá otra hoja/fuente adicional?  
3. ¿Procedo a generar PR en `develop` con el código scaffolding y los scripts iniciales una vez confirmes lo anterior?

---

## Checklist mínimo para arrancar (pre-sprint)
- Provisionar PostgreSQL local + Spaces y compartir credenciales.
- Confirmar monedas por país y entregar Excel (si aplica).
- Acordar el punto de corte para mover la BD a DigitalOcean y el acceso CI/CD/dominio destino para producción.

## Referencias
- [bloque-tecnico-dia-1-fase-2.md](bloque-tecnico-dia-1-fase-2.md)
- [guia-tecnica-fase-2.md](guia-tecnica-fase-2.md)
- [backend.md](backend.md)
- [modelo-datos-fase2.md](modelo-datos-fase2.md)
- [contrato-minimo-datos-fase-1.md](contrato-minimo-datos-fase-1.md)

---

> Archivo generado por el equipo técnico como plan operativo de Fase 2. Actualizaciones y ajustes se registrarán en commits y PRs relacionados.
