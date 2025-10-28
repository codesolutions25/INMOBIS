// URL base para la API de gestión inmobiliaria
export const API_URL = process.env.INMOBILIARIA_SERVICE_URL || '';

// URL base para la API de archivos
export const FILES_API_URL = process.env.ARCHIVOS_SERVICE_URL || '';

// Opciones de fetch para CORS
export const FETCH_OPTIONS = {
  mode: 'cors' as RequestMode,
  credentials: 'include' as RequestCredentials,
  headers: {
    'Accept': 'application/json',
  }
};
