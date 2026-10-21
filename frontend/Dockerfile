# Build en una etapa y nginx en otra, para que la imagen final no cargue
# con node ni con node_modules: solo los archivos estaticos ya compilados.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite incrusta las VITE_* en el bundle en tiempo de build, no de arranque.
# Por eso el valor por defecto es una ruta relativa y no una URL completa:
# nginx reenvía /api a la API, y la imagen no queda atada a un ambiente.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
