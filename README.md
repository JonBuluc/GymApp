# RegiTreno

RegiTreno es una aplicacion web diseñada para el registro y analisis detallado de entrenamientos de fuerza. El proyecto permite transformar los levantamientos diarios en datos visuales para facilitar el seguimiento del progreso a largo plazo.

## Caracteristicas Principales

* Menu Desplegable: interfaz optimizada para navegacion movil.
* Registro de Sesiones: gestion de ejercicios, series y repeticiones con persistencia en Firebase.
* Panel de Progreso: visualizacion de evolucion de cargas y calculo de 1RM Estimado mediante Recharts.
* Captura de Pantalla: exportacion de graficas y tarjetas de entrenamiento individuales en formato PNG.
* Matriz de Constancia: visualizacion del historial mensual de dias entrenados.
* Marca de Agua: identificacion automatica de la aplicacion y el usuario en las imagenes exportadas.

## Tecnologias

* Frontend: React con Vite y Tailwind CSS.
* Backend: Firebase (Firestore y Authentication).
* Visualizacion: Recharts.
* Exportacion: html2canvas.

## Instalacion

1. Clonar el repositorio:
   git clone https://github.com/JonBuluc/GymApp.git
2. Instalar dependencias:
   npm install
3. Configurar variables de entorno:
   Crear un archivo .env en la raiz con las credenciales de Firebase (API Key, Auth Domain, Project ID, etc.).
4. Iniciar entorno de desarrollo:
   npm run dev