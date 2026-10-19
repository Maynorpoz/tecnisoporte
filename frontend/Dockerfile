# Build en una etapa y nginx en otra, para que la imagen final no cargue
# con node ni con node_modules: solo los archivos estaticos ya compilados.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite incrusta las VITE_* en el bundle en tiempo de build, no de arranque.
# Por eso la URL de la API entra como argumento del build y no como
# variable del contenedor.
ARG VITE_API_URL=http://localhost:3100/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
