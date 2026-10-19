# Cuentas y revisión de PR (proyecto individual, un solo usuario)

El catedrático autorizó trabajar con una sola cuenta por ser proyecto individual, así que la regla 9 del PDF (dos integrantes con contribuciones verificables) no aplica.

## Configuración de cuentas

| Qué | Valor |
|---|---|
| Organización | `dev.azure.com/devopsmaynor` |
| Proyecto | `incident` (nuevo, dentro de esa organización) |
| Usuario único | `mpozh@miumg.edu.gt` |

No hace falta crear cuentas adicionales ni verificar si la organización está conectada al directorio Entra de la UMG: esa restricción solo afectaba la invitación de usuarios externos, y ya no vas a invitar a nadie.

## El único punto que hay que cubrir distinto: la revisión de PR

El punto 4 del PDF pide *"mínimo 6 PR reales, con descripción, revisión y evidencia de validación"*. Con un solo usuario la **revisión humana por un tercero** no existe, así que el peso de la evidencia se traslada a la **validación automática** y a la calidad del PR en sí.

### Políticas de rama a configurar en `main`

*Project Settings → Repositories → `incident` → Policies → Branch Policies → main*

| Política | Configuración | Qué evidencia produce |
|---|---|---|
| **Require a minimum number of reviewers** | 1, con *Allow requestors to approve their own changes* activado | Fuerza que todo entre por PR, nunca por push directo |
| **Check for linked work items** | Required | Cada PR queda amarrado a su work item: trazabilidad `AB#ID` verificable |
| **Check for comment resolution** | Required | Obliga a cerrar cada observación antes del merge |
| **Build Validation** | El pipeline de CI, Required | Esta es la *"evidencia de validación"* que pide el PDF |

La combinación de **work item vinculado + build en verde + comentarios resueltos** es lo que sustituye al revisor humano. Un PR que no puede mergearse hasta que el pipeline pasa es validación real, no simbólica.

### Haz autorevisión con comentarios de verdad

Esto es lo que más levanta la evidencia y casi nadie lo hace. En cada PR, antes de mergear:

1. Abre el PR y lee tu propio diff en la pestaña **Files**.
2. Deja **comentarios reales sobre las líneas**: algo que no te convence, un valor hardcodeado, una consulta sin paginación, un nombre confuso.
3. Empuja un commit que resuelva esos comentarios.
4. Marca los comentarios como **Resolved** y luego mergea.

El resultado es un PR con conversación, hallazgos y correcciones: un historial que demuestra criterio de ingeniería. Además, varios de esos hallazgos alimentan directamente `docs/deuda-tecnica.md`, que es otro requisito.

### Descripción del PR

Usa siempre la misma plantilla, para que los 6+ PRs se lean como un proceso y no como commits sueltos:

```markdown
## Qué hace
<resumen en 2 o 3 líneas>

## Work item
AB#<ID>

## Cómo se validó
- [ ] Pipeline en verde (build + pruebas + npm audit)
- [ ] Pruebas nuevas o actualizadas: <cuáles>
- [ ] Probado manualmente: <qué se hizo>

## Notas de revisión
<hallazgos de la autorevisión y cómo se resolvieron>
```

## Aprobación manual antes de producción

Para la estrategia de release (punto 4, último bullet) vas a configurar un *approval check* en el ambiente `prod`:

*Pipelines → Environments → prod → Approvals and checks → Approvals*

⚠️ Agrégate como aprobador y **activa la opción que permite al aprobador aprobar sus propias ejecuciones**. Si no la activas, el pipeline queda esperando para siempre: la persona que disparó la ejecución no puede aprobarla, y eres la única aprobadora.

## Lo demás no cambia

Las otras 11 condiciones obligatorias del PDF (ramas, trazabilidad, deuda técnica, pipeline, fallo controlado, self-hosted agent, secretos, GitHub Actions, dependencias, SemVer y release) se cumplen exactamente igual con un solo usuario.
