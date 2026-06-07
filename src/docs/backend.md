# Backend - Tiens Catalog

## Propósito
Este documento sirve como guía de desarrollo del backend. Describe el estado real del repositorio, las decisiones ya tomadas, el modelo de datos, las piezas implementadas y lo que aún queda por construir. El seguimiento de avance diario se mantiene en [plan-operativo-fase-2.md](plan-operativo-fase-2.md).

## Cómo usar este documento
- Léelo como especificación técnica viva, no como bitácora.
- Lo que ya existe en el repo debe reflejarse como implementación actual.
- Lo que todavía no existe debe mantenerse como intención futura, sin convertirlo en seguimiento de estado.

## Estado actual del repositorio
- La UI principal del catálogo ya existe en Next.js App Router bajo `src/app`.
- No existe todavía backend API funcional en `src/app/api`.
- No existe todavía la capa modular `src/modules`.
- Sí existen scripts de importación, seed y verificación en `scripts/`.
- Sí existen migraciones SQL para el modelo de datos y parte de la base de auth.

### Piezas implementadas hoy
- Frontend público con rutas por país en `src/app/[country]`.
- Importador JSON → BD en `scripts/import_mock.mjs`.
- Generador de seed SQL en `scripts/generate-seed-from-mock.mjs`.
- Verificación de login/acceso por país en `scripts/verify-country-access-login.mjs`.
- Migrations para catálogo, features de traducción y base de autenticación.

## Objetivo del backend
El backend debe soportar un catálogo de productos multi-país y multi-idioma con estas capacidades:
- servir listado y detalle de productos por país;
- administrar productos desde un mantenedor interno;
- almacenar datos estructurados en PostgreSQL;
- validar datos y controlar errores;
- soportar imágenes externas o en storage compatible con CDN;
- registrar eventos básicos de analítica;
- preparar la transición desde mock JSON hacia base de datos y API.

## Arquitectura objetivo
La arquitectura definida sigue siendo un monolito modular dentro de Next.js:
- Next.js App Router para UI y API;
- PostgreSQL como base de datos;
- storage externo compatible con CDN para imágenes;
- service layer para reglas de negocio;
- repository layer para acceso a datos;
- `pg` directo en la etapa inicial, sin ORM.

### Flujo lógico esperado
```txt
Frontend / Admin
    ↓
Route Handler o Server Action
    ↓
Service
    ↓
Repository
    ↓
PostgreSQL / Storage / Eventos
```

### Decisiones tecnológicas vigentes
- Next.js como monolito modular.
- App Router y Route Handlers para endpoints.
- `pg` directo en la etapa inicial.
- PostgreSQL como base relacional.
- DigitalOcean Spaces o storage S3-compatible para imágenes.
- Vercel como despliegue inicial recomendado.

## Modelo de dominio
Las entidades del dominio siguen esta separación:

### Catálogo
- `country`
- `language`
- `product`
- `product_country`
- `product_translation`
- `product_image`
- `category`
- `product_category`
- `product_relation`
- `event`

### Autenticación y acceso
- `app_user`
- `app_user_country_access`
- funciones auxiliares de acceso por país

### Relaciones principales
- Un `product` agrupa la ficha global del SKU.
- `product_country` representa la publicación del producto en un país concreto.
- `product_translation` representa la traducción por idioma para ese país.
- `product_image` agrupa imágenes por país y orden de aparición.
- `app_user_country_access` define acceso granular por país para usuarios no globales.

## Modelo relacional actual
El esquema SQL ya cubre el núcleo del catálogo y parte de auth.

### Country
- id UUID
- code único
- name
- currency_code
- is_active

### Language
- id UUID
- code único
- name
- is_active

### AppUser
- id UUID
- name
- email único
- password
- role
- is_active
- last_login_at

### AppUserCountryAccess
- user_id FK
- country_id FK
- is_active
- created_at
- updated_at

### Product
- id UUID
- sku único
- is_active
- created_at
- updated_at

### ProductCountry
- id UUID
- product_id FK
- country_id FK
- slug
- price
- currency
- ecommerce_url
- ecommerce_external_id
- is_active
- published_at
- created_at
- updated_at

### ProductTranslation
- id UUID
- product_country_id FK
- language_id FK
- name
- short_description
- long_description
- intro
- benefits
- applications
- usage
- restrictions
- recommendations
- technical_info
- features
- cta_label
- seo_title
- seo_description
- seo_og_image
- video_url

### ProductImage
- id UUID
- product_country_id FK
- url
- sort_order
- alt_text
- is_primary

