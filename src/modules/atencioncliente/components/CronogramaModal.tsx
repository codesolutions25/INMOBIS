"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/contexts/AlertContext';
import { PlanPago } from './planPagoConfig';
import { Proyecto } from '@/types/proyectos';
import { Propiedad } from '@/types/propiedades';
import { Persona } from '@/types/persona';
import { createCotizacion, getEstadoCotizacionPendienteId } from '@/services/apiCotizaciones';
import { CronogramaPagosPdf } from '@/components/pdf/CronogramaPagosPdf/CronogramaPagosPdf';
import { generateAndDownloadPdf, generateCronogramaFilename } from '@/utils/pdfUtils';

interface CronogramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  planPago: PlanPago;
  clienteNombre?: string;
  cliente?: Persona;
  clienteId?: number;
  proyecto: Proyecto | null;
  propiedad: Propiedad | null;
  precioBase: number;
  observacion?: string;
  onCotizacionCreada?: (planId: number) => void;
  soloVer?: boolean; // Nuevo prop para indicar si es solo visualización
}

const CronogramaModal: React.FC<CronogramaModalProps> = ({
  isOpen,
  onClose,
  planPago,
  clienteNombre,
  cliente,
  clienteId,
  proyecto,
  propiedad,
  precioBase,
  observacion,
  onCotizacionCreada,
  soloVer = false
}) => {
  const { showAlert } = useAlert();
  const [generandoPdf, setGenerandoPdf] = useState(false);
  
  // Generar nombre completo del cliente
  const obtenerNombreCompleto = () => {
    if (cliente) {
      const { nombre, apellidoPaterno, apellidoMaterno } = cliente;
      return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
    }
    return clienteNombre || 'Cliente no especificado';
  };

  // Generar código de contrato único
  const generarCodigoContrato = () => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PROP${año}${mes}${dia}${random}`;
  };

  // Calcular cronograma de cuotas con las fórmulas específicas
  const calcularCronogramaCuotas = () => {
    const interes = planPago.interes || 0;
    const numeroCuotas = planPago.numeroCuota;
    const valorMinimo = planPago.valorMinimo || 0;
    
    // Verificar si es un plan "Al Contado"
    const esAlContado = planPago.planPago?.toLowerCase().includes('contado') || numeroCuotas === 1;
    
    const cuotas = [];
    
    if (esAlContado) {
      // Para planes "Al Contado", solo generar una cuota (cuota 0) con el precio total
      cuotas.push({
        numero: 0,
        fechaVencimiento: new Date(),
        saldoCapital: precioBase,
        amortizacion: precioBase,
        interes: 0,
        montoCuota: precioBase,
        dias: 0
      });
    } else {
      // Para planes "Por Partes", usar el cálculo original
      // TEM (Tasa Efectiva Mensual) = interés anual / 12
      const tem = interes / 12 / 100; // Convertir a decimal
      
      // Saldo capital inicial después del valor mínimo
      const saldoCapitalInicial = precioBase - valorMinimo;
      let saldoCapital = saldoCapitalInicial;
      
      // Primera cuota (cuota inicial)
      cuotas.push({
        numero: 0,
        fechaVencimiento: new Date(),
        saldoCapital: precioBase,
        amortizacion: valorMinimo,
        interes: 0,
        montoCuota: valorMinimo,
        dias: 0
      });
      
      // Calcular cuota fija mensual para las cuotas restantes
      let cuotaFijaMensual = 0;
      if (numeroCuotas > 1 && saldoCapital > 0) {
        const n = numeroCuotas; // Número total de cuotas
        cuotaFijaMensual = saldoCapital * (tem * Math.pow(1 + tem, n)) / (Math.pow(1 + tem, n) - 1);
      }
      
      // Calcular cuotas restantes (del 1 al numeroCuotas)
      for (let i = 1; i <= numeroCuotas; i++) {
        const interesMensual = saldoCapital * tem;
        const amortizacion = cuotaFijaMensual - interesMensual;
        
        // Fecha de vencimiento (30 días después de la cuota anterior)
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 30));
        
        cuotas.push({
          numero: i,
          fechaVencimiento,
          saldoCapital: saldoCapital,
          amortizacion: amortizacion,
          interes: interesMensual,
          montoCuota: cuotaFijaMensual,
          dias: 30
        });
        
        // Actualizar saldo capital para la siguiente cuota
        saldoCapital -= amortizacion;
      }
    }
    
    return cuotas;
  };

  // Calcular monto total con interés
  const calcularMontoTotal = () => {
    const cuotas = calcularCronogramaCuotas();
    const totalAmortizacion = cuotas.reduce((total, cuota) => total + cuota.amortizacion, 0);
    const totalInteres = cuotas.reduce((total, cuota) => total + cuota.interes, 0);
    return totalAmortizacion + totalInteres;
  };

  // Obtener fecha de emisión actual
  const fechaEmision = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Obtener frecuencia de pago
  const obtenerFrecuenciaPago = () => {
    return planPago.frecuencia || 'Mensual';
  };

  // Función para obtener el ID del estado "En Curso"
  const obtenerEstadoEnCursoId = async (): Promise<number> => {
    try {
      const estadoUrl = process.env.ESTADO_PLAN_PAGO_URL;
      
      if (!estadoUrl) {
        // Intentar obtener estados desde el microservicio
        const baseUrl = process.env.PLAN_PAGOS_SERVICE_URL;
        if (baseUrl) {
          const estadosResponse = await fetch(`${baseUrl}/estado-plan-pago`);
          if (estadosResponse.ok) {
            const estadosData = await estadosResponse.json();
            
            // Buscar un estado que contenga "curso" o usar el primero disponible
            if (estadosData.data && Array.isArray(estadosData.data)) {
              const estadoEnCurso = estadosData.data.find((estado: any) => 
                estado.nombre?.toLowerCase().includes('curso')
              );
              if (estadoEnCurso) {
                return estadoEnCurso.id_estado_plan_pago || estadoEnCurso.id || 1;
              }
              // Si no encuentra "En Curso", usar el primer estado disponible
              if (estadosData.data.length > 0) {
                return estadosData.data[0].id_estado_plan_pago || estadosData.data[0].id || 1;
              }
            }
          }
        }
        return 1; // Valor por defecto
      }

      const response = await fetch(estadoUrl);
      if (!response.ok) {
        throw new Error(`Error al obtener estado: ${response.status}`);
      }

      const data = await response.json();
      
      // Buscar el estado "En Curso" en la respuesta
      let estadoId = 1; // Valor por defecto
      
      if (Array.isArray(data)) {
        const estadoEnCurso = data.find((estado: any) => 
          estado.nombre?.toLowerCase().includes('curso') || 
          estado.descripcion?.toLowerCase().includes('curso')
        );
        if (estadoEnCurso) {
          estadoId = estadoEnCurso.id_estado_plan_pago || estadoEnCurso.id || estadoEnCurso.idEstadoAtencion || 1;
        }
      } else if (data.data && Array.isArray(data.data)) {
        const estadoEnCurso = data.data.find((estado: any) => 
          estado.nombre?.toLowerCase().includes('curso') || 
          estado.descripcion?.toLowerCase().includes('curso')
        );
        if (estadoEnCurso) {
          estadoId = estadoEnCurso.id_estado_plan_pago || estadoEnCurso.id || estadoEnCurso.idEstadoAtencion || 1;
        }
      }

      return estadoId;
    } catch (error) {
      // Como fallback, intentar obtener estados desde el microservicio
      try {
        const baseUrl = process.env.PLAN_PAGOS_SERVICE_URL;
        if (baseUrl) {
          const estadosResponse = await fetch(`${baseUrl}/estado-plan-pago`);
          if (estadosResponse.ok) {
            const estadosData = await estadosResponse.json();
            if (estadosData.data && Array.isArray(estadosData.data) && estadosData.data.length > 0) {
              return estadosData.data[0].id_estado_plan_pago || estadosData.data[0].id || 1;
            }
          }
        }
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
      }
      return 1; // Valor por defecto en caso de error
    }
  };

  // Función para validar que exista un plan de pago
  const validarPlanPagoExiste = async (idPlanPago: number): Promise<boolean> => {
    try {
      const baseUrl = process.env.PLAN_PAGOS_SERVICE_URL;
      const response = await fetch(`${baseUrl}/planes-pago/${idPlanPago}`);
      return response.ok;
    } catch (error) {
      console.error('Error al validar plan de pago:', error);
      return false;
    }
  };

  // Función para validar que exista un estado
  const validarEstadoExiste = async (idEstado: number): Promise<boolean> => {
    try {
      const baseUrl = process.env.PLAN_PAGOS_SERVICE_URL;
      const response = await fetch(`${baseUrl}/estado-plan-pago/${idEstado}`);
      return response.ok;
    } catch (error) {
      console.error('Error al validar estado:', error);
      return false;
    }
  };

  // Función para crear cotización
  const crearCotizacion = async () => {
    try {
      if (!propiedad || !clienteId || !observacion) {
        throw new Error('Faltan datos necesarios para crear la cotización');
      }

      const estadoPendienteId = await getEstadoCotizacionPendienteId();
      const fechaActual = new Date().toISOString();
      
      // Redondear precio final a exactamente 2 decimales
      const precioFinalRedondeado = Math.round((planPago.nuevoCosto || precioBase) * 100) / 100;
      
      const cotizacionData = {
        idClienteInmobiliario: clienteId,
        idPropiedad: propiedad.idPropiedad,
        idEstadoCotizacion: estadoPendienteId,
        idPlanPagoPropiedad: planPago.idPlanPagoPropiedad,
        descuento: 0, // Siempre 0 según especificación
        precioFinal: precioFinalRedondeado,
        moneda: 'PEN', // Soles peruanos
        observaciones: observacion, // Observación del inicio del cuadro
        fechaCotizacion: fechaActual,
        fechaCreacion: fechaActual
      };
      
      await createCotizacion(cotizacionData);
      
      // Notificar al componente padre que se creó la cotización
      if (onCotizacionCreada && planPago.idPlanPagoPropiedad) {
        onCotizacionCreada(planPago.idPlanPagoPropiedad);
      }
    } catch (error) {
      console.error('Error al crear cotización:', error);
      throw error;
    }
  };

  // Función para guardar todas las cuotas en la API
  const guardarCuotas = async () => {
    try {
      // Validar datos necesarios
      if (!propiedad || !propiedad.idPropiedad) {
        throw new Error('No se ha seleccionado una propiedad válida');
      }

      if (!planPago.idPlanPagoPropiedad) {
        throw new Error('No se ha seleccionado un plan de pago válido');
      }

      // Obtener ID del cliente
      let idCliente = null;
      if (clienteId) {
        idCliente = clienteId;
      } else if (cliente && cliente.idPersona) {
        idCliente = cliente.idPersona;
      } else {
        throw new Error('No se puede identificar el cliente para guardar las cuotas');
      }

      // Validar que el plan de pago existe
      const planExiste = await validarPlanPagoExiste(planPago.idPlanPagoPropiedad);
      if (!planExiste) {
        throw new Error(`El plan de pago con ID ${planPago.idPlanPagoPropiedad} no existe en la base de datos`);
      }

      // Obtener el ID del estado "En Curso"
      const estadoEnCursoId = await obtenerEstadoEnCursoId();

      // Validar que el estado existe
      const estadoExiste = await validarEstadoExiste(estadoEnCursoId);
      if (!estadoExiste) {
        throw new Error(`El estado con ID ${estadoEnCursoId} no existe en la base de datos`);
      }

      const cuotas = calcularCronogramaCuotas();
      const baseUrl = process.env.PLAN_PAGOS_SERVICE_URL;
      
      if (!baseUrl) {
        throw new Error('URL del servicio de plan de pagos no configurada');
      }

      // Guardar cada cuota individualmente
      const promesasGuardado = cuotas.map(async (cuota, index) => {
        try {
          const cuotaData = {
            id_usuario: idCliente, // ID del cliente
            id_propiedad: propiedad.idPropiedad, // ID de la propiedad seleccionada
            id_plan_pago_propiedad: planPago.idPlanPagoPropiedad, // ID del plan de pago seleccionado
            numero_cuota: cuota.numero,
            fecha_vencimiento: cuota.fechaVencimiento.toISOString(), // Formato ISO-8601 completo
            fecha_pago_estimada: cuota.fechaVencimiento.toISOString(), // Mismo que fecha_vencimiento
            saldo_capital: Number(cuota.saldoCapital.toFixed(2)),
            monto_amortizacion: Number(cuota.amortizacion.toFixed(2)),
            monto_total_cuota: Number(cuota.montoCuota.toFixed(2)),
            monto_interes: Number(cuota.interes.toFixed(2)),
            id_estado_plan_pago: estadoEnCursoId // Estado "En Curso" obtenido dinámicamente
          };

          console.log(`Guardando cuota ${cuota.numero}:`, cuotaData);

          const response = await fetch(`${baseUrl}/cuotas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(cuotaData)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al guardar cuota ${cuota.numero}: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          console.log(`Cuota ${cuota.numero} guardada exitosamente:`, result);
          return result;
        } catch (error) {
          console.error(`Error específico en cuota ${cuota.numero}:`, error);
          throw error;
        }
      });

      // Esperar a que todas las cuotas se guarden
      const resultados = await Promise.all(promesasGuardado);
      
      console.log('Todas las cuotas se guardaron exitosamente:', resultados);
      return true;
    } catch (error) {
      console.error('Error al guardar cuotas:', error);
      throw error;
    }
  };

  // Función para descargar cronograma como PDF
  const descargarCronogramaPDF = async () => {
    try {
      setGenerandoPdf(true);
      
      const cuotasCalculadas = calcularCronogramaCuotas();
      const montoTotalCalculado = calcularMontoTotal();
      const codigoContratoGenerado = generarCodigoContrato();
      
      // Crear el componente PDF con los datos reales
      const pdfComponent = (
        <CronogramaPagosPdf
          planPago={planPago}
          cliente={cliente}
          clienteNombre={clienteNombre}
          proyecto={proyecto}
          propiedad={propiedad}
          precioBase={precioBase}
          codigoContrato={codigoContratoGenerado}
          cuotas={cuotasCalculadas}
          montoTotal={montoTotalCalculado}
        />
      );
      
      // Generar nombre del archivo
      const filename = generateCronogramaFilename(
        codigoContratoGenerado,
        obtenerNombreCompleto()
      );
      
      // Generar y descargar el PDF
      await generateAndDownloadPdf(pdfComponent, filename);
      
      showAlert('success', 'PDF Generado', 'El cronograma de pagos se ha descargado exitosamente.');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      showAlert('error', 'Error', 'No se pudo generar el archivo PDF. Por favor, inténtelo nuevamente.');
    } finally {
      setGenerandoPdf(false);
    }
  };

  const codigoContrato = generarCodigoContrato();
  const montoTotal = calcularMontoTotal();
  const cuotas = calcularCronogramaCuotas();
  const totalInteres = cuotas.reduce((total, cuota) => total + cuota.interes, 0);
  const tem = (planPago.interes || 0) / 12 / 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-[95vw] max-h-[95vh] h-[95vh] overflow-y-auto p-0" style={{ width: '95vw', maxWidth: '95vw' }}>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 cronograma-content">
            {/* Título del Cronograma */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Cronograma de Pagos</h1>
              <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
            </div>
            <div className="space-y-8">
          {/* Información del Cliente y Contrato */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Información del Contrato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente:
                </label>
                <p className="text-gray-800 font-medium">{obtenerNombreCompleto()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Contrato:
                </label>
                <p className="text-gray-800 font-mono font-medium">{codigoContrato}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Emisión:
                </label>
                <p className="text-gray-800">{fechaEmision}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia de Pagos:
                </label>
                <p className="text-gray-800">{obtenerFrecuenciaPago()}</p>
              </div>
            </div>
          </div>

          {/* Información del Proyecto y Propiedad */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Detalles del Proyecto y Propiedad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proyecto:
                </label>
                <p className="text-gray-800 font-medium">
                  {proyecto?.nombre || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propiedad:
                </label>
                <p className="text-gray-800 font-medium">
                  {propiedad?.nombre || propiedad?.descripcion || 'No especificada'}
                </p>
              </div>
            </div>
          </div>

          {/* Información Financiera */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Información Financiera
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Base:
                </label>
                <p className="text-gray-800 font-medium text-lg">
                  S/ {precioBase.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Mínimo:
                </label>
                <p className="text-gray-800 font-medium text-lg">
                  S/ {(planPago.valorMinimo || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interés Mensual:
                </label>
                <p className="text-gray-800 font-medium text-lg">
                  {planPago.interes || 0}%
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Total a Pagar:
                </label>
                <p className="text-gray-800 text-lg">
                  S/ {montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Cuotas:
                </label>
                <p className="text-gray-800 font-medium text-lg">
                  {planPago.numeroCuota}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan de Pago:
                </label>
                <p className="text-gray-800 font-medium">
                  {planPago.planPago}
                </p>
              </div>
            </div>
          </div>

          {/* Cronograma de Cuotas */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Cronograma de Cuotas
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-3 py-2 text-center">N° de Cuota</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Fecha Vencimiento</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Saldo Capital (S/)</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Amortización (S/)</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Interés (S/)</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Monto Cuota (S/)</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Días</th>
                  </tr>
                </thead>
                <tbody>
                  {calcularCronogramaCuotas().map((cuota, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                        {cuota.numero.toString().padStart(3, '0')}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {cuota.fechaVencimiento.toLocaleDateString('es-PE')}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                        {cuota.saldoCapital.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                        {cuota.amortizacion.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        {cuota.interes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                        {cuota.montoCuota.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {cuota.dias}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-between items-center pt-6 border-t bg-gray-50 -mx-6 px-6 py-4 mt-8">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 py-2"
            >
              Cerrar
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  window.print();
                }}
                className="px-6 py-2"
              >
                Imprimir
              </Button>
              
              <Button
                variant="outline"
                onClick={descargarCronogramaPDF}
                disabled={generandoPdf}
                className="px-6 py-2"
              >
                {generandoPdf ? 'Generando PDF...' : 'Descargar como PDF'}
              </Button>
              
              {!soloVer && (
                <Button
                  className="bg-green-600 hover:bg-green-700 px-6 py-2"
                  onClick={async () => {
                    try {
                      // Solo crear la cotización, sin guardar cuotas
                      await crearCotizacion();
                      
                      // Cerrar el modal primero
                      onClose();
                      
                      // Mostrar alerta de éxito después de cerrar el modal
                      setTimeout(() => {
                        showAlert('success', 'Cotización Guardada', 'La cotización ha sido guardada exitosamente. Las cuotas se generarán cuando se cree una reserva.');
                      }, 300);
                    } catch (error) {
                      console.error('Error al guardar cotización:', error);
                      // Para errores, mostrar inmediatamente sin cerrar el modal
                      showAlert('error', 'Error', `Error al guardar cotización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
                    }
                  }}
                >
                  Guardar
                </Button>
              )}
            </div>
          </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CronogramaModal;
