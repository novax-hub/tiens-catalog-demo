Estoy desarrollando un proyecto para la empresa Tiens que vende productos de cuidado de la salud con un modelo tipo red de mercadeo. Tiens opera en varios países de latinoamérica y actualmente la web tienslar.com muestra los productos, su detalle (los mismos productos en todos los países aunque en cada país puede cambiar precio, imágenes y textos) y redirige aun e-commerce externo, sin embargo, visual y estructuralmente la forma de exponer los productos no es la mejor y modificar esta web no es viable por el momento por lo que se ha propuesto crear una landing page de productos y su detalle que muestre la información de una mejor manera y redirija al mismo e-commerce externo. Inicialmente esta landing estaría disponible solo para Perú con 10 productos fijos pero con un mantenedor para poder modificar contenido.
Para esto, se ha desarrollado el proyecto que consiste en:
Fase 1: landing de productos +  detalle de productos
Next.js + App rotuter. 10 productos a partir de un mock.json
Base multipaís y base multi idioma.

Fase 2: mantendor + base de datos + imágenes en DigitalOceaan Spaces + login + roles y permisos.
10 productos cargados, sólo disponible para Perú en español
roles: super administrador (todos los países, puede crear productos), administrador (por país, puede modificar la configuración regional de un producto), editor (puede modificar contenido de los productos de su país) y asistente (sólo puede visualizar información de los productos de su país).

Inicialmente esta landing page estará en un dominio aparte (vivetiens.com).
Hay un proyecto a futuro para rediseñar tienslar.com y en ese momento se integrará la landing al dominio tienslar.com.

Ya se ha terminado la fase 1 y se ha desplegado en producción. La web es ágil y responsive y está desplegada en Vercel en una cuenta del cliente.

He entrado a la fase 2 y en este momento me encuentro diseñando las pantallas del mantenedor y los flujos de trabajo de cada rol.
Te comparto este contexto base sobre lo que se está considerando. Está alineado con todo lo que hemos definido hasta ahora sobre el modelo de datos, los países, idiomas, roles y UX del mantenedor. 

---


# Tiens Landing - Fase 2

# Contexto Funcional del Mantenedor de Productos

## 1. Contexto general

La Fase 2 incorpora:

* Base de datos PostgreSQL.
* API REST.
* Mantenedor administrativo.
* Gestión de imágenes en DigitalOcean Spaces.
* Autenticación y autorización por roles.

Actualmente la landing se encuentra habilitada únicamente para Perú.

Sin embargo, la arquitectura fue diseñada desde el inicio para soportar múltiples países e idiomas.

Importante:

Los productos NO nacen en Perú.

Los productos ya existen en múltiples países desde hace años y actualmente son comercializados dentro del ecosistema Tiens LATAM.

La landing actual es una nueva experiencia de catálogo que inicialmente será utilizada por Perú y posteriormente podrá ser habilitada para otros países.

Por lo tanto:

* Un producto puede existir en múltiples países.
* Cada país puede tener precios distintos.
* Cada país puede tener moneda distinta.
* Cada país puede tener imágenes distintas.
* Cada país puede tener SEO distinto.
* Cada país puede tener contenido distinto.
* Un mismo país puede tener múltiples idiomas.

---

# Modelo de datos conceptual

## Producto global

Representa la existencia corporativa del producto.

Tabla:

product

Campos:

* id
* sku
* is_active
* created_at
* updated_at

Ejemplo:

SKU = VIOKAL

No almacena contenido editorial ni comercial.

---

## Configuración por país

Representa la configuración regional de un producto.

Tabla:

product_country

Campos:

* product_id
* country_id
* slug
* price
* currency
* ecommerce_url
* ecommerce_external_id
* category_tags
* created_at
* updated_at

Ejemplos:

* VIOKAL Perú
* VIOKAL Ecuador
* VIOKAL Brasil

---

## Traducción

Representa el contenido de un producto para un idioma específico.

Tabla:

product_translation

Campos:

* product_country_id
* language_id
* name
* short_description
* long_description
* intro
* benefits (jsonb)
* applications (jsonb)
* usage (jsonb)
* restrictions (jsonb)
* recommendations (jsonb)
* features (jsonb)
* cta_label
* seo_title
* seo_description
* seo_og_image
* video_url
* technical_info (jsonb)

