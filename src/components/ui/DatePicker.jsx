import React, { useState, useRef, useEffect } from "react";

const DatePicker = ({ fechaSeleccionada, alCambiarFecha, etiqueta }) => {
  const [estaAbierto, cambiarEstaAbierto] = useState(false);
  const [fechaVista, cambiarFechaVista] = useState(() => {
    if (fechaSeleccionada) {
      return new Date(fechaSeleccionada + "T12:00:00");
    }
    return new Date();
  });

  const refContenedor = useRef(null);

  // efecto para cerrar el calendario al hacer clic fuera
  useEffect(() => {
    const manejarClicAfuera = (evento) => {
      if (refContenedor.current && !refContenedor.current.contains(evento.target)) {
        cambiarEstaAbierto(false);
      }
    };
    document.addEventListener("mousedown", manejarClicAfuera);
    return () => document.removeEventListener("mousedown", manejarClicAfuera);
  }, []);

  // funcion para formatear la fecha a cadena
  const formatearFechaCadena = (fecha) => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
  };

  // comprobamos si una fecha es el dia de hoy
  const comprobarEsHoy = (fecha) => {
    const hoy = new Date();
    return (
      fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear()
    );
  };

  // comprobamos si la fecha es la que esta seleccionada
  const comprobarEsSeleccionada = (fecha) => {
    if (!fechaSeleccionada) return false;
    return formatearFechaCadena(fecha) === fechaSeleccionada;
  };

  // funcion para avanzar o retroceder el mes
  const modificarMes = (cantidadMeses) => {
    const nuevaFecha = new Date(fechaVista);
    nuevaFecha.setMonth(fechaVista.getMonth() + cantidadMeses);
    cambiarFechaVista(nuevaFecha);
  };

  // funcion para seleccionar un dia especifico
  const seleccionarDia = (fecha) => {
    alCambiarFecha(formatearFechaCadena(fecha));
    cambiarEstaAbierto(false);
  };

  // generamos la cuadricula de dias del mes visible
  const renderizarDias = () => {
    const anio = fechaVista.getFullYear();
    const mes = fechaVista.getMonth();

    const primerDiaDelMes = new Date(anio, mes, 1);
    const comienzoDeCuadricula = new Date(primerDiaDelMes);
    comienzoDeCuadricula.setDate(
      primerDiaDelMes.getDate() - primerDiaDelMes.getDay()
    );

    const diasTotales = [];
    const fechaTemporal = new Date(comienzoDeCuadricula);
    const cuarentaYDos = 42;

    for (let indiceUno = 0; indiceUno < cuarentaYDos; indiceUno++) {
      const fechaActualBucle = new Date(fechaTemporal);
      const esMesActual = fechaActualBucle.getMonth() === mes;
      const esHoyBucle = comprobarEsHoy(fechaActualBucle);
      const esSeleccionadoBucle = comprobarEsSeleccionada(fechaActualBucle);

      let estilosClase =
        "h-10 flex items-center justify-center cursor-pointer text-sm transition-colors rounded-lg mx-0.5 my-0.5 font-medium";

      if (esSeleccionadoBucle) {
        estilosClase += " bg-blue-600 text-white shadow-md";
      } else if (esHoyBucle) {
        estilosClase +=
          " bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30";
      } else if (esMesActual) {
        estilosClase += " text-gray-200 hover:bg-gray-700";
      } else {
        estilosClase += " text-gray-600 hover:bg-gray-800";
      }

      diasTotales.push(
        <div
          key={fechaActualBucle.toISOString()}
          onClick={() => seleccionarDia(fechaActualBucle)}
          className={estilosClase}
        >
          {fechaActualBucle.getDate()}
        </div>
      );
      fechaTemporal.setDate(fechaTemporal.getDate() + 1);
    }
    return diasTotales;
  };

  // variables de dias y meses
  const nombresDiasSemana = ["do", "lu", "ma", "mi", "ju", "vi", "sa"];
  const nombreMeses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  return (
    <div className="relative w-full" ref={refContenedor}>
      {etiqueta && (
        <label className="text-xs text-gray-400 block mb-1">{etiqueta}</label>
      )}
      <button
        type="button"
        onClick={() => cambiarEstaAbierto(!estaAbierto)}
        className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-left flex justify-between items-center h-11"
      >
        <span>{fechaSeleccionada || "seleccionar fecha"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {estaAbierto && (
        <div className="absolute z-50 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 w-full sm:w-80 left-0 top-full">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => modificarMes(-1)}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className="text-white font-bold capitalize text-sm">
              {nombreMeses[fechaVista.getMonth()]} {fechaVista.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => modificarMes(1)}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0 mb-2">
            {nombresDiasSemana.map((nombreDia) => (
              <div
                key={nombreDia}
                className="h-8 flex items-center justify-center text-xs font-bold text-gray-500 uppercase"
              >
                {nombreDia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0">{renderizarDias()}</div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;