"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductDetail, ProductImage } from "@/modules/product/product.types.ts";

type QueuedImage = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
};

type ImageRemovalTarget = ProductImage;

type MediaActionTarget = {
  type: "promote" | "delete";
  image: ProductImage;
};

function formatList(value: string[] | null | undefined): string {
  return value && value.length > 0 ? value.join("\n") : "";
}

function formatRecord(value: Record<string, unknown> | null | undefined): string {
  if (!value) {
    return "";
  }

  return Object.entries(value)
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join("\n");
}

function compactImages(images: ProductImage[]) {
  return images.map((image, index) => ({
    ...image,
    sortOrder: index,
    isPrimary: index === 0,
  }));
}

function humanFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function makeQueuedImage(file: File): QueuedImage {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
  };
}

type AdminProductDetailEditorProps = {
  product: ProductDetail;
};

export function AdminProductDetailEditor({ product }: AdminProductDetailEditorProps) {
  const [name, setName] = useState(product.name);
  const [intro, setIntro] = useState(product.intro ?? "");
  const [longDescription, setLongDescription] = useState(product.longDescription ?? "");
  const [benefits, setBenefits] = useState(formatList(product.benefits));
  const [applications, setApplications] = useState(formatList(product.applications));
  const [usage, setUsage] = useState(formatList(product.usage));
  const [restrictions, setRestrictions] = useState(formatList(product.restrictions));
  const [recommendations, setRecommendations] = useState(formatList(product.recommendations));
  const [technicalInfo, setTechnicalInfo] = useState(formatRecord(product.technicalInfo));
  const [videoUrl, setVideoUrl] = useState(product.videoUrl ?? "");
  const [seoTitle, setSeoTitle] = useState(product.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(product.seoDescription ?? "");
  const [seoOgImage, setSeoOgImage] = useState(product.seoOgImage ?? "");
  const [images, setImages] = useState<ProductImage[]>(() => compactImages([...product.images]));
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [mediaActionTarget, setMediaActionTarget] = useState<MediaActionTarget | null>(null);
  const [mediaLoadingAction, setMediaLoadingAction] = useState<MediaActionTarget["type"] | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queuedImagesRef = useRef<QueuedImage[]>([]);

  useEffect(() => {
    queuedImagesRef.current = queuedImages;
  }, [queuedImages]);

  useEffect(() => {
    return () => {
      queuedImagesRef.current.forEach((queuedImage) => URL.revokeObjectURL(queuedImage.previewUrl));
    };
  }, []);

  const handleQueuedFiles = (fileList: FileList | File[]) => {
    const nextQueuedImages = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => makeQueuedImage(file));

    if (nextQueuedImages.length === 0) {
      setStatusMessage("Selecciona al menos una imagen válida.");
      return;
    }

    setQueuedImages((currentQueuedImages) => [...currentQueuedImages, ...nextQueuedImages]);
    setStatusMessage(`Se agregaron ${nextQueuedImages.length} imagen${nextQueuedImages.length === 1 ? "" : "es"} a la cola.`);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleQueuedFiles(event.target.files);
    }

    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropzoneActive(false);

    if (event.dataTransfer.files.length > 0) {
      handleQueuedFiles(event.dataTransfer.files);
    }
  };

  const handleSaveDetails = () => {
    setStatusMessage("Cambios de la ficha guardados en la sesión actual.");
  };

  const handleSaveImages = () => {
    if (queuedImages.length === 0) {
      setStatusMessage("No hay imágenes nuevas por guardar.");
      return;
    }

    setImages((currentImages) => {
      const baseIndex = currentImages.length;
      const appendedImages: ProductImage[] = queuedImages.map((queuedImage, index) => ({
        id: queuedImage.id,
        url: queuedImage.previewUrl,
        altText: queuedImage.name,
        sortOrder: baseIndex + index,
        isPrimary: currentImages.length === 0 && index === 0,
      }));

      return currentImages.length > 0 ? [...currentImages, ...appendedImages] : appendedImages;
    });

    setQueuedImages((currentQueuedImages) => {
      currentQueuedImages.forEach((queuedImage) => URL.revokeObjectURL(queuedImage.previewUrl));
      return [];
    });

    setStatusMessage(`Se guardó ${queuedImages.length === 1 ? "1 imagen" : `${queuedImages.length} imágenes`} en la sesión actual.`);
  };

  const handleConfirmMediaAction = async () => {
    if (!mediaActionTarget) {
      return;
    }

    setMediaLoadingAction(mediaActionTarget.type);

    try {
      const response = await fetch(`/api/admin/products/${product.id}/images`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: mediaActionTarget.type,
          countryCode: product.country,
          imageId: mediaActionTarget.image.id,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; data?: { images?: ProductImage[] } } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo actualizar la galería");
      }

      if (Array.isArray(payload?.data?.images)) {
        setImages(payload.data.images);
      }

      if (mediaActionTarget.type === "promote") {
        setStatusMessage("La imagen principal se actualizó correctamente.");
      } else if (mediaActionTarget.image.isPrimary) {
        setStatusMessage("Se eliminó la imagen principal y la siguiente imagen pasó a ser la portada.");
      } else {
        setStatusMessage("La imagen se eliminó correctamente.");
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "No se pudo actualizar la galería.");
    } finally {
      setMediaLoadingAction(null);
      setMediaActionTarget(null);
    }
  };

  const handleSetPrimary = (imageId: string) => {
    const targetImage = images.find((image) => image.id === imageId);

    if (!targetImage) {
      return;
    }

    setMediaActionTarget({ type: "promote", image: targetImage });
  };

  const mediaButtonLabel = queuedImages.length > 1 ? "Guardar imágenes" : "Guardar imagen";

  const contentFields: Array<{
    id: string;
    label: string;
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
  }> = [
    { id: "beneficios", label: "Beneficios", value: benefits, setValue: setBenefits },
    { id: "applications", label: "Aplicaciones", value: applications, setValue: setApplications },
    { id: "usage", label: "Uso", value: usage, setValue: setUsage },
    { id: "restrictions", label: "Restricciones", value: restrictions, setValue: setRestrictions },
    { id: "recommendations", label: "Recomendaciones", value: recommendations, setValue: setRecommendations },
  ];

  return (
    <section style={{ background: "rgba(255,255,255,0.92)", border: "1px solid var(--color-neutral-300)", borderRadius: 20, padding: "var(--space-4)", boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)" }}>
      <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", alignItems: "start" }}>
        <article style={{ gridColumn: "span 8", background: "var(--color-white)", border: "1px solid var(--color-neutral-300)", borderRadius: 18, padding: "var(--space-4)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Información general</h2>
              <p style={{ margin: "4px 0 0", color: "var(--color-neutral-600)" }}>Nombre, narrativa comercial y texto base de la ficha.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>Nombre del producto</label>
              <input style={{ width: "100%", border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)" }} value={name} onChange={(event) => setName(event.target.value)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>Introducción</label>
              <textarea style={{ width: "100%", minHeight: 120, border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)", resize: "vertical" }} value={intro} onChange={(event) => setIntro(event.target.value)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>Descripción comercial</label>
              <textarea style={{ width: "100%", minHeight: 120, border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)", resize: "vertical" }} value={longDescription} onChange={(event) => setLongDescription(event.target.value)} />
            </div>
          </div>
        </article>

        <article style={{ gridColumn: "span 4", background: "var(--color-white)", border: "1px solid var(--color-neutral-300)", borderRadius: 18, padding: "var(--space-4)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Resumen comercial</h2>
              <p style={{ margin: "4px 0 0", color: "var(--color-neutral-600)" }}>Vista rápida del producto por país.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "linear-gradient(135deg, rgba(15, 118, 74, 0.08), rgba(15, 118, 74, 0.03))", border: "1px solid rgba(15, 118, 74, 0.18)", borderRadius: 14, padding: "12px 14px" }}>
              <strong style={{ display: "block", fontSize: "0.875rem" }}>País</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-neutral-700)", lineHeight: 1.35 }}>{product.country.toUpperCase()} · {product.countryName}</p>
            </div>

            {[
              ["Código de producto", product.sku],
              ["Valor comercial", `${product.currency} ${product.price.toFixed(2)}`],
              ["Estado de publicación", product.isActive ? "Activo" : "Inactivo"],
            ].map(([label, value]) => (
              <div key={label} style={{ background: "var(--color-neutral-100)", border: "1px solid var(--color-neutral-300)", borderRadius: 14, padding: "12px 14px", minHeight: 64 }}>
                <strong style={{ display: "block", fontSize: "0.875rem" }}>{label}</strong>
                <p style={{ margin: "6px 0 0", color: "var(--color-neutral-600)", lineHeight: 1.35 }}>{value}</p>
              </div>
            ))}
          </div>
        </article>

        <article style={{ position: "relative", gridColumn: "span 12", background: "var(--color-white)", border: "1px solid var(--color-neutral-300)", borderRadius: 18, padding: "var(--space-4)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Información complementaria</h2>
              <p style={{ margin: "4px 0 0", color: "var(--color-neutral-600)" }}>Contenido enriquecido, dato técnico y vídeo del producto.</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
            {contentFields.map((field) => (
              <div key={field.id} style={{ gridColumn: "span 6", display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>{field.label}</label>
                <textarea
                  style={{ width: "100%", minHeight: 120, border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)", resize: "vertical" }}
                  value={field.value}
                  onChange={(event) => field.setValue(event.target.value)}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>Una línea por ítem. Se mostrará como lista en la ficha pública.</span>
              </div>
            ))}

            <div style={{ gridColumn: "span 12", display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>Información técnica</label>
              <textarea style={{ width: "100%", minHeight: 180, border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)", resize: "vertical" }} value={technicalInfo} onChange={(event) => setTechnicalInfo(event.target.value)} />
            </div>

            <div style={{ gridColumn: "span 12", display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>Video del producto</label>
              <input style={{ width: "100%", border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)" }} value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://..." />
              <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>Lo mantenemos fuera de SEO para no mezclarlo con los metadatos de buscador.</span>
            </div>
          </div>
        </article>

        <article style={{ gridColumn: "span 12", background: "var(--color-white)", border: "1px solid var(--color-neutral-300)", borderRadius: 18, padding: "var(--space-4)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>SEO</h2>
              <p style={{ margin: "4px 0 0", color: "var(--color-neutral-600)" }}>Título, descripción y OG image para buscadores y redes.</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
            <div style={{ gridColumn: "span 12", display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>Título SEO</label>
              <input style={{ width: "100%", border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)" }} value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
            </div>

            <div style={{ gridColumn: "span 12", display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>Descripción SEO</label>
              <textarea style={{ width: "100%", minHeight: 120, border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)", resize: "vertical" }} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} />
            </div>

            <div style={{ gridColumn: "span 12", display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>OG image</label>
              <input style={{ width: "100%", border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)" }} value={seoOgImage} onChange={(event) => setSeoOgImage(event.target.value)} placeholder="product-assets/.../preview.png" />
            </div>
          </div>
        </article>

        <article style={{ gridColumn: "span 12", background: "var(--color-white)", border: "1px solid var(--color-neutral-300)", borderRadius: 18, padding: "var(--space-4)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Medios</h2>
              <p style={{ margin: "4px 0 0", color: "var(--color-neutral-600)" }}>Portada, galería, cola de archivos y borrado controlado.</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className="btn-primary" style={{ padding: "6px 10px", borderRadius: 999, fontSize: "0.75rem", background: "var(--color-white)", color: "var(--color-neutral-900)", border: "1px solid var(--color-neutral-300)" }}>{queuedImages.length} en cola</span>
            </div>
          </div>

          <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.7fr)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}>Imágenes actuales</label>
                <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>Reordena al borrar. La principal mantiene la portada visible.</span>
              </div>

              {images.length > 0 ? (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  {images.map((image) => (
                    <div key={image.id} style={{ position: "relative", border: "1px solid var(--color-neutral-300)", borderRadius: 14, overflow: "hidden", background: "var(--color-white)" }}>
                      <button
                        type="button"
                        onClick={() => setMediaActionTarget({ type: "delete", image })}
                        aria-label="Eliminar imagen"
                        disabled={Boolean(mediaLoadingAction)}
                        style={{ position: "absolute", top: 10, right: 10, zIndex: 2, width: 30, height: 30, borderRadius: 999, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.94)", color: "var(--color-neutral-900)", fontSize: 18, lineHeight: 1, cursor: "pointer", opacity: mediaLoadingAction ? 0.6 : 1 }}
                      >
                        ×
                      </button>

                      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "var(--color-neutral-100)" }}>
                        <img src={image.url} alt={image.altText ?? name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          {image.isPrimary ? (
                            <span className="btn-primary" style={{ padding: "5px 8px", borderRadius: 999, fontSize: "0.72rem" }}>Principal</span>
                          ) : (
                            <button type="button" className="btn-primary" style={{ padding: "5px 8px", borderRadius: 999, fontSize: "0.72rem", background: "var(--color-white)", color: "var(--color-neutral-900)", border: "1px solid var(--color-neutral-300)" }} onClick={() => handleSetPrimary(image.id)} disabled={Boolean(mediaLoadingAction)}>
                              Marcar principal
                            </button>
                          )}
                          <span style={{ fontSize: "0.8rem", color: "var(--color-neutral-700)" }}>Orden {image.sortOrder + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ border: "1px dashed var(--color-neutral-300)", borderRadius: 16, padding: 18, color: "var(--color-neutral-600)" }}>Todavía no hay imágenes guardadas.</div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropzoneActive(true);
                }}
                onDragLeave={() => setDropzoneActive(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                style={{
                  minHeight: 280,
                  border: `1.5px dashed ${dropzoneActive ? "var(--color-primary-700)" : "var(--color-neutral-300)"}`,
                  borderRadius: 18,
                  background: dropzoneActive ? "rgba(15, 118, 74, 0.05)" : "var(--color-neutral-50)",
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
                  <p style={{ margin: 0, color: "var(--color-neutral-600)", lineHeight: 1.45 }}>Suelta una o varias imágenes para crear una cola previa. También puedes hacer clic para abrir el selector de archivos.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ borderRadius: 14, border: "1px solid var(--color-neutral-300)", background: "var(--color-white)", padding: 14 }}>
                    <strong style={{ display: "block", marginBottom: 4 }}>Cola previa</strong>
                    <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>{queuedImages.length > 0 ? `${queuedImages.length} archivo${queuedImages.length === 1 ? "" : "s"} listo${queuedImages.length === 1 ? "" : "s"} para guardar.` : "Todavía no has agregado archivos."}</p>
                  </div>

                  <button type="button" className="btn-primary" style={{ width: "100%", background: "var(--color-primary-700)" }} onClick={handleSaveImages} disabled={Boolean(mediaLoadingAction)}>
                    {mediaButtonLabel}
                  </button>
                </div>
              </div>

              {queuedImages.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <strong style={{ fontSize: "0.875rem" }}>Archivos en cola</strong>
                  {queuedImages.map((queuedImage) => (
                    <div key={queuedImage.id} style={{ display: "flex", gap: 12, alignItems: "center", border: "1px solid var(--color-neutral-300)", borderRadius: 14, padding: 10, background: "var(--color-white)" }}>
                      <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", background: "var(--color-neutral-100)", flexShrink: 0 }}>
                        <img src={queuedImage.previewUrl} alt={queuedImage.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        <strong style={{ fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{queuedImage.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>{humanFileSize(queuedImage.size)}</span>
                      </div>

                      <button
                        type="button"
                        aria-label="Quitar archivo de la cola"
                        onClick={() => {
                          setQueuedImages((currentQueuedImages) => {
                            const nextQueuedImages = currentQueuedImages.filter((item) => item.id !== queuedImage.id);
                            const removedItem = currentQueuedImages.find((item) => item.id === queuedImage.id);

                            if (removedItem) {
                              URL.revokeObjectURL(removedItem.previewUrl);
                            }

                            return nextQueuedImages;
                          });
                        }}
                        style={{ width: 30, height: 30, borderRadius: 999, border: "1px solid rgba(0,0,0,0.12)", background: "var(--color-white)", cursor: "pointer", lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </article>

        <article style={{ gridColumn: "span 12", background: "var(--color-white)", border: "1px solid var(--color-neutral-300)", borderRadius: 18, padding: "var(--space-4)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Acciones</h2>
              <p style={{ margin: "4px 0 0", color: "var(--color-neutral-600)" }}>El guardado de la ficha es independiente del guardado de medios.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <button type="button" className="btn-primary" style={{ background: "var(--color-primary-700)" }} onClick={handleSaveDetails}>Guardar cambios</button>
            <button type="button" className="btn-primary" style={{ background: "var(--color-white)", color: "var(--color-neutral-900)", border: "1px solid var(--color-neutral-300)" }} onClick={() => setStatusMessage("Los cambios quedan en memoria hasta conectar persistencia.")}>Revisar después</button>
          </div>

          {statusMessage ? <p style={{ margin: "12px 0 0", color: "var(--color-neutral-600)" }}>{statusMessage}</p> : null}
        </article>
      </div>

      {mediaActionTarget ? (
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
            style={{ width: "min(100%, 440px)", background: "var(--color-white)", borderRadius: 18, border: "1px solid var(--color-neutral-300)", padding: 20, boxShadow: "0 24px 72px rgba(0,0,0,0.25)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
              {mediaActionTarget.type === "delete" ? "¿Desea remover esta imagen?" : "¿Desea marcar esta imagen como principal?"}
            </h3>
            <p style={{ margin: "10px 0 0", color: "var(--color-neutral-600)" }}>
              {mediaActionTarget.type === "delete"
                ? "Se quitará de la galería visible y el orden se compactará automáticamente."
                : "La imagen pasará a ser la portada y la galería se reordenará para mantener una sola principal."}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button type="button" className="btn-primary" style={{ background: "var(--color-white)", color: "var(--color-neutral-900)", border: "1px solid var(--color-neutral-300)" }} onClick={() => setMediaActionTarget(null)} disabled={Boolean(mediaLoadingAction)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" style={{ background: mediaActionTarget.type === "delete" ? "var(--color-red-600, #dc2626)" : "var(--color-primary-700)" }} onClick={handleConfirmMediaAction} disabled={Boolean(mediaLoadingAction)}>
                {mediaLoadingAction ? "Actualizando..." : mediaActionTarget.type === "delete" ? "Remover imagen" : "Marcar principal"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mediaLoadingAction ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255, 255, 255, 0.55)", zIndex: 45, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <div style={{ width: 220, borderRadius: 16, border: "1px solid var(--color-neutral-300)", background: "var(--color-white)", padding: 16, boxShadow: "0 18px 40px rgba(0,0,0,0.12)", textAlign: "center" }}>
            <div style={{ width: 28, height: 28, margin: "0 auto 10px", borderRadius: "50%", border: "3px solid var(--color-neutral-200)", borderTopColor: "var(--color-primary-700)", animation: "spin 0.8s linear infinite" }} />
            <strong style={{ display: "block", fontSize: "0.95rem" }}>Actualizando imágenes</strong>
            <p style={{ margin: "6px 0 0", color: "var(--color-neutral-600)" }}>Espera un momento.</p>
          </div>
        </div>
      ) : null}

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInputChange} style={{ display: "none" }} />
    </section>
  );
}