Ejemplos:

* VIOKAL Perú Español
* VIOKAL Ecuador Español
* VIOKAL Brasil Portugués

---

## Imágenes

Tabla:

product_image

Campos:

* product_country_id
* url
* alt_text
* sort_order
* is_primary

Las imágenes pertenecen al contexto país.

Ejemplo:

VIOKAL Perú:

* main.webp
* gallery-01.webp
* gallery-02.webp

VIOKAL Ecuador:

* main.webp
* gallery-01.webp

Las imágenes físicas se almacenan en DigitalOcean Spaces.

---

# Jerarquía funcional

La jerarquía correcta es:

Producto Global
→ Configuración País
→ Traducción

Representación:

product
└── product_country
└── product_translation

---

# Estado del producto

No existe flujo editorial.

No existen:

* Draft
* Published
* PublishedAt

El único mecanismo de activación es:

product.is_active

Reglas:

* true = visible en la landing
* false = oculto en la landing

---

# Roles

## SUPERADMIN

Puede:

* Ver todos los países.
* Crear productos.
* Editar productos.
* Activar/Inactivar productos.
* Agregar países a productos existentes.
* Administrar imágenes.
* Administrar traducciones.
* Administrar usuarios.

---

## ADMIN

Asociado a uno o varios países.

Puede:

* Ver únicamente sus países.
* Crear configuraciones regionales para sus países.
* Editar configuraciones regionales.
* Activar/Inactivar productos de sus países.
* Gestionar imágenes de sus países.

No puede administrar usuarios.

---

## EDITOR

Puede:

* Ver productos.
* Editar contenido.
* Editar imágenes.
* Editar SEO.

No puede:

* Activar/Inactivar.
* Administrar usuarios.

---

## ASISTENTE

Solo lectura.

Puede consultar:

* Productos.
* Configuraciones.
* Traducciones.
* Imágenes.

No puede modificar información.

---

# Estructura de navegación

Catálogo

├── Productos
├── Configuraciones Regionales
└── Categorías (futuro)


De acuerdo. Por otro lado, no llegué a compartirte esta información sobre el diseño de las pantallas:
PANTALLA 0
NUEVO PRODUCTO GLOBAL

Responsable:

SUPERADMIN

Trabaja sobre:

product

Campos:

SKU
Nombre (nuevo campo name en tabla product)
Estado (activo por defecto)

Botón:

Guardar

Al guardar:

product

sin países todavía.


PANTALLA 1
PRODUCTOS

Objetivo:

Administrar productos globales.

Trabaja sobre:

product

:::

Campos mostrados

SKU (product.sku)
Nombre (product.name)
Estado (product.is_active)
Países configurados (calculado)

Ejemplo:

SKU Nombre Países
A01 VIOKAL PE, EC
102 AIRIZ PE

Acciones:

Ver
Editar
Agregar país
Activar/Inactivar

Botón superior:

Nuevo Producto

:::

PANTALLA 2
DETALLE PRODUCTO GLOBAL

Objetivo:

Visualizar un producto global y sus configuraciones regionales.

:::

Contexto superior

Nombre
SKU
Estado

Ejemplo:

Producto: Viokal
SKU: VIOKAL
Estado: Activo

:::

Sección

Países configurados

Tabla:

País | Idiomas

Perú | Español
Ecuador | Español
Brasil | Portugués

Acciones:

Ver configuración
Editar configuración

Botón:

Agregar país

:::

PANTALLA 3
AGREGAR PAÍS

Objetivo:

Crear una nueva configuración regional para un producto existente.

Campos:
Producto: (SKU - Nombre) (SUPER_ADMIN: solo lectura, ADMIN: editable)
País (SUPER_ADMIN: editable, ADMIN: solo lectura)
Idioma inicial
Nombre en "País"
slug
precio
moneda

Ejemplo:
Nombre: Viokal Pe
País: Ecuador
Idioma: Español

Al guardar se crea:

product_country
product_translation

:::

PANTALLA 4
CONFIGURACIONES REGIONALES

Objetivo:

Pantalla principal de trabajo diario.

Trabaja sobre:

product_country
+
product_translation

:::

Campos mostrados

