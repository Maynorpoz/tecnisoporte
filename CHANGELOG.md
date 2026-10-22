# Cambios por versión

TecniSoporte sigue [versionado semántico](https://semver.org/lang/es/). Mientras la versión empiece en 0, cada entregable semanal sube el número del medio. La 1.0.0 es la versión que se entrega y se despliega en prod.

Cada versión es un tag de git sobre el merge que cerró ese entregable. Las tres primeras se etiquetaron el 22 de octubre sobre commits que ya existían, cuando se definió esta convención; el mensaje de cada tag lo dice.

## Sin publicar

Lo que va a formar la 1.0.0: la estrategia de release en `docs/release.md`, el README final y el ensayo de la demostración completa.

## 0.3.0

Merge del PR 27. Deuda técnica, dashboard, seguridad y entrega continua.

- Registro de deuda técnica priorizado en `docs/deuda-tecnica.md`, con tres deudas pagadas: el manejo de errores centralizado, las validaciones compartidas y la protección de la base de pruebas
- Endpoint `GET /metrics` y pantalla de dashboard con indicadores, gráfica por categoría y carga por técnico
- `docs/seguridad.md`, con CORS restringido al frontend y el health sin exponer errores de la base
- El pipeline despliega en dev, staging y prod. Prod espera aprobación manual
- La suite pasa de 60 a 94 pruebas

## 0.2.0

Merge del PR 19. Cierre de la semana 2.

- Asignación de técnico y máquina de estados de un solo sentido
- Bitácora de comentarios, con nota obligatoria al resolver un incidente
- Filtros combinables en el listado, con el estado en la URL
- Pipeline de integración continua en el agente autohospedado, con la falla controlada y su corrección
- Workflow complementario en GitHub Actions y análisis de dependencias

## 0.1.0

Merge del PR 6. Cierre de la semana 1.

- Estructura del repositorio, convención de ramas y arquitectura
- Esquema de la base de datos
- API para crear, listar y consultar incidentes, con validaciones y paginación
- Frontend con formulario, listado y detalle
