Voy a revisar el nuevo archivo en formato markdown para ajustar el diagnóstico y después te entrego la matriz de riesgos por fase separando negocio y técnico, con mitigaciones accionables desde ya para arrancar Fase 1 sin fricción.

Read [](file:///d%3A/Repos/2-Colaboracion/repo-tiens/Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md)

Voy a precisar algunos puntos del documento con referencias de línea para que la actualización del análisis quede objetiva y trazable antes de pasar a la matriz.

Ran terminal command: $p='d:\Repos\2-Colaboracion\repo-tiens\Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md'; Select-String -Path $p -Pattern '3.2. Stack|3.4. Infraestructura|Fase 1:|Fase 2:|Tiempo Total Fase 1|Tiempo Total Fase 2|FASE 2\s+Implementación de base de datos|Deploy en ambiente de desarrollo|Despliegue en ambiente de producción|No incluye CMS|Hasta 2 rondas de ajustes incluidos' -SimpleMatch | ForEach-Object { "{0}:{1}: {2}" -f $_.Path.Substring((Get-Location).Path.Length+1), $_.LineNumber, $_.Line.Trim() }

Ran terminal command: $p='d:\Repos\2-Colaboracion\repo-tiens\Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md'; Select-String -Path $p -Pattern '3.2. Stack','3.4. Infraestructura','Fase 1:','Fase 2:','Tiempo Total Fase 1','Tiempo Total Fase 2','FASE 2	Implementación de base de datos','Deploy en ambiente de desarrollo','Despliegue en ambiente de producción','No incluye CMS','Hasta 2 rondas de ajustes incluidos' | Format-Table LineNumber,Line -AutoSize | Out-String

**Actualización del análisis con el nuevo documento**
Revisé el contenido completo en Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md y sí hay ajustes importantes respecto al análisis anterior.

Cambios y hallazgos clave:
1. El alcance comercial está más claro y usable para gestión del proyecto.
2. Se confirma enfoque de reutilización (no construir desde cero), lo cual reduce riesgo de calendario.
3. Se formaliza que Fase 1 usa datos mock/JSON y Fase 2 pasa a BD + admin.
4. Hay inconsistencias que conviene corregir antes de ejecutar:
1. En Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md se plantean opciones de hosting, pero en Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md ya se define Vercel + DigitalOcean.
2. En Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md Fase 1 dice deploy en desarrollo, pero en Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md aparece despliegue en producción.
3. La tabla de tiempos de Fase 2 está duplicada/arrastrada de Fase 1 y además contradice el detalle de solo 2 días para BD en Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md y Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md.
4. El compromiso de “hasta 2 rondas de ajustes” está explícito y es buen control de alcance en Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md.

---

**Matriz de riesgos y mitigaciones por fase (negocio + técnico)**

**Fase 1: Landing + Detalle + Redirección**

| ID | Tipo | Riesgo | Probabilidad | Impacto | Mitigación | Disparador/Indicador |
|---|---|---|---|---|---|---|
| F1-R1 | Negocio | Retraso por entrega tardía de textos/imágenes/links | Alta | Alta | Checklist de insumos con fecha límite y responsable cliente; congelar alcance de contenido por sprint | Faltan assets 48h antes de QA |
| F1-R2 | Negocio | Mensaje comercial débil para tráfico Meta | Media | Alta | Definir plantilla mínima de copy por producto (hero, beneficios, CTA) y validarla previo desarrollo | CTR bajo en pruebas internas |
| F1-R3 | Negocio | Cambios de alcance fuera de 2 iteraciones | Alta | Alta | Proceso formal de change request con impacto en plazo/costo | Solicitudes nuevas post UAT |
| F1-R4 | Negocio | Desalineación con dominio destino (vivetiens/tienslar) | Media | Media | Definir desde inicio dominio de pruebas y dominio objetivo final con DNS plan | Bloqueos de QA por URL final |
| F1-R5 | Técnico | Redirecciones rotas o links de compra inválidos | Media | Alta | Validación automatizada de links y fallback visible al usuario | Errores 404/5xx en click compra |
| F1-R6 | Técnico | SEO y performance insuficientes en mobile | Media | Alta | SSR, optimización de imágenes, budgets de Core Web Vitals y pruebas Lighthouse móvil | LCP/CLS fuera de umbral |
| F1-R7 | Técnico | Inconsistencia de rutas multipaís | Media | Alta | Convención única de rutas por país, validación de country code y defaults | URLs inconsistentes entre campañas |
| F1-R8 | Técnico | Dependencia excesiva de proyecto base heredado | Media | Media | Auditoría rápida del baseline y refactor mínimo de riesgos críticos antes de construir | Bugs heredados bloquean avance |
| F1-R9 | Técnico | Falta de trazabilidad de eventos de conversión | Media | Media | Instrumentar eventos mínimos: view_product, click_buy, campaign_source | No hay datos para atribución |
| F1-R10 | Técnico | Falta de criterios de aceptación claros para entrega | Media | Alta | Definir DoD por pantalla y por dispositivo antes de desarrollo | Rechazo de entregable en demo |

**Fase 2: Mantenedor + BD + API + Storage + Multi-país v2**

| ID | Tipo | Riesgo | Probabilidad | Impacto | Mitigación | Disparador/Indicador |
|---|---|---|---|---|---|---|
| F2-R1 | Negocio | Subestimación de esfuerzo real de Fase 2 | Alta | Alta | Reestimar con WBS técnico y backlog priorizado; separar MVP admin de extras | Desviación >20% en semana 1 |
| F2-R2 | Negocio | Expectativas no alineadas sobre seguridad del admin | Media | Alta | Documento de alcance de seguridad (auth, roles, auditoría, backups) firmado | Cambios de requisito de seguridad tardíos |
| F2-R3 | Negocio | Dependencia de aprobación infraestructura/credenciales | Media | Alta | Hito temprano de accesos: BD, storage, DNS, secretos | Bloqueo de ambientes por permisos |
| F2-R4 | Negocio | Aprobaciones lentas de contenido por país | Alta | Media | Flujo editorial simple con estados borrador/publicado y responsable por país | Publicaciones retrasadas |
| F2-R5 | Técnico | Vulnerabilidades en API admin (sin validación/rbac) | Media | Muy alta | Validación estricta de payload, auth robusta, autorización por rol y rate limiting | Hallazgos en pruebas de seguridad |
| F2-R6 | Técnico | Inconsistencia entre modelo de datos y seed/migraciones | Alta | Alta | Estandarizar tipos (UUID), migraciones versionadas y seed compatible | Fallos al levantar entornos |
| F2-R7 | Técnico | Fallos en carga de imágenes a storage | Media | Alta | Upload firmado, validación de tipo/tamaño y reintentos | Errores frecuentes en carga |
| F2-R8 | Técnico | Degradación de performance en consultas catálogo | Media | Alta | Índices, paginación, queries optimizadas y monitoreo DB | Tiempo de respuesta > p95 objetivo |
| F2-R9 | Técnico | Falta de observabilidad operativa | Media | Alta | Logging estructurado, métricas API, alertas y dashboard básico | Incidentes sin diagnóstico |
| F2-R10 | Técnico | Deploy/rollback frágil en productivo | Media | Alta | Pipeline con ambientes separados, smoke tests y plan de rollback | Fallo en release sin rollback |
| F2-R11 | Técnico | Integración de ruta final con tienslar no estable | Media | Alta | Pruebas tempranas de reverse proxy y routing rules | 404/loops en integración |
| F2-R12 | Técnico | Datos multilenguaje incompletos en admin | Media | Media | Reglas de obligatoriedad por idioma y fallback de visualización | Landing muestra campos vacíos |

---

**Ajuste de criterio para pasar a Fase 1 (recomendado)**
1. Cerrar una versión final del alcance Fase 1: deploy en desarrollo o producción, no ambos.
2. Corregir la tabla de tiempos de Fase 2 para evitar ambigüedad contractual.
3. Acordar paquete mínimo de contenidos por producto y fecha de entrega.
4. Definir KPIs de Fase 1: tiempo de carga móvil, CTR hacia e-commerce y tasa de rebote.
5. Aprobar formalmente la matriz de riesgos como baseline de seguimiento semanal.

No hice cambios de código ni de archivos, solo análisis y matriz como pediste.

Si te parece, el siguiente paso es arrancar directamente con el plan operativo de Fase 1 en formato ejecutable: backlog por día, entregables, criterios de aceptación y orden de implementación de landing + detalle.
