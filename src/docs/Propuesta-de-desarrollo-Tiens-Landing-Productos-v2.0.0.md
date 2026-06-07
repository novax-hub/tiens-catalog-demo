
 
Contenido
1.	Contexto del Negocio	2
2.	Objetivo	2
3.	Propuesta Técnica	2
4.	Estructura de la Landing	4
5.	Estrategia de Desarrollo	5
6.	Alcance del Proyecto	5
7.	Estimación de Tiempo	7
8.	Inversión	7
9.	Consideraciones	7
10.	Cierre	8
11.	Condiciones Generales	8
12.	Contacto	8

 
1.	Contexto del Negocio
El cliente Tiens es una multinacional presente en diversos países a través de más de 100 sucursales alrededor del mundo. Cuenta con distintas líneas de productos como Suplementos Nutricionales, Equipos para el cuidado de la salud, entre otros.
Actualmente, en las sucursales de Perú, se busca mejorar la conversión de campañas digitales (Meta Ads), llevando a los usuarios a una experiencia más clara, visual y orientada a compra.
Situación actual:
•	El e-commerce existente no está optimizado para conversión directa.
•	Las páginas de producto son funcionales, pero no comerciales.
•	El tráfico de campañas requiere una experiencia más directa y persuasiva.
Actualmente se requiere una solución que permita:
•	Mostrar productos de forma atractiva para usuarios finales
•	Redirigir al e-commerce B2C existente
•	Adaptar contenido por país (precio, imágenes, descripción)
•	Escalar a múltiples países y productos
•	Medir interacción y conversión de usuarios
Adicionalmente, esta solución se proyecta como base para futuras iniciativas digitales (BI, integración con web principal, expansión regional).

2.	Objetivo
Desarrollar una plataforma de landing page de productos escalable, que permita: 
•	Gestionar contenido por país
•	Optimizar conversión de campañas
•	Centralizar catálogo de productos
•	Preparar base para analítica (BI) 

3.	Propuesta Técnica
3.1. Enfoque
Se desarrollará:
•	Una landing page reutilizando un proyecto base existente para acelerar tiempos.
•	Un mantenedor backoffice para gestionar el contenido de la landing page reutilizando un proyecto base existente para acelerar tiempos.
•	Un API REST para exponer los endpoints que requiere el mantenedor para ejecutar la gestión de contenido y garantizar la seguridad de la aplicación.
•	La implementación de una base de datos relacional para el almacenamiento de la información de productos y garantizar la escalabilidad de la solución.
Consideraciones:
•	No se desarrollará desde cero
•	Se optimizará lo ya construido
3.2. Stack
Frontend:
•	Framework: Next.js (basado en React)
•	Render: SSR / SSG (alto performance)
•	Hosting: On Premise, Digitalocean o Microsoft Azure
Bakend
•	Framework: Next.js
•	Arquitectura: Servicio basado en API REST
•	Hosting: Digitalocean
Base de Datos y Storage: 
•	PostgreSQL 
•	Almacenamiento externo de imágenes en Digitalocean Spaces

3.3. Arquitectura
La arquitectura de la solución debe tomar en cuenta:
•	Integración entre Meta y Landing Page
•	Integración entre Landing Page y el e-commerce
•	Administrador
•	Roles y permisos
•	Almacenamiento de imágenes
•	Soporte multi país
•	Soporte multi idioma
•	Base SEO
•	Base para analítica de datos
•	Base para métricas de interacción de usuarios
En base al análisis de los requerimientos, necesidad de desarrollo rápido, así como en la volumetría estimada y escalabilidad de la solución. Se propone lo siguiente:
Se propone un monolito modular limpio y escalable preparado para desacoplar servicios a futuro si el sistema crece o requiere mayor escalabilidad
 

3.4. Infraestructura:
Se propone:
•	Hosting: Vercel 
•	Base de datos: PostgreSQL (cloud) en DigitalOcean
•	Storage: DigitalOcean Spaces
Se podrá realizar pruebas en el servidor actual (previa configuración) si se requiere.

4.	Estructura de la Landing
Cada página incluirá:
•	Hero (imagen + beneficio + CTA)
•	Beneficios principales
•	Descripción comercial del producto
•	Imágenes / contenido visual
•	Información relevante (uso, características)
•	CTA de compra (redirección)

Enfocada en:
•	Claridad
•	Rapidez
•	Conversión

