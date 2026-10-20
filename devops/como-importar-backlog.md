# Cómo importar el backlog a Azure Boards

> Nota: estos pasos ya se ejecutaron el 18 de octubre de 2026. El documento se conserva como registro de cómo se cargó el backlog, no como tarea pendiente.

## 0. Antes de importar

1. Crear el proyecto `incident` dentro de la organización existente `dev.azure.com/devopsmaynor`
   - Visibilidad: privado
   - **Work item process: Agile** — el selector está escondido bajo **Advanced**. Si lo dejas por defecto puede crearte un proyecto con proceso *Basic*, que solo tiene Epic/Issue/Task y no User Story ni Feature, y entonces la importación del CSV falla.

2. Usuarios: no hay nada que hacer
   - El proyecto es individual y el catedrático autorizó trabajar con una sola cuenta, así que todo el backlog queda asignado a `mpozh@miumg.edu.gt`.
   - Cómo se sustituye la revisión de PR en ese escenario está en [cuentas-y-revision-pr.md](cuentas-y-revision-pr.md).

3. Crear los 3 sprints (*Project Settings → Project configuration → Iterations*)
   - `Sprint 1` → 14–20 oct
   - `Sprint 2` → 21–27 oct
   - `Sprint 3` → 28 oct – 4 nov

## 1. Responsables

Las 59 filas ya vienen asignadas a `mpozh@miumg.edu.gt`. No hay nada que reemplazar.

Si en algún momento cambias de cuenta, el correo debe ser **exactamente** el del usuario que tiene acceso al proyecto, o la importación marcará esas filas con error.

## 2. Importar

1. *Boards → Work items*
2. Botón **Import Work Items** (en el menú de la barra superior)
3. Seleccionar `backlog-azure-boards.csv` → **Import**
4. Los items aparecen en estado *unsaved* (resaltados). Revisar que no haya filas con error y pulsar **Save Items**.

La jerarquía se construye con las columnas `Title 1` a `Title 4`: Epic en Title 1, Feature en Title 2, User Story en Title 3, Task/Bug en Title 4. No tocar esa estructura ni reordenar las filas, porque el padre de cada item es la fila superior más cercana de un nivel menos.

## 3. Después de importar

- **Asignar sprints**: el CSV no trae `Iteration Path` (depende del nombre de tu proyecto y fallaría la importación). Usa el tag `S1` / `S2` / `S3` de cada item para filtrar en el backlog y arrastrarlos al sprint correspondiente.
- **Verificar el conteo** en *Boards → Backlogs*: 2 Epics, 6 Features, 15 User Stories, 35 Tasks, 1 Bug.
- **Mover estados conforme avanzas**, no al final. El historial de cambios de estado es parte de la evidencia reconstruible que pide el punto 7 del PDF.

## 4. El ciclo que no se debe romper

```
Task en Boards  →  rama feature/*  →  commits con AB#<ID>  →  PR con descripción
      →  review del otro usuario  →  merge a main  →  pipeline  →  artefacto  →  tag SemVer
```

Cada Task del CSV ya trae en su descripción la rama sugerida. El `AB#<ID>` lo tomas del número de work item que Azure asigna al importar (lo ves en el tablero).

Si trabajas en GitHub, instala la app **Azure Boards** en el repositorio para que `AB#123` en un commit o PR enlace solo contra el work item.

## 5. Mínimos a revisar al final

| Requisito                               | Mínimo                        | Dónde se cubre                        |
|-----------------------------------------|-------------------------------|---------------------------------------|
| Epics / Features / Stories / Tasks      | 2 / 4 / 8 / 16                | este CSV (2 / 6 / 15 / 35)            |
| PRs reales con descripción y revisión   | 6 o más                       | una rama por Task relevante           |
| Deudas identificadas / resueltas        | 5 / 2                         | Feature "Seguridad deuda técnica..."  |
| Pipeline fallido y luego exitoso        | 1                             | Task de fallo controlado + Bug        |
| Self-hosted agent                       | 1                             | Task del pool propio                  |
| Workflow de GitHub Actions              | 1                             | Task de GitHub Actions                |
| Versiones hasta v1.0.0                  | secuencia coherente           | Task de tags SemVer                   |
| Documentos en `docs/`                   | 6 documentos                  | Tasks con tag `docs`                  |
