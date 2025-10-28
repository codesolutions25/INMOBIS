import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateUtils";
import { Reserva } from "../types";
import { getCotizaciones } from "@/services/apiCotizaciones";
import { getPropiedad } from "@/services/apiPropiedades";
import { getDistritos } from "@/services/apiDistritos";
import { getProvincias } from "@/services/apiProvincias";
import { getDepartamentos } from "@/services/apiDepartamentos";
import { getProyecto } from "@/services/apiProyecto";
import { useEffect, useState, useCallback } from "react";
import { getPlanPagoById } from "@/services/apiPlanesPago";
import { useCompany } from "@/contexts/CompanyContext";
import { getCuotasPorPlanPago } from "@/services/apiCuotas";

interface ReservasTableProps {
  clienteId?: number;
  reservaSeleccionada: Reserva | null;
  onSelectReserva: (reserva: Reserva) => void;
  reservas?: Reserva[]; // Propiedad para recibir las reservas directamente
}

export function ReservasTable({ clienteId, reservaSeleccionada, onSelectReserva, reservas: reservasProp }: ReservasTableProps) {
  const [reservas, setReservas] = useState<Reserva[]>(reservasProp || []);
  const [filteredReservas, setFilteredReservas] = useState<Reserva[]>(reservasProp || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  
  const handleRowClick = async (reserva: any, cotizacion: any) => {
      
    try {
      // First call the original handler to select the reservation
      onSelectReserva(reserva);
     
      // Then validate the payment plan if cotizacion is available
      if (reserva?.idPlanPagoPropiedad) {
        const planes = await getPlanPagoById(reserva.idPlanPagoPropiedad);
 
        if (planes) {
          toast.success('Plan de pago disponible');
          // Here you can add navigation or additional logic when plan exists
        } else {
          toast.warning('No se encontró el plan de pago');
          // Handle case when plan doesn't exist
        }
      } else {
        toast.warning('No se encontró información del plan de pago');
      }
    } catch (error) {
      toast.error('Error al validar el plan de pago');
    }
  };

  
  const { selectedCompany } = useCompany();

  // Filtrar reservas cuando cambia el término de búsqueda, las reservas o la empresa seleccionada
  const filterReservas = useCallback(() => {
   
    
    const filtered = reservas.filter((reserva: any) => {
      // Debug log para ver los datos de cada reserva
      
      
      // Si no hay empresa seleccionada, mostrar todas las reservas
      if (!selectedCompany) {
        return true;
      }

      // Si la reserva no tiene idEmpresa, mostrarla para mantener compatibilidad
      if (reserva.idEmpresa === undefined || reserva.idEmpresa === null) {
        
        return true;
      }

      // Si la reserva tiene idEmpresa, filtrar por la empresa seleccionada
      const matchesCompany = reserva.idEmpresa == selectedCompany.idEmpresa; // Usamos == para manejar string vs number
      if (!matchesCompany) {
        console.log('Reserva filtrada por empresa:', reserva.id);
      }
      return matchesCompany;
    });

    // Aplicar filtro de búsqueda si existe
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return filtered.filter((reserva: any) => {
        return (
          (reserva.codigoPropiedad?.toLowerCase().includes(searchLower)) ||
          (reserva.nombrePropiedad?.toLowerCase().includes(searchLower)) ||
          (reserva.proyecto?.toLowerCase().includes(searchLower)) ||
          (reserva.estado?.toLowerCase().includes(searchLower)) ||
          (reserva.id?.toString().includes(searchTerm)) ||
          (reserva.lote?.toLowerCase().includes(searchLower))
        );
      });
    }
    
    return filtered;
  }, [searchTerm, reservas, selectedCompany]);

  useEffect(() => {
    const filtered = filterReservas();
    setFilteredReservas(filtered);
  }, [filterReservas]);

  // Si recibimos reservas por props, las usamos directamente
  useEffect(() => {
    if (reservasProp && reservasProp.length > 0) {
      setReservas(reservasProp);
      setFilteredReservas(reservasProp);
      return; // No cargamos nada más si ya tenemos reservas
    }
    
    // Si no hay reservas en las props pero hay clienteId, cargamos las reservas
    if (clienteId) {
      cargarReservas();
    }
  }, [reservasProp, clienteId]);

  // Función para buscar un distrito por ID
  const buscarDistrito = async (idDistrito: number) => {
    try {
      const distritos = await getDistritos();
      return distritos.find(d => d.idDistrito === idDistrito);
    } catch (error) {
      console.error('Error al obtener distrito:', error);
      return null;
    }
  };

  // Función para buscar una provincia por ID
  const buscarProvincia = async (idProvincia: number) => {
    try {
      const provincias = await getProvincias();
      return provincias.find(p => p.idProvincia === idProvincia);
    } catch (error) {
      console.error('Error al obtener provincia:', error);
      return null;
    }
  };

  // Función para buscar un departamento por ID
  const buscarDepartamento = async (idDepartamento: number) => {
    try {
      const departamentos = await getDepartamentos();
      return departamentos.find(d => d.idDepartamento === idDepartamento);
    } catch (error) {
      console.error('Error al obtener departamento:', error);
      return null;
    }
  };

  const cargarReservas = async () => {
    if (!clienteId) {
      setReservas([]);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Obtener todas las cotizaciones
      const response = await getCotizaciones(1, 1000);
      
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al obtener cotizaciones');
      }
      
      const cotizaciones = response.data;
        
      // 2. Filtrar por idClienteInmobiliario y excluir estados 3, 4, 5
      const cotizacionesCliente = cotizaciones.filter(
        (cotizacion: any) => 
          cotizacion.idClienteInmobiliario === clienteId && 
          ![3, 4, 5].includes(cotizacion.idEstadoCotizacion)
      );
      
      
      if (cotizacionesCliente.length === 0) {
        setReservas([]);
        return;
      }
      
      // 3. Para cada cotización, obtener la propiedad, proyecto y ubicación
      const reservasData = await Promise.all(
        cotizacionesCliente.map(async (cotizacion: any) => {
        
          try {
            const propiedad = await getPropiedad(cotizacion.idPropiedad);
            
            if (!propiedad) {
              return null;
            }
            
            let proyecto = null;
            if (propiedad.idProyectoInmobiliario) {
              proyecto = await getProyecto(propiedad.idProyectoInmobiliario);
            
            }
              // Obtener información de ubicación
              let distrito = null;
              let provincia = null;
              let departamento = null;
              
              if (proyecto?.idDistrito) {
                distrito = await buscarDistrito(proyecto.idDistrito);
                if (distrito?.idProvincia) {
                  provincia = await buscarProvincia(distrito.idProvincia);
                  if (provincia?.idDepartamento) {
                    departamento = await buscarDepartamento(provincia.idDepartamento);
                  }
                }
              }

              let estadoPago: 'PENDIENTE' | 'PAGADO' = 'PAGADO'; // Por defecto asumimos que está pagado

              if (cotizacion.idPlanPagoPropiedad) {
                try {
                  const cuotas = await getCuotasPorPlanPago(cotizacion.idPlanPagoPropiedad);
                  
                  if (cuotas && cuotas.length > 0) {
                    // Primero mostramos la estructura completa de la primera cuota para depuración
                     
                    const tieneCuotasPendientes = cuotas.some((cuota: any) => {
                      const estado = cuota.idEstadoPlanPago?.toString() || '';
                      
                      // Verificar si la cuota está pendiente basado en el estado
                      // Asumo que el estado 3 es "PAGADO" y cualquier otro es pendiente
                      const estaPendiente = estado !== '3';
                      
                      // Verificar montos de la cuota individual
                      const saldoPendiente = parseFloat(cuota.saldoCapital || '0');
                      const montoTotal = parseFloat(cuota.montoTotalCuota || '0');
                      const estaPagada = saldoPendiente <= 0 && montoTotal > 0;
                      
                      return estaPendiente && !estaPagada;
                    });

                      
                    estadoPago = tieneCuotasPendientes ? 'PENDIENTE' : 'PAGADO';
                  } else {
                    console.log('No se encontraron cuotas para este plan');
                  }
                } catch (error) {
                  console.error('Error al obtener cuotas:', error);
                }
              } else {
                console.log('No tiene plan de pago asociado');
              }

                         
              // Mapear a la interfaz Reserva
              return {
                id: cotizacion.idCotizaciones.toString(),
                proyecto: proyecto?.nombre || 'No especificado',
                cliente: cotizacion.idClienteInmobiliario,
                propiedad: propiedad?.descripcion || 'N/A',
                lote: propiedad?.codigoPropiedad || 'N/A',
                nombrePropiedad: propiedad?.nombre || 'N/A',
                distrito: distrito?.nombre || 'No especificado',
                provincia: provincia?.nombre || 'No especificado',
                departamento: departamento?.nombre || 'No especificado',
                idPlanPagoPropiedad: cotizacion.idPlanPagoPropiedad,
                fechaReserva: formatDate(cotizacion.fechaCreacion),
                monto: cotizacion.precioFinal || 0,
                idPropiedad: cotizacion.idPropiedad,
                precio: cotizacion.precioFinal || 0,
                estado: cotizacion.estado || 'PENDIENTE',
                estadoPago: estadoPago,
                cuotasVencidas: 0,
                montoCuotasVencidas: 0,
                cuotasPendientes: 0,
                proximoVencimiento: '',
                deudaPendiente: 0,
                saldoCapital: 0
              } as Reserva;
            } catch (error) {
              console.error('Error al cargar datos de reserva para cotización ID:', cotizacion.idCotizaciones, error);
              return null;
            }
          })
        );

        // Filtrar cualquier error y actualizar el estado
        const reservasValidas = reservasData.filter((r): r is Reserva => r !== null);
       
        setReservas(reservasValidas);
      } catch (error) {
        console.error('Error al cargar reservas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // No llamamos cargarReservas aquí, se maneja en el primer useEffect

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando reservas...</span>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por código, cliente o estado..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proyecto</TableHead>          
              <TableHead>Nombre de Propiedad</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Distrito</TableHead>
              <TableHead>Provincia</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Estado de Pago</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReservas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                  No se encontraron reservas
                </TableCell>
              </TableRow>
            ) : (
              filteredReservas.map((reserva: any, index: number) => {
                // Ensure we have access to the cotizacion data
                const cotizacion = Array.isArray(reservasProp) ? reservasProp[index] : null;
                return (
                  <TableRow 
                    key={reserva.id} 
                    className={`cursor-pointer hover:bg-gray-50 ${
                      reservaSeleccionada?.id === reserva.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleRowClick(reserva, cotizacion)}
                  >
                    <TableCell className="font-medium">{reserva.proyecto}</TableCell>
                    <TableCell className="font-medium">{reserva.nombrePropiedad || '-'}</TableCell>
                    <TableCell>{reserva.lote}</TableCell>              
                    <TableCell>{reserva.distrito}</TableCell>
                    <TableCell>{reserva.provincia}</TableCell>
                    <TableCell>{reserva.departamento}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reserva.estadoPago === 'PAGADO' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reserva.estadoPago}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button 
                        className="text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReserva(reserva);
                        }}
                      >
                        Ver detalles
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
