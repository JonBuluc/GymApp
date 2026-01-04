# RegiTreno

RegiTreno es una aplicacion web estatica (SPA) diseñada para el registro y analisis detallado de entrenamientos de fuerza. Al ser una aplicacion estatica, se sirve directamente al navegador, utilizando un modelo de Backend as a Service (BaaS) con Firebase para gestionar la persistencia de datos y la autenticacion de usuarios sin necesidad de un servidor propio.

El proyecto permite transformar los levantamientos diarios en datos visuales para facilitar el seguimiento del progreso a largo plazo.

## Caracteristicas Principales

* Menu Desplegable: interfaz optimizada para navegacion movil.
* Registro de Sesiones: gestion de ejercicios, series y repeticiones con persistencia en Firebase.
* Panel de Progreso: visualizacion de evolucion de cargas y calculo de 1RM Estimado mediante Recharts.
* Captura de Pantalla: exportacion de graficas y tarjetas de entrenamiento individuales en formato PNG.
* Matriz de Constancia: visualizacion del historial mensual de dias entrenados.
* Marca de Agua: identificacion automatica de la aplicacion y el usuario en las imagenes exportadas.
* Importacion/Exportacion: compatibilidad con archivos csv de Strong App y backups propios.

## Tecnologias y Dependencias

Para el funcionamiento de esta arquitectura BaaS, utilizamos las siguientes librerias:

* firebase: implementacion del backend (Firestore y Authentication).
* recharts: generacion de graficas dinamicas.
* papaparse: lectura y escritura de archivos csv.
* html2canvas: generador de imagenes a partir de componentes dom.
* lucide-react: iconos vectoriales para la interfaz.

## Instalacion

1. Clonar el repositorio:
   git clone https://github.com/JonBuluc/GymApp.git

2. Instalar las dependencias que estamos utilizando:
   ## instalacion de dependencias de produccion
   npm install firebase recharts papaparse html2canvas lucide-react
   
   ## instalacion de herramientas de desarrollo y estilos
   npm install -D tailwindcss postcss autoprefixer vite @vitejs/plugin-react

3. Configurar variables de entorno:
   Crear un archivo .env en la raiz con las credenciales de tu proyecto de Firebase:
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
   VITE_FIREBASE_PROJECT_ID=tu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   VITE_FIREBASE_APP_ID=tu_app_id

## Nuestro Flujo de Trabajo con Vite

En este proyecto, utilizamos Vite como herramienta de construccion y servidor de desarrollo. Este es el flujo de comandos que seguimos:

## para trabajar localmente (inicia el servidor de desarrollo)
npm run dev

## para generar la version final de la pagina estatica
npm run build

## para probar la version de produccion antes de subirla
npm run preview

## Despliegue en Firebase Hosting

Como RegiTreno es una aplicacion web estatica, la desplegamos en Firebase Hosting siguiendo estos pasos:

1. Autenticacion:
   firebase login

2. Inicializacion (una sola vez, configurando "dist" como directorio publico):
   firebase init

3. Publicacion de cambios:
   # construimos los archivos estaticos finales
   npm run build
   # subimos la carpeta dist al hosting de firebase
   firebase deploy

## Licencia

Este proyecto se distribuye bajo la licencia MIT. consulta el archivo LICENSE para mas detalles.