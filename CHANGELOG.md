# Cambios por versión

TecniSoporte sigue [versionado semántico](https://semver.org/lang/es/). Mientras la versión empiece en 0, cada entregable semanal sube el número del medio. La 1.0.0 es la versión que se entrega y se despliega en prod.

Cada versión es un tag de git sobre el merge que cerró ese entregable. Las tres primeras se etiquetaron el 22 de octubre sobre commits que ya existían, cuando se definió esta convención; el mensaje de cada tag lo dice.

## 1.0.2

Merge del PR 33. Corrección de seguridad, sin cambios en el comportamiento de la aplicación.

- `body-parser` sube de 1.20.8 a 1.20.9 por una vulnerabilidad alta de denegación de servicio en una dependencia de producción (Bug AB#67)
- `docs/dependencias.md` registra el estado al cierre: cero vulnerabilidades en backend y frontend

## 1.0.1

Merge del PR 32. Corrección del README, sin cambios en la aplicación.

- Las pruebas apuntan a su propia base en el puerto 5436, como dice el README y como ya hacían el pipeline y GitHub Actions. Antes la plantilla `.env.example` las mandaba a la base de desarrollo, y seguir el README daba `ECONNREFUSED` si esa base estaba apagada (Bug AB#66)
- El README pide la versión de Node que de verdad exige Vite 8, y explica la instalación en el `cmd` de Windows

## 1.0.0

Merge del PR 31. La versión de la entrega.

- Estrategia de release en `docs/release.md`: ambientes, controles antes de prod y cómo volver atrás
- Corregido el control de vulnerabilidades críticas del pipeline, que no se ejecutaba en el agente Windows (Bug AB#65)
- Versionado semántico con tags y este registro de cambios
- README final con instalación, ejecución, pruebas, pipeline y ambientes
- Este mismo cambio recorrió el ciclo completo como ensayo de la demostración: Task, rama, PR, pipeline, dev, staging, aprobación y prod

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
