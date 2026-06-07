# Contrato Minimo de Datos Mock - Fase 1

## Objetivo
Definir una estructura temporal en JSON para cubrir la landing y el detalle de producto en Fase 1, sin depender de base de datos.

## Alcance
- Fuente unica de verdad para datos de productos en Fase 1.
- Soporte de rutas por pais.
- URL publica por slug.
- Redireccion al e-commerce por pais usando id externo.
- Base preparada para escalar a multi idioma en Fase 2.

## Archivo fuente
- mock-data/catalog.fase1.mock.json

## Estructura raiz
- defaultCountry: string
- availableCountries: string[]
- availableLanguages: string[]
- products: ProductMock[]

## Estructura ProductMock
- id: string (UUID interno)
- sku: string
- slug: string (URL publica SEO)
- isActive: boolean
- countries: record<string, ProductCountryMock>

## Estructura ProductCountryMock
- isActive: boolean
- ecommerceExternalId: string
- ecommerceUrl: string
- price: { amount: number, currency: string }
- categoryTags: string[]
- images: string[]
- heroImage: string
- translations: record<string, ProductTranslationMock>

## Estructura ProductTranslationMock
- name: string
- shortDescription: string
- longDescription: string
- benefits: string[]
- features: string[]
- ctaLabel: string
- seo: {
  title: string,
  description: string,
  ogImage: string
}

## Reglas de negocio para Fase 1
1. Solo se publicara contenido en espanol (es), pero la estructura debe permitir mas idiomas.
2. Todo producto activo debe tener al menos una configuracion por pais activo.
3. Todo country activo debe incluir ecommerceUrl valido y ecommerceExternalId.
4. slug debe ser unico en el catalogo.
5. El detalle se resuelve por pais + slug.

## Campos minimos obligatorios para Landing
- slug
- translations.es.name
- translations.es.shortDescription
- price.amount
- price.currency
- heroImage
- ctaLabel

## Campos minimos obligatorios para Detalle
- slug
- translations.es.name
- translations.es.longDescription
- images (minimo 1)
- benefits (minimo 1)
- features (minimo 1)
- ecommerceUrl
- ecommerceExternalId

## Estrategia de escalamiento a Fase 2
1. id se mantiene como UUID interno.
2. ecommerceExternalId se mantiene para construir URL de compra externa.
3. slug continua como URL publica SEO.
4. Este contrato se mapea 1 a 1 al modelo Product, ProductCountry y ProductTranslation en BD.

## Version final de campos minimos (congelada para Fase 1)

Estado: APROBADO

### Campos obligatorios por producto
- id
- sku
- slug
- isActive
- countries.pe (como minimo para publicar en Fase 1)

### Campos obligatorios por country activo
- isActive
- ecommerceExternalId
- ecommerceUrl
- price.amount
- price.currency
- heroImage
- images (minimo 1)
- translations.es

### Campos obligatorios por traduccion es
- name
- shortDescription
- longDescription
- benefits (minimo 1)
- features (minimo 1)
- ctaLabel
- seo.title
- seo.description
- seo.ogImage

### Campos opcionales en Fase 1
- categoryTags
- translations en otros idiomas distintos de es
- countries adicionales a pe cargados con contenido completo

### Reglas tecnicas de validacion
1. slug unico a nivel catalogo.
2. sku unico a nivel catalogo.
3. ecommerceUrl debe iniciar con https://.
4. price.amount debe ser mayor a 0.
5. price.currency debe tener 3 caracteres (ejemplo: PEN).
6. Si isActive = true en un country, todos sus obligatorios deben estar completos.

### Regla de cambios
Durante Fase 1 no se agregan nuevos campos obligatorios.
Si negocio solicita nuevos campos, se registran como opcionales o se difieren a Fase 2 mediante control de cambios.
