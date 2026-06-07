# Estructura Final del Proyecto - Día 2

## Orden sugerido de lectura

Este archivo no es obligatorio para la app ni para la documentación canónica, pero sí sirve como puerta de entrada cómoda para un chat nuevo. No hace falta renombrar archivos con números; basta con mantener este índice de lectura aquí.

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

## Documentación existente en el repo

Estos son los archivos de referencia que hoy sí existen y conviene usar como base:

- `src/docs/alcance.md`
- `src/docs/backend.md`
- `src/docs/contrato-minimo-datos-fase-1.md`
- `src/docs/design-system.md`
- `src/docs/estructura-proyecto.md`
- `src/docs/frontend.md`
- `src/docs/modelo-datos-fase2.md`
- `src/docs/plan-operativo-fase-1.md`
- `src/docs/workflow-git.md`
- `src/docs/Matriz-de-riesgos-y-mitigaciones.md`
- `src/docs/Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md`

## 📁 Árbol Completo del Repo

```
d:\Repos\2-Colaboracion\repo-tiens/
│
├─ tiens-catalog/                    ← APP PRINCIPAL (Next.js)
│  ├─ .git/                         (repositorio local)
│  ├─ .next/                        (build cache)
│  ├─ node_modules/                 (359 packages)
│  │
│  │  ├─ public/                       (assets estáticos)
│  │  ├─ file.svg
│  │  ├─ globe.svg
│  │  ├─ next.svg
│  │  ├─ vercel.svg
│  │  ├─ window.svg
│  │  └─ product-assets/           (fuente local para conversión)
│  │     ├─ raw/                     (originales por país y producto)
│  │     └─ optimized/               (webp listos para CDN)
│  │
│  ├─ src/
│  │  ├─ app/                       (App Router - Next.js 16)
│  │  │  ├─ layout.tsx              (✓ Root layout con Inter + metadata)
│  │  │  ├─ page.tsx                (✓ Home redirect a /pe)
│  │  │  ├─ globals.css             (✓ Design tokens + utilities)
│  │  │  │
│  │  │  └─ [country]/              (✓ Dynamic country route)
│  │  │     ├─ layout.tsx           (✓ Country layout con Header/Footer)
│  │  │     ├─ page.tsx             (✓ Landing grid de productos)
│  │  │     │
│  │  │     └─ producto/[slug]/     (✓ Product detail route)
│  │  │        └─ page.tsx          (✓ Página de detalle)
│  │  │
│  │  ├─ components/
│  │  │  └─ layout/
│  │  │     ├─ site-header.tsx      (✓ Header reutilizable)
│  │  │     ├─ site-footer.tsx      (✓ Footer reutilizable)
│  │  │     └─ root-layout.tsx      (✓ Layout wrapper)
│  │  │
│  │  ├─ lib/
│  │  │  └─ countries.ts            (✓ Validación multi-país)
│  │  │
│  │  └─ mock-data/
│  │     └─ catalog.fase1.mock.json (✓ 10 productos + metadatos)
│  │
│  ├─ .eslintrc.json
│  ├─ .gitignore
│  ├─ eslint.config.mjs
│  ├─ next-env.d.ts
│  ├─ next.config.ts
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ postcss.config.mjs
│  ├─ README.md
│  ├─ tailwind.config.ts
│  └─ tsconfig.json
│
├─ mock-data/                        (Datos originales - sincronizados a src/mock-data)
│  └─ catalog.fase1.mock.json
│
├─ product-assets/                   (Assets originales y optimizados para Spaces)
│  ├─ raw/
│  └─ optimized/
│
├─ altok-website-new/               (Base anterior para reutilización)
│  └─ ...
│
└─ Documentación Fase 1 y base de planificación
   ├─ plan-operativo-fase-1.md
   ├─ contrato-minimo-datos-fase-1.md
   ├─ design-system.md
   ├─ Matriz-de-riesgos-y-mitigaciones.md
   ├─ Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md
   ├─ Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.pdf
   ├─ Resumen-ejecutivo-hallazgos-feedback.md
   ├─ informacion-plantilla_landing_tiens_xlsx.txt
   ├─ plantilla_landing_tiens.xlsx
   └─ tiens-v2.drawio.png
```

---

## 📊 Estadísticas del Proyecto

... (mantener contenido estadístico sin cambios)