### Gestión de imágenes de producto
- La imagen principal de una publicación representa la portada visible del producto y se usa como referencia base para hero image y catálogo.
- Al marcar una imagen como principal, el sistema reordena la galería en una transacción: la imagen elegida pasa a `sort_order = 0` e `is_primary = true`, y el resto se compacta en orden ascendente.
- Al eliminar una imagen principal, el sistema promueve automáticamente la siguiente imagen disponible como nueva principal. Si no quedan imágenes, la publicación queda sin portada.
- El endpoint de administración para esta acción es `POST /api/admin/products/[id]/images` con `action = promote | delete`, `countryCode` e `imageId`.
- El frontend debe mostrar confirmación antes de ejecutar la mutación y refrescar la lista devuelta por el endpoint.

### Category
- id UUID
- name

### ProductCategory
- product_country_id FK
- category_id FK

### ProductRelation
- id UUID
- product_country_id FK
- related_product_country_id FK
- relation_type

### Event
- id UUID
- event_type
- product_id
- country_code
- created_at

## Contrato mínimo de datos de Fase 1
El archivo [contrato-minimo-datos-fase-1.md](contrato-minimo-datos-fase-1.md) sigue siendo la base de entrada del importador.

### Campos alineados con el mock actual
- defaultCountry
- availableCountries
- availableLanguages
- products
- id
- sku
- slug
- isActive
- countries
- ecommerceExternalId
- ecommerceUrl
- price.amount
- price.currency
- categoryTags
- heroImage
- images
- translations.es
- name
- shortDescription
- longDescription
- benefits
- ctaLabel
- seo.title
- seo.description
- seo.ogImage

### Campos que requieren normalización
- `features` debe seguir tratándose como JSONB en `product_translation`.
- `intro`, `applications`, `usage`, `restrictions`, `recommendations`, `technicalInfo` y `videoUrl` también deben conservarse porque ya forman parte del dataset real del mock y del importador.
- Si en una etapa posterior el admin necesita edición más fina, esos campos se pueden dividir en subestructuras, pero no es necesario hacerlo ahora.

### Observación sobre el mock actual
- El contenido real está cargado principalmente para `pe`.
- La estructura ya prepara soporte para `ec`, `bo`, `co` y `mx`.
- El backend debe contemplar fallback explícito a PE como país semilla hasta que exista localización propia por país.

## Reglas de negocio
- Cada `sku` debe ser único en el catálogo.
- Cada `slug` debe ser único por país.
- Si un país está activo y ya tiene localización propia, debe tener datos completos para publicar.
- Mientras no exista localización propia por país, el sistema puede resolver el contenido desde PE de forma controlada.
- `ecommerce_url` debe ser válido y usar `https`.
- `price.amount` debe ser mayor que cero.
- `price.currency` debe tener 3 caracteres.
- El detalle se resuelve por país + slug.

## API prevista
La API aún no existe en el repo, pero este es el contrato que debe implementar Fase 2.

### Lectura pública
- `GET /api/products?country=PE&lang=es`
- `GET /api/products/[id]?lang=es`

### Administración
- `POST /api/admin/products`
- `PUT /api/admin/products/[id]`
- `DELETE /api/admin/products/[id]`

### Eventos
- `POST /api/events`

## Patrón de implementación recomendado
Los handlers no deben contener lógica de negocio pesada.

### Estructura sugerida
```bash
src/
  app/
    api/
      products/
        route.ts
      products/[id]/
        route.ts
      admin/products/
        route.ts
      admin/products/[id]/
        route.ts
      events/
        route.ts
  modules/
    product/
      product.service.ts
      product.repository.ts
      product.types.ts
      product.mapper.ts
  lib/
    db.ts
```

### Responsabilidad por capa
- Controller / `route.ts`: recibe request y devuelve response.
- Service: aplica reglas de negocio y validaciones de flujo.
- Repository: ejecuta SQL y encapsula acceso a la base.

## Seed e importación
El seed y el importador deben mantenerse como fuente reproducible del catálogo inicial.

### Scripts actuales
- `scripts/generate-seed-from-mock.mjs`: genera `db/migrations/002_seed_from_mock.sql`.
- `scripts/import_mock.mjs`: importa el mock hacia la BD local de validación.
- `scripts/convert-images-to-webp.mjs`: normaliza imágenes al formato esperado.
- `scripts/verify-country-access-login.mjs`: valida login y acceso por país.