Producto (SKU - Producto)
Nombre en País
País
Idioma
Precio
Moneda
Estado

Ejemplo:

Producto | País | Idioma

A01 - Viokal | Viokal Pe | Perú | Español
A02 - Chitosa | Cápsulas Chitosa | Perú | Español

:::

Filtros

Buscar por SKU o nombre
País
Idioma
Estado

:::

Acciones

Ver detalle
Editar

:::

PANTALLA 5
DETALLE CONFIGURACIÓN REGIONAL

Objetivo:

Visualizar una configuración específica.

Ejemplo:

Viokal
SKU: VIOKAL
País: Perú
Idioma: Español

Modo lectura.

Muestra todas las secciones del producto.

Botón:

Editar

:::

PANTALLA 6
EDICIÓN CONFIGURACIÓN REGIONAL

Objetivo:

Editar contenido regional.

Contexto superior

Producto
SKU
País
Idioma
Estado

Ejemplo:

Producto: Viokal
SKU: VIOKAL
País: Perú
Idioma: Español

:::

TAB
Información General

Nombre
(product_translation.name)

Slug
(product_country.slug)

Descripción corta
(product_translation.short_description)

:::

TAB
Información Comercial

Precio
(product_country.price)

Moneda
(product_country.currency)

URL Ecommerce
(product_country.ecommerce_url)

Categorías
(product_country.category_tags)

:::

TAB
Contenido

Introducción
(product_translation.intro)

Descripción larga
(product_translation.long_description)

Beneficios
(product_translation.benefits)

Aplicaciones
(product_translation.applications)

Modo de uso
(product_translation.usage)

Restricciones
(product_translation.restrictions)

Recomendaciones
(product_translation.recommendations)

Características
(product_translation.features)

Texto CTA
(product_translation.cta_label)

Video
(product_translation.video_url)

:::

TAB
SEO

Título SEO
(product_translation.seo_title)

Descripción SEO
(product_translation.seo_description)

Imagen Open Graph
(product_translation.seo_og_image)

:::

TAB
Información Técnica

Tipo de producto
(product_translation.technical_info.tipo_de_producto)

Ingrediente principal
(product_translation.technical_info.ingrediente_principal)

Componentes principales
(product_translation.technical_info.componentes_principales)

Presentación
(product_translation.technical_info.presentacion)

Contenido
(product_translation.technical_info.contenido)

Marca
(product_translation.technical_info.marca)

Valor diferencial
(product_translation.technical_info.valor_diferencial)

Tecnología
(product_translation.technical_info.tecnologia)

Reconocimientos
(product_translation.technical_info.reconocimientos)

Certificaciones
(product_translation.technical_info.certificaciones)

:::

TAB
Medios

Galería de imágenes

Campos:

Imagen
(product_image.url)

Texto alternativo
(product_image.alt_text)

Orden
(product_image.sort_order)

Imagen principal
(product_image.is_primary)

Acciones:

Subir
Eliminar
Marcar como principal (reordena en automático)

La imagen principal alimenta:

Landing
Detalle producto
Hero image

SEO OG Image es independiente.

:::

FLUJOS POR ROL

SUPERADMIN

Productos
→ Crear producto global

Productos
→ Agregar país

Productos
→ Activar/Inactivar

Configuraciones Regionales
→ Editar contenido

Configuraciones Regionales
→ Editar SEO

Configuraciones Regionales
→ Editar imágenes

:::

ADMIN

Configuraciones Regionales

Filtrado automáticamente por sus países.

Puede:

Editar contenido.
Editar SEO.
Editar imágenes.
Activar/Inactivar.

No puede:

Administrar usuarios.
Ver países no asignados.

:::

EDITOR

Configuraciones Regionales

Puede:

Editar contenido.
Editar SEO.
Editar imágenes.

No puede:

Activar/Inactivar.
Administrar usuarios.

:::

ASISTENTE

Configuraciones Regionales

Solo lectura.

No puede modificar datos.
:::



**El menú principal para Admin, Editor y Asistente debería abrir directamente "Configuraciones Regionales" y ocultar "Productos"**, porque el 95% de su trabajo será editar configuraciones de país, mientras que la administración del catálogo global es una tarea más propia del Superadmin. 