# 1. Usar una imagen oficial de Python liviana y estable
FROM python:3.12-slim

# 2. Establecer variables de entorno para optimizar Python en contenedores
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Definir el directorio de trabajo dentro del contenedor
WORKDIR /code

# 4. Instalar las dependencias primero (aprovecha la caché de Docker)
COPY requirements.txt /code/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# 5. Copiar todo el código de la aplicación de FastAPI al contenedor
COPY . /code/

# 6. Exponer el puerto por defecto (Cloud Run inyectará la variable $PORT)
EXPOSE 8080

# 7. Comando para arrancar uvicorn adaptado a la arquitectura de Cloud Run
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]