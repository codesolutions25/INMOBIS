import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle } from "lucide-react";
import { Pago } from "../types";
import { DollarSign } from "lucide-react";
import { PagoModal } from "./PagoModal";
import { getCuotasPorPlanPago } from "@/services/apiCuotas";
import { Cuota } from "@/services/apiCuotas";
import { calcularMora } from "@/services/apiMora";
import { Badge } from "@/components/ui/badge";
import { useCompany } from "@/contexts/CompanyContext";
import { cn } from "@/lib/utils";

interface Cliente {
  id?: number | string;
  nombre?: string;
  documento?: string;
  telefono?: string;
  email?: string;

  // Agrega más campos según sea necesario
}

interface PagosPendientesProps {
  reserva: {
    id: string | number;
    idEmpresa?: number;
    lote?: string | {
      nombre?: string;
      manzana?: string;
      precio?: number;
    };
    proyecto?: string | {
      nombre?: string;
    };
    cliente?: string | Cliente;
  } | null;
  cuotas: Cuota[];
  isLoading?: boolean;
  onPagoRealizado?: (reserva: any) => void;
  cliente?: Cliente | string; // Nuevo prop para el cliente
  idPlanPagoPropiedad?: number;
  aplicaMora?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function PagosPendientes({
  reserva,
  cuotas = [],
  isLoading = false,
  onPagoRealizado,
  cliente: clienteProp,
  idPlanPagoPropiedad,
  aplicaMora = false
}: PagosPendientesProps) {
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [moraCalculada, setMoraCalculada] = useState<Record<string, { montoMora: number, diasMora: number, montoTotal: number }>>({});
  const [cuotasConMora, setCuotasConMora] = useState<Cuota[]>([]);
  const [isLoadingMora, setIsLoadingMora] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);



