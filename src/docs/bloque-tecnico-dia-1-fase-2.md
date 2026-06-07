# Bloque Técnico Día 1 — Fase 2

## Propósito
Cerrar la base técnica mínima para arrancar Fase 2 con un modelo relacional claro, reglas de integridad, validaciones y un mapeo inicial desde `src/mock-data/catalog.fase1.mock.json`.

## Alcance del bloque
Este bloque define:
- esquema de tablas base;
- restricciones e índices mínimos;
- reglas de validación de negocio y de publicación;
- mapeo inicial desde el mock de Fase 1;
- criterio de tratamiento para campos flexibles con JSONB.

## Supuestos cerrados
- Base de datos: PostgreSQL en DigitalOcean.
- Países iniciales: `pe`, `ec`, `bo`, `co`, `mx`, `br`, `ar`, `pa`, `us`, `ve`.
- Monedas:
  - nuevos países: `BRL`, `ARS`, `PAB`, `USD`, `VES`;
  - países ya existentes: moneda oficial del mercado.
- Publicación por país: `is_active` + `published_at`.
- `ecommerceUrl` es solo redirección externa.
- Perú es el país semilla. Mientras un país no tenga localización propia, el producto reutiliza temporalmente el contenido y los assets de PE.
- Campos flexibles se guardan como JSONB.

## Modelo relacional

### country
```sql
id UUID PRIMARY KEY
code VARCHAR(5) UNIQUE NOT NULL
name VARCHAR(100) NOT NULL
currency_code VARCHAR(10) NOT NULL
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
```

### language
```sql
id UUID PRIMARY KEY
code VARCHAR(5) UNIQUE NOT NULL
name VARCHAR(50) NOT NULL
is_active BOOLEAN DEFAULT TRUE
```

### app_user
```sql
id UUID PRIMARY KEY
name VARCHAR(150) NOT NULL
email VARCHAR(150) UNIQUE NOT NULL
password TEXT NOT NULL
role VARCHAR(20) NOT NULL
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

Roles esperados:
- `SUPER_ADMIN`
- `ADMIN`
- `EDITOR`
- `ASSISTANT`

Roles y responsabilidades:
- `SUPER_ADMIN`: Acceso a todos los países
- `ADMIN`: administrador con acceso a todas las opciones dentro de un país
- `EDITOR`: sólo puede subir información de los productos
- `ASSISTANT`: opciones más restringidas (por ejemplo, solo ver)

### product
```sql
id UUID PRIMARY KEY
sku VARCHAR(100) UNIQUE NOT NULL
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### product_country
```sql
id UUID PRIMARY KEY
product_id UUID NOT NULL
country_id UUID NOT NULL
slug VARCHAR(180) NOT NULL
price NUMERIC(10,2) NOT NULL
currency VARCHAR(10) NOT NULL
ecommerce_url TEXT NOT NULL
ecommerce_external_id VARCHAR(120)
is_active BOOLEAN DEFAULT TRUE
published_at TIMESTAMP NULL
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### product_translation
```sql
id UUID PRIMARY KEY
product_country_id UUID NOT NULL
language_id UUID NOT NULL
name VARCHAR(255) NOT NULL
short_description TEXT
long_description TEXT
intro TEXT
benefits JSONB
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

### product_image
```sql
id UUID PRIMARY KEY
product_country_id UUID NOT NULL
url TEXT NOT NULL
sort_order INT DEFAULT 0
alt_text VARCHAR(255)
is_primary BOOLEAN DEFAULT FALSE
created_at TIMESTAMP DEFAULT NOW()
```

### category
```sql
id UUID PRIMARY KEY
name VARCHAR(150) NOT NULL
slug VARCHAR(150) UNIQUE
is_active BOOLEAN DEFAULT TRUE
```

### product_category
```sql
product_country_id UUID NOT NULL
category_id UUID NOT NULL
PRIMARY KEY (product_country_id, category_id)
```

### product_relation
```sql
id UUID PRIMARY KEY
product_country_id UUID NOT NULL
related_product_country_id UUID NOT NULL
relation_type VARCHAR(50) DEFAULT 'related'
created_at TIMESTAMP DEFAULT NOW()
```

