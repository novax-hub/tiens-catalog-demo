# Backlog Técnico por PR — Fase 2 Admin

## Propósito

Este documento traduce el roadmap funcional y técnico del mantenedor en una secuencia concreta de PRs.

Cada PR define:

- objetivo
- alcance
- dependencias
- archivos probables
- riesgos
- checklist de aceptación

La intención es reducir retrabajo, aislar riesgos y mantener una progresión clara desde la base de permisos hasta la UI final del admin.

---

## Supuestos cerrados

- La activación regional usa `product_country.is_active`.
- La activación global excepcional usa `product.is_active`.
- `published_at` no participa en el flujo funcional actual.
- Categorías quedan fuera de alcance en esta etapa.
- `features` permanece oculto en UI.
- `ecommerceExternalId` se deriva en backend desde `ecommerceUrl`.
- `SUPER_ADMIN` tiene acceso global.
- `ADMIN`, `EDITOR` y `ASSISTANT` operan sólo sobre sus países asignados.

1. PR 1 — Permisos y autorización granular
  Título sugerido: `refactor(auth): add granular role permissions and country-scoped authorization`
2. PR 2 — Capa de datos admin separada de la API pública
  Título sugerido: `refactor(admin): split admin data layer from public catalog api`
3. PR 3 — Navegación y landing del panel por rol
4. PR 4 — Módulo de Productos globales
  Título sugerido: `feat(admin-products): global products list and global product detail`
**ESTADO: COMPLETADO**
5. PR 5 — Flujo Agregar país
  Título sugerido: `feat(admin-products): add country flow for existing product`
6. PR 6 — Módulo de Productos por País: listado y detalle lectura
  Título sugerido: `feat(admin-regional): regional configurations list and read-only detail`
7. PR 7 — Editor de Producto por País con tabs y medios
  Título sugerido: `feat(admin-regional): regional configuration editor with tabs and media integration`
8. PR 8 — Módulo de Usuarios
  Título sugerido: `feat(admin-users): country-scoped user management`

**ESTADO: COMPLETADO**


### Objetivo

### Alcance

- Definir capacidades por rol.
- Separar permisos de:
  - ver productos por país
  - editar contenido
  - gestionar asignación de países
- Mantener intacta la UX actual de imágenes; en este PR solo se endurecen permisos sobre ese flujo si hace falta.

### Qué sí entra

- Reemplazar el uso central de `canRoleEdit()` por helpers de capacidad más precisos.
- Introducir helpers para validar acceso por país.
- Aplicar autorización por rol y país en middleware.
- Aplicar autorización por rol y país en endpoints admin existentes.
- Mantener login/logout operativos.

### Qué no entra

- Nueva navegación del panel por rol.
- Nuevas pantallas de `Productos` o `Productos por País`.
- Refactor de formularios.
- Módulo de usuarios.
- Cambio de UX de imágenes.
- Reorganización del editor actual más allá de validación de permisos.

### Dependencias

- Ninguna, salvo el contrato funcional cerrado.

### Archivos probables

- [src/lib/auth.ts](src/lib/auth.ts)
- [src/middleware.ts](src/middleware.ts)
- [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts)
- [src/app/api/admin/products/route.ts](src/app/api/admin/products/route.ts)
- [src/app/api/admin/products/[id]/route.ts](src/app/api/admin/products/[id]/route.ts)
- [src/app/api/admin/products/[id]/images/route.ts](src/app/api/admin/products/[id]/images/route.ts)

### Tareas técnicas

1. Refactor de permisos en `auth.ts`
- Incorporar helpers por capacidad.
- Incorporar helper de acceso por país.
- Mantener `countryCodes` en la sesión como fuente de autorización.

2. Endurecer `middleware.ts`
- Mantener protección de sesión.
- Restringir acceso a rutas según rol.
- Preparar redirección segura por rol sin abrir todavía la nueva navegación.

3. Endurecer endpoints admin
- Validar país objetivo en backend.
- Validar acción por capacidad, no solo por “rol editable”.
- Garantizar que `ASSISTANT` quede en solo lectura real.

4. Revisar login/session
- Confirmar carga correcta de `countryCodes` al iniciar sesión.
- Mantener redirección funcional tras login.

5. Validación funcional mínima
- Probar casos por rol sobre endpoints y flujo actual del panel.

### Riesgos

- Romper acceso actual del panel por cambios en middleware.
- Dejar huecos de autorización si la validación queda solo en UI.
- Sobrecomplicar una primera versión del modelo de permisos.
- Alterar accidentalmente el flujo actual de imágenes.

