# Variable Group `tecnisoporte-ci`

El pipeline necesita contraseñas de base de datos: la de pruebas y la de los ambientes. No pueden estar en `azure-pipelines.yml` porque el YAML vive en el repositorio, así que se guardan en un Variable Group de Azure DevOps.

## Cómo se crea

*Pipelines → Library → **+ Variable group***

- **Variable group name**: `tecnisoporte-ci`
- Dejar activado **Allow access to all pipelines**

Tiene dos variables:

| Nombre | Para qué | Secreto |
|---|---|---|
| `POSTGRES_PASSWORD` | La base de pruebas y las de dev y staging | sí, con el candado cerrado |
| `POSTGRES_PASSWORD_PROD` | La base de prod. Se agregó con la entrega continua, en el PR 27 | sí, con el candado cerrado |

Prod tiene su propia contraseña para que conocer la de dev o staging no alcance para entrar a la base de prod.

El candado es lo importante. Con la variable marcada como secreta, Azure la enmascara incluso en los logs: si algún paso la imprimiera, saldría `***` en lugar del valor.

## Por qué solo contraseñas

La cadena de conexión completa se arma dentro del pipeline:

```yaml
TEST_DATABASE_URL: postgresql://incident_user:$(POSTGRES_PASSWORD)@localhost:5436/tecnisoporte_test
```

Así el único dato sensible es la contraseña. Lo mismo pasa en los ambientes: `devops/docker-compose.deploy.yml` arma la cadena de conexión dentro del stack a partir de la contraseña que le pasa el pipeline. El usuario, el host, el puerto y el nombre de la base no son secretos y pueden estar a la vista.

## Cosa importante de los secretos en Azure Pipelines

Las variables marcadas como secretas **no se exponen automáticamente** como variables de entorno a los pasos. Hay que mapearlas explícitamente:

```yaml
- script: docker compose -f devops/docker-compose.test.yml up -d --wait
  env:
    POSTGRES_PASSWORD: $(POSTGRES_PASSWORD)
```

Si se olvida el bloque `env`, la variable llega vacía y el contenedor falla al arrancar con un error que no dice nada sobre la contraseña. Es el error más común con secretos en Azure Pipelines.

## Qué NO va aquí

El PAT del agente no se guarda en ningún lado: se usa una sola vez al registrar el agente y después este guarda sus propias credenciales en `C:\agent\.credentials`.

La contraseña de la base de desarrollo tampoco: esa vive en el `.env` local de cada quien, que está en el `.gitignore`.