### event
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
    currency_code VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE language (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(5) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'ASSISTANT')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_product_country_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE RESTRICT,
    CONSTRAINT fk_product_country_country FOREIGN KEY (country_id) REFERENCES country(id) ON DELETE RESTRICT,
    CONSTRAINT uq_product_country UNIQUE (product_id, country_id),
    CONSTRAINT uq_product_country_slug UNIQUE (country_id, slug),
    CONSTRAINT ck_product_country_price CHECK (price > 0),
    CONSTRAINT ck_product_country_currency CHECK (char_length(currency) BETWEEN 3 AND 10),
    CONSTRAINT ck_product_country_url CHECK (ecommerce_url LIKE 'https://%')
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
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_pi_product_country FOREIGN KEY (product_country_id) REFERENCES product_country(id) ON DELETE CASCADE
);

CREATE TABLE category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE
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
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_pr_product FOREIGN KEY (product_country_id) REFERENCES product_country(id) ON DELETE CASCADE,
    CONSTRAINT fk_pr_related FOREIGN KEY (related_product_country_id) REFERENCES product_country(id) ON DELETE CASCADE,
    CONSTRAINT uq_product_relation UNIQUE (product_country_id, related_product_country_id, relation_type)
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

## Índices mínimos
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

## Restricciones funcionales
- `product.sku` único a nivel catálogo.
- `product_country` único por combinación producto-país.
- `product_country.slug` único por combinación país-slug.
- `price` debe ser mayor que cero.
- `currency` debe existir y representar la moneda del país.
- `ecommerce_url` debe iniciar con `https://`.
- `product_translation` único por combinación producto-país-idioma.
- Si `product_country.is_active = true`, la fila debe tener precio, moneda, URL externa, idioma base y contenido completo.
- Si un país no tiene data completa, el producto no debe publicarse para ese país.

## Mapeo inicial desde `catalog.fase1.mock.json`

### Raíz del JSON
- `defaultCountry` → referencia de fallback o país de arranque.
- `availableCountries` → filas en `country`.
- `availableLanguages` → filas en `language`.
- `products` → filas en `product`.

### Producto
- `id` → `product.id`
- `sku` → `product.sku`
- `isActive` → `product.is_active`

### País del producto
- `countries.pe`, `countries.ec`, etc. → `product_country`
- `isActive` → `product_country.is_active`
- `slug` → `product_country.slug`
- `ecommerceExternalId` → `product_country.ecommerce_external_id`
- `ecommerceUrl` → `product_country.ecommerce_url`
- `price.amount` → `product_country.price`
- `price.currency` → `product_country.currency`
- `heroImage` → `product_image.is_primary = true`
- `images[]` → `product_image`

### Traducciones
- `translations.es` → `product_translation` con `language_id` de `es`
- `name` → `product_translation.name`
- `shortDescription` → `product_translation.short_description`
- `longDescription` → `product_translation.long_description`
- `intro` → `product_translation.intro`
- `benefits` → `product_translation.benefits`
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

## Criterio para campos JSONB
### Guardar como JSONB
- `benefits`
- `applications`
- `usage`
- `restrictions`
- `recommendations`
- `technicalInfo`

### Motivo
- Mantienen estructura reutilizable.
- Permiten variación entre productos.
- Facilitan migración desde el mock y desde Excel.
- Hacen viable el admin sin normalizar de más desde el día 1.

## Validaciones Zod / Schema mínimas
- `sku` obligatorio y único.
- `slug` obligatorio y único.
- `price.amount` positivo.
- `price.currency` requerido.
- `ecommerceUrl` con `https://`.
- `translations.es.name` requerido.
- `translations.es.shortDescription` requerido para listing.
- `translations.es.longDescription` requerido para detalle.
- `images` con mínimo 1 elemento.
- `heroImage` presente y referenciando un asset válido.
- `technicalInfo` como objeto JSON válido.
- `slug` único por país/región en `product_country`.

## Entregable Día 1
Con este bloque queda listo el material base para:
- migraciones;
- seed;
- importador JSON → BD;
- validación inicial de la Fase 2.
