# === ETAPA 1: Compilación del código ===
FROM node:20-alpine AS build

# Definir el directorio de trabajo
WORKDIR /app

# Copiar los archivos de configuración de dependencias
COPY package*.json ./

# Instalar las dependencias del proyecto
RUN npm ci

# Copiar todo el resto del código del frontend
COPY . .

# Compilar la aplicación para producción (creará la carpeta /app/dist)
RUN npm run build

# === ETAPA 2: Servidor de producción liviano ===
FROM nginx:alpine

# Copiar los archivos compilados desde la etapa anterior al directorio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Modificar la configuración por defecto de Nginx para que escuche en el puerto 8080 (Requisito de Cloud Run)
RUN sed -i 's/listen\(.*\)80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Exponer el puerto 8080
EXPOSE 8080

# Iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]