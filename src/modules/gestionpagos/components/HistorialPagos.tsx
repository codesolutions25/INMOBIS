import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cuota } from "@/services/apiCuotas";
import { Printer, Download } from "lucide-react";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { HistorialPagosPDF } from "./HistorialPagosPDF";
import { ReciboPagoPDF } from "./ReciboPagoPDF";
import { useCompany } from "@/contexts/CompanyContext";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { calcularMora } from "@/services/apiMora";

interface HistorialPagosProps {
  cuotas: Cuota[];
  lote: string;
  reserva: any;
  cliente: any;
}

interface VentaInfo {
  id_venta: number;
  total: string;
  fecha_emision: string;
  serie: string;
  correlativo: string;
  id_estado_venta: number;
}

export function HistorialPagos({ cuotas, lote, reserva, cliente }: HistorialPagosProps) {
  const { selectedCompany } = useCompany();
  const [canceledStatusId, setCanceledStatusId] = useState<number | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);
  const [ventasInfo, setVentasInfo] = useState<Record<number, VentaInfo>>({});
  const [moraCalculada, setMoraCalculada] = useState<Record<string, { montoMora: number, diasMora: number, montoTotal: number }>>({});
  const [isLoadingMora, setIsLoadingMora] = useState(false);
  
  // Obtener los IDs de estado desde la API
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        // Obtener estado Cancelado
        const canceladoResponse = await fetch('/api/proxy?service=estado_plan_pago_cancelado');

        if (!canceladoResponse.ok) throw new Error('Error al obtener el estado cancelado');
        const canceladoData = await canceladoResponse.json();

        const canceladoId = canceladoData?.data?.[0]?.idEstadoPlanPago;
        if (canceladoId) setCanceledStatusId(canceladoId);

        // Obtener estado Pendiente
        const pendienteResponse = await fetch('/api/proxy?service=estado_plan_pago_pendiente');

        if (!pendienteResponse.ok) throw new Error('Error al obtener el estado pendiente');
        const pendienteData = await pendienteResponse.json();
        const pendienteId = pendienteData?.data?.[0]?.idEstadoPlanPago;
        if (pendienteId) setPendingStatusId(pendienteId);
      } catch (error) {
        console.error('Error fetching status IDs:', error);
      }
    };

    fetchEstados();
  }, []);
 
  // Función para obtener y filtrar ventas por número de cuota
  const fetchVentas = async () => {
    try {
      // Obtener todas las ventas
      const response = await fetch('/api/proxy?service=ventas&path=ventas');
      if (!response.ok) throw new Error('Error al obtener las ventas');
      
      const data = await response.json();
      const ventas = Array.isArray(data.data) ? data.data : [];
      // Crear un mapeo de id_cuota a venta
      const ventasMap: Record<number, VentaInfo> = {};
      
      cuotas.forEach(cuota => {
        if (cuota.idCuota) {
          const venta = ventas.find((v: any) => v.numero_cuota === cuota.idCuota);
          if (venta) {
            ventasMap[cuota.idCuota] = {
              id_venta: venta.id_venta,
              total: venta.total,
              fecha_emision: venta.fecha_emision,
              serie: venta.serie,
              correlativo: venta.correlativo,
              id_estado_venta: venta.id_estado_venta
            };
          }
        }
      });
      setVentasInfo(ventasMap);
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      return [];
    }
  };

  // Efecto para cargar ventas cuando cambian las cuotas
  useEffect(() => {
    if (cuotas.length > 0) {
      fetchVentas();
    }
  }, [cuotas]);

  // Función para normalizar fechas a inicio del día (UTC) y comparar solo fechas
  const normalizeDate = useCallback((date: Date | string): Date => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // Función para calcular días de mora considerando solo fechas completas
  const calcularDiasMora = useCallback((fechaVencimiento: Date | string, fechaActual: Date | string): number => {
    const fechaVenc = normalizeDate(fechaVencimiento);
    const fechaAct = normalizeDate(fechaActual);

    // Si la fecha actual es menor o igual a la de vencimiento, no hay mora
    if (fechaAct <= fechaVenc) return 0;

    // Calcular diferencia en días
    const diffTime = fechaAct.getTime() - fechaVenc.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }, [normalizeDate]);

  // Calcular mora para cada cuota
  useEffect(() => {
    let isMounted = true;

    const calcularMoraParaCuotas = async () => {
      if (!cuotas.length || !selectedCompany?.idEmpresa) {
        return;
      }

      setIsLoadingMora(true);
      const now = new Date();
      const nuevosCalculos: Record<string, { montoMora: number, diasMora: number, montoTotal: number }> = {};

      try {
        for (const cuota of cuotas) {
          const idCuota = cuota.idCuota?.toString();
          const montoCuota = (cuota as any).monto_total_cuota || (cuota as any).montoTotalCuota || 0;
          const fechaVencimiento = cuota.fechaVencimiento;

          if (fechaVencimiento && idCuota) {
            const fechaVencNormalizada = normalizeDate(fechaVencimiento);
            const diasMora = calcularDiasMora(fechaVencNormalizada, now);
            let montoMora = 0;
            let montoTotal = montoCuota;

            if (diasMora > 0) {
              try {
                const resultadoMora = await calcularMora(
                  fechaVencNormalizada,
                  montoCuota,
                  selectedCompany.idEmpresa,
                  now
                );
                montoMora = resultadoMora.montoMora || 0;
                montoTotal = montoCuota + montoMora;
              } catch (error) {
                console.error('Error al calcular mora:', error);
              }
            }

            nuevosCalculos[idCuota] = {
              montoMora,
              diasMora,
              montoTotal
            };
          }
        }

        if (isMounted) {
          setMoraCalculada(prev => ({
            ...prev,
            ...nuevosCalculos
          }));
        }
      } catch (error) {
        console.error('Error en el cálculo de mora:', error);
      } finally {
        if (isMounted) {
          setIsLoadingMora(false);
        }
      }
    };

    calcularMoraParaCuotas();

    return () => {
      isMounted = false;
    };
  }, [cuotas, selectedCompany, normalizeDate, calcularDiasMora]);

  // Ordenar y filtrar cuotas por numeroCuota
  const cuotasFiltradas = useMemo(() => {
    if (!pendingStatusId) return [];
    
    return [...cuotas]
      .sort((a: any, b: any) => a.numeroCuota - b.numeroCuota)
      .filter((cuota: any) => cuota.idEstadoPlanPago !== pendingStatusId);
  }, [cuotas, pendingStatusId]);

  if (cuotasFiltradas.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Historial de Pagos - Lote {lote}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">No hay pagos registrados con estado diferente a pendiente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Historial de Pagos</CardTitle>
          <p className="text-sm text-gray-500">
            {cliente?.nombres} - Lote: {lote}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          asChild
        >
          <PDFDownloadLink
            document={
              <HistorialPagosPDF 
                cuotas={cuotasFiltradas} 
                lote={lote}
                cliente={cliente?.nombres || 'Cliente'}
                proyecto={reserva?.proyecto?.nombre || 'Proyecto'}
                ventasInfo={ventasInfo}
                moraCalculada={moraCalculada}
                canceledStatusId={canceledStatusId}
                pendingStatusId={pendingStatusId}
              />
            }
            fileName={`historial-pagos-${(cliente?.nombres || 'cliente').toLowerCase().replace(/\s+/g, '-')}-lote-${lote}.pdf`}
          >
            {({ loading }) => (
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {loading ? 'Generando...' : ' PDF'}
              </div>
            )}
          </PDFDownloadLink>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
        <Table className="min-w-[1200px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="min-w-[120px]">Concepto</TableHead>
              <TableHead className="min-w-[100px]">Saldo Capital</TableHead>
              <TableHead className="min-w-[100px]">Amortización</TableHead>
              <TableHead className="min-w-[80px]">Interés</TableHead>
              <TableHead className="min-w-[120px]">Monto Pagado</TableHead>
              <TableHead className="min-w-[120px]">Fecha de Pago</TableHead>
              <TableHead className="min-w-[100px]">Estado</TableHead>
              <TableHead className="min-w-[80px]">Mora</TableHead>
              <TableHead className="min-w-[120px]">Total Pagado</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cuotasFiltradas.map((cuota:any) => (
                <TableRow key={cuota.idCuota}>
                  <TableCell>{cuota.numeroCuota === 0 ? 'Inicial' : cuota.numeroCuota}</TableCell>
                  <TableCell>{cuota.numeroCuota === 0 ? 'Cuota Inicial' : `Cuota ${cuota.numeroCuota}`}</TableCell>
                  <TableCell>S/ {((cuota as any).saldo_capital ?? (cuota as any).saldoCapital)?.toLocaleString() || '0'}</TableCell>
                  <TableCell>S/ {((cuota as any).monto_amortizacion ?? (cuota as any).montoAmortizacion)?.toLocaleString() || '0'}</TableCell>
                  <TableCell>S/ {((cuota as any).monto_interes ?? (cuota as any).montoInteres)?.toLocaleString() || '0'}</TableCell>
                  <TableCell>S/ {((cuota as any).monto_total_cuota ?? (cuota as any).montoTotalCuota)?.toLocaleString() || '0'}</TableCell>
                  <TableCell>
                    {ventasInfo[cuota.idCuota]?.fecha_emision 
                      ? new Date(ventasInfo[cuota.idCuota].fecha_emision).toLocaleString('es-PE', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ventasInfo[cuota.idCuota]?.id_estado_venta === 1 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ventasInfo[cuota.idCuota]?.id_estado_venta === 1 ? 'Pagado' : 'Pendiente'}
                    </span>
                  </TableCell>
                  
                  <TableCell className="font-medium">
                    {moraCalculada[cuota.idCuota]?.montoMora ? `S/ ${moraCalculada[cuota.idCuota].montoMora.toFixed(2)}` : 'S/ 0.00'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {moraCalculada[cuota.idCuota]?.montoTotal ? `S/ ${moraCalculada[cuota.idCuota].montoTotal.toFixed(2)}` : `S/ ${Number((cuota as any).monto_total_cuota || (cuota as any).montoTotalCuota || 0).toFixed(2)}`}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <PDFDownloadLink
                      document={
                        <ReciboPagoPDF
                          pago={{
                            id: cuota.idCuota,
                            nroItem: cuota.numeroCuota,
                            montoPagar: (cuota as any).monto_total_cuota || (cuota as any).montoTotalCuota || 0,
                            mora: moraCalculada[cuota.idCuota]?.montoMora || 0,
                            totalPagar: moraCalculada[cuota.idCuota]?.montoTotal || (cuota as any).monto_total_cuota || (cuota as any).montoTotalCuota || 0,
                            concepto: cuota.numeroCuota === 0 ? 'Cuota Inicial' : `Cuota ${cuota.numeroCuota}`
                          }}
                          cliente={`${cliente?.nombres || ''} ${cliente?.apellidoPaterno || ''} ${cliente?.apellidoMaterno || ''}`.trim() || 'Cliente no disponible'}
                          proyecto={reserva?.proyecto?.nombre || 'Proyecto no disponible'}
                          propiedad={cliente?.direccion || 'No especificado'}
                          lote={lote || 'N/A'}
                          montoEntregado={(cuota as any).monto_total_cuota || (cuota as any).montoTotalCuota || 0}
                          tipoOperacion="efectivo"
                          numeroOperacion=""
                          vuelto={0}
                          empresa={selectedCompany ? {
                            razonSocial: selectedCompany.razonSocial || 'INMOBILIARIA',
                            ruc: `RUC: ${selectedCompany.ruc || '20123456789'}`,
                            direccion: selectedCompany.direccion || 'Av. Principal 123 - Lima',
                            telefono: `Teléfono: ${selectedCompany.telefono || '(01) 123-4567'}`,
                            email: 'contacto@inmobiliaria.com',
                            logoUrl: selectedCompany.logoUrl
                          } : undefined}
                        />
                      }
                      fileName={`recibo-${cuota.numeroCuota}-${Date.now()}.pdf`}
                    >
                      {({ loading, url, error }) => {
                        if (error) {
                          console.error('Error al generar el PDF:', error);
                          return (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-red-500"
                              title="Error al generar PDF"
                              disabled
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          );
                        }
                        
                        return (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            title={loading ? 'Generando...' : 'Imprimir recibo'}
                            disabled={loading}
                            onClick={(e) => {
                              if (url) {
                                window.open(url, '_blank');
                              }
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        );
                      }}
                    </PDFDownloadLink>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </CardContent>
    </Card>
  );
}