### Qué debe poblar el seed
- países base;
- idioma `es`;
- usuarios de prueba local;
- productos globales;
- `product_country` por país;
- traducciones;
- imágenes;
- categorías;
- relaciones entre productos;
- eventos mock.

### Uso esperado del seed
- validar listado;
- validar detalle;
- validar relaciones;
- preparar pruebas del admin;
- respaldar la transición desde JSON local a BD.

### Credenciales de prueba local
Las credenciales de usuarios de prueba local se documentan en [usuarios-prueba-local.md](usuarios-prueba-local.md).

## Mantenedor / Admin
El mantenedor debe vivir dentro del mismo Next.js, en `/admin`.

### Alcance esperado
- dashboard base;
- listado de productos;
- crear producto;
- editar producto;
- desactivar producto;
- soporte posterior para traducciones, imágenes y roles.

### Estructura esperada
```bash
app/
  admin/
    layout.tsx
    page.tsx
    products/
      page.tsx
      new/
        page.tsx
      [id]/
        page.tsx
```

### Base visual del admin
- sidebar fija;
- header superior;
- área de contenido dinámica;
- patrón reutilizable para módulos futuros.

## Autenticación y control de acceso
La base de auth ya quedó preparada a nivel de BD y la capa mínima de API/UI ya está conectada para login, logout y protección del admin.

### Lo que ya existe
- restricción de roles en `app_user`;
- `last_login_at` para auditoría simple;
- tabla `app_user_country_access`;
- función `can_user_access_country(...)`.

### Lo que ya está implementado en la app
- endpoint de login con sesión HttpOnly;
- endpoint de logout;
- middleware de protección para `/admin`;
- bloqueo de acciones de edición para roles de solo lectura.

### Roles previstos
- `SUPER_ADMIN`: acceso global.
- `ADMIN`: acceso total dentro de los países asignados.
- `EDITOR`: puede actualizar información de productos.
- `ASSISTANT`: acceso restringido, principalmente consulta.

### Comportamiento esperado
- `SUPER_ADMIN` accede a todo.
- `ADMIN` y `EDITOR` requieren acceso por país para operar.
- `ASSISTANT` conserva acceso de solo lectura o el mínimo definido por el producto.

## Observabilidad y eventos
El backend debe dejar preparadas estas métricas mínimas:
- vista de producto;
- click en comprar;
- errores básicos;
- eventual integración con BI.

## Infraestructura y despliegue
- Frontend y backend integrados: Vercel.
- Base de datos: PostgreSQL administrado, idealmente en DigitalOcean.
- Imágenes: Spaces o S3 compatible.
- CI: build, lint y migraciones en staging.

## Recomendaciones de desarrollo
- Mantener `pg` mientras el modelo siga relativamente acotado.
- Introducir validación estricta con esquemas antes de escribir en base.
- Formalizar auth mínima para admin antes de exponer escritura. Hecho a nivel de login/sesión; queda ampliar permisos finos por módulo.
- Normalizar los campos del mock que hoy viven en estructuras heterogéneas.
- Definir en cada feature si los campos extensibles viven en `product_translation` o en subestructuras dedicadas.

## Qué queda fuera de este backend
- e-commerce propio;
- integraciones en tiempo real con tiendas externas;
- copywriting y creación de assets;
- microservicios;
- separación de frontend y backend en proyectos distintos para esta fase.

## Referencias y diagramas
- Diagrama de arquitectura: [tiens-v2.drawio.png](tiens-v2.drawio.png)
- Ver también: [alcance.md](alcance.md), [frontend.md](frontend.md), [modelo-datos-fase2.md](modelo-datos-fase2.md), [workflow-git.md](workflow-git.md)
- Contrato mínimo de datos (origen del mock): [contrato-minimo-datos-fase-1.md](contrato-minimo-datos-fase-1.md)
- Diseño / tokens: [design-system.md](design-system.md)
- Estructura del proyecto: [estructura-proyecto.md](estructura-proyecto.md)
- Propuesta técnica y comercial: [Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md](Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md)

## Resumen ejecutivo
El backend del proyecto está pensado como una base pragmática y escalable:
- monolito modular;
- API propia en Next.js todavía por implementar;
- PostgreSQL;
- data model preparado para país e idioma;
- admin interno en `/admin` como objetivo;
- seed reproducible desde el mock;
- transición ordenada desde archivos JSON hacia persistencia real.

Este archivo debe tomarse como la guía vigente de backend. Para seguimiento de avance usa [plan-operativo-fase-2.md](plan-operativo-fase-2.md).