# Plan Operativo Fase 1

## Objetivo
Construir la landing de productos y la página de detalle con redirección al e-commerce, usando datos mock/JSON, base reutilizable existente, soporte multi-país por ruta y despliegue en entorno de desarrollo para validación.

## Alcance de esta fase
- Landing de productos con listado.
- Página de detalle de producto.
- CTA de compra con redirección al e-commerce.
- Diseño responsive mobile-first.
- Rutas por país.
- Datos iniciales configurables desde mock/JSON.
- Preparación para futura integración con BD y mantenedor.

## Criterios de entrada
- Producto/landing base disponible para reutilización.
- Copy e imágenes del producto validados por negocio.
- Link de e-commerce por producto confirmado.
- País inicial definido para pruebas.
- Dominio o subdominio de desarrollo disponible.

## Estado Dia 1 - Decisiones cerradas
- Paises habilitados: pe (default), ec, bo, co, mx.
- Mapa de rutas v1:
	- / redirecciona a /pe
	- /:country landing de productos
	- /:country/producto/:slug detalle de producto por pais
	- /404 pagina no encontrado
	- /:country/* fallback de ruta invalida
- URL publica por slug para SEO.
- Identidad interna por UUID y campo ecommerceExternalId para integracion externa.
- Fuente unica de datos Fase 1: mock-data/catalog.fase1.mock.json
- Campos minimos del producto cerrados como version final en [contrato-minimo-datos-fase-1.md](contrato-minimo-datos-fase-1.md)
- Revision de componentes reutilizables completada en 12.revision-componentes-reutilizables-proyecto-base.md
- Plantilla de responsables y checklist de ambientes creada en 13.plantilla-responsables-y-checklist-ambientes-fase-1.md
- Validacion de nuevos insumos del cliente (Excel + assets) en 15.validacion-insumos-cliente-fase-1.md

## Orden de implementación
1. Definir estructura de rutas y modelo temporal de datos.
2. Montar layout base y sistema visual común.
3. Construir landing de listado.
4. Construir detalle de producto.
5. Conectar CTA de compra al e-commerce.
6. Ajustar responsive y performance.
7. Validar tracking mínimo y SEO base.
8. Ejecutar QA funcional y publicar en desarrollo.

## Backlog por día

### Día 1 - Definición técnica y preparación
Objetivo:
Establecer la base funcional y el alcance cerrado de la fase.

Tareas:
- Confirmar rutas por país.
- Definir estructura temporal de datos en JSON/mock.
- Definir campos mínimos del producto.
- Revisar componentes reutilizables del proyecto base.
- Validar dominios, ambientes y responsables.

Entregable:
- Mapa de rutas.
- Contrato mínimo de datos.
- Lista de assets requeridos por producto.

Aceptación:
- Queda claro qué información entra en Fase 1 y cuál se posterga.
- Se aprueba una fuente única de datos mock para arrancar.

### Día 2 - Setup visual y layout base
**ESTADO: ✓ COMPLETADO**

Objetivo:
Dejar listo el esqueleto visual reutilizable para landing y detalle.

Tareas (✓ Ejecutadas):
- ✓ Proyecto Next.js scaffold con TypeScript + Tailwind creado en `tiens-catalog/`
- ✓ Typography: Inter implementada, tokens de tamaños (h1-h3, body, small) definidos
- ✓ Paleta TIENS aplicada en CSS variables (primary green, secondary orange, neutrales)
- ✓ Espaciado 8px base en variables --space-1 hasta --space-7
- ✓ Layout general con flexbox, altura mínima 100vh, flujo de contenido
- ✓ Header reutilizable (SiteHeader) con navegación y logo
- ✓ Footer reutilizable (SiteFooter) con derechos de autor y metadata fase
- ✓ Rutas multi-país implementadas: [country] layout dinámico con validación de país
- ✓ Responsive base usando grid y media queries implícitas en flexbox
- ✓ Container seguro .site-container (ancho máximo + márgenes auto)
- ✓ Botón primario (.btn-primary) y tarjeta base (.card-base) listos
- ✓ Mock data integrado en src/mock-data/catalog.fase1.mock.json

Entregable:
✓ Layout funcional con base visual común, compilado y sin errores TypeScript.
✓ Rutas generadas estáticamente: 59 páginas (5 países × 10 productos + home/404)
✓ Assets locales en public/product-assets/ listos para uso

Aceptación:
✓ Proyecto compila sin errores (npm run build = Success).
✓ Estructura layout responde a flexbox sin overflow.
✓ Header y footer funcionan en todas las rutas de país.
✓ Importación de mock data correcta y sin encoding issues.

### Día 3 - Landing de listado, primera versión
**ESTADO: ✓ COMPLETADO**
Objetivo:
Mostrar el listado de productos con estructura comercial básica.

Tareas:
- Crear landing principal.
- Renderizar cards o bloques de productos.
- Mostrar imagen, nombre, beneficio corto y CTA.
- Vincular ruta de detalle.

Entregable:
- Landing navegable con listado visible.

Aceptación:
- El usuario identifica el producto y puede entrar al detalle.
- La navegación funciona con datos mock.

### Día 4 - Landing de listado, refinamiento comercial
**ESTADO: ✓ COMPLETADO**
Objetivo:
Completar la experiencia de entrada con foco en conversión.

Tareas:
- Agregar hero principal.
- Reforzar beneficios y jerarquía visual.
- Ajustar copy de CTA.
- Optimizar imágenes iniciales.

Entregable:
- Landing lista para revisión interna.

Aceptación:
- El hero comunica el valor del producto en menos de 5 segundos.
- El CTA principal es visible sin fricción en mobile.

### Día 5 - Página de detalle, primera versión
**ESTADO: ✓ COMPLETADO**
Objetivo:
Construir el detalle del producto con la información principal.

Tareas:
- Crear ruta de detalle.
- Mostrar título, descripción, imágenes y precio.
- Preparar sección de beneficios y características.
- Agregar CTA de compra.

Entregable:
- Página de detalle funcional.

Aceptación:
- La información del producto se entiende de forma clara.
- El detalle responde correctamente a la ruta del producto.

### Día 6 - Redirección al e-commerce
Objetivo:
Hacer confiable el flujo final de compra.

Tareas:
- Conectar CTA al link real del e-commerce.
- Validar apertura en nueva pestaña o comportamiento acordado.
- Manejar fallback si el link no está disponible.

Entregable:
- Flujo completo detalle -> e-commerce.

Aceptación:
- El click compra siempre lleva al destino correcto.
- No existen enlaces rotos en el flujo principal.

### Día 7 - Multi-país por ruta
**ESTADO: ✓ COMPLETADO**
Objetivo:
Separar la experiencia por país desde la URL.

Tareas:
- Implementar parámetro de país.
- Definir fallback de país por defecto.
- Asegurar que landing y detalle respeten la ruta.

Entregable:
- Navegación por país operativa.

Aceptación:
- La ruta por país cambia el contenido esperado.
- No hay conflictos entre rutas locales y rutas de producto.

### Día 8 - SEO base y metadatos
**ESTADO: ✓ COMPLETADO**
Objetivo:
Dejar la landing lista para indexación y campañas.

Tareas:
- ✓ Títulos y descripciones por página.
- ✓ Open Graph básico.
- ✓ Estructura semántica correcta.
- ✓ Revisión de performance inicial.

Entregable:
- ✓ Base SEO funcional.

Aceptación:
- ✓ Cada página tiene metadata mínima correcta.
- ✓ El HTML conserva jerarquía semántica válida.

### Día 9 - Responsive y mobile-first
**ESTADO: ✓ COMPLETADO**
Objetivo:
Asegurar que la experiencia funcione bien en el tráfico principal.

Tareas:
- ✓ Ajustar card, hero, detalle y CTA.
- ✓ Corregir espaciados y tamaños en mobile.
- ✓ Revisar comportamiento de imágenes.

Entregable:
- ✓ UI responsive afinada.

Aceptación:
- ✓ No hay desbordes ni elementos ilegibles en pantallas pequeñas.
- ✓ El CTA sigue siendo visible y usable en mobile.

### Día 10 - Validación de contenido y assets
**ESTADO: EN PROGRESO**
Objetivo:
Garantizar que el contenido cargado sea consistente.

Tareas:
- ✓ Checklist de validación creado (archivo: 16.validacion-dia-10-contenido-assets.md)
- ⏳ Revisar textos finales en todos los 10 productos
- ⏳ Confirmar imágenes por producto en `public/product-assets/`
- ⏳ Verificar orden de contenido y jerarquía
- ⏳ Validar URLs de e-commerce y precios

Entregable:
- Contenido validado para revisión con negocio
- Reporte de assets y estado de producto

Aceptación:
- No faltan assets críticos
- El contenido refleja lo aprobado por el cliente

Decisiones de diseño registradas para implementación posterior:
- El detalle mantendrá el render base en servidor y moverá solo la galería interactiva a componentes cliente.
- El visor de imágenes tendrá imagen principal, miniaturas con estado activo y cambio de imagen por clic o tap.
- En mobile, la experiencia se resolverá con carrusel por deslizamiento y puntos de estado; las flechas quedarán solo si aportan claridad sin ruido visual.
- El lightbox se cargará de forma diferida para no penalizar el tiempo inicial de carga.
- El orden de contenido del detalle quedará alineado a la jerarquía de conversión definida para desktop y mobile.
- El header reemplazará el texto de marca por el logo SVG de Tiens ubicado dentro del proyecto.
- Estos cambios se tratarán como una evolución de UI/UX posterior a la validación de contenido, no como parte de la validación misma.

### Día 11 - Implementar galería interactiva y lightbox (UI/UX)
**ESTADO: ✓ COMPLETADO**
Objetivo:
Implementar la galería de producto con miniaturas, comportamiento click/tap para cambiar imagen principal, carrusel móvil y lightbox a pantalla completa (carga diferida).

Tareas:
- ✓ Crear rama `feature/day-11-product-detail-gallery` desde `develop`.
- ✓ Añadir componente cliente `ProductGallery` (thumbnails, imagen activa, accesibilidad básica).
- ✓ Implementar carrusel mobile con soporte swipe y puntos activos.
- ✓ Implementar lightbox fullscreen y cargarlo de forma diferida (dynamic import) para minimizar bundle inicial.
- ✓ Reemplazar texto del header por `logo.svg` (ubicar asset en `public/images/` dentro del proyecto).
- ✓ Reordenar contenido del detalle (desktop: imagen izquierda, info derecha; mobile: una columna).
- ✓ Mantener secciones bajo orden acordado: descripción, beneficios, uso, aplicaciones, restricciones, técnica, video al final.
- ✓ Añadir pruebas visuales y pasos de verificación en PR.

Entregable:
- ✓ Componente `ProductGallery` funcional y documentado.
- ✓ Comportamiento móvil con swipe y puntos de estado.
- ✓ Lightbox funcional cargado diferido.
- ✓ Header actualizado con logo SVG.

Aceptación (Criterios):
- ✓ Miniaturas: la imagen seleccionada tiene estado visual (borde o overlay) y al hacer click/tap se muestra como principal.
- ✓ Mobile: swipe horizontal cambia imagen, puntos indican imagen activa.
- ✓ Lightbox: tap en imagen abre fullscreen con opción de cierre explícita.
- ✓ Detalle mantiene SEO y pre-render rápido (server component principal).
- ✓ Header con logo se refleja en todas las rutas.
- ✓ Build success (npm run build = 59+ páginas generadas).

Branch / Commits:
- Branch: `feature/day-11-product-detail-gallery`
- Commit: `feat(detail-gallery): add product gallery + lightbox (day-11)`

### Día 12 - QA funcional
**ESTADO: ✓ COMPLETADO**
Objetivo:
Corregir puntos críticos de experiencia y velocidad.

Tareas:
- ✓ Optimizar imágenes.
- ✓ Revisar carga inicial.
- ✓ Corregir comportamientos lentos o saltos visuales.

Entregable:
- ✓ Versión candidata para validación final.

Aceptación:
- ✓ La experiencia mobile es estable.
- ✓ No hay regresiones visuales luego de optimizar.

### Día 13 - Ajustes finales
**ESTADO: ✓ COMPLETADO**
Objetivo:
Resolver lo observado en QA y dejar el alcance cerrado.

Tareas:
- ✓ Aplicar correcciones menores.
- ✓ Ajustar contenido o layout si aplica.
- ✓ Revalidar el flujo completo.

Entregable:
- ✓ Release candidate de Fase 1.

Aceptación:
- ✓ Las incidencias abiertas quedan cerradas o aceptadas por negocio.

### Día 14 - Preparación de despliegue
**ESTADO: ✓ COMPLETADO**
Objetivo:
Dejar listo el ambiente de entrega.

Tareas:
- ✓ Configurar variables de entorno.
- ✓ Revisar rutas y dominios.
- ✓ Preparar checklist de publicación.

Entregable:
- ✓ Checklist de despliegue completo.

Aceptación:
- ✓ No existen bloqueos técnicos para publicar.

### Día 15 - Publicación y cierre de Fase 1
**ESTADO: ✓ COMPLETADO**
Objetivo:
Publicar la versión aprobada en el ambiente acordado y cerrar la fase.

Tareas:
- ✓ Desplegar la versión final.
- ✓ Validar acceso público.
- ✓ Confirmar redirección y navegación.
- ✓ Entregar breve guía de uso y verificación.

Entregable:
- ✓ Landing publicada en el ambiente definido para Fase 1.

Aceptación:
- ✓ El flujo completo está accesible.
- ✓ Negocio valida la entrega final.

### Cierre de Fase 1
**ESTADO: ✓ COMPLETADO**

Resumen:
- La landing de productos quedó funcional y publicada.
- La página de detalle quedó funcional, responsive y con navegación de imágenes mejorada.
- La redirección al e-commerce quedó operativa.
- Las rutas por país quedaron activas.
- La aplicación fue desplegada temporalmente en `www.vivetiens.com` para validación y pago.

Conclusión operativa:
- La Fase 1 puede considerarse cerrada para efectos de entrega y facturación.

## Entregables de Fase 1
- Landing de productos funcional.
- Página de detalle funcional.
- CTA de compra redirigiendo al e-commerce.
- Rutas por país activas.
- Datos mock/JSON integrados.
- Deploy en ambiente acordado.

## Criterios de aceptación globales
- El usuario entra desde una ruta por país y ve contenido correcto.
- El usuario puede navegar del listado al detalle sin errores.
- El usuario puede hacer click en comprar y llegar al e-commerce.
- La experiencia es usable en mobile y desktop.
- La solución queda lista para extenderse a Fase 2.

## Dependencias críticas
- Contenido final aprobado por negocio.
- Link de e-commerce confirmado por producto.
- Imágenes definitivas disponibles.
- Acceso al ambiente de despliegue.

## Riesgos operativos
- Retraso en entrega de contenidos.
- Cambios de alcance durante la fase.
- Inconsistencia entre rutas, país y contenido.
- Problemas de redirección hacia el e-commerce.

## Regla de control de cambios
- Todo cambio fuera del backlog de Fase 1 debe validarse contra tiempo e impacto.
- Las 2 rondas de ajustes incluidas se reservan para correcciones y no para ampliar alcance.
