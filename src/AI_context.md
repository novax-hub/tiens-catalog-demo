# Contexto Fase 2: Mantenedor

**Propósito:** dejar un resumen único y actual para iniciar un chat nuevo sobre el admin panel, usando solo los documentos canónicos vigentes.

## Orden de arranque recomendado

Si este archivo se usa como punto de entrada en un chat nuevo, leer en este orden:

1. `src/docs/alcance.md`
2. `src/docs/contrato-minimo-datos-fase-1.md`
3. `src/docs/frontend.md`
4. `src/docs/backend.md`
5. `src/docs/modelo-datos-fase2.md`
6. `src/docs/plan-operativo-fase-1.md`
7. `src/docs/design-system.md`
8. `src/docs/workflow-git.md`
9. `src/docs/estructura-proyecto.md`
10. `src/AI_context.md`

---

## Estado actual de Fase 1

La aplicación ya está funcionando con:

- Landing por país en `src/app/[country]/page.tsx`
- Detalle de producto en `src/app/[country]/producto/[slug]/page.tsx`
- Redirect inicial desde `src/app/page.tsx` hacia el país por defecto
- Mock fuente en `src/mock-data/catalog.fase1.mock.json`
- Galería y lightbox en componentes client-side
- SEO por página con `generateMetadata`

El punto importante para Fase 2 es este: la implementación actual consume JSON, no base de datos. El admin debe preparar la transición sin romper esa realidad de Fase 1.

---

## Documentación canónica vigente

Para entender el proyecto sin arrastrar nombres viejos, usar este orden:

1. `src/docs/alcance.md`
2. `src/docs/frontend.md`
3. `src/docs/backend.md`
4. `src/docs/modelo-datos-fase2.md`
5. `src/docs/plan-operativo-fase-1.md`
6. `src/docs/contrato-minimo-datos-fase-1.md`
7. `src/docs/design-system.md`
8. `src/docs/estructura-proyecto.md`
9. `src/docs/workflow-git.md`
10. `src/docs/Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md`

El contrato mínimo de datos sigue separado a propósito: es la definición congelada del mock de Fase 1 y alimenta la lectura del JSON actual.

---

## Arquitectura actual resumida

- Next.js 16 con App Router y TypeScript
- Tailwind CSS 4 con tokens en `src/app/globals.css`
- Componentes client-side para interacción de galería y lightbox
- Static generation para el catálogo y los detalles de producto
- Git con ramas feature, commits convencionales y PRs

Estructura útil para Fase 2:

```text
src/
├── app/
├── components/
├── docs/
├── lib/
└── mock-data/
public/
└── product-assets/
```

---

## Contrato de datos que debes asumir

El archivo `src/docs/contrato-minimo-datos-fase-1.md` define el contrato congelado del mock. Su forma actual es más cercana a un catálogo estructurado por país que al modelo relacional futuro. La idea clave es mantener estas piezas conceptuales:

- `defaultCountry`
- `availableCountries`
- `availableLanguages`
- `products[]`
- `countries` por producto
- `translations` por idioma

Eso significa que el admin de Fase 2 no debería diseñarse contra el viejo modelo plano; debería salir del contrato congelado y mapearlo a `Product`, `ProductCountry` y `ProductTranslation` como describe `src/docs/modelo-datos-fase2.md`.

---

## Qué falta resolver en Fase 2

- Autenticación y autorización para el admin
- CRUD de productos
- Carga y gestión de imágenes
- Persistencia en PostgreSQL
- API routes para leer y escribir catálogo
- Estrategia de migración desde JSON a BD o transición dual

La decisión técnica recomendada en la documentación es avanzar hacia BD y API, no mantener el mock como sistema definitivo.

---

## Qué estaba desalineado en este archivo

- Refería documentos eliminados: `1.documento-tecnico.md`, `8.mantenedor-propuesta.md` y `9.mantenedor-desarrollo.md`
- Describía una estructura vieja de mock con `prices`, `ecommerceUrl` y `translations` al nivel raíz del producto, que ya no es la referencia canónica
- No apuntaba al orden actual de docs canónicos
- Mezclaba contexto de Fase 1 y Fase 2 sin separar claramente el contrato congelado del plan de evolución

---

## Siguiente chat recomendado

Si vas a abrir otro chat para continuar, usa este archivo como resumen y la lista anterior como orden de lectura. Si quieres recortar al mínimo indispensable, el arranque real puede ser:

1. `src/docs/alcance.md`
2. `src/docs/contrato-minimo-datos-fase-1.md`
3. `src/docs/backend.md`
4. `src/docs/modelo-datos-fase2.md`

Con eso el nuevo contexto queda ordenado y sin referencias rotas.
