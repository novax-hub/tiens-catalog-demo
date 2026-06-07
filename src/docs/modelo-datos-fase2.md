# Modelo de Datos Fase 2 - Tiens Catalog

## Propósito
Documento único y consolidado del modelo físico de datos para Fase 2. Reúne el diseño relacional, las reglas de integridad, el seed inicial, el mapeo desde el mock de Fase 1 y los campos que sí deben mantenerse desde el contrato mínimo de datos.

## Alcance
Este documento cubre la base de datos física y su relación con el contenido actual del proyecto:
- catálogo multi-país;
- soporte multi-idioma;
- productos, traducciones, imágenes y relaciones;
- usuarios y roles del admin;
- eventos básicos de analítica;
- seed inicial;
- migración desde el mock JSON actual.

No cubre la API ni el admin UI, que pertenecen al documento de backend.

## Estado actual del proyecto
- Fase 1 todavía usa `src/mock-data/catalog.fase1.mock.json` como fuente principal.
- El mock contiene estructura preparada para varios países, pero el contenido real está cargado principalmente para `pe`, que actúa como país semilla durante el piloto.
- El contrato mínimo de datos de Fase 1 sigue siendo relevante porque define el formato de entrada que luego se migrará al modelo físico.

## Principio de diseño
El modelo físico debe ser:
- normalizado en 3FN cuando el dato se repite entre producto, país e idioma;
- íntegro con claves foráneas y restricciones únicas;
- escalable para más países e idiomas;
- pragmático para el alcance real del proyecto;
- compatible con el mock actual y con su futura migración a BD.

## Entidades principales
- country
- language
- app_user
- product
- product_country
- product_translation
- product_image
- category
- product_category
- product_relation
- app_user_country_access
- event

## Modelo lógico
- Product es la entidad global del catálogo.
- ProductCountry representa el comportamiento del producto por país: precio, moneda, URL externa, estado y metadatos de publicación.
- ProductTranslation representa el contenido por idioma.
- ProductImage guarda imágenes ordenadas por producto-país.
- Category y ProductCategory permiten clasificación.
- ProductRelation permite productos recomendados o relacionados.
- Event registra interacciones básicas de frontend.
- Mientras no exista localización propia por país, el front y las capas de lectura pueden resolver contenido y assets desde `pe` como fallback controlado.

## Modelo físico recomendado

### 1. country
```sql
id UUID PRIMARY KEY
code VARCHAR(5) UNIQUE NOT NULL
name VARCHAR(100) NOT NULL
is_active BOOLEAN DEFAULT TRUE
```

### 2. language
```sql
id UUID PRIMARY KEY
code VARCHAR(5) UNIQUE NOT NULL
name VARCHAR(50) NOT NULL
```

### 3. app_user
```sql
id UUID PRIMARY KEY
name VARCHAR(150) NOT NULL
email VARCHAR(150) UNIQUE NOT NULL
password TEXT NOT NULL
role VARCHAR(20) NOT NULL
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
last_login_at TIMESTAMP NULL
```

Roles esperados:
- SUPER_ADMIN
- ADMIN
- EDITOR
- ASSISTANT

### Acceso por país recomendado

La unicidad de `email` no impide una tabla de acceso por país. Al contrario, ambas piezas se complementan bien:

```sql
app_user_country_access
------------------------
user_id UUID NOT NULL FK
country_id UUID NOT NULL FK
role VARCHAR(20) NOT NULL
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
PRIMARY KEY (user_id, country_id)
```

Regla práctica para este negocio:
- `SUPER_ADMIN`: sin asignación de país; acceso global.
- `ADMIN`, `EDITOR`, `ASSISTANT`: una o más asignaciones de país según el alcance permitido.
- `UNIQUE(email)` se mantiene en `app_user` para evitar identidades duplicadas y simplificar autenticación.

### 4. app_user_country_access
```sql
user_id UUID NOT NULL FK
country_id UUID NOT NULL FK
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
PRIMARY KEY (user_id, country_id)
```

Uso esperado:
- asignar países a usuarios no globales;
- permitir pruebas reales de bloqueo por país;
- mantener `SUPER_ADMIN` como caso global sin filas asociadas si la capa de autorización lo interpreta así.