### Checklist de aceptación

- `ADMIN` no puede operar sobre países no asignados.
- `EDITOR` no puede activar/desactivar productos por país.
- `ASSISTANT` no puede modificar endpoints admin.
- `SUPER_ADMIN` mantiene acceso completo.
- Middleware y endpoints validan país y rol, no solo existencia de sesión.

### Criterios de validación

- `SUPER_ADMIN` puede acceder a todas las rutas admin existentes.
- `ADMIN` puede operar solo sobre sus países asignados.
- `EDITOR` puede editar contenido, SEO e imágenes de sus países, pero no activar/desactivar productos por país.
- `ASSISTANT` recibe `403` al intentar modificar endpoints admin.
- El flujo actual de imágenes se mantiene para roles permitidos.
- Login y logout siguen operativos.
- Middleware no genera bucles de redirección.

---

## PR 2 — Capa de datos admin separada de la API pública

**ESTADO: COMPLETADO**

**PR sugerido:** `refactor(admin): split admin data layer from public catalog api`

### Objetivo

Desacoplar el admin de la API pública del catálogo y crear consultas orientadas a backoffice.

### Alcance

- Crear consultas o servicios para:
  - listado de productos globales
  - detalle de producto global
  - listado de configuraciones regionales
  - detalle de configuración regional
  - base para listado de usuarios
- Crear tipos/view models específicos de admin.
- Evitar depender de [src/lib/catalog-api.ts](src/lib/catalog-api.ts) para pantallas administrativas.

### Dependencias

- PR 1 completado.

### Archivos probables

- [src/modules/product/product.repository.ts](src/modules/product/product.repository.ts)
- [src/modules/product/product.types.ts](src/modules/product/product.types.ts)
- [src/modules/product/product.mapper.ts](src/modules/product/product.mapper.ts)
- [src/lib/catalog-api.ts](src/lib/catalog-api.ts)
- Nuevos servicios o rutas bajo `src/app/api/admin/**`

### Riesgos

- Duplicar lógica de lectura entre API pública y admin.
- Mezclar DTOs públicos con DTOs internos del admin.
- Aumentar demasiado el tamaño de `product.repository.ts`.

### Checklist de aceptación

- El admin puede resolver datos sin pasar por la API pública.
- Existen consultas separadas para producto global y configuración regional.
- Las respuestas contemplan restricciones por rol y país.

---

## PR 3 — Navegación y landing del panel por rol

**ESTADO: COMPLETADO**

**PR sugerido:** `feat(admin): role-based navigation and dashboard routing`

### Objetivo

Adaptar la estructura del panel a los flujos reales de trabajo definidos por rol.

### Alcance

- Rediseñar menú lateral.
- Definir landing de `/admin` según rol.
- Implementar visibilidad condicional de módulos:
  - `SUPER_ADMIN`: Dashboard, Productos, Productos por País, Usuarios
  - `ADMIN`: Dashboard, Productos por País, Usuarios
  - `EDITOR`: Productos por País
  - `ASSISTANT`: Productos por País

### Dependencias

- PR 1 y PR 2.

### Archivos probables

- [src/components/admin/admin-panel-shell.tsx](src/components/admin/admin-panel-shell.tsx)
- [src/app/admin/page.tsx](src/app/admin/page.tsx)
- [src/app/admin/(panel)/layout.tsx](src/app/admin/(panel)/layout.tsx)
- Posibles nuevos componentes de navegación en `src/components/admin/`

### Riesgos

- Enlaces rotos durante la transición de rutas.
- Inconsistencias entre navegación visible y permisos reales.

### Checklist de aceptación

- Cada rol ve solo las entradas que le corresponden.
- `ADMIN`, `EDITOR` y `ASSISTANT` no ven “Productos”.
- `/admin` redirige a la pantalla correcta según rol.

---

## PR 4 — Módulo de Productos globales

**ESTADO: COMPLETADO**

**PR sugerido:** `feat(admin-products): global products list and global product detail`

### Objetivo

Implementar la superficie de administración del catálogo global para `SUPER_ADMIN`.

### Alcance

- Pantalla de listado de productos globales.
- Pantalla de detalle de producto global.
- Mostrar:
  - SKU
  - estado global
  - países configurados
  - idiomas por país
- Acciones:
  - ver
  - editar producto global
  - agregar país
  - activar/inactivar globalmente

### Dependencias

- PR 2 y PR 3.

### Archivos probables

