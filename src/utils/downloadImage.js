import html2canvas from 'html2canvas';

export const downloadAsPNG = async (elementRef, fileName) => {
  // validacion: si no hay referencia al elemento, salir
  if (!elementRef.current) return;

  try {
    // captura del elemento usando html2canvas
    const canvas = await html2canvas(elementRef.current, {
      useCORS: true,
      scale: 2, // mejor resolucion para pantallas retina
      backgroundColor: '#1f2937' // asegura el fondo oscuro de la app
    });

    // conversion a data url y descarga
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `${fileName}.png`;
    link.click();
    
  } catch (error) {
    // manejo de errores en la captura
    console.error("error al exportar png:", error);
  }
};
