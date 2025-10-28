/**
 * Formatea una fecha en formato ISO a formato dd/mm/yyyy, usando UTC.
 * @param dateString - Fecha en formato ISO o string compatible con Date.
 * @returns Fecha formateada en formato dd/mm/yyyy o string vacío si la fecha es inválida.
 */
export const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Usar métodos UTC para evitar corrimientos por zona horaria
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
};

/**
 * Convierte una fecha en formato dd/mm/yyyy o yyyy-mm-dd a formato ISO (UTC).
 * @param dateString - Fecha en formato dd/mm/yyyy o yyyy-mm-dd.
 * @returns Fecha en formato ISO (UTC) o null si la fecha es inválida.
 */
export const parseDate = (dateString: string): string | null => {
  if (!dateString) return null;

  try {
    let year, month, day;

    if (dateString.includes('/')) {
      // Handle DD/MM/YYYY
      const parts = dateString.split('/');
      if (parts.length !== 3) return null;
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else if (dateString.includes('-')) {
      // Handle YYYY-MM-DD from <input type="date">
      const parts = dateString.split('-');
      if (parts.length !== 3) return null;
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      // Formato no soportado
      return null;
    }

    // Validación básica de las partes parseadas
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // Crear fecha en UTC para evitar corrimientos por zona horaria.
    // El mes en JavaScript es 0-indexado (0-11).
    const date = new Date(Date.UTC(year, month - 1, day));

    // Validación final para fechas inválidas (ej. 30 de Febrero) y para asegurar que el parseo fue correcto
    if (isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        return null;
    }

    return date.toISOString();
  } catch (error) {
    console.error('Error al parsear fecha:', error);
    return null;
  }
};
