FROM node:22-alpine

WORKDIR /app

# Se copian primero los manifiestos para que Docker pueda reutilizar la
# capa de dependencias mientras no cambien, y no reinstalar en cada build.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3100

# Sin npm en medio: asi las señales de parada llegan directo a node y el
# contenedor se detiene limpio en vez de esperar el timeout.
CMD ["node", "src/server.js"]
