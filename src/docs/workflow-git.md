# Git Workflow & Branching

Ignora la carpeta tiens-catalog-demo, la he incluido recientemente pero es temporal para hacer el deploy en vercel.
He creado la rama main y la rama develop.

Sugiero crear ramas feature a partir de ahora. 
Si hacemos eso, el flujo sería el siguiente:

Al iniciar un Día del backlog:
1. Verificar si hay cambios pendientes en la rama develop (y en otras ramas)
2. Si en el punto 1 hay cambios pendientes, me avisas para validarlos, subir commits si es necesario. Si hay commits se hace el PR a develop y se espera la confirmación o la denegación. Si se confirma, actualizo develop local y si se deniega repito paso 1.
3. Si en el punto 1 no hay cambios pendientes, actualizamos develop local con el remoto.
4. Verificamos la funcionalidad y verificamos que exista una rama para esta funcionalidad y si existe se actualiza con develop. Si no existe la creamos: feature/funcionalidad-nombre-en-ingles y se trackea para que exista en el remoto.
5. Al terminar los cambios del día del backlog, generamos el commit en formato conventional commit, resumido y en inglés.
6. Hacemos el push a la rama feature actual.
7. Se repiten el pasos 1, 2 y 3


Es un enfoque profesional y escalable. Algunas observaciones constructivas (menores):

### ✅ Estoy de acuerdo con:
- Ramas feature por funcionalidad
- Conventional commits (resumido, inglés)
- PR a develop antes de mergear
- Actualización local antes de iniciar cada día
- Tracking remoto de features

### 📝 Sugerencias/Aclaraciones (opcionales):

1. **Paso 7 - claridad del flujo**
   - Después del push a feature, sugiero: **crear PR manual en GitHub** (no automático) para control explícito
   - Esto evita PRs accidentales

2. **Flujo de merge confirmado**
   - Cuando se confirma PR: mergear en GitHub, luego en local hacer:
     ```bash
     git checkout develop
     git pull origin develop
     git branch -d feature/nombre-feature  # local
     git push origin --delete feature/nombre-feature  # remoto (opcional, para limpiar)
     ```

3. **Ejemplo Conventional Commits para Day x+**
   - Format: `feat(landing): add hero section` o `feat(landing): refine visual hierarchy`
   - Esto facilita después generar CHANGELOGs automáticos

4. **Entre días (pasos 1-3)**
   - Si develop tiene cambios remotos nuevos, hacer `git.pull origin develop` antes de crear feature
   - Esto asegura que la feature está basada en lo más reciente

### 🎯 Propuesta de PR template (opcional):
```markdown
## Description
Describe el cambio brevemente.

## Related to
Day X del backlog

## Type of Change
- [ ] Feature (nueva funcionalidad)
- [ ] Fix (corrección)
- [ ] Refactor (mejora técnica)

## Testing
Cómo verificar que funciona.
```

---

## Referencias
- Documentos principales del proyecto: [alcance.md](alcance.md), [frontend.md](frontend.md), [backend.md](backend.md), [modelo-datos-fase2.md](modelo-datos-fase2.md)
- Contrato mínimo de datos (mock Fase 1): [contrato-minimo-datos-fase-1.md](contrato-minimo-datos-fase-1.md)
 - Diseño / tokens: [design-system.md](design-system.md)
 - Estructura del proyecto: [estructura-proyecto.md](estructura-proyecto.md)
 - Propuesta técnica y comercial: [Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md](Propuesta-de-desarrollo-Tiens-Landing-Productos-v2.0.0.md)
