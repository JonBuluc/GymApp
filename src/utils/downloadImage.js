import html2canvas from 'html2canvas';

export const downloadAsPNG = async (elementRef, fileName) => {
  if (!elementRef.current) return;

  try {
    const element = elementRef.current;

    // 1. MEDIR DÓNDE ESTÁ EL ELEMENTO REALMENTE
    const rect = element.getBoundingClientRect();
    // Calculamos la distancia absoluta desde el techo del documento hasta el elemento.
    // Esto incluye la altura de la Navbar y cualquier scroll que hayas hecho.
    const offsetTop = rect.top + window.scrollY;

    // 2. MEDIR EL TAMAÑO TOTAL DEL CONTENIDO
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 2, // Calidad Retina
      backgroundColor: '#111827', // Tu bg-gray-900

      // 3. EL TRUCO DEL "ELEVADOR" (Scroll Simulado)
      // Le decimos a html2canvas: "Simula que el scroll está exactamente en esta posición".
      // Esto hace que la librería empiece a dibujar justo donde empieza tu elemento,
      // eliminando la barra negra superior.
      scrollY: offsetTop,
      scrollX: window.scrollX, // Por si acaso hay scroll horizontal

      // 4. FORZAR TAMAÑO DE LIENZO EXACTO
      // El canvas final debe medir exactamente lo que mide el elemento.
      width: width,
      height: height,

      // Aseguramos que la "ventana virtual" sea lo suficientemente grande para renderizar todo
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,

      onclone: (clonedDoc) => {
        // FIX PARA RECHARTS (GRÁFICAS)
        // Esto sigue siendo necesario para que las gráficas no salgan vacías.
        const charts = clonedDoc.querySelectorAll('.recharts-responsive-container');
        charts.forEach(chart => {
            chart.style.display = 'block'; // Importante para forzar renderizado
            chart.style.width = '100%';
            // Forzamos una altura mínima en el clon por seguridad
            chart.style.height = chart.clientHeight > 0 ? `${chart.clientHeight}px` : '300px';
            chart.style.position = 'relative';
        });

        // MOSTRAR MARCA DE AGUA EN LA CAPTURA
        const watermarks = clonedDoc.querySelectorAll('.watermark');
        watermarks.forEach(wm => {
            wm.style.display = 'block';
        });
      }
    });

    // DESCARGA
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    link.remove();

  } catch (error) {
    console.error("Error al exportar imagen:", error);
    alert("Hubo un problema al generar la imagen. Intenta de nuevo.");
  }
};