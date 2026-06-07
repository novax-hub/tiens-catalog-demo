# Usuarios de prueba local

Este documento guarda las credenciales de los usuarios de ejemplo usados para el reseed local de Fase 2.

## Credenciales

| Usuario | Email | Rol | País | Password |
| --- | --- | --- | --- | --- |
| Super Admin | super@local.test | SUPER_ADMIN | Global | Super2026! |
| Admin Perú | admin.pe@local.test | ADMIN | pe | AdminPe2026! |
| Admin Ecuador | admin.ec@local.test | ADMIN | ec | AdminEc2026! |
| Editor Perú | editor.pe@local.test | EDITOR | pe | EditorPe2026! |
| Editor Ecuador | editor.ec@local.test | EDITOR | ec | EditorEc2026! |
| Assistant Perú | assistant.pe@local.test | ASSISTANT | pe | AssistantPe2026! |
| Assistant Ecuador | assistant.ec@local.test | ASSISTANT | ec | AssistantEc2026! |

## Uso esperado

- `SUPER_ADMIN`: acceso a todos los países.
- `ADMIN`, `EDITOR`, `ASSISTANT`: usuarios de prueba para validar alcance por país.
- Estas contraseñas son solo para desarrollo local y no deben usarse en staging o producción.

## Nota técnica

El seed inserta las contraseñas hasheadas con bcrypt vía `pgcrypto`.

## Impacto para el modelo de negocio

### `last_login_at`

- Es útil para auditoría ligera, soporte y limpieza de cuentas inactivas.
- El impacto técnico es bajo: una columna nullable en `app_user` y un update en el login exitoso.
- Si luego quieren reportes de actividad, conviene indexarla solo si realmente se consulta por rangos de fecha.

### `UNIQUE(email)`

- Para este proyecto, es una buena restricción si cada correo representa una sola identidad global.
- El impacto funcional es positivo para evitar duplicados y simplificar login, recuperación de contraseña y soporte.
- La limitación es importante: si una misma persona necesita acceso a más de un país con roles distintos, `UNIQUE(email)` obliga a resolverlo con una tabla de asignaciones por país en lugar de duplicar usuarios.
- La nueva tabla `app_user_country_access` permite ese modelo sin renunciar a la unicidad del correo.

### Recomendación para nuestro caso

- Mantener `UNIQUE(email)` en `app_user`.
- Agregar una relación explícita de acceso por país, por ejemplo `app_user_country_access` o `user_country_role`.
- Dejar `SUPER_ADMIN` sin país asignado y asociar `ADMIN`, `EDITOR` y `ASSISTANT` al menos a un país.
- Si más adelante se necesita historial de ingresos, agregar `last_login_at` sin romper el modelo actual.

## Tabla de acceso por país

- La semilla asigna `pe` a `admin.pe@local.test`, `editor.pe@local.test` y `assistant.pe@local.test`.
- La semilla asigna `ec` a `admin.ec@local.test`, `editor.ec@local.test` y `assistant.ec@local.test`.
- `super@local.test` queda sin filas en `app_user_country_access` porque `SUPER_ADMIN` se interpreta como acceso global.
