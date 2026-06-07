"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminRegionalProductDetail,
  AdminRegionalProductImage,
} from "@/modules/product/admin-product.types.ts";

// ---- local types ----

type QueuedImage = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
};

type MediaActionTarget = {
  type: "promote" | "delete";
  image: AdminRegionalProductImage;
};

type TranslationDraft = {
  name: string;
  shortDescription: string;
  longDescription: string;
  intro: string;
  benefits: string;
  applications: string;
  usage: string;
  restrictions: string;
  recommendations: string;
  technicalInfo: Record<string, string>;
  videoUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoOgImage: string;
};

// ---- technical info field definitions ----

const TECH_INFO_FIELDS: Array<{ key: string; label: string; wide?: boolean }> = [
  { key: "tipo-de-producto",         label: "Tipo de producto" },
  { key: "marca",                    label: "Marca" },
  { key: "ingrediente-principal",    label: "Ingrediente principal" },
  { key: "ingredientes-principales", label: "Ingredientes principales", wide: true },
  { key: "componentes-principales",  label: "Componentes principales", wide: true },
  { key: "presentacion",             label: "Presentación" },
  { key: "contenido",                label: "Contenido" },
  { key: "diferencial",              label: "Valor diferencial", wide: true },
  { key: "tecnologia",               label: "Tecnología" },
  { key: "reconocimientos",          label: "Reconocimientos" },
  { key: "certificaciones",          label: "Certificaciones" },
];

const TECH_INFO_KNOWN_KEYS = new Set(TECH_INFO_FIELDS.map((f) => f.key));

// ---- serialisation helpers ----

function parseListField(value: unknown): string {
  if (!value) return "";
  if (Array.isArray(value)) return (value as unknown[]).map(String).join("\n");
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function parseTechInfoField(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v !== null && v !== undefined) result[k] = String(v);
  }
  return result;
}

function serializeTechInfoField(record: Record<string, string>): Record<string, string> | null {
  const clean = Object.fromEntries(
    Object.entries(record).filter(([, v]) => v.trim() !== "")
  );
  return Object.keys(clean).length > 0 ? clean : null;
}

function serializeListField(text: string): string[] | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : null;
}

function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function makeQueuedImage(file: File): QueuedImage {
  return { id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), name: file.name, size: file.size };
}

function draftFromTranslation(t: AdminRegionalProductDetail["translations"][number]): TranslationDraft {
  return {
    name: t.name ?? "",
    shortDescription: t.shortDescription ?? "",
    longDescription: t.longDescription ?? "",
    intro: t.intro ?? "",
    benefits: parseListField(t.benefits),
    applications: parseListField(t.applications),
    usage: parseListField(t.usage),
    restrictions: parseListField(t.restrictions),
    recommendations: parseListField(t.recommendations),
    technicalInfo: parseTechInfoField(t.technicalInfo),
    videoUrl: t.videoUrl ?? "",
    seoTitle: t.seoTitle ?? "",
    seoDescription: t.seoDescription ?? "",
    seoOgImage: t.seoOgImage ?? "",
  };
}