### 5. product
```sql
id UUID PRIMARY KEY
sku VARCHAR(100) UNIQUE NOT NULL
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### 6. product_country
```sql
id UUID PRIMARY KEY
product_id UUID NOT NULL FK
country_id UUID NOT NULL FK
slug VARCHAR(180) NOT NULL
price NUMERIC(10,2) NOT NULL
currency VARCHAR(10) NOT NULL
ecommerce_url TEXT NOT NULL
ecommerce_external_id VARCHAR(120)
is_active BOOLEAN DEFAULT TRUE
published_at TIMESTAMP NULL
```

### 7. product_translation
```sql
id UUID PRIMARY KEY
product_country_id UUID NOT NULL FK
language_id UUID NOT NULL FK
name VARCHAR(255) NOT NULL
short_description TEXT
long_description TEXT
intro TEXT
benefits JSONB
features JSONB
applications JSONB
usage JSONB
restrictions JSONB
recommendations JSONB
technical_info JSONB
cta_label VARCHAR(100)
seo_title VARCHAR(255)
seo_description TEXT
seo_og_image TEXT
video_url TEXT
```

### 8. product_image
```sql
id UUID PRIMARY KEY
product_country_id UUID NOT NULL FK
url TEXT NOT NULL
sort_order INT DEFAULT 0
alt_text VARCHAR(255)
is_primary BOOLEAN DEFAULT FALSE
```

### 9. category
```sql
id UUID PRIMARY KEY
name VARCHAR(150) NOT NULL
slug VARCHAR(150) UNIQUE
```

### 10. product_category
```sql
product_country_id UUID NOT NULL FK
category_id UUID NOT NULL FK
PRIMARY KEY (product_country_id, category_id)
```

### 11. product_relation
```sql
id UUID PRIMARY KEY
product_country_id UUID NOT NULL FK
related_product_country_id UUID NOT NULL FK
relation_type VARCHAR(50) DEFAULT 'related'
```

### 12. event
```sql
id UUID PRIMARY KEY
event_type VARCHAR(50) NOT NULL
product_id UUID NULL
country_code VARCHAR(5) NULL
payload JSONB NULL
created_at TIMESTAMP DEFAULT NOW()
```

## DDL base sugerido
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE country (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(5) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE language (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(5) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (
        role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'ASSISTANT')
    ),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_country (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    country_id UUID NOT NULL,
    slug VARCHAR(180) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    ecommerce_url TEXT NOT NULL,
    ecommerce_external_id VARCHAR(120),
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP NULL,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE RESTRICT,
    CONSTRAINT fk_country FOREIGN KEY (country_id) REFERENCES country(id) ON DELETE RESTRICT,
    CONSTRAINT uq_product_country UNIQUE (product_id, country_id),
    CONSTRAINT uq_product_country_slug UNIQUE (country_id, slug)
);

CREATE TABLE product_translation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_country_id UUID NOT NULL,
    language_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    short_description TEXT,
    long_description TEXT,
    intro TEXT,
    benefits JSONB,
    features JSONB,
    applications JSONB,
    usage JSONB,
    restrictions JSONB,
    recommendations JSONB,
    technical_info JSONB,
    cta_label VARCHAR(100),
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_og_image TEXT,
    video_url TEXT,
    CONSTRAINT fk_pt_product_country FOREIGN KEY (product_country_id) REFERENCES product_country(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_language FOREIGN KEY (language_id) REFERENCES language(id) ON DELETE RESTRICT,
    CONSTRAINT uq_translation UNIQUE (product_country_id, language_id)
);

CREATE TABLE product_image (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_country_id UUID NOT NULL,
    url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_pi_product_country FOREIGN KEY (product_country_id) REFERENCES product_country(id) ON DELETE CASCADE
);

CREATE TABLE category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE
);

CREATE TABLE product_category (
    product_country_id UUID NOT NULL,
    category_id UUID NOT NULL,
    PRIMARY KEY (product_country_id, category_id),
    CONSTRAINT fk_pc_product_country FOREIGN KEY (product_country_id) REFERENCES product_country(id) ON DELETE CASCADE,
    CONSTRAINT fk_pc_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT
);

CREATE TABLE product_relation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_country_id UUID NOT NULL,
    related_product_country_id UUID NOT NULL,
    relation_type VARCHAR(50) DEFAULT 'related',
    CONSTRAINT fk_pr_product FOREIGN KEY (product_country_id) REFERENCES product_country(id) ON DELETE CASCADE,
    CONSTRAINT fk_pr_related FOREIGN KEY (related_product_country_id) REFERENCES product_country(id) ON DELETE CASCADE
);

CREATE TABLE event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    product_id UUID NULL,
    country_code VARCHAR(5) NULL,
    payload JSONB NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Índices recomendados
```sql
CREATE INDEX idx_product_country_product ON product_country(product_id);
CREATE INDEX idx_product_country_country ON product_country(country_id);
CREATE INDEX idx_product_country_active ON product_country(is_active);

CREATE INDEX idx_translation_pc ON product_translation(product_country_id);
CREATE INDEX idx_translation_lang ON product_translation(language_id);

CREATE INDEX idx_image_pc ON product_image(product_country_id);
CREATE INDEX idx_image_primary ON product_image(is_primary);

CREATE INDEX idx_event_product ON event(product_id);
CREATE INDEX idx_event_country ON event(country_code);
CREATE INDEX idx_event_type ON event(event_type);
```

## Relaciones

### 1:N
- Product → ProductCountry
- Country → ProductCountry
- ProductCountry → ProductTranslation
- ProductCountry → ProductImage

### N:M
- ProductCountry ↔ Category
- ProductCountry ↔ ProductCountry para relaciones entre productos

## Reglas de integridad
- `product.sku` debe ser único.
- `product_country` debe ser único por combinación producto-país.
- `product_country.slug` debe ser único por país/región.
- Si un país está activo para publicación, debe tener precio, moneda, URL externa e idioma base completos.
- `ecommerce_url` debe iniciar con `https://`.
- `price` debe ser mayor que cero.
- `currency` debe ser un código válido de 3 caracteres.
- `product_translation` debe ser único por combinación producto-país-idioma.

