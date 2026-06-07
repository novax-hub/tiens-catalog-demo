# Frontend - Tiens Catalog

## Propósito
Este documento sirve como guía de desarrollo del frontend. Describe el estado real del código en `src/app`, `src/components` y `src/lib`, las decisiones visuales y de arquitectura ya tomadas, y el trabajo pendiente para Fase 2. El seguimiento de avance diario vive en [plan-operativo-fase-2.md](plan-operativo-fase-2.md).

## Cómo usar este documento
- Léelo como especificación viva del frontend.
- Lo que ya existe en el repo debe quedar reflejado como implementación actual.
- Lo que todavía no existe debe quedar como intención futura, sin mezclarlo con seguimiento de avance.

## Estado actual del frontend
- El frontend está implementado con Next.js 16 y App Router.
- La navegación pública parte desde `/` y redirige a `/pe`.
- La landing vive en `/{country}`.
- El detalle del producto vive en `/{country}/producto/[slug]`.
- El frontend público consume la API pública a través de `src/lib/catalog-api.ts`.
- Las imágenes se resuelven contra un CDN de DigitalOcean Spaces o el dominio configurado en `NEXT_PUBLIC_SPACES_CDN_URL`.
- La base visual usa `Inter` como fuente principal.
- El admin de Fase 2 ya tiene scaffolding navegable en `/admin` con login, listado, alta y detalle base de productos.

### Piezas implementadas hoy
- Rutas públicas en `src/app`.
- Rutas de admin scaffold en `src/app/admin`.
- Componentes de detalle y conversión en `src/components`.
- Shell visual para el panel en `src/components/admin`.
- Utilidades de URLs de assets en `src/lib/spaces-assets.ts`.
- Helper de consumo del API en `src/lib/catalog-api.ts`.
- Estilos globales y tokens en `src/app/globals.css`.

## Objetivo funcional
El frontend es una landing de catálogo orientada a conversión:
- mostrar productos por país;
- abrir el detalle de producto;
- llevar al usuario a un enlace externo de compra;
- mantener una base preparada para multi-país y multi-idioma;
- dejar listo el terreno para consumir API y BD en Fase 2.

## Arquitectura frontend
La implementación actual sigue un patrón simple y efectivo:
- Next.js App Router;
- Server Components para render principal;
- Client Components para interacciones puntuales;
- pre-rendering estático para rutas públicas;
- layout compartido por país con contenido reutilizable;
- lógica de presentación separada de la lógica de resolución de assets.

### Flujo lógico
```txt
Next.js route
	↓
API pública / asset helpers
	↓
Page component
	↓
Reusable UI components
	↓
Browser interaction
```

## Rutas implementadas
| Ruta | Propósito |
|------|-----------|
| `/` | Redirección inicial a Perú |
| `/{country}` | Landing de catálogo por país |
| `/{country}/producto/[slug]` | Página de detalle del producto |

## Render y pre-rendering
- `src/app/[country]/layout.tsx` define los países soportados.
- `src/app/[country]/producto/[slug]/page.tsx` genera combinaciones país-producto.
- El sistema está pensado para servir contenido estable con SEO predecible.
- El listado y el detalle públicos ya se resuelven desde la API.
- Las rutas de admin usan render dinámico para leer la base real mientras el CRUD se conecta.

## Componentes principales

### Layout base
- `src/app/layout.tsx` define metadata básica, carga `Inter` y establece el `html lang="es"`.
- `src/app/page.tsx` redirige a `/pe` como punto de entrada.
- `src/app/admin` aloja el scaffolding del panel interno y la UI de login.

### Landing por país
- `src/app/[country]/page.tsx` renderiza un hero y un grid de productos.
- Cada tarjeta muestra imagen, nombre, descripción breve, precio y enlace al detalle.
- Si el país no tiene datos propios, el render cae a PE como fallback controlado.

### Detalle de producto
- `src/app/[country]/producto/[slug]/page.tsx` presenta galería, nombre, intro, precio, CTA, descripción larga y secciones extendidas.
- También soporta video embebido cuando existe URL.
- La página prioriza lectura, jerarquía visual y conversión.

### Interacciones
- `ProductGallery` maneja imagen principal, miniaturas, swipe en mobile y apertura de lightbox.
- `ProductLightbox` se carga sin SSR para mantener el bundle principal más liviano.
- `EcommerceCTAButton` abre el enlace externo de compra y muestra un mensaje de error si el enlace falta o falla.
- El panel de admin muestra navegación, tablas y formularios de scaffold para el siguiente paso de Fase 2.

