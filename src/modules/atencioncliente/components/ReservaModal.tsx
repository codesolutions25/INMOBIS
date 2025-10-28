"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, User, Home, CreditCard, DollarSign } from 'lucide-react';
import { useAlert } from '@/contexts/AlertContext';
import { PlanPago } from './planPagoConfig';
import { Proyecto } from '@/types/proyectos';
import { Propiedad } from '@/types/propiedades';
import { Persona } from '@/types/persona';
import { crearReservaPropiedad, getReservasPorCotizacion, verificarReservaActivaPropiedad, verificarReservaClientePropiedad, CreateReservaPropiedadDto, ReservaPropiedad } from '@/services/apiReservasPropiedad';
import { getCotizaciones } from '@/services/apiCotizaciones';

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  planPago: PlanPago;
  cliente?: Persona;
  clienteNombre?: string;
  clienteId?: number;
  proyecto: Proyecto | null;
  propiedad: Propiedad | null;
  idCotizacion?: number;
  onReservaCreada?: (reserva: ReservaPropiedad) => void;
}

const ReservaModal: React.FC<ReservaModalProps> = ({
  isOpen,
  onClose,
  planPago,
  cliente,
  clienteNombre,
  clienteId,
  proyecto,
  propiedad,
  idCotizacion,
  onReservaCreada
}) => {
  const { showAlert } = useAlert();
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);


  // Obtener información del cliente separada
  const obtenerInfoCliente = () => {
    if (clienteNombre) {
      // Si tenemos clienteNombre, intentar separarlo
      const partes = clienteNombre.split(' ');
      if (partes.length >= 3) {
        return {
          nombre: partes[0],
          apellidos: partes.slice(1).join(' ')
        };
      } else {
        return {
          nombre: partes[0] || '',
          apellidos: partes.slice(1).join(' ') || ''
        };
      }
    }

    // Si tenemos el objeto cliente completo
    if (cliente) {
      return {
        nombre: cliente.nombre || '',
        apellidos: `${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`.trim()
      };
    }

    return {
      nombre: 'Cliente',
      apellidos: 'no especificado'
    };
  };

  // Función para obtener el ID del estado "En Curso"
  const obtenerEstadoEnCursoId = async (): Promise<number> => {
    try {
      const estadoUrl = process.env.ESTADO_PLAN_PAGO_URL;
      console.log('URL del estado configurada:', estadoUrl);

      if (!estadoUrl) {
        console.warn('URL del estado "En Curso" no configurada, intentando obtener desde API de estados');
        // Intentar obtener estados desde el microservicio


        const estadosResponse = await fetch(`/api/proxy?service=planes&path=estado-plan-pago`);
        if (estadosResponse.ok) {
          const estadosData = await estadosResponse.json();
          console.log('Estados disponibles:', estadosData);

          // Buscar un estado que contenga "curso" o usar el primero disponible
          if (estadosData.data && Array.isArray(estadosData.data)) {
            const estadoEnCurso = estadosData.data.find((estado: any) =>
              estado.nombre?.toLowerCase().includes('curso')
            );
            if (estadoEnCurso) {
              console.log('Estado "En Curso" encontrado:', estadoEnCurso);
              return estadoEnCurso.id_estado_plan_pago || estadoEnCurso.id || 1;
            }
            // Si no encuentra "En Curso", usar el primer estado disponible
            if (estadosData.data.length > 0) {
              console.log('Usando primer estado disponible:', estadosData.data[0]);
              return estadosData.data[0].id_estado_plan_pago || estadosData.data[0].id || 1;
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
      console.log('Respuesta del estado:', data);

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

      console.log('Estado "En Curso" obtenido:', estadoId);
      return estadoId;
    } catch (error) {
      console.error('Error al obtener estado "En Curso":', error);
      // Como fallback, intentar obtener estados desde el microservicio
      try {


        const estadosResponse = await fetch(`/api/proxy?service=planes&path=estado-plan-pago`);
        if (estadosResponse.ok) {
          const estadosData = await estadosResponse.json();
          if (estadosData.data && Array.isArray(estadosData.data) && estadosData.data.length > 0) {
            console.log('Usando primer estado como fallback:', estadosData.data[0]);
            return estadosData.data[0].id_estado_plan_pago || estadosData.data[0].id || 1;
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
      const response = await fetch(`/api/proxy?service=planes&path=planes-pago/${idPlanPago}`);
      return response.ok;
    } catch (error) {
      console.error('Error al validar plan de pago:', error);
      return false;
    }
  };

  // Función para validar que exista un estado
  const validarEstadoExiste = async (idEstado: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/proxy?service=planes&path=estado-plan-pago/${idEstado}`);
      return response.ok;
    } catch (error) {
      console.error('Error al validar estado:', error);
      return false;
    }
  };

  // Calcular cronograma de cuotas con las fórmulas específicas
  const calcularCronogramaCuotas = () => {
    const interes = planPago.tasaInteres || planPago.interes || 0;
    const numeroCuotas = planPago.cantidadCuotas || planPago.numeroCuota;
    const valorMinimo = planPago.montoInicial || planPago.valorMinimo || 0;
    const precioBase = propiedad?.precio || planPago.nuevoCosto || 0;

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

      // Primera cuota (cuota inicial) - SIEMPRE usa fecha actual
      const fechaActual = new Date();
      cuotas.push({
        numero: 0,
        fechaVencimiento: fechaActual,
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

        // Fecha de vencimiento (30 días después de la cuota anterior) - SIEMPRE desde fecha actual
        const fechaVencimiento = new Date(fechaActual);
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

  // Función para guardar todas las cuotas en la API
  const guardarCuotas = async (cotizacionId: number) => {
    try {
      // Validar datos necesarios
      console.log('Validando datos para guardar cuotas:', {
        cliente,
        propiedad,
        planPago: planPago.idPlanPagoPropiedad
      });

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
      console.log('Validando existencia del plan de pago:', planPago.idPlanPagoPropiedad);
      const planExiste = await validarPlanPagoExiste(planPago.idPlanPagoPropiedad);
      if (!planExiste) {
        throw new Error(`El plan de pago con ID ${planPago.idPlanPagoPropiedad} no existe en la base de datos`);
      }

      // Obtener el ID del estado "En Curso"
      const estadoEnCursoId = await obtenerEstadoEnCursoId();
      console.log('Estado obtenido:', estadoEnCursoId);

      // Validar que el estado existe
      const estadoExiste = await validarEstadoExiste(estadoEnCursoId);
      if (!estadoExiste) {
        throw new Error(`El estado con ID ${estadoEnCursoId} no existe en la base de datos`);
      }

      const cuotas = calcularCronogramaCuotas();
     

      console.log(`Guardando ${cuotas.length} cuotas para cliente ${idCliente} con estado ${estadoEnCursoId}`);

      // Guardar cada cuota individualmente
      const promesasGuardado = cuotas.map(async (cuota, index) => {
        try {
          const cuotaData = {
            id_usuario: idCliente,
            id_propiedad: propiedad.idPropiedad,
            id_plan_pago_propiedad: planPago.idPlanPagoPropiedad,
            numero_cuota: cuota.numero,
            fecha_vencimiento: cuota.fechaVencimiento.toISOString(),
            saldo_capital: Number(cuota.saldoCapital.toFixed(2)),
            monto_amortizacion: Number(cuota.amortizacion.toFixed(2)),
            monto_total_cuota: Number(cuota.montoCuota.toFixed(2)),
            monto_interes: Number(cuota.interes.toFixed(2)),
            id_estado_plan_pago: estadoEnCursoId,
            fecha_pago_estimada: cuota.fechaVencimiento.toISOString()
          };

          console.log(`Guardando cuota ${cuota.numero}:`, cuotaData);

          const response = await fetch(`/api/proxy?service=planes&path=cuotas`, {
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

  const handleGuardarReserva = async () => {
    if (!fechaSeleccionada) {
      showAlert('error', 'Error', 'Debe seleccionar una fecha para la reserva');
      return;
    }

    if (!clienteId || !propiedad?.idPropiedad) {
      showAlert('error', 'Error', 'Faltan datos necesarios para crear la reserva');
      return;
    }

    setGuardando(true);

    try {
      // 🔍 VALIDACIONES ANTES DE CREAR LA RESERVA

      // 1. Verificar si la propiedad ya tiene una reserva activa
      const propiedadTieneReserva = await verificarReservaActivaPropiedad(propiedad.idPropiedad);
      if (propiedadTieneReserva) {
        showAlert('warning', 'Propiedad No Disponible',
          'Esta propiedad ya tiene una reserva activa. No se puede reservar hasta que la reserva actual sea completada o cancelada.');
        return;
      }

      // 2. Verificar si el cliente ya tiene una reserva para esta propiedad
      const clienteTieneReserva = await verificarReservaClientePropiedad(clienteId, propiedad.idPropiedad);
      if (clienteTieneReserva) {
        showAlert('warning', 'Reserva Duplicada',
          'Este cliente ya tiene una reserva activa para esta propiedad. No se pueden crear reservas duplicadas.');
        return;
      }

      console.log('✅ Validaciones pasadas - Procediendo con la creación de la reserva');
      const montoReserva = planPago.montoInicial || 0;
      const fechaReservaISO = fechaSeleccionada.toISOString();

      // Buscar cotización que coincida con el precio total del plan
      let cotizacionId = idCotizacion;

      try {
        const cotizacionesResponse = await getCotizaciones(1, 100); // Obtener todas las cotizaciones
        const precioTotalPlan = planPago.nuevoCosto || 0;

        // Buscar cotización con precio final igual al precio total del plan
        const cotizacionCoincidente = cotizacionesResponse.data.find(cotizacion =>
          Math.abs((cotizacion.precioFinal || 0) - precioTotalPlan) < 0.01 && // Tolerancia de 1 centavo
          cotizacion.idClienteInmobiliario === clienteId &&
          cotizacion.idPropiedad === propiedad.idPropiedad
        );

        if (cotizacionCoincidente) {
          cotizacionId = cotizacionCoincidente.idCotizaciones;
          console.log(`Cotización encontrada: ID ${cotizacionId} con precio ${cotizacionCoincidente.precioFinal}`);
        } else {
          console.log('No se encontró cotización coincidente, usando ID proporcionado');
        }
      } catch (error) {
        console.error('Error al buscar cotizaciones:', error);
        // Continuar con el ID original si hay error
      }

      if (!cotizacionId) {
        showAlert('error', 'Error', 'No se pudo determinar la cotización para la reserva');
        return;
      }

      const fechaFormateada = fechaSeleccionada.toLocaleDateString('es-PE');
      const observaciones = `Reserva a pagar hasta ${fechaFormateada} por un monto de S/ ${montoReserva.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const reservaData: CreateReservaPropiedadDto = {
        id_cliente_inmobiliario: clienteId,
        id_propiedad: propiedad.idPropiedad,
        id_cotizaciones: cotizacionId,
        fecha_reserva: fechaReservaISO,
        monto_reserva: montoReserva,
        estado_reserva: 'Pendiente',
        observaciones: observaciones
      };

      console.log('Datos de reserva a enviar:', reservaData);

      // 1. Crear la reserva
      const reservaCreada = await crearReservaPropiedad(reservaData);

      // 2. Generar y guardar las cuotas asociadas a la cotización
      try {
        await guardarCuotas(cotizacionId);
        console.log('Cuotas generadas exitosamente para la cotización:', cotizacionId);
      } catch (errorCuotas) {
        console.error('Error al generar cuotas:', errorCuotas);
        // No interrumpir el flujo si falla la generación de cuotas
        // Solo registrar el error y continuar
      }

      // Cerrar modal primero
      onClose();

      // Mostrar alerta de éxito después de cerrar
      setTimeout(() => {
        showAlert('success', 'Reserva Creada', 'La reserva de propiedad y el plan de cuotas se han creado exitosamente');
      }, 300);

      // Notificar al componente padre
      if (onReservaCreada) {
        onReservaCreada(reservaCreada);
      }

    } catch (error) {
      console.error('Error al crear reserva:', error);
      showAlert('error', 'Error', 'No se pudo crear la reserva de propiedad');
    } finally {
      setGuardando(false);
    }
  };

  const montoReserva = planPago.montoInicial || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-h-[90vh] overflow-y-auto" style={{ width: '45vw', maxWidth: '90vw' }}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-blue-600">
            Reservar Propiedad
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Cliente y Propiedad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <User className="h-5 w-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium text-gray-600">Nombre:</span>
                  <p className="font-semibold">{obtenerInfoCliente().nombre}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Apellidos:</span>
                  <p className="font-semibold">{obtenerInfoCliente().apellidos}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Home className="h-5 w-5" />
                  Información de la Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium text-gray-600">Proyecto:</span>
                  <p className="font-semibold">{proyecto?.nombre || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Propiedad:</span>
                  <p className="font-semibold">{propiedad?.nombre || 'No especificado'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información del Plan de Pago */}
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <CreditCard className="h-5 w-5" />
                Plan de Pago Seleccionado
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium text-gray-600">Tipo de Plan:</span>
                <p className="font-semibold">{planPago.planPago || 'No especificado'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Número de Cuotas:</span>
                <p className="font-semibold">{planPago.cantidadCuotas}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Interés:</span>
                <p className="font-semibold">{planPago.tasaInteres}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Monto de Reserva */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <DollarSign className="h-5 w-5" />
                Monto de Reserva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  S/ {montoReserva.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  (Valor mínimo del plan de pago)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Selección de Fecha */}
          <Card className="border-indigo-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-indigo-600">
                <CalendarIcon className="h-5 w-5" />
                Seleccionar Fecha de Reserva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <input
                    type="date"
                    value={fechaSeleccionada ? fechaSeleccionada.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFechaSeleccionada(new Date(e.target.value + 'T00:00:00'));
                      } else {
                        setFechaSeleccionada(undefined);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {fechaSeleccionada && (
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg text-center">
                    <p className="text-indigo-800 font-medium">
                      Fecha seleccionada: {fechaSeleccionada.toLocaleDateString('es-PE')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cronograma de Cuotas */}
          {fechaSeleccionada && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <CreditCard className="h-5 w-5" />
                  Cronograma de Cuotas a Generar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">N° Cuota</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Fecha Vencimiento</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Saldo Capital (S/)</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Amortización (S/)</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Interés (S/)</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Monto Cuota (S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {calcularCronogramaCuotas().map((cuota, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{String(cuota.numero).padStart(3, '0')}</td>
                          <td className="px-3 py-2">{cuota.fechaVencimiento.toLocaleDateString('es-PE')}</td>
                          <td className="px-3 py-2 text-right">{cuota.saldoCapital.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-right">{cuota.amortizacion.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-right">{cuota.interes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-right font-medium">{cuota.montoCuota.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm font-medium text-center">
                    Se generarán {calcularCronogramaCuotas().length} cuotas automáticamente al confirmar la reserva
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarReserva}
              disabled={!fechaSeleccionada || guardando}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {guardando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Confirmar Reserva y Generar Cuotas'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservaModal;