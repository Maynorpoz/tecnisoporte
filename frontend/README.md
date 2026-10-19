# Frontend

Aplicación React del IT Incident Hub.

El andamiaje se genera con Vite en la Task de creación del formulario de incidentes:

```bash
npm create vite@latest frontend -- --template react
cd frontend && npm install
```

Si Vite se queja de que el directorio no está vacío, elige la opción de continuar
sin borrar: este README y el resto del contenido se conservan.

## Variables de entorno

La URL de la API se configura con `VITE_API_URL`, que se define en el `.env`
de esta carpeta. Igual que en el backend, el `.env` real nunca se versiona.