  if (!reserva) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagos Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Seleccione una reserva para ver los pagos pendientes.</p>
        </CardContent>
      </Card>
    );
  }

  // Helper function to safely get lote name
  const getLoteNombre = () => {
    if (!reserva?.lote) return 'N/A';
    if (typeof reserva.lote === 'string') return reserva.lote;
    return reserva.lote.nombre || 'N/A';
  };

  // Mapear las cuotas al formato de Pago
  const getCuotaProp = (cuota: any, prop: string) => {
    if (!cuota) return undefined;
    const snakeCaseProp = prop.replace(/([A-Z])/g, '_$1').toLowerCase();
    return cuota[snakeCaseProp] !== undefined ? cuota[snakeCaseProp] : cuota[prop];
  };

  // Estado para el ID del estado pendiente
  const [pendingStatusId, setPendingStatusId] = useState<number>(1);

  // Obtener el ID del estado pendiente desde la API
  useEffect(() => {
    const fetchEstadoPendiente = async () => {
      try {
        const response = await fetch('api/proxy?service=estado_plan_pago_pendiente');
        if (!response.ok) throw new Error('Error al obtener el estado pendiente');
        const data = await response.json();
        const statusId = data?.data?.[0]?.idEstadoPlanPago;
        if (statusId) setPendingStatusId(statusId);
      } catch (error) {
        console.error('Error fetching PENDING_STATUS_ID:', error);
      }
    };

    fetchEstadoPendiente();
  }, []);

  // Filtrar y ordenar las cuotas
  const cuotasProcesadas = useMemo(() => {
    if (isLoading || !cuotas) return [];

    // Filtrar cuotas pendientes usando el ID del estado pendiente
    const pendientes = cuotas.filter(cuota => 
      Number(getCuotaProp(cuota, 'idEstadoPlanPago')) === pendingStatusId
    );

    // Ordenar por número de cuota y asegurar que sean números
    return [...pendientes]
      .sort((a, b) =>
        (Number(getCuotaProp(a, 'numeroCuota')) || 0) - (Number(getCuotaProp(b, 'numeroCuota')) || 0)
      )
      .map((cuota, index) => ({
        ...cuota,
        // Forzar el número de cuota a ser un número secuencial basado en el índice
        numeroCuota: index + 1
      }));
  }, [cuotas, isLoading]);

  // Calcular el total de páginas
  const totalPages = Math.max(1, Math.ceil(cuotasProcesadas.length / ITEMS_PER_PAGE));

  // Manejar el cambio de página
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Obtener la empresa seleccionada
  const { selectedCompany } = useCompany();

  // Obtener el ID del cliente de la reserva o del prop
  const clienteId = useMemo(() => {
    if (!clienteProp) return undefined;
    return typeof clienteProp === 'string' ? clienteProp : 'id' in clienteProp ? clienteProp.id : undefined;
  }, [clienteProp]);

  // Usar el ID de empresa de la reserva o del selector de empresa
  const idEmpresa = reserva?.idEmpresa || selectedCompany?.idEmpresa;

  // Efecto para calcular la mora cuando cambian las cuotas, la empresa seleccionada o el día actual
  useEffect(() => {
    let isMounted = true;

    
    setIsLoadingMora(true);

    // Obtener la fecha actual sin horas/minutos/segundos para comparación
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Función para normalizar fechas a inicio del día (UTC) y comparar solo fechas
    const normalizeDate = (date: Date | string): Date => {
      const d = new Date(date);
      // Establecer a inicio del día en hora local
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    // Función para calcular días de mora considerando solo fechas completas
    const calcularDiasMora = (fechaVencimiento: Date | string, fechaActual: Date | string): number => {
      const fechaVenc = normalizeDate(fechaVencimiento);
      const fechaAct = normalizeDate(fechaActual);

      // Si la fecha actual es menor o igual a la de vencimiento, no hay mora
      if (fechaAct <= fechaVenc) return 0;

      // Calcular diferencia en días
      const diffTime = fechaAct.getTime() - fechaVenc.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays > 0 ? diffDays : 0;
    };

    // Función para actualizar el estado con los nuevos cálculos
    const actualizarEstadoConMora = (nuevosCalculos: any, cuotasActualizadas: any[]) => {
      if (!isMounted) return;

      // Actualizar el estado de mora calculada
      setMoraCalculada(prev => ({
        ...prev,
        ...nuevosCalculos
      }));

      // Actualizar cuotas con los nuevos cálculos
      setCuotasConMora(prevCuotas => {
        const updated = [...prevCuotas];
        let hasChanges = false;

        cuotasActualizadas.forEach((cuota, index) => {
          if (JSON.stringify(cuota) !== JSON.stringify(prevCuotas[index])) {
            updated[index] = cuota;
            hasChanges = true;
          }
        });

        if (hasChanges) {
          console.log('Cuotas actualizadas con mora calculada');
          return updated;
        }
        console.log('No hay cambios en las cuotas después del cálculo de mora');
        return prevCuotas;
      });

      setIsLoadingMora(false);
    };

    const calcularMoraParaCuotas = async (): Promise<{ nuevosCalculos: any, cuotasActualizadas: any[] }> => {
      const nuevosCalculos: Record<string, { montoMora: number, diasMora: number, montoTotal: number }> = {};
      const cuotasActualizadas = [...cuotasProcesadas];

      try {
        for (let i = 0; i < cuotasProcesadas.length; i++) {
          const cuota = cuotasProcesadas[i];
          const idCuota = getCuotaProp(cuota, 'idCuota')?.toString();
          const montoCuota = getCuotaProp(cuota, 'montoTotalCuota') || 0;
          const fechaVencimiento = getCuotaProp(cuota, 'fechaVencimiento');

          if (fechaVencimiento && idCuota) {
            try {

              // Crear fecha de vencimiento a inicio del día (UTC)
              const fechaVenc = new Date(fechaVencimiento);
              const fechaVencNormalizada = normalizeDate(fechaVenc);
              const hoyNormalizado = normalizeDate(now);

              // Calcular días de mora basados solo en fechas completas

              const diasMora = calcularDiasMora(fechaVencNormalizada, now);

              // Solo calcular mora si hay días de mora y aplicaMora es true
              let montoMora = 0;
              let montoTotal = montoCuota;

            

              if (diasMora > 0 && aplicaMora === true) {


                // Llamar a la función de cálculo de mora con la fecha actual
                const resultadoMora = await calcularMora(
                  fechaVencNormalizada,
                  montoCuota,
                  selectedCompany?.idEmpresa,
                  now
                );

                montoMora = resultadoMora.montoMora || 0;


                montoTotal = montoCuota + montoMora;
                if (!aplicaMora) {
                  montoMora = 0;
                }
              } else {
                console.log('No hay días de mora');
              }

              const calculoMora = {
                montoMora,
                diasMora,
                montoTotal,
                estaVencido: diasMora > 0
              };

              // Actualizar la cuota con los días de mora y el estado de vencimiento
              const cuotaActualizada = {
                ...cuota,
                diasMora: calculoMora.diasMora || 0,
                montoMora: calculoMora.montoMora || 0,
                estaVencido: calculoMora.estaVencido || false,
                // Forzar actualización de monto total si es necesario
                montoTotal: (montoCuota + (calculoMora.montoMora || 0))
              };


              cuotasActualizadas[i] = cuotaActualizada;



              nuevosCalculos[idCuota] = {
                montoMora: calculoMora.montoMora || 0,
                diasMora: calculoMora.diasMora || 0,
                montoTotal: calculoMora.montoTotal || montoCuota
              };
            } catch (error) {
              console.error(`Error al calcular mora para cuota ${idCuota}:`, error);
              nuevosCalculos[idCuota] = {
                montoMora: 0,
                diasMora: 0,
                montoTotal: montoCuota
              };
            }
          }
        }




        return { nuevosCalculos, cuotasActualizadas };
      } catch (error) {
        console.error('Error en el cálculo de mora:', error);
        throw error; // Re-lanzar el error para manejarlo en el llamador
      }
    };

    // Llamar a la función de cálculo
    (async () => {
      try {
        const { nuevosCalculos, cuotasActualizadas } = await calcularMoraParaCuotas();

        if (isMounted) {

          actualizarEstadoConMora(nuevosCalculos, cuotasActualizadas);

        }
      } catch (error) {
        console.error('Error al calcular mora:', error);
        if (isMounted) {
          setIsLoadingMora(false);
        }
      }
    })();



    // Limpieza al desmontar
    return () => {
      isMounted = false;
    };


  }, [cuotasProcesadas, selectedCompany?.idEmpresa, new Date().getDate()]); // Agregamos el día actual como dependencia

  // Obtener las cuotas para la página actual con cálculo de mora
  const pagos = useMemo(() => {


    if (isLoading || isLoadingMora) return [];

    const cuotasFuente = cuotasConMora.length > 0 ? cuotasConMora : cuotasProcesadas;


    if (!cuotasFuente.length) {
      console.log('No hay cuotas en la fuente');
      return [];
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const cuotasPagina = cuotasFuente.slice(startIndex, startIndex + ITEMS_PER_PAGE);


    // Mapear las cuotas al formato de pago con cálculo de mora
    return cuotasPagina.map((cuota: any, index: number) => {
      const idCuota = getCuotaProp(cuota, 'idCuota')?.toString() || '';
      const numeroCuota = getCuotaProp(cuota, 'numeroCuota');
      const idEstadoPlanPago = getCuotaProp(cuota, 'idEstadoPlanPago');
      const montoCuota = getCuotaProp(cuota, 'montoTotalCuota') || 0;
      const fechaVencimiento = getCuotaProp(cuota, 'fechaVencimiento');

      // Obtener valores de mora calculados previamente
      const calculoMora = moraCalculada[idCuota] || { montoMora: 0, diasMora: 0, montoTotal: montoCuota };
      const montoMora = calculoMora.montoMora;
      const diasMora = calculoMora.diasMora || 0; // Default to 0 if undefined
      const montoTotalConMora = calculoMora.montoTotal;

      return {
        id: getCuotaProp(cuota, 'idCuota')?.toString() || '',
        idCuota: getCuotaProp(cuota, 'idCuota')?.toString() || '',
        numeroCuota: numeroCuota || index + 1,
        concepto: `Cuota ${numeroCuota || index + 1}`,
        saldoCapital: getCuotaProp(cuota, 'saldoCapital') || 0,
        amortizacion: getCuotaProp(cuota, 'montoAmortizacion') || 0,
        interes: getCuotaProp(cuota, 'montoInteres') || 0,
        montoPagar: montoCuota,
        monto: montoCuota,
        fecha: fechaVencimiento || '',
        estado: idEstadoPlanPago === 1 ? (diasMora > 0 ? 'Vencido' : 'Pendiente') :
          idEstadoPlanPago === 2 ? 'Pagado' :
            idEstadoPlanPago === 3 ? 'Cancelado' :
              idEstadoPlanPago === 4 ? 'Vencido' :
                `Estado ${idEstadoPlanPago}`,
        diasMora: diasMora,
        mora: montoMora,
        montoMora: montoMora, // Asegurarse de que montoMora esté disponible en el objeto
        totalPagar: montoTotalConMora,
        fechaPago: getCuotaProp(cuota, 'fechaPagoEstimada') || '',
        nroItem: index + 1,
        descripcion: getCuotaProp(cuota, 'descripcion') || '',
        _estado_original: idEstadoPlanPago
      } as Pago & { _estado_original?: number; diasMora?: number };
    });
  }, [cuotas, currentPage, isLoading, cuotasProcesadas, cuotasConMora, moraCalculada]);

  const handlePagar = (pago: Pago) => {
    // Verificar si el cliente existe
    if (!clienteProp) {
      console.error('No se puede realizar el pago: cliente no especificado');
      return;
    }

    // Obtener el ID del cliente de manera segura
    const clienteId = typeof clienteProp === 'string' ?
      clienteProp :
      'id' in clienteProp ? clienteProp.id : null;

    if (!clienteId) {
      console.error('No se puede realizar el pago: ID de cliente no válido');
      return;
    }
    setSelectedPago(pago);
    setIsModalOpen(true);
  };

  // Manejador para el clic en el botón de pago
  const handlePagarClick = (pago: Pago) => {
    handlePagar(pago);
  };

  const handlePagoCompletado = () => {
    if (onPagoRealizado) {
      onPagoRealizado(reserva);
    }
    setIsModalOpen(false);
  };

  if (isLoading) {
    const getLoteLoadingText = () => {
      if (!reserva?.lote) return '';
      if (typeof reserva.lote === 'string') return ` - ${reserva.lote}`;
      return ` - ${reserva.lote.nombre || ''}`;
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagos Pendientes{getLoteLoadingText()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">Cargando pagos pendientes...</p>
        </CardContent>
      </Card>
    );
  }

  if (!cuotasProcesadas || cuotasProcesadas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagos Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">No hay pagos pendientes</p>
        </CardContent>
      </Card>
    );
  }

  // Función para obtener la clase CSS según el estado de la cuota
  const getEstadoCuotaClass = (fechaVencimiento?: string, estado?: string, estaVencido?: boolean) => {
    if (estado === 'Pagado') return 'bg-green-50';
    if (estaVencido) return 'bg-red-50';
    if (!fechaVencimiento) return '';

    const fechaVenc = new Date(fechaVencimiento);
    const hoy = new Date();

    // Usar la fecha normalizada para la comparación
    const fechaVencNormalizada = new Date(Date.UTC(fechaVenc.getFullYear(), fechaVenc.getMonth(), fechaVenc.getDate()));
    const hoyNormalizado = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));

    return fechaVencNormalizada < hoyNormalizado ? 'bg-red-50' : '';
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Pagos Pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Saldo Capital</TableHead>
                <TableHead>Amortización</TableHead>
                <TableHead>Interés</TableHead>
                <TableHead>Monto a Pagar</TableHead>
                <TableHead>Fecha de Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Mora</TableHead>
                <TableHead>Total a Pagar</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isLoadingMora ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center">
                    Cargando cuotas...
                  </TableCell>
                </TableRow>
              ) : !pagos || pagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center">
                    {cuotasProcesadas.length === 0 ? 'No hay cuotas pendientes' : 'No hay pagos para mostrar'}
                  </TableCell>
                </TableRow>
              ) : (
                pagos.map((pago: Pago, index: number) => {
                  const isLate = pago.estado === 'Vencido' || (typeof pago.diasMora !== 'undefined' && pago.diasMora > 0);
                  return (
                    <TableRow
                      key={pago.id}
                      className={cn(
                        isLate ? 'bg-red-50 hover:bg-red-100' : '',
                        getEstadoCuotaClass(pago.fecha, pago.estado, pago._estado_original === 4)
                      )}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{pago.concepto}</span>
                          {(pago.estado === 'Vencido' && (pago.diasMora && pago.diasMora > 0)) && (
                            <span className="text-xs text-red-600 flex items-center mt-1">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {pago.diasMora} día{pago.diasMora !== 1 ? 's' : ''} {aplicaMora ? ' de mora' : ' de atraso'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>S/ {pago.saldoCapital?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</TableCell>
                      <TableCell>S/ {pago.amortizacion?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</TableCell>
                      <TableCell>S/ {pago.interes?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</TableCell>
                      <TableCell className="font-medium">S/ {pago.montoPagar?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {pago.fecha
                            ? new Date(pago.fecha).toLocaleDateString('es-PE', {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit'
                            })
                            : 'Pendiente'}
                          {(pago.diasMora || 0) > 0 && (
                            <span className="text-xs text-red-600">Vencido</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pago.estado === 'Pagado' ? 'default' :
                              (pago.diasMora || 0) > 0 ? 'destructive' : 'secondary'
                          }
                          className="whitespace-nowrap"
                        >
                          {pago.estado || 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pago.mora > 0 ? (
                          <div className="flex flex-col">
                            <span>S/ {pago.mora.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-xs text-red-600">({pago.diasMora} día{pago.diasMora !== 1 ? 's' : ''})</span>
                          </div>
                        ) : 'S/ 0.00'}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>S/ {pago.totalPagar?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                          {pago.mora > 0 && (
                            <span className="text-xs text-muted-foreground">
                              (Cuota: S/ {pago.montoPagar?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) + Mora
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={pago.estado === 'Vencido' ? 'destructive' : 'default'}
                          size="sm"
                          className="w-full"
                          onClick={() => handlePagarClick(pago)}
                          disabled={pago.estado === 'Pagado'}
                        >
                          {pago.estado === 'Pagado' ? 'Pagado' : 'Pagar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, cuotasProcesadas.length)}
              </span>{' '}
              de <span className="font-medium">{cuotasProcesadas.length}</span> pagos
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Ir a la primera página</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Página anterior</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <span className="sr-only">Página siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <span className="sr-only">Ir a la última página</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <PagoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPagoRealizado={handlePagoCompletado}
        pago={selectedPago}
        lote={getLoteNombre()}
        idPlanPagoPropiedad={idPlanPagoPropiedad}
        propiedad={reserva && 'propiedad' in reserva ? (reserva as any).propiedad : 'N/A'}
        proyecto={typeof reserva.proyecto === 'string'
          ? reserva.proyecto
          : (reserva.proyecto?.nombre || 'N/A')}
        cliente={typeof clienteProp === 'object'
          ? (clienteProp?.nombre || 'Cliente no especificado')
          : (typeof reserva.cliente === 'object'
            ? (reserva.cliente?.nombre || 'Cliente no especificado')
            : (reserva.cliente || 'Cliente no especificado')
          )}
        idcliente={typeof clienteProp === 'object' && clienteProp !== null && 'id' in clienteProp ? Number(clienteProp.id) : undefined}
      />
    </Card>
  );
}