- [src/app/admin/(panel)/products/page.tsx](src/app/admin/(panel)/products/page.tsx)
- [src/app/admin/(panel)/products/[id]/page.tsx](src/app/admin/(panel)/products/[id]/page.tsx)
- Nuevos componentes bajo `src/components/admin/`
- Nuevas consultas admin en repositorio

### Riesgos

- Mantener lógica vieja de detalle regional en la pantalla global.
- Confundir activación global con activación regional.

### Checklist de aceptación

- El listado trabaja sobre `product`, no sobre una vista regional PE.
- El detalle global muestra países/idiomas configurados.
- El producto global puede activarse o desactivarse sin tocar manualmente cada región.

---

## PR 5 — Flujo Agregar país

**ESTADO: COMPLETADO**

**PR sugerido:** `feat(admin-products): add country flow for existing product`

### Objetivo

Permitir crear un nuevo producto por país para un producto existente.

### Alcance

- Pantalla o modal “Agregar país”.
- Campos mínimos:
  - país
  - idioma inicial
- Crear en una sola operación:
  - `product_country`
  - `product_translation`

### Dependencias

- PR 4.

### Archivos probables

- Nueva ruta UI bajo `src/app/admin/(panel)/products/[id]/...`
- [src/app/api/admin/products/[id]/route.ts](src/app/api/admin/products/[id]/route.ts)
- [src/modules/product/product.repository.ts](src/modules/product/product.repository.ts)

### Riesgos

- Permitir duplicados de país para el mismo producto.
- No validar correctamente país o idioma inicial.

### Checklist de aceptación

- No se puede crear dos veces el mismo país para un producto.
- La operación crea el producto por país y su traducción inicial.
- Solo `SUPER_ADMIN` y, si aplica luego, `ADMIN` de ese país pueden usar este flujo.

---

## PR 6 — Productos por País: listado y detalle lectura

**ESTADO: COMPLETADO**

**PR sugerido:** `feat(admin-regional): regional configurations list and read-only detail`

### Objetivo

Implementar la pantalla principal de trabajo diario para productos por país.

### Alcance

- Listado de productos por país.
- Filtros por:
  - país
  - idioma
  - estado regional
  - texto libre
- Detalle del producto por país en modo lectura.
- Restricción automática por país para `ADMIN`, `EDITOR` y `ASSISTANT`.

### Dependencias

- PR 2 y PR 3.

### Archivos probables

- Nuevas rutas bajo `src/app/admin/(panel)/regional-configurations/**`
- Nuevos componentes en `src/components/admin/`
- Nuevas consultas admin en repositorio

### Riesgos

- Intentar reutilizar el listado global actual sin separar niveles.
- No dejar clara la diferencia entre lectura y edición.

### Checklist de aceptación

- `ADMIN`, `EDITOR` y `ASSISTANT` ven solo productos por país de sus países.
- `ASSISTANT` puede navegar todo el detalle en modo lectura.
- Los filtros funcionan sobre el producto por país, no sobre el producto global.

---

## PR 7 — Editor de Producto por País con tabs y medios

**ESTADO: COMPLETADO**

**PR sugerido:** `feat(admin-regional): regional configuration editor with tabs and media integration`

### Objetivo

Implementar la edición completa del producto por país alineada al documento funcional.

### Alcance

- Tabs o secciones equivalentes:
  - Información General
  - Información Comercial
  - Contenido
  - SEO
  - Información Técnica
  - Medios
- Persistencia real de cambios.
- Soporte para:
  - `ecommerceUrl`
  - derivación backend de `ecommerceExternalId`
  - `benefits`, `applications`, `usage`, `restrictions`, `recommendations`
  - `technicalInfo`
  - `videoUrl`
  - SEO
  - galería de imágenes por país
- `features` oculto.
- categorías fuera de UI.
- Mantener y reutilizar el comportamiento actual de medios como baseline aprobada.

### Dependencias

- PR 1, PR 2 y PR 6.

### Archivos probables

- [src/components/admin/product-detail-editor.tsx](src/components/admin/product-detail-editor.tsx)
- Nuevos formularios regionales en `src/components/admin/`
- [src/app/api/admin/products/[id]/route.ts](src/app/api/admin/products/[id]/route.ts)
- [src/app/api/admin/products/[id]/images/route.ts](src/app/api/admin/products/[id]/images/route.ts)
- [src/modules/product/product.repository.ts](src/modules/product/product.repository.ts)

### Riesgos

