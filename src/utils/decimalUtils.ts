/**
 * Formatea un número con separador de miles y decimales
 * @param value - Número a formatear
 * @param decimals - Cantidad de decimales (por defecto 2)
 * @returns Número formateado como string
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formatea un número como moneda peruana (S/)
 * @param value - Valor numérico
 * @param decimals - Cantidad de decimales (por defecto 2)
 * @returns String con el formato de moneda peruana
 */
export const formatCurrency = (value: number, decimals: number = 2): string => {
  return `S/ ${formatNumber(value, decimals)}`;
};

/**
 * Convierte un string con formato de número a número
 * @param value - String con formato de número (ej: "1,234.56")
 * @returns Número o NaN si el formato es inválido
 */
export const parseNumber = (value: string): number => {
  return Number(value.replace(/\./g, '').replace(',', '.'));
};

export default {
  formatNumber,
  formatCurrency,
  parseNumber
};