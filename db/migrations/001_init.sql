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
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP NULL
);

CREATE TABLE app_user_country_access (
    user_id UUID NOT NULL,
    country_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, country_id),
    CONSTRAINT fk_auca_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_auca_country FOREIGN KEY (country_id) REFERENCES country(id) ON DELETE CASCADE
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
