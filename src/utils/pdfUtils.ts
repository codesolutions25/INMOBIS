import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import React from 'react';

export const generateAndDownloadPdf = async (component: React.ReactElement<any>, filename: string) => {
  try {
    const blob = await pdf(component).toBlob();
    
    saveAs(blob, filename);
    
    return true;
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el archivo PDF');
  }
};

export const generateCronogramaFilename = (codigoContrato: string, clienteNombre?: string) => {
  const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const cliente = clienteNombre ? clienteNombre.replace(/[^a-zA-Z0-9]/g, '_') : 'Cliente';
  return `Cronograma_Pagos_${codigoContrato}_${cliente}_${fecha}.pdf`;
};