## Contrato mínimo de Fase 1 y su valor para Fase 2
El archivo [contrato-minimo-datos-fase-1.md](contrato-minimo-datos-fase-1.md) sí alimenta directamente este modelo porque define la forma original del mock.

### Campos del mock que deben preservarse en la migración
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

### Campos del mock que amplían el contrato mínimo
- intro
- applications
- usage
- restrictions
- recommendations
- technicalInfo
- videoUrl
- features

### Recomendación de mapeo
- `benefits`, `features`, `applications`, `usage`, `restrictions`, `recommendations` y `technicalInfo` pueden almacenarse como JSONB en Fase 2 para preservar flexibilidad inicial.
- Si más adelante el admin exige filtros o edición granular avanzada, se pueden normalizar en tablas propias.

## Mapeo desde el mock actual

### Raíz del JSON
- `defaultCountry` → referencia de publicación inicial o fallback.
- `availableCountries` → tabla `country`.
- `availableLanguages` → tabla `language`.

### Producto
- `id` → `product.id`
- `sku` → `product.sku`
- `isActive` → `product.is_active`

### País del producto
- `countries.pe` / `countries.ec` / etc. → `product_country`
- `isActive` → `product_country.is_active`
- `slug` → `product_country.slug`
- `ecommerceExternalId` → `product_country.ecommerce_external_id`
- `ecommerceUrl` → `product_country.ecommerce_url`
- `price.amount` → `product_country.price`
- `price.currency` → `product_country.currency`
- `heroImage` → primera imagen o imagen principal
- `images` → `product_image`

## Referencias y diagrama
- Diagrama de arquitectura: [tiens-v2.drawio.png](tiens-v2.drawio.png)
 - Ver también: [alcance.md](alcance.md), [frontend.md](frontend.md), [backend.md](backend.md), [workflow-git.md](workflow-git.md)
 - Contrato mínimo de datos (mock Fase 1): [contrato-minimo-datos-fase-1.md](contrato-minimo-datos-fase-1.md)
 - Diseño / tokens: [design-system.md](design-system.md)
 - Estructura del proyecto: [estructura-proyecto.md](estructura-proyecto.md)
 - Propuesta técnica y comercial: [Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md](Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md)
- `categoryTags` → `product_category` o JSON temporal si aún no se normaliza

### Traducciones
- `translations.es` → `product_translation` con `language = es`
- `name` → `product_translation.name`
- `shortDescription` → `product_translation.short_description`
- `longDescription` → `product_translation.long_description`
- `intro` → `product_translation.intro`
- `benefits` → `product_translation.benefits`
- `features` → `product_translation.features`
- `applications` → `product_translation.applications`
- `usage` → `product_translation.usage`
- `restrictions` → `product_translation.restrictions`
- `recommendations` → `product_translation.recommendations`
- `technicalInfo` → `product_translation.technical_info`
- `ctaLabel` → `product_translation.cta_label`
- `seo.title` → `product_translation.seo_title`
- `seo.description` → `product_translation.seo_description`
- `seo.ogImage` → `product_translation.seo_og_image`
- `videoUrl` → `product_translation.video_url`

## Seed inicial sugerido
La documentación previa define un seed que sirve como arranque del sistema.

### Datos base mínimos
- País base Perú.
- Idioma español.
- Usuario admin inicial.
- Productos reales de referencia.

### Objetivo del seed
- validar listing;
- validar detalle;
- validar relaciones;
- validar admin;
- validar analítica básica.

## Observación sobre el mock real
El mock actual no llena todos los países de forma uniforme. Por eso el modelo físico debe soportar dos estados:
- datos estructuralmente preparados para todos los países;
- datos efectivamente publicados solo en algunos países mientras se completa la carga.

## Convención de publicación recomendada
- Mantener `product.is_active` para controlar si el producto existe globalmente.
- Mantener `product_country.is_active` para controlar si se publica por país.
- Mantener `product_translation` por idioma para sostener expansión futura.
- Usar `published_at` cuando se necesite distinguir borrador y publicación.

## Límites actuales del modelo
- No incorpora lógica de workflow editorial completa.
- No define versionado histórico detallado.
- No define auditoría de cambios por campo.
- No define CMS enriquecido para contenido libre.

## Resumen ejecutivo
El modelo físico de datos de Fase 2 debe permitir que el catálogo crezca sin rehacer la base:
- producto global;
- comportamiento por país;
- traducciones por idioma;
- imágenes ordenadas;
- categorías y relaciones;
- usuarios del admin;
- eventos de analítica;
- migración directa desde el mock actual.

Este archivo debe tomarse como la versión consolidada y vigente del modelo físico de datos.