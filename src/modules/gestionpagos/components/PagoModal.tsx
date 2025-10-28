import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Label";
import { Combobox } from "@/components/ui/combobox";
import { Pago } from "../types";
import { getCajas } from "@/services/apiCajas";
import { getCajasUsuario } from "@/services/apiCajaUsuario";
import { Caja } from "@/types/cajas";
import { CajaUsuario } from "@/types/cajausuario";
import { useAuth } from "@/contexts/AuthContext";
import { getTiposCaja } from "@/services/apiTiposCaja";
import { useCompany } from "@/contexts/CompanyContext";
import { createVenta } from "@/services/apiVentas";
import { createDetalleVenta } from "@/services/apiDetalleVentas";
import { actualizarCuota } from "@/services/apiCuotas";
import { createCajaMovimiento } from "@/services/apiCajaMovimientos";
import { toast } from "sonner";
import { getTiposPago } from "@/services/apiTipoPago";
import { TipoPago } from "@/types/tipospago";


// Extend the Caja type to include empresa_id for filtering
type CajaConEmpresa = Caja & {
  empresa_id?: number;
};

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pago: Pago | null;
  onPagoRealizado?: () => void;
  cliente?: string;
  proyecto?: string;
  propiedad?: string;
  lote?: string;
  idPlanPagoPropiedad?: number;
  idcliente?: number;
}