- PR demasiado grande si mezcla UX, backend y medios sin dividir internamente.
- Regresiones en imágenes por mezcla de cola local y persistencia real.
- Inconsistencias entre el detalle lectura y el editor.
- Reemplazar innecesariamente una UX de imágenes ya validada.

### Checklist de aceptación

- `ADMIN` puede editar contenido, SEO, imágenes y estado regional.
- `EDITOR` puede editar contenido, SEO e imágenes, pero no estado regional.
- `ASSISTANT` no puede editar.
- `ecommerceExternalId` no se captura manualmente.
- `published_at` no aparece en UI ni en reglas funcionales.
- La UX actual de imágenes se conserva o se reutiliza sin degradación funcional.

---

## PR 8 — Módulo de Usuarios

**ESTADO: COMPLETADO**

**PR sugerido:** `feat(admin-users): country-scoped user management`

### Objetivo

Implementar administración de usuarios con alcance global para `SUPER_ADMIN` y alcance por país para `ADMIN`.

### Alcance

- Listado de usuarios.
- Alta y activación/inactivación.
- Gestión de asignaciones por país según rol.
- Reglas:
  - `SUPER_ADMIN` gestiona todos los usuarios y países
  - `ADMIN` gestiona `EDITOR` y `ASSISTANT` de sus países
  - `ADMIN` no crea otros `ADMIN`
  - `ADMIN` no modifica asignaciones de país estructurales fuera de su alcance

### Dependencias

- PR 1 y PR 3.

### Archivos probables

- Nuevas rutas bajo `src/app/admin/(panel)/users/**`
- Nuevos componentes en `src/components/admin/`
- Nuevos endpoints admin para usuarios
- Reutilización de [src/lib/auth.ts](src/lib/auth.ts)

### Riesgos

- Errores de autorización con alto impacto funcional.
- Mezclar gestión de usuarios global con administración local por país.

### Checklist de aceptación

- `SUPER_ADMIN` ve y administra todos los usuarios.
- `ADMIN` ve solo usuarios de sus países.
- `ADMIN` no puede crear `ADMIN`.
- La activación e inactivación respeta alcance por rol y país.

---

## PR 9 — QA, smoke tests y alineación de seeds

**ESTADO: COMPLETADO**

**PR sugerido:** `chore(admin): qa, seed alignment, and role smoke tests`

### Objetivo

Validar los flujos finales y corregir desalineaciones entre mock, seed y datos locales.

### Alcance

- Smoke tests por rol.
- Validación de navegación por rol.
- Validación de restricciones por país.
- Revisión de derivación de `ecommerceExternalId` desde URLs reales del mock.
- Revisión de datos locales para probar escenarios multi-país mínimos.
- Verificación de imágenes y ordenamiento.

### Dependencias

- PR 1 a PR 8.

### Archivos probables

- [scripts/generate-seed-from-mock.mjs](scripts/generate-seed-from-mock.mjs)
- [src/mock-data/catalog.fase1.mock.json](src/mock-data/catalog.fase1.mock.json)
- [db/tiens-bd.txt](db/tiens-bd.txt)
- Posibles tests o scripts nuevos

### Riesgos

- Descubrir tarde inconsistencias de datos no cubiertas por la UI.
- Validar solo en PE y no probar restricciones multi-país.

### Checklist de aceptación

- Cada rol llega a su menú correcto.
- Cada rol ve únicamente lo que su alcance permite.
- `ecommerceExternalId` se deriva correctamente para URLs con `?id=` y `#/?s=`.
- Los cambios regionales no afectan otras regiones.
- El flujo de imágenes mantiene una sola principal y reordena correctamente.

---

## Recomendaciones de ejecución

- No combinar permisos + navegación + formularios complejos en un solo PR.
- No seguir construyendo el admin sobre [src/lib/catalog-api.ts](src/lib/catalog-api.ts).
- Separar siempre producto global de producto por país.
- Mantener PR 7 aislado porque es el más propenso a regresiones.
- Ejecutar validación manual por rol después de PR 1, PR 3, PR 7 y PR 8.

---

## Criterio de cierre de la etapa

La nueva arquitectura del mantenedor puede considerarse alineada cuando se cumplan estos puntos:

- El panel cambia según rol.
- El módulo `Productos` representa verdaderamente el catálogo global.
- El módulo `Productos por País` es la superficie diaria principal.
- Los permisos por rol y país se validan en backend.
- Los usuarios pueden gestionarse según su alcance.
- La edición del producto por país respeta el contrato funcional cerrado.
