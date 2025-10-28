import { getEmpresaModuloOpciones } from './apiEmpresaModuloOpcion';
import { getOpcionById } from './apiOpciones';

export interface OpcionConModulo {
  idOpcion: number;
  nombre: string;
  descripcion: string;
  icono: string;
  esActivo: boolean;
  idEmpresaSistemaModulo: number;
  nombreAlias: string;
  ruta: string;
  idModulo: number;
}

/**
 * Obtiene todas las opciones agrupadas por módulo
 * @returns Map con clave idModulo y valor array de opciones
 */
export const getOpcionesPorModuloAgrupadas = async (): Promise<Map<number, OpcionConModulo[]>> => {
  try {
    // Obtener todas las opciones con paginación alta
    const opcionesResponse = await getEmpresaModuloOpciones(1, 1000);

    // Crear mapa para agrupar opciones por módulo
    const opcionesPorModulo = new Map<number, OpcionConModulo[]>();

    // Procesar cada opción
    for (const empresaModuloOpcion of opcionesResponse.data) {
      const idModulo = empresaModuloOpcion.idEmpresaSistemaModulo;

      try {
        // Obtener detalles completos de la opción
        const opcionDetalles = await getOpcionById(empresaModuloOpcion.idOpcion);

        if (!opcionesPorModulo.has(idModulo)) {
          opcionesPorModulo.set(idModulo, []);
        }

        const opcionConModulo: OpcionConModulo = {
          idOpcion: opcionDetalles.idOpcion,
          nombre: opcionDetalles.nombre,
          descripcion: opcionDetalles.descripcion,
          icono: opcionDetalles.icono || '',
          esActivo: opcionDetalles.esActivo,
          idEmpresaSistemaModulo: empresaModuloOpcion.idEmpresaSistemaModulo,
          nombreAlias: empresaModuloOpcion.nombreAlias,
          ruta: empresaModuloOpcion.ruta,
          idModulo: idModulo,
        };

        opcionesPorModulo.get(idModulo)!.push(opcionConModulo);
      } catch (error) {
        console.warn(`Error al obtener detalles de la opción ${empresaModuloOpcion.idOpcion}:`, error);
        // Continuar con la siguiente opción
      }
    }

    return opcionesPorModulo;
  } catch (error) {
    console.error('Error al obtener opciones por módulo:', error);
    return new Map();
  }
};

/**
 * Obtiene las opciones específicas de un módulo
 * @param idModulo - ID del módulo
 * @returns Array de opciones del módulo
 */
export const getOpcionesDeModulo = async (idModulo: number): Promise<OpcionConModulo[]> => {
  try {
    const opcionesPorModulo = await getOpcionesPorModuloAgrupadas();
    return opcionesPorModulo.get(idModulo) || [];
  } catch (error) {
    console.error('Error al obtener opciones del módulo:', error);
    return [];
  }
};
