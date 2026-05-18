# Enci-intel-proyect
Guía Rápida de Git y Flujo de Trabajo
Para mantener el orden y el historial de nuestro código limpio, en este proyecto utilizamos un flujo de trabajo colaborativo basado en ramas y Pull Requests

1. Conceptos Clave
-Git: Sistema de control de versiones que rastrea los cambios en nuestro código fuente.  
-Repositorio: La carpeta del proyecto que contiene todo el historial de cambios.  
-Commit: Una "instantánea" o guardado del estado del proyecto en un momento específico.  
-Rama (Branch): Una línea de desarrollo independiente. Nos permite trabajar en nuevas cosas sin romper el código principal.

2. Estrategia de Ramas
-Trabajaremos principalmente con el siguiente esquema de ramas:  

-main: Contiene el código en producción; siempre debe ser estable.  

-develop: Es la rama principal de trabajo. Aquí se integran todas las nuevas funcionalidades (features) antes de pasar a main.  

-feature/*: Ramas temporales para desarrollar nuevas funcionalidades (ej. feature/login, feature/carrito). Siempre se crean a partir de develop.  

-hotfix/*: Ramas para correcciones urgentes directamente sobre main.

3. Nuestro Flujo de Trabajo Paso a Paso Para contribuir al proyecto, sigue estos pasos:

-Actualiza tu local: Asegúrate de estar en develop y tener los últimos cambios (git pull origin develop).

-Crea tu rama de trabajo: Crea una rama descriptiva para tu tarea. Por ejemplo: git checkout -b feature/nueva-seccion.  

-Desarrolla: Haz cambios pequeños y frecuentes con mensajes de commit claros.  

-Sube tus cambios: Sube tu rama al repositorio remoto (git push origin feature/nueva-seccion).  

4. Convención de Mensajes de Commit
Por favor, utiliza estos prefijos al crear tus commits para saber rápidamente qué hace cada cambio:  

-feat:: Para una nueva funcionalidad. (Ej. git commit -m "feat: agregar botón de pago")  

-fix:: Para la corrección de un bug o error.  

-docs:: Para cambios en la documentación.  

-refactor:: Para reescribir código sin cambiar su comportamiento.  

-chore:: Para tareas de mantenimiento o configuración.

5. Comandos Esenciales (Referencia Rápida)

-Clonar el proyecto: git clone <url>   

-Ver el estado de los archivos: git status   

-Crear y cambiar a una nueva rama: git checkout -b <nombre-rama> o git switch -c <nombre-rama>   

-Cambiar entre ramas existentes: git checkout <nombre-rama>   

-Preparar todos los cambios para el commit: git add .   

-Crear un commit: git commit -m "tu mensaje aquí"   

-Subir cambios al remoto: git push origin <nombre-rama>   

-Descargar y fusionar los últimos cambios: git pull origin <nombre-rama> 