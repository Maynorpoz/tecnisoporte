# Seguridad

Cómo maneja TecniSoporte sus secretos, qué hacer si uno se filtra y qué hallazgos de seguridad salieron durante el desarrollo.

## Qué es secreto y dónde vive

El proyecto tiene pocos secretos, y cada uno vive en un solo lugar.

| Secreto | Dónde vive | Quién lo ve |
|---|---|---|
| Contraseña de la base de desarrollo | `.env` local, fuera del repositorio | Solo quien trabaja en la máquina |
| Contraseña de la base de pruebas en Azure | Variable `POSTGRES_PASSWORD` del grupo `tecnisoporte-ci`, marcada como secreta | Nadie: Azure la enmascara como `***` en los logs |
| Contraseña de la base de pruebas en GitHub | Secret `CI_DB_PASSWORD` del repositorio | Nadie: GitHub tampoco la muestra después de guardarla |
| PAT para registrar el agente | En ningún lado. Se usó una vez y el agente guarda sus propias credenciales en `C:\agent\.credentials` | Solo el agente |
| PAT del CLI de Azure y token de GitHub | Los escribe el desarrollador en su terminal; quedan en el almacén de credenciales del sistema | Solo el desarrollador |

Las dos bases de pruebas del CI son efímeras: se crean al empezar el build y se destruyen al terminar. Su contraseña no abre nada que exista fuera de ese build.

## Cómo se evita que se filtren

El `.env` real está en el `.gitignore`. En el repositorio solo está `.env.example`, con valores de relleno como `TU_PASSWORD_LOCAL` que no sirven para conectarse a nada.

La aplicación no tiene ninguna credencial escrita en el código. Todo sale de variables de entorno, y si falta una obligatoria la API se niega a arrancar en lugar de usar un valor por defecto.

En el pipeline el secreto se mapea a mano en cada paso que lo necesita, con un bloque `env`. Azure no expone las variables secretas a los scripts por su cuenta, así que un paso que no la pide no la recibe. El detalle está en `devops/variable-group.md`.

El 21 de octubre revisé el historial completo del repositorio: 58 commits, ningún `.env` versionado y ninguna contraseña con un valor real.

## Qué hacer si una credencial se filtra

Lo primero es rotarla, no borrarla. Una contraseña que estuvo en un commit ya está en todas las copias del repositorio, incluido el espejo de GitHub. Reescribir el historial no la saca de esas copias. Lo único que la vuelve inútil es cambiarla.

El orden es este:

1. Cambiar la contraseña en el lugar donde vive. Si es la de Azure, en el variable group; si es la de GitHub, en el secret del repositorio; si es la local, en el `.env`.
2. Si es la de una base, recrear el volumen. Postgres solo toma la contraseña la primera vez que crea el volumen, así que cambiarla en la variable no cambia la base existente. Esto ya causó un problema real: el build 20 falló porque tomó un contenedor viejo con otra contraseña.
3. Si es un PAT o un token, revocarlo desde Azure DevOps o GitHub, en la página de tokens del usuario, y crear uno nuevo con los permisos mínimos.
4. Revisar en los logs de Azure y de GitHub si alguien usó la credencial mientras estuvo expuesta.
5. Solo después, y si el valor quedó en un commit, limpiar el historial con `git filter-repo`. Es un paso de orden, no de seguridad: para entonces la credencial ya no sirve.

## Hallazgos durante el desarrollo

Estos salieron en la autorevisión de los PRs. La mayoría ya está corregida.

**CORS abierto a cualquier origen.** Detectado en el PR 6. Así desplegada, cualquier página web podía llamar a la API desde el navegador de quien la visitara. Corregido en el PR 26: la API solo le da permiso al origen de `CORS_ORIGIN`, que por defecto es el frontend local.

**El health devolvía el error de la base.** Detectado en el PR 1. Un fallo de conexión puede traer el host, el usuario o el nombre de la base, y eso le llegaba al cliente. Corregido en el PR 26: el detalle va al log y la respuesta solo dice que la base no responde.

**Stack trace con rutas del disco.** Un JSON mal formado devolvía una página HTML con el stack trace completo y las rutas del servidor. Lo encontré al pagar la deuda D1 y quedó corregido en el PR 21: ahora es un 400 en JSON.

**SQL armado con texto.** Detectado en los PR 7 y 18. Dos funciones arman SQL concatenando nombres de columna. Lo revisé las dos veces: los nombres están escritos en el código, nunca vienen del cliente, y todos los valores van parametrizados. No hay inyección posible hoy, pero es un patrón que hay que revisar cada vez que se toquen esas funciones.

**Acciones de GitHub fijadas por versión y no por commit.** Detectado en el PR 12. Si alguien publicara una versión comprometida de una acción, el workflow la ejecutaría. Lo dejo abierto porque el único secreto del job es la contraseña de una base que deja de existir cuando el job termina.

**La API no tiene autenticación.** Es el riesgo más grande del sistema y es una decisión, no un descuido. El proyecto no pide login y se decidió no implementarlo. La consecuencia es que cualquiera que alcance la API en la red puede crear, asignar y cerrar incidentes. Antes de usarlo fuera de un ambiente de prueba, esto es lo primero que habría que resolver.

## Dependencias

Las vulnerabilidades de paquetes, su severidad y la decisión tomada con cada una están en `docs/dependencias.md`.