export function PagoModal({
  isOpen,
  onClose,
  pago,
  onPagoRealizado,
  cliente = '',
  proyecto = '',
  propiedad = '',
  lote = '',
  idPlanPagoPropiedad = 0,
  idcliente = 0
}: PagoModalProps) {
  const [montoEntregado, setMontoEntregado] = useState<number>(0);
  const [tipoOperacion, setTipoOperacion] = useState<string>('efectivo');
  const [numeroOperacion, setNumeroOperacion] = useState<string>('');
  const [cajas, setCajas] = useState<CajaConEmpresa[]>([]);
  const [selectedCaja, setSelectedCaja] = useState<string>('');
  const [tiposCaja, setTiposCaja] = useState<{ value: string, label: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { user } = useAuth();
  const { selectedCompany } = useCompany();

  const [metodosPago, setMetodosPago] = useState<{ label: string; value: string; id: number }[]>([]);

  // Fetch payment types from API
  useEffect(() => {
    const fetchTiposPago = async () => {
      try {
        setIsLoading(true);
        const response = await getTiposPago(1, 1000);
        const tipos = response.data.map((tipo: TipoPago) => ({
          label: tipo.nombre,
          value: tipo.nombre.toLowerCase(),
          id: tipo.id_tipo_pago
        }));
        setMetodosPago(tipos);
        
        // Set default payment type if available
        const efectivoTipo = tipos.find((t: any) => t.value.includes('Efectivo'));
        if (efectivoTipo) {
          setTipoOperacion(efectivoTipo.value);
        }
      } catch (error) {
        console.error('Error al cargar los tipos de pago:', error);
       
      }
    };

    fetchTiposPago();
  }, []);

  // Fetch cajas ejecutivas del usuario
  useEffect(() => {
    const fetchCajas = async () => {
      if (!user || !selectedCompany) return;

      setIsLoading(true);
      try {
        // Obtener cajas asignadas al usuario actual
        
        const cajasUsuarioResponse = await getCajasUsuario(1, 1000);

        // Filtrar solo las cajas del usuario actual
        const cajasUsuario = (cajasUsuarioResponse?.data || []).filter(
          (cu: CajaUsuario) => cu.id_usuario === user.id
        );

        

        if (cajasUsuario.length === 0) {
          
          setTiposCaja([]);
          return;
        }

        // Obtener todas las cajas
        const cajasResponse = await getCajas();
        const todasLasCajas: CajaConEmpresa[] = (cajasResponse?.data || []).map(caja => ({
          ...caja,
          empresa_id: (caja as any).empresa_id || selectedCompany?.idEmpresa
        }));

        // Obtener tipos de caja para filtrar por tipo 'ejecutiva'
        const tiposCajaResponse = await getTiposCaja();
        
        const tiposCaja = tiposCajaResponse?.data || [];
        const tipoEjecutiva = tiposCaja.find(t =>
          t.nombre_tipo_caja?.toLowerCase().includes('ejecutivo')
        );

        

        if (!tipoEjecutiva) {
          console.error('No se encontró el tipo de caja ejecutiva');
          return;
        }

       
        // Obtener el ID del estado 'Abierta' desde la API usando la variable de entorno
        let estadoAbiertaId = 1; // Valor por defecto
        try {
          const response = await fetch('api/proxy?service=estado_caja_abierta');
          if (response.ok) {
            const data = await response.json();
            estadoAbiertaId = data.data[0]?.id_estado_caja || 1;
          }
        } catch (error) {
          console.error('Error al obtener el estado de caja abierta:', error);
        }
          
        const cajasFiltradas = todasLasCajas.filter((caja: CajaConEmpresa) => {
          const esAsignada = cajasUsuario.some((cu: CajaUsuario) => cu.id_caja === caja.id_caja);
          const esEjecutiva = caja.id_tipo_caja === tipoEjecutiva.id_tipo_caja;
          const esDeLaEmpresa = caja.empresa_id === selectedCompany?.idEmpresa;
          const estaAbierta = caja.id_estado_caja === estadoAbiertaId;
          
          return esAsignada && esEjecutiva && esDeLaEmpresa && estaAbierta;
        });

        setCajas(cajasFiltradas);

        // Crear opciones para el combobox
        const opcionesCajas = cajasFiltradas.map(caja => ({
          value: caja.id_caja?.toString() || '',
          label: caja.nombre_caja || `Caja ${caja.id_caja}`
        }));

        setTiposCaja(opcionesCajas);
      } catch (error) {
        console.error('Error al cargar las cajas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCajas();
  }, [user, selectedCompany]);

  const vuelto = useMemo(() => {
    if (!pago) return 0;
    return Math.max(0, montoEntregado - (pago.totalPagar || 0));
  }, [montoEntregado, pago]);

  if (!pago) return null;

  const handleSavePago = async () => {
    if (!pago) return;
    
    try {
      setIsSaving(true);
      
      if (!selectedCompany) {
        throw new Error('No se ha seleccionado una empresa');
      }
      
      if (montoEntregado < (pago.totalPagar || 0)) {
        throw new Error('El monto ingresado es menor al monto a pagar');
      }

      

      // Validar campos requeridos
      if (!idPlanPagoPropiedad) {
        throw new Error('No se encontró el ID de la cuota del plan de pago');
      }

      console.log("pago", pago.idCuota);
      // 1. Crear la venta
      const ventaData = {
        empresa_id: selectedCompany.idEmpresa, // Usar idEmpresa en lugar de id
        id_usuario: user?.id || 1, // Usar el ID del usuario autenticado
        persona_id: Number(idcliente),
        id_caja: parseInt(selectedCaja) || 1,
        id_punto_venta: 1, // Valor estático temporal
        id_tipo_documento: 1, // Valor estático temporal (Boleta)
        serie: 'R001', // Valor estático temporal
        correlativo: new Date().getTime().toString().slice(-8), // Número aleatorio
        moneda: 'PEN',
        subtotal: pago.totalPagar,
        igv: 0,
        total: pago.totalPagar,
        id_estado_venta: 1, // 1 = Pagado
        numero_cuota: Number(pago.idCuota) || 0,
        id_tipo_pago: metodosPago.find(t => t.value === tipoOperacion)?.id || 1,
        id_plan_pago: idPlanPagoPropiedad, // Proporcionar un valor por defecto
        observaciones: `Pago de cuota ${pago.numeroCuota || ''} - ${pago.descripcion || 'Pago de cuota'}`,
        referencia_externa: tipoOperacion === 'transferencia' ? numeroOperacion : ''
      };

      // 2. Guardar la venta
      const venta:any = await createVenta(ventaData);
      
      // 3. Crear el detalle de venta
      if (!venta.id_venta) {
        throw new Error('No se pudo obtener el ID de la venta');
      }

      const detalleVentaData = {
        id_venta: venta.id_venta,
        id_tipo_item_venta: 1, // 1 = Cuota de pago
        item_id: Number(pago.id), // Asegurarse de que sea un número
        plan_pago_cuota_id: idPlanPagoPropiedad,
        descripcion: `Cuota ${pago.nroItem || ''} - ${pago.concepto || 'Pago de cuota'}`,
        cantidad: 1,
        precio_unitario: pago.totalPagar,
        subtotal: pago.totalPagar,
        descuento: 0,
        igv: 0,
        total: pago.totalPagar
      };

      await createDetalleVenta(detalleVentaData);

      // Actualizar el estado de la cuota a Pagado (3)
      if (pago.id) {
        const cuotaActualizada = await actualizarCuota(Number(pago.id), 3);
        if (!cuotaActualizada) {
          console.warn('No se pudo actualizar el estado de la cuota, pero el pago se registró correctamente');
        }
      }

      // Crear movimiento de caja
      if (selectedCaja && user?.id) {
        try {
          const movimientoData = {
            id_caja: parseInt(selectedCaja),
            id_tipo_operacion: 1, // 
            id_tipo_movimiento: 5, // 5 = Ingreso por venta
            monto: pago.totalPagar,
            descripcion_movimiento: `Pago de cuota ${pago.nroItem || ''} - ${pago.concepto || 'Pago de cuota'}`,
            referencia_externa: tipoOperacion === 'transferencia' ? numeroOperacion : `VENTA-${venta.id_venta}`,
            fecha_movimiento: new Date().toISOString(),
            id_usuario: user.id,
            estado: 1 // 1 = Activo
          };

          await createCajaMovimiento(movimientoData);
          console.log('Movimiento de caja registrado correctamente');
        } catch (error) {
          console.error('Error al registrar el movimiento de caja:', error);
          // No lanzamos el error para no interrumpir el flujo de pago
        }
      }

      // Mostrar mensaje de éxito
      toast.success('Pago registrado correctamente');
      
      // Cerrar el modal y limpiar el formulario
      onClose();
      setMontoEntregado(0);
      setTipoOperacion('efectivo');
      setNumeroOperacion('');
      
      // Llamar al callback si existe
      if (onPagoRealizado) {
        onPagoRealizado();
      }
    } catch (error) {
      console.error('Error al guardar el pago:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar el pago');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedCaja) {
      toast.error('Por favor seleccione una caja ejecutiva');
      return;
    }

    if (montoEntregado < (pago?.totalPagar || 0)) {
      toast.error('El monto ingresado es menor al monto a pagar');
      return;
    }

    try {
      // Aquí iría la lógica para procesar el pago
      console.log('Procesando pago:', {
        pagoId: pago?.id,
        montoEntregado,
        tipoOperacion,
        idCaja: selectedCaja,
        cliente,
        proyecto,
        propiedad
      });

      // Simular una llamada a la API
      // await procesarPago({ pagoId: pago?.id, montoEntregado, tipoOperacion });

      // Cerrar el modal
      onClose();

      // Llamar a onPagoRealizado si está definido
      if (onPagoRealizado) {
        onPagoRealizado();
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      // Mostrar mensaje de error al usuario
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Representación de Pagos</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Columna Derecha: Información del Cliente */}
            <div className="flex-1 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Datos del Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{cliente || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Proyecto</p>
                  <p className="font-medium">{proyecto || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Propiedad</p>
                  <p className="font-medium">{propiedad || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Caja Ejecutiva</p>
                  <div className="mt-1">
                    <Combobox
                      options={tiposCaja}
                      selected={selectedCaja}
                      onChange={setSelectedCaja}
                      placeholder="Seleccione una caja"
                      emptyMessage="No hay cajas disponibles"
                      disabled={isLoading}
                    />
                    {isLoading && (
                      <p className="text-xs text-muted-foreground mt-1">Cargando cajas...</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lote</p>
                  <p className="font-medium">{lote || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
                  <p className="font-medium">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            {/* Columna Izquierda: Información del Pago */}
            <div className="flex-1 space-y-4 bg-white p-4 border rounded-lg">
              <h3 className="text-lg font-medium">Datos del Pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto a Pagar (S/)</Label>
                  <Input
                    value={pago.totalPagar.toFixed(2)}
                    readOnly
                    className="font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dinero Entregado (S/)</Label>
                  <Input
                    type="number"
                    value={montoEntregado}
                    onChange={(e) => setMontoEntregado(Number(e.target.value))}
                    className="font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vuelto (S/)</Label>
                  <Input
                    value={vuelto.toFixed(2)}
                    readOnly
                    className="font-bold text-primary mt-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Pago</Label>
                  <Combobox
                    options={metodosPago}
                    selected={tipoOperacion}
                    onChange={(value) => {
                      setTipoOperacion(value);
                      // Reset numeroOperacion when changing payment type
                      if (value === 'efectivo') {
                        setNumeroOperacion('');
                      }
                    }}
                    placeholder="Método de pago"
                  />
                </div>
                {tipoOperacion !== 'Efectivo' && (
                  <div className="md:col-span-2 space-y-2">
                    <Label>Número de Operación</Label>
                    <Input
                      value={numeroOperacion}
                      onChange={(e) => setNumeroOperacion(e.target.value)}
                      placeholder="Ingrese el número de operación"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fila 3: Detalle de la Cuota */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detalle de la Cuota</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">N° Cuota</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Concepto</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Saldo Capital</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Amortización</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Interés</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Mora</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Total a Pagar</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {pago.nroItem === 0 ? 'Inicial' : pago.nroItem}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {pago.nroItem === 0 ? 'Cuota Inicial' : `Cuota ${pago.nroItem}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">S/ {(pago.montoPagar - pago.mora).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">S/ {(pago.montoPagar * 0.7).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">S/ {(pago.montoPagar * 0.3).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {pago.mora > 0 ? `S/ ${pago.mora.toFixed(2)}` : 'S/ 0.00'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right text-gray-900">
                        S/ {pago.totalPagar.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-3 text-sm font-medium text-right text-gray-900">
                        Total
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right text-red-600">
                        {pago.mora > 0 ? `S/ ${pago.mora.toFixed(2)}` : 'S/ 0.00'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right text-gray-900">
                        S/ {pago.totalPagar.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePago}
              disabled={isSaving || !montoEntregado || !selectedCaja}
            >
              {isSaving ? 'Guardando...' : 'Guardar Pago'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