5.	Estrategia de Desarrollo
Fase 1:
•	Landing de productos (listado)
•	Página de detalle
•	Redirección al e-commerce
•	Datos iniciales configurables
•	Deploy inicial
•	Multipaís con parámetro de ruta
•	Pruebas de integración a dominio vivetiens
Fase 2:
•	Mantenedor (gestor de contenido)
•	Implementación de base de datos
•	CRUD de productos
•	Configuración por país
•	Subida de imágenes
•	Actualización dinámica en la landing
•	Multipaís con parámetro de ruta v2
•	Configuración de integración a dominio tienslar
Para cumplir tiempos:
•	Reutilización de componentes existentes
•	Corrección de errores mínimos necesarios
•	Adaptación a formato de producto
•	Enfoque en mobile
Dado que gran parte del tráfico proviene de mobile, el diseño responsive es crítico

6.	Alcance del Proyecto
Fase 1:
•	Landing Page de productos (estructura completa)
•	Detalle de Producto (estructura completa)
•	Botón comprar con redirirección a e-commerce
•	Diseño responsive (mobile + desktop)
•	Secciones:
o	Hero (imagen + CTA)
o	Beneficios del producto
o	Descripción
o	Imágenes / contenido visual
o	CTA de compra (redirección)
•	Imágenes en repositorio del proyecto
•	Adaptación de base existente
•	Configuración de producto mediante data (mock / JSON) 
•	Multipaís con parámetro de ruta modelo landing.dominio.com/pe
•	Deploy en ambiente de desarrollo

Fase 2:
•	Mantenedor de productos
•	Implementación de base de datos
•	Imágenes desde Storage en la nube
•	Multipaís con parámetro de ruta modelo tienslar.com/pe/productos
•	Configuración de producto mediante administrador
•	Deploy en entorno productivo (Vercel)

Entregables
•	1 landing page funcional publicada
•	1 página detalle de producto que redirige a e-commerce
•	1 mantenedor funcional publicado
•	1 repositorio de imágenes en la nube
•	1 base de datos relacional optimizada y escalable
•	Código fuente del proyecto
•	Template reutilizable para futuros productos

No incluye
•	Desarrollo de e-commerce
•	Integración en tiempo real con APIs
•	Copywriting (textos comerciales)
•	Diseño desde cero (se adapta base existente)

Iteraciones
•	Hasta 2 rondas de ajustes incluidos
•	Cambios adicionales se cotizan aparte
Requisitos del cliente
•	Contenido del producto (texto e imágenes)
•	Link de destino (e-commerce)
•	Feedback oportuno para cumplir tiempos
7.	Estimación de Tiempo
Se consideran los siguientes tiempos:
Fase	Actividad	Tiempo
FASE 1	Definición y estructura	2 días
	Adaptación base existente	2 días
	Desarrollo landing producto	3 días
	Desarrollo detalle producto	4 días
	Ajustes y pruebas	3 días
	Despliegue en ambiente de producción	1 día
FASE 2	Implementación de base de datos	2 días
Tiempo Total Fase 1	15 días

Fase	Actividad	Tiempo
FASE 1	Definición y estructura	2 días
	Adaptación base existente	2 días
	Desarrollo landing producto	3 días
	Desarrollo detalle producto	4 días
	Ajustes y pruebas	3 días
	Despliegue en ambiente de producción	1 día
Tiempo Total Fase 2	15 días

8.	Inversión
Fase	Descripción	Monto
Fase 1	•	Landing Page de producto y detalle completa
•	Adaptación de base existente
•	Redirección al e-commerce
•	Soporte para deploy en entorno productivo	$ 300
Fase 2	•	Implementación de BD 
•	API REST completa 
•	Mantenedor completo
•	Repositorio de imágenes
•	Multipaís
•	Soporte para deploy en entorno productivo	$ 300
TOTAL	$ 600

9.	Consideraciones
•	No incluye desarrollo de e-commerce
•	No incluye CMS
•	No incluye integración en tiempo real
•	Se trabajará con contenido proporcionado
10.	Cierre
Esta propuesta permite lanzar rápidamente una solución enfocada en conversión, reutilizando tecnología existente y minimizando tiempos, con la posibilidad de escalar según resultados


11.	Condiciones Generales
La propuesta está sujeta a los siguientes términos y condiciones:
•	Los precios son referenciales y pueden ajustarse tras definir el alcance final.
•	Se solicita un anticipo del 50% para el inicio del proyecto.
•	El 50% restante se abona contra entrega final.
•	Incluye capacitación básica en el uso del panel administrativo.
•	No incluye hosting ni dominio (el cliente ya dispone de dominio propio).


12.	Contacto

Puede ponerse en contacto con nosotros por los siguientes medios:
Consultor: Fernando Valverde Uchoffen
WhatsApp: +51 980 860 266
Correo: proyectos@mdcoders.com



Estaremos a la espera de su respuesta.
Atte.
El equipo de MDCoders

