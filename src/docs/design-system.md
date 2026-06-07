https://www.tiens.com/

He revisado el sitio de Tiens Group (incluyendo páginas internas) y, más allá del modal inicial (que efectivamente usa azul y no corresponde al core branding), la identidad visual es bastante consistente y clara: **verde como color dominante**, con soporte de blancos, grises suaves y algunos acentos cálidos (naranja del logo).

A continuación te dejo un **sistema de diseño mínimo, coherente y aplicable directamente a tu landing**, pensado como base profesional (no solo visual, sino usable en código).

---

# 🎯 1. Paleta de colores (propuesta estructurada)

### ✅ Color base detectado

* Verde principal aproximado del branding:
  `#137D52` (correcto, coincide con lo que mencionas)

Este color está alineado con el posicionamiento de la marca: salud, naturaleza, equilibrio ([Jennifer Fellin][1])

---

## 🎨 Sistema de colores recomendado

### 🟢 Primary (Brand)

```css
--color-primary-900: #0B5A3A;
--color-primary-700: #137D52; /* principal */
--color-primary-500: #1FA36A;
--color-primary-300: #6FCF97;
--color-primary-100: #E6F4EE;
```

### 🟡 Secondary (natural / warm support - basado en el logo)

```css
--color-secondary-500: #F4A261; /* naranja suave */
--color-secondary-300: #F8CFA8;
--color-secondary-100: #FEF4EC;
```

👉 Uso: highlights suaves, badges, micro-accentos

---

### ⚫ Neutrales (muy importantes en este sitio)

```css
--color-neutral-900: #1A1A1A; /* títulos */
--color-neutral-700: #4F4F4F; /* texto */
--color-neutral-500: #828282; /* subtítulos */
--color-neutral-300: #E0E0E0; /* borders */
--color-neutral-100: #F9F9F9; /* backgrounds */
--color-white: #FFFFFF;
```

---

### 🔴 Estados

```css
--color-success: #27AE60;
--color-warning: #F2C94C;
--color-error: #EB5757;
--color-info: #2F80ED;
```

---

## 📌 Uso práctico (muy importante)

* **Botones primarios** → primary-700
* **Hover botones** → primary-900
* **Backgrounds suaves** → primary-100 / neutral-100
* **Textos** → neutral-900 / 700
* **Borders** → neutral-300

👉 Mantén máximo 1 color fuerte (verde) + neutros → evita ruido visual ([Tenten][2])

---

# 🔤 2. Tipografía

El sitio usa una línea muy clara: **sans-serif moderna, limpia, corporativa**

## Recomendación equivalente (web-friendly)

```css
font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif;
```

o más sobrio:

```css
font-family: 'Inter', sans-serif;
```

---

## 📏 Escala tipográfica

```css
--font-size-h1: 48px;
--font-size-h2: 36px;
--font-size-h3: 24px;
--font-size-body: 16px;
--font-size-small: 14px;
```

Line-height:

```css
--line-height-body: 1.6;
--line-height-heading: 1.2;
```

Esto sigue prácticas estándar de legibilidad en e-commerce ([Tenten][2])

---

... (contenido restante reusado sin cambios)

[1]: https://www.jenniferfellin.co/blog/brand-identity-101-colors-fonts-and-consistency-that-builds-trust?utm_source=chatgpt.com "Brand Identity 101: Colors, Fonts, and Consistency That Builds Trust"
[2]: https://tenten.co/shopify/ecommerce-brand-identity-guide/?utm_source=chatgpt.com "Brand Identity for Ecommerce: Logo, Typography, and Visua..."