// ---- shared field styles ----

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--color-neutral-300)",
  borderRadius: 12,
  padding: "12px 14px",
  font: "inherit",
  background: "var(--color-white)",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>{children}</span>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <article
      style={{
        background: "var(--color-white)",
        border: "1px solid var(--color-neutral-300)",
        borderRadius: 18,
        padding: "var(--space-4)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-2)",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{title}</h2>
          {subtitle && (
            <p style={{ margin: "4px 0 0", color: "var(--color-neutral-600)" }}>{subtitle}</p>
          )}
        </div>
        {badge && (
          <span
            className="btn-primary"
            style={{ padding: "6px 10px", borderRadius: 999, fontSize: "0.75rem" }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </article>
  );
}

// ---- main component ----

type RegionalProductEditorProps = {
  detail: AdminRegionalProductDetail;
  /** Whether the current user can toggle is_active on the product_country. */
  canToggle: boolean;
};

export function RegionalProductEditor({ detail, canToggle }: RegionalProductEditorProps) {
  const router = useRouter();

  // -- language tab --
  const [activeLanguageCode, setActiveLanguageCode] = useState(
    detail.translations[0]?.languageCode ?? "es",
  );

  // -- commercial info --
  const [slug, setSlug] = useState(detail.slug);
  const [price, setPrice] = useState(String(detail.price));
  const [currency, setCurrency] = useState(detail.currency);
  const [ecommerceUrl, setEcommerceUrl] = useState(detail.ecommerceUrl);
  const [isActive, setIsActive] = useState(detail.isRegionallyActive);
  const [isSavingCommercial, setIsSavingCommercial] = useState(false);
  const [commercialStatus, setCommercialStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // -- translation drafts (per language) --
  const [drafts, setDrafts] = useState<Record<string, TranslationDraft>>(() =>
    Object.fromEntries(detail.translations.map((t) => [t.languageCode, draftFromTranslation(t)])),
  );
  const [isSavingTranslation, setIsSavingTranslation] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const currentDraft: TranslationDraft | undefined = drafts[activeLanguageCode];

  const updateDraft = (field: Exclude<keyof TranslationDraft, "technicalInfo">, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [activeLanguageCode]: { ...prev[activeLanguageCode], [field]: value },
    }));
  };

  const updateTechField = (key: string, value: string) => {
    setDrafts((prev) => {
      const draft = prev[activeLanguageCode];
      return {
        ...prev,
        [activeLanguageCode]: {
          ...draft,
          technicalInfo: { ...draft.technicalInfo, [key]: value },
        },
      };
    });
  };

  // -- images --
  const [images, setImages] = useState<AdminRegionalProductImage[]>(detail.images);
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [mediaActionTarget, setMediaActionTarget] = useState<MediaActionTarget | null>(null);
  const [mediaLoadingAction, setMediaLoadingAction] = useState<"promote" | "delete" | null>(null);
  const [isSavingQueuedImages, setIsSavingQueuedImages] = useState(false);
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queuedImagesRef = useRef<QueuedImage[]>([]);

  useEffect(() => {
    queuedImagesRef.current = queuedImages;
  }, [queuedImages]);

  useEffect(() => {
    return () => {
      queuedImagesRef.current.forEach((qi) => URL.revokeObjectURL(qi.previewUrl));
    };
  }, []);

  // -- handlers: commercial --

  const handleSaveCommercial = async () => {
    setIsSavingCommercial(true);
    setCommercialStatus(null);
    try {
      const res = await fetch(`/api/admin/regional-configurations/${detail.productCountryId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          countryConfig: {
            slug: slug.trim() || undefined,
            price: price ? Number(price) : undefined,
            currency: currency.trim() || undefined,
            ecommerceUrl,
            ...(canToggle ? { isActive } : {}),
          },
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(payload?.error ?? "Error al guardar");
      setCommercialStatus({ ok: true, msg: "Información comercial guardada correctamente." });
      router.refresh();
    } catch (err) {
      setCommercialStatus({
        ok: false,
        msg: err instanceof Error ? err.message : "Error al guardar.",
      });
    } finally {
      setIsSavingCommercial(false);
    }
  };

  // -- handlers: translation --

  const handleSaveTranslation = async () => {
    if (!currentDraft) return;
    setIsSavingTranslation(true);
    setTranslationStatus(null);
    try {
      const res = await fetch(`/api/admin/regional-configurations/${detail.productCountryId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          translation: {
            languageCode: activeLanguageCode,
            name: currentDraft.name,
            shortDescription: currentDraft.shortDescription || null,
            longDescription: currentDraft.longDescription || null,
            intro: currentDraft.intro || null,
            benefits: serializeListField(currentDraft.benefits),
            applications: serializeListField(currentDraft.applications),
            usage: serializeListField(currentDraft.usage),
            restrictions: serializeListField(currentDraft.restrictions),
            recommendations: serializeListField(currentDraft.recommendations),
            technicalInfo: serializeTechInfoField(currentDraft.technicalInfo),
            videoUrl: currentDraft.videoUrl || null,
            seoTitle: currentDraft.seoTitle || null,
            seoDescription: currentDraft.seoDescription || null,
            seoOgImage: currentDraft.seoOgImage || null,
          },
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(payload?.error ?? "Error al guardar");
      setTranslationStatus({ ok: true, msg: "Contenido guardado correctamente." });
      router.refresh();
    } catch (err) {
      setTranslationStatus({
        ok: false,
        msg: err instanceof Error ? err.message : "Error al guardar.",
      });
    } finally {
      setIsSavingTranslation(false);
    }
  };

  // -- handlers: images --

  const handleQueuedFiles = (fileList: FileList | File[]) => {
    const next = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .map(makeQueuedImage);
    if (next.length === 0) { setMediaStatus("Selecciona al menos una imagen válida."); return; }
    setQueuedImages((prev) => [...prev, ...next]);
    setMediaStatus(`Se agregaron ${next.length} imagen${next.length === 1 ? "" : "es"} a la cola.`);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropzoneActive(false);
    if (e.dataTransfer.files.length > 0) handleQueuedFiles(e.dataTransfer.files);
  };

  const handleSaveQueuedImages = async () => {
    if (queuedImages.length === 0) {
      setMediaStatus("No hay imágenes en la cola.");
      return;
    }

    setIsSavingQueuedImages(true);

    try {
      const formData = new FormData();
      formData.append("action", "upload");
      queuedImages.forEach((queuedImage) => {
        formData.append("files", queuedImage.file, queuedImage.name);
      });

      const res = await fetch(`/api/admin/regional-configurations/${detail.productCountryId}/images`, {
        method: "POST",
        body: formData,
      });

      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        data?: { images?: AdminRegionalProductImage[] };
      } | null;

      if (!res.ok) {
        throw new Error(payload?.error ?? "No se pudieron guardar las imágenes");
      }

      if (Array.isArray(payload?.data?.images)) {
        setImages(payload.data.images as AdminRegionalProductImage[]);
      }

      setQueuedImages((prev) => {
        prev.forEach((qi) => URL.revokeObjectURL(qi.previewUrl));
        return [];
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMediaStatus(
        queuedImages.length === 1
          ? "1 imagen guardada y publicada correctamente."
          : `${queuedImages.length} imágenes guardadas y publicadas correctamente.`,
      );
    } catch (error) {
      setMediaStatus(error instanceof Error ? error.message : "No se pudieron guardar las imágenes.");
    } finally {
      setIsSavingQueuedImages(false);
    }
  };

  const handleConfirmMediaAction = async () => {
    if (!mediaActionTarget) return;
    setMediaLoadingAction(mediaActionTarget.type);
    try {
      const res = await fetch(
        `/api/admin/regional-configurations/${detail.productCountryId}/images`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: mediaActionTarget.type, imageId: mediaActionTarget.image.id }),
        },
      );
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        data?: { images?: AdminRegionalProductImage[] };
      } | null;
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo actualizar la galería");
      if (Array.isArray(payload?.data?.images)) setImages(payload.data.images as AdminRegionalProductImage[]);
      setMediaStatus(
        mediaActionTarget.type === "promote"
          ? "La imagen principal se actualizó correctamente."
          : mediaActionTarget.image.isPrimary
          ? "Se eliminó la imagen principal y la siguiente pasó a ser la portada."
          : "La imagen se eliminó correctamente.",
      );
    } catch (err) {
      setMediaStatus(err instanceof Error ? err.message : "Error al actualizar la galería.");
    } finally {
      setMediaLoadingAction(null);
      setMediaActionTarget(null);
    }
  };

  // ---- render ----

  const statusBadgeStyle = (ok: boolean): React.CSSProperties => ({
    margin: "8px 0 0",
    color: ok ? "var(--color-primary-700, #0b5a3a)" : "var(--color-red-600, #dc2626)",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

      {/* ── SECCIÓN 1: Información comercial ── */}
      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        <SectionCard
          title="Información Comercial"
          subtitle="Datos de configuración de la ficha por país: slug, precio, URL de e-commerce."
          badge="Por país"
        >
          <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Slug</FieldLabel>
              <input style={{ ...inputStyle, fontFamily: "monospace" }} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-del-producto" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Precio</FieldLabel>
              <input style={inputStyle} type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Moneda</FieldLabel>
              <input style={inputStyle} value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="PEN" maxLength={5} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <FieldLabel>URL de e-commerce</FieldLabel>
            <input style={{ ...inputStyle, fontFamily: "monospace" }} value={ecommerceUrl} onChange={(e) => setEcommerceUrl(e.target.value)} placeholder="https://..." />
            <FieldHint>
              El ID externo se deriva automáticamente de la URL ({`?id=`} o {`#/?s=`}). No es necesario ingresarlo manualmente.
            </FieldHint>
          </div>

          {canToggle && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                Activo regionalmente
              </label>
              <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
                Controla si esta ficha aparece en el catálogo del país.
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveCommercial}
              disabled={isSavingCommercial}
            >
              {isSavingCommercial ? "Guardando..." : "Guardar información comercial"}
            </button>
          </div>
          {commercialStatus && (
            <p style={statusBadgeStyle(commercialStatus.ok)}>{commercialStatus.msg}</p>
          )}
        </SectionCard>
      </section>

      {/* ── SECCIÓN 2: Contenido por idioma ── */}
      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        {/* Language selector */}
        {detail.translations.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
            {detail.translations.map((t) => (
              <button
                key={t.languageCode}
                type="button"
                className="btn-primary"
                onClick={() => setActiveLanguageCode(t.languageCode)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: "0.85rem",
                  ...(activeLanguageCode === t.languageCode
                    ? {}
                    : {
                        background: "var(--color-white)",
                        color: "var(--color-neutral-900)",
                        border: "1px solid var(--color-neutral-300)",
                      }),
                }}
              >
                {t.languageName} ({t.languageCode.toUpperCase()})
              </button>
            ))}
          </div>
        )}

        {!currentDraft ? (
          <p style={{ color: "var(--color-neutral-500)" }}>
            No hay traducciones configuradas para este idioma.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

            {/* Información General */}
            <SectionCard title="Información General" subtitle="Nombre, descripción corta, introducción y texto largo.">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FieldLabel>Nombre del producto</FieldLabel>
                  <input style={inputStyle} value={currentDraft.name} onChange={(e) => updateDraft("name", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FieldLabel>Descripción corta</FieldLabel>
                  <textarea style={textareaStyle} value={currentDraft.shortDescription} onChange={(e) => updateDraft("shortDescription", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FieldLabel>Introducción</FieldLabel>
                  <textarea style={textareaStyle} value={currentDraft.intro} onChange={(e) => updateDraft("intro", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FieldLabel>Descripción larga</FieldLabel>
                  <textarea style={{ ...textareaStyle, minHeight: 180 }} value={currentDraft.longDescription} onChange={(e) => updateDraft("longDescription", e.target.value)} />
                </div>
              </div>
            </SectionCard>

            {/* Contenido */}
            <SectionCard title="Contenido" subtitle="Beneficios, aplicaciones, uso, restricciones y recomendaciones. Una línea por ítem.">
              <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
                {(
                  [
                    { field: "benefits", label: "Beneficios" },
                    { field: "applications", label: "Aplicaciones" },
                    { field: "usage", label: "Uso" },
                    { field: "restrictions", label: "Restricciones" },
                    { field: "recommendations", label: "Recomendaciones" },
                  ] as Array<{ field: Exclude<keyof TranslationDraft, "technicalInfo">; label: string }>
                ).map(({ field, label }) => (
                  <div key={field} style={{ gridColumn: "span 6", display: "flex", flexDirection: "column", gap: 8 }}>
                    <FieldLabel>{label}</FieldLabel>
                    <textarea
                      style={textareaStyle}
                      value={currentDraft[field] as string}
                      onChange={(e) => updateDraft(field, e.target.value)}
                    />
                    <FieldHint>Una línea por ítem. Se mostrará como lista en la ficha pública.</FieldHint>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Información Técnica */}
            <SectionCard title="Información Técnica" subtitle="Campos técnicos del producto. Cada campo se guarda como propiedad individual.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "var(--space-3)" }}>
                {TECH_INFO_FIELDS.map(({ key, label, wide }) => (
                  <div
                    key={key}
                    style={{ gridColumn: wide ? "span 12" : "span 6", display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <FieldLabel>{label}</FieldLabel>
                    <input
                      style={inputStyle}
                      value={currentDraft.technicalInfo[key] ?? ""}
                      onChange={(e) => updateTechField(key, e.target.value)}
                      placeholder={key}
                    />
                  </div>
                ))}

                {/* Extra keys not in the known list (e.g. legacy data) */}
                {Object.keys(currentDraft.technicalInfo)
                  .filter((k) => !TECH_INFO_KNOWN_KEYS.has(k))
                  .map((key) => (
                    <div key={key} style={{ gridColumn: "span 6", display: "flex", flexDirection: "column", gap: 6 }}>
                      <FieldLabel>
                        <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--color-neutral-500)" }}>{key}</span>
                      </FieldLabel>
                      <input
                        style={{ ...inputStyle, fontFamily: "monospace", fontSize: "0.875rem" }}
                        value={currentDraft.technicalInfo[key]}
                        onChange={(e) => updateTechField(key, e.target.value)}
                      />
                    </div>
                  ))}

                <div style={{ gridColumn: "span 12", display: "flex", flexDirection: "column", gap: 8 }}>
                  <FieldLabel>Video del producto</FieldLabel>
                  <input
                    style={inputStyle}
                    value={currentDraft.videoUrl}
                    onChange={(e) => updateDraft("videoUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </SectionCard>

            {/* SEO */}
            <SectionCard title="SEO" subtitle="Título, descripción y OG image para buscadores y redes.">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FieldLabel>Título SEO</FieldLabel>
                  <input style={inputStyle} value={currentDraft.seoTitle} onChange={(e) => updateDraft("seoTitle", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FieldLabel>Descripción SEO</FieldLabel>
                  <textarea style={textareaStyle} value={currentDraft.seoDescription} onChange={(e) => updateDraft("seoDescription", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FieldLabel>OG Image</FieldLabel>
                  <input style={{ ...inputStyle, fontFamily: "monospace" }} value={currentDraft.seoOgImage} onChange={(e) => updateDraft("seoOgImage", e.target.value)} placeholder="product-assets/.../preview.png" />
                </div>
              </div>
            </SectionCard>

            {/* Save translation */}
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center", padding: "0 2px" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveTranslation}
                disabled={isSavingTranslation}
              >
                {isSavingTranslation
                  ? "Guardando..."
                  : `Guardar contenido (${activeLanguageCode.toUpperCase()})`}
              </button>
              {translationStatus && (
                <p style={{ margin: 0, ...statusBadgeStyle(translationStatus.ok) }}>
                  {translationStatus.msg}
                </p>
              )}
            </div>

          </div>
        )}
      </section>

      {/* ── SECCIÓN 3: Medios ── */}
      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        <SectionCard
          title="Medios"
          subtitle="Portada, galería, cola de archivos y borrado controlado."
          badge={`${queuedImages.length} en cola`}
        >
          <div
            style={{
              display: "grid",
              gap: "var(--space-4)",
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.7fr)",
            }}
          >
            {/* Current images */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <FieldLabel>Imágenes actuales</FieldLabel>
                <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>La principal mantiene la portada visible.</span>
              </div>

              {images.length > 0 ? (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  {images.map((image) => (
                    <div
                      key={image.id}
                      style={{
                        position: "relative",
                        border: "1px solid var(--color-neutral-300)",
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "var(--color-white)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setMediaActionTarget({ type: "delete", image })}
                        aria-label="Eliminar imagen"
                        disabled={Boolean(mediaLoadingAction)}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          zIndex: 2,
                          width: 30,
                          height: 30,
                          borderRadius: 999,
                          border: "1px solid rgba(0,0,0,0.12)",
                          background: "rgba(255,255,255,0.94)",
                          color: "var(--color-neutral-900)",
                          fontSize: 18,
                          lineHeight: 1,
                          cursor: "pointer",
                          opacity: mediaLoadingAction ? 0.6 : 1,
                        }}
                      >
                        ×
                      </button>
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "4 / 3",
                          background: "var(--color-neutral-100)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.altText ?? detail.productSku}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          padding: "12px 12px 14px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          {image.isPrimary ? (
                            <span
                              className="btn-primary"
                              style={{ padding: "5px 8px", borderRadius: 999, fontSize: "0.72rem" }}
                            >
                              Principal
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{
                                padding: "5px 8px",
                                borderRadius: 999,
                                fontSize: "0.72rem",
                                background: "var(--color-white)",
                                color: "var(--color-neutral-900)",
                                border: "1px solid var(--color-neutral-300)",
                              }}
                              onClick={() => {
                                const targetImage = images.find((img) => img.id === image.id);
                                if (targetImage) setMediaActionTarget({ type: "promote", image: targetImage });
                              }}
                              disabled={Boolean(mediaLoadingAction)}
                            >
                              Marcar principal
                            </button>
                          )}
                          <span style={{ fontSize: "0.8rem", color: "var(--color-neutral-700)" }}>
                            Orden {image.sortOrder + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed var(--color-neutral-300)",
                    borderRadius: 16,
                    padding: 18,
                    color: "var(--color-neutral-600)",
                  }}
                >
                  Todavía no hay imágenes guardadas.
                </div>
              )}
            </div>

            {/* Upload queue */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDropzoneActive(true); }}
                onDragLeave={() => setDropzoneActive(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                style={{
                  minHeight: 280,
                  border: `1.5px dashed ${dropzoneActive ? "var(--color-primary-700)" : "var(--color-neutral-300)"}`,
                  borderRadius: 18,
                  background: dropzoneActive
                    ? "rgba(15, 118, 74, 0.05)"
                    : "var(--color-neutral-50)",
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 14,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <strong style={{ fontSize: "1rem" }}>Arrastra imágenes aquí</strong>
                  <p style={{ margin: 0, color: "var(--color-neutral-600)", lineHeight: 1.45 }}>
                    Suelta una o varias imágenes para crear una cola previa. También puedes hacer
                    clic para abrir el selector de archivos.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px solid var(--color-neutral-300)",
                      background: "var(--color-white)",
                      padding: 14,
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: 4 }}>Cola previa</strong>
                    <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>
                      {queuedImages.length > 0
                        ? `${queuedImages.length} archivo${queuedImages.length === 1 ? "" : "s"} listo${queuedImages.length === 1 ? "" : "s"} para guardar.`
                        : "Todavía no has agregado archivos."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: "100%", background: "var(--color-primary-700)" }}
                    onClick={(e) => { e.stopPropagation(); handleSaveQueuedImages(); }}
                    disabled={Boolean(mediaLoadingAction || isSavingQueuedImages)}
                  >
                    {isSavingQueuedImages
                      ? "Guardando..."
                      : queuedImages.length === 1
                      ? "Guardar imagen"
                      : "Guardar imágenes"}
                  </button>
                </div>
              </div>

              {queuedImages.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <strong style={{ fontSize: "0.875rem" }}>Archivos en cola</strong>
                  {queuedImages.map((qi) => (
                    <div
                      key={qi.id}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        border: "1px solid var(--color-neutral-300)",
                        borderRadius: 14,
                        padding: 10,
                        background: "var(--color-white)",
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 12,
                          overflow: "hidden",
                          background: "var(--color-neutral-100)",
                          flexShrink: 0,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qi.previewUrl}
                          alt={qi.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>
                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "0.875rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {qi.name}
                        </strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
                          {humanFileSize(qi.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label="Quitar archivo de la cola"
                        onClick={() => {
                          setQueuedImages((prev) => {
                            const removed = prev.find((item) => item.id === qi.id);
                            if (removed) URL.revokeObjectURL(removed.previewUrl);
                            return prev.filter((item) => item.id !== qi.id);
                          });
                        }}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 999,
                          border: "1px solid rgba(0,0,0,0.12)",
                          background: "var(--color-white)",
                          cursor: "pointer",
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {mediaStatus && (
            <p style={{ margin: "8px 0 0", color: "var(--color-neutral-600)" }}>{mediaStatus}</p>
          )}
        </SectionCard>
      </section>

      {/* ── Confirmation modal ── */}
      {mediaActionTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 50,
          }}
          onClick={() => setMediaActionTarget(null)}
        >
          <div
            style={{
              width: "min(100%, 440px)",
              background: "var(--color-white)",
              borderRadius: 18,
              border: "1px solid var(--color-neutral-300)",
              padding: 20,
              boxShadow: "0 24px 72px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
              {mediaActionTarget.type === "delete"
                ? "¿Desea remover esta imagen?"
                : "¿Desea marcar esta imagen como principal?"}
            </h3>
            <p style={{ margin: "10px 0 0", color: "var(--color-neutral-600)" }}>
              {mediaActionTarget.type === "delete"
                ? "Se quitará de la galería visible y el orden se compactará automáticamente."
                : "La imagen pasará a ser la portada y la galería se reordenará para mantener una sola principal."}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="btn-primary"
                style={{
                  background: "var(--color-white)",
                  color: "var(--color-neutral-900)",
                  border: "1px solid var(--color-neutral-300)",
                }}
                onClick={() => setMediaActionTarget(null)}
                disabled={Boolean(mediaLoadingAction)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{
                  background:
                    mediaActionTarget.type === "delete"
                      ? "var(--color-red-600, #dc2626)"
                      : "var(--color-primary-700)",
                }}
                onClick={handleConfirmMediaAction}
                disabled={Boolean(mediaLoadingAction)}
              >
                {mediaLoadingAction
                  ? "Actualizando..."
                  : mediaActionTarget.type === "delete"
                  ? "Remover imagen"
                  : "Marcar principal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading overlay for media actions ── */}
      {mediaLoadingAction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.55)",
            zIndex: 45,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 220,
              borderRadius: 16,
              border: "1px solid var(--color-neutral-300)",
              background: "var(--color-white)",
              padding: 16,
              boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                margin: "0 auto 10px",
                borderRadius: "50%",
                border: "3px solid var(--color-neutral-200)",
                borderTopColor: "var(--color-primary-700)",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <strong style={{ display: "block", fontSize: "0.95rem" }}>Actualizando imágenes</strong>
            <p style={{ margin: "6px 0 0", color: "var(--color-neutral-600)" }}>
              Espera un momento.
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => { if (e.target.files) handleQueuedFiles(e.target.files); e.target.value = ""; }}
        style={{ display: "none" }}
      />
    </div>
  );
}