## Manejo de assets e imágenes
La resolución de imágenes sigue una convención estable:
- `main.webp` para la imagen principal;
- `gallery-xx.webp` para la galería;
- ruta base: `products/<country>/<slug>/...`.

### Utilidades actuales
- `buildProductImageUrl` construye URLs absolutas del CDN.
- `buildProductAssetUrls` genera la secuencia principal + galería.
- `normalizeImageUrl` convierte rutas relativas o legacy en URLs válidas del CDN.

### Comportamiento actual
- Si el mock trae URL absoluta, se respeta.
- Si el mock trae una ruta relativa o un fallback, se normaliza al CDN configurado.
- La imagen principal y la galería se resuelven de forma consistente entre landing y detalle.

## Sistema de diseño

### Identidad visual
- Branding dominado por verde Tiens.
- Blanco y grises suaves como base de lectura.
- Acento cálido naranja para soporte visual.

### Tipografía
- Fuente base: Inter.
- Escala definida para títulos, cuerpo y texto pequeño.
- Jerarquía pensada para una landing comercial.

### Espaciado
- Sistema de 8 px con variables para consistencia.
- Contenedores centrados y secciones amplias para lectura cómoda.

### Componentes visuales
- Botón primario verde con hover más oscuro.
- Card base con borde suave, fondo blanco y sombra ligera.
- Galería con thumbnails en desktop y dots en mobile.

## Variables y estilos globales
`src/app/globals.css` centraliza tokens y utilidades:
- colores de marca y neutrales;
- escalas tipográficas;
- espaciado;
- ancho máximo del sitio;
- clases compartidas como `site-container`, `site-main`, `btn-primary` y `card-base`.

## Fuentes de datos
El frontend público consume el API pública de lectura; el admin ya puede leer productos desde el mismo backend.

### Estructura de datos usada hoy
- `ProductCatalogResponse`
- `ProductDetailResponse`
- `ProductSummary`
- `ProductDetail`
- `heroImage`
- `images`
- `features`
- `price`
- `currency`

### Observación importante
- El contenido real sigue estando cargado principalmente para `pe`.
- La estructura ya prepara soporte para otros países.
- El fallback a PE sigue existiendo, pero ahora lo resuelve la API.

## Decisiones de implementación
- La página principal redirige a Perú para asegurar un punto de entrada claro.
- El contenido público se organiza por país en la URL para SEO y escalabilidad.
- La página de detalle mantiene el render principal en servidor y limita la parte cliente a interacción.
- La galería y el lightbox se separan como componentes interactivos para no cargar toda la página como cliente.
- El enlace externo de compra permanece desacoplado del sitio.

## Alcance cubierto por la Fase 1
- Landing funcional.
- Detalle funcional.
- Base multi-país en rutas y datos.
- Base multi-idioma preparada en estructura.
- Diseño visual consistente con el branding Tiens.
- Assets locales organizados como fuente de conversión para el CDN de Spaces.

## Límites actuales
- No existe mantenedor funcional todavía.
- No existe API consumida por el frontend.
- No existe base de datos conectada.
- No hay analítica implementada en el frontend.
- El contenido multi-país real todavía depende de la completitud del JSON.

## Lo que queda para Fase 2
- Añadir autenticación real y control de sesión para el admin.
- Implementar CRUD de productos en el backend y la UI.
- Incorporar upload de imágenes y edición completa de medios.
- Implementar analytics/eventos si se aprueba ese alcance.

## Referencias
- Ver también: [backend.md](backend.md), [modelo-datos-fase2.md](modelo-datos-fase2.md), [workflow-git.md](workflow-git.md)
- Contrato mínimo de datos (mock Fase 1): [contrato-minimo-datos-fase-1.md](contrato-minimo-datos-fase-1.md)
- Diseño / tokens: [design-system.md](design-system.md)
- Estructura del proyecto: [estructura-proyecto.md](estructura-proyecto.md)
- Propuesta técnica y comercial: [Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md](Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md)

## Resumen ejecutivo
El frontend del proyecto ya cubre la landing pública y el detalle por país consumiendo la API de lectura, con una base visual consistente y una resolución de assets preparada para CDN. También quedó abierto el scaffold del admin para la siguiente fase. La siguiente evolución debe concentrarse en autenticación, CRUD y medios sin romper la estructura ya establecida.

Este archivo debe tomarse como la guía vigente de frontend. Para seguimiento de avance usa [plan-operativo-fase-2.md](plan-operativo-fase-2.md).