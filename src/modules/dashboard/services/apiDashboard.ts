import { DashboardData, DashboardMetrics, VentasMensuales, CrecimientoClientes, Periodo } from '../types/dashboard.types';
import InmobiliariaApi from '@/modules/GestionImobiliaria/services/InmobiliariaApi';
import { getVentas } from '@/services/apiVentas';
import { getCotizaciones, getEstadoCotizacionAnuladaId, getEstadoCotizacionAprobadaId, getEstadoCotizacionPendienteId } from '@/services/apiCotizaciones';
import { Cotizacion } from '@/types/cotizaciones';

declare global {
  interface Window {
    __COMPANY_CONTEXT__?: {
      selectedCompany?: {
        idEmpresa: number;
        // Otros campos de la compañía si son necesarios
      };
    };
  }
}

class DashboardService {

    private getDateRange(periodo: Periodo, year?: number): { startDate: Date; endDate: Date } {
        const endDate = new Date();
        // Asegurarse de que endDate sea el final del día
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date();
        // Asegurarse de que startDate sea el inicio del día
        startDate.setHours(0, 0, 0, 0);
        
        // Usar el año proporcionado o el año actual
        const currentYear = year || new Date().getFullYear();
    
        switch (periodo) {
            case 'mes_actual':
                startDate.setDate(1);
                break;
            case 'mes_anterior':
                startDate.setMonth(startDate.getMonth() - 1, 1);
                startDate.setDate(1);
                endDate.setDate(0); // Último día del mes anterior
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'ultimos_3_meses':
                startDate.setMonth(startDate.getMonth() - 2, 1);
                startDate.setDate(1);
                break;
            case 'ultimos_6_meses':
                startDate.setMonth(startDate.getMonth() - 5, 1);
                startDate.setDate(1);
                break;
            case 'este_año':
                startDate.setMonth(0, 1);
                startDate.setFullYear(currentYear);
                endDate.setMonth(11, 31);
                endDate.setFullYear(currentYear);
                break;
        }

        // Si se especificó un año, establecerlo
        if (year) {
            startDate.setFullYear(year);
            // Solo actualizar el año de endDate si estamos en el año actual
            if (endDate.getFullYear() === new Date().getFullYear()) {
                endDate.setFullYear(year);
            }
        }

        return { startDate, endDate };
    }

    public async getTotalVentas(periodo: Periodo, empresaId?: number, year?: number): Promise<number> {
        try {
            const { startDate, endDate } = this.getDateRange(periodo, year);
            const { data: ventas } = await getVentas(1, 10000);
            
            if (!ventas || !Array.isArray(ventas)) {
                console.warn('No se encontraron datos de ventas');
                return 0;
            }

            

            const ventasFiltradas = ventas.filter(venta => {
                // Filtro por empresa si se proporciona empresaId
                if (empresaId !== undefined && venta.empresa_id !== empresaId) {
                    return false;
                }
                
                const fechaEmision = venta.fecha_emision;
                if (!fechaEmision) {
                    return false;
                }
                
                const fechaVenta = new Date(fechaEmision);
                const esValida = !isNaN(fechaVenta.getTime());
                const enRango = fechaVenta >= startDate && fechaVenta <= endDate;
                
                return esValida && enRango;
            });

            console.log(`Ventas en el rango${empresaId ? ` para la empresa ${empresaId}` : ''} (${year || 'todos los años'}): ${ventasFiltradas.length} de ${ventas.length}`);

            const total = ventasFiltradas.reduce((suma, venta) => {
                // Convertir a número si es necesario
                const monto = typeof venta.total === 'string' 
                    ? parseFloat(venta.total) 
                    : venta.total;
                return suma + (isNaN(Number(monto)) ? 0 : Number(monto));
            }, 0);

            return Math.round(total * 100) / 100;
        } catch (error) {
            console.error('Error al obtener el total de ventas:', error);
            return 0;
        }
    }

    public async getClientesActivos(periodo: Periodo, empresaId?: number, year?: number): Promise<number> {
        try {
            const { startDate, endDate } = this.getDateRange(periodo, year);
            const estadoPendienteId = await getEstadoCotizacionPendienteId();
            const response = await getCotizaciones(1, 10000);
            const cotizaciones = response?.data || [];
            
            const clientesUnicos = new Set<number>();

            const propiedadesResponse = await InmobiliariaApi.propiedadController.getPropiedadList({
                page: 1,
                perPage: 10000,
                search: ''
            });
            const propiedades = propiedadesResponse?.data || [];

            const propiedadToProyecto = new Map<number, number>();
            propiedades.forEach(propiedad => {
                propiedadToProyecto.set(propiedad.idPropiedad, propiedad.idProyectoInmobiliario);
            });

            const proyectosResponse = await InmobiliariaApi.proyectoController.getProyectoList({
                page: 1,
                perPage: 10000,
                search: ''
            });
            const proyectos = proyectosResponse?.data || [];
            
            const proyectoToEmpresa = new Map<number, number>();
            proyectos.forEach(proyecto => {
                proyectoToEmpresa.set(proyecto.idProyectoInmobiliario, proyecto.idEmpresa);
            });
            
            cotizaciones.forEach(cotizacion => {
                const fechaCotizacion = new Date(cotizacion.fechaCotizacion);
                const propiedadId = cotizacion.idPropiedad;
                
                if(fechaCotizacion >= startDate && fechaCotizacion <= endDate) {
                    const proyectoId = propiedadToProyecto.get(propiedadId);
                    const empresaPropiedad = proyectoId ? proyectoToEmpresa.get(proyectoId) : undefined;
                    

                    if (!empresaId || empresaPropiedad === empresaId) {
                        clientesUnicos.add(cotizacion.idClienteInmobiliario);
                    }
                }
            });

            console.log('Clientes únicos encontrados:', clientesUnicos.size);
            return clientesUnicos.size;
        } catch (error) {
            console.error('Error al obtener los clientes activos:', error);
            return 0;
        }
    }


    public async getPropiedadesDisponibles(empresaId?: number): Promise<any[]> {
        try {
            
            // Obtener el ID de la empresa de los parámetros o del contexto global
            let idEmpresa = empresaId;
            
            // Si no se proporcionó el ID de la empresa, intentar obtenerlo del contexto global
            if (!idEmpresa && typeof window !== 'undefined' && window.__COMPANY_CONTEXT__?.selectedCompany?.idEmpresa) {
                idEmpresa = window.__COMPANY_CONTEXT__.selectedCompany.idEmpresa;

            }
            
            // Si aún no hay ID de empresa, usar un valor por defecto para pruebas
            if (!idEmpresa) {
                idEmpresa = 24; // Valor temporal para pruebas
            }
            
            
            // 1. Obtener proyectos de la empresa
            const responseProyectos = await InmobiliariaApi.proyectoController.getProyectoList({
                page: 1,
                perPage: 1000,
                search: ''
            });
            
            if (!responseProyectos?.data) {
                return [];
            }
            
            // Filtrar proyectos solo de la empresa seleccionada
            const proyectosFiltrados = responseProyectos.data.filter(
                (proyecto: any) => proyecto.idEmpresa === empresaId
            );

            if (proyectosFiltrados.length === 0) {
                return [];
            }
            
            const proyectosIds = proyectosFiltrados.map((p: any) => p.idProyectoInmobiliario);
            
            if (proyectosIds.length === 0) {
                return [];
            }
            
            // 2. Obtener todas las propiedades
            const response = await InmobiliariaApi.propiedadController.getPropiedadList({ 
                page: 1, 
                perPage: 1000,
                search: ''
            });
            
            if (!response?.data) {
                return [];
            }
            
            
            // Filtrar propiedades por proyectos de la empresa
            let propiedades = response.data.filter((p: any) => {
                const tieneProyecto = !!p.idProyectoInmobiliario;
                const esDelProyecto = tieneProyecto && proyectosIds.includes(p.idProyectoInmobiliario);
                
                if (tieneProyecto && !esDelProyecto) {
                    return false;
                }
                
                if (!tieneProyecto) {
                    return false;
                }
                
                return true;
            });
            
            console.log(`Propiedades encontradas para los proyectos: ${propiedades.length} (filtradas de ${response?.data?.length || 0} totales)`);
            
            if (propiedades.length === 0) {
                console.error('No se encontraron propiedades para los proyectos de la empresa');
                console.log('IDs de proyectos buscados:', proyectosIds);
                return [];
            }
            
            // 3. Filtrar por estado DISPONIBLE (1)
            const propiedadesDisponibles = propiedades.filter((p: any) => {
                const esDisponible = p.idEstadoPropiedad === 1;
                if (!esDisponible) {
                } 
                return esDisponible;
            });

            if (propiedadesDisponibles.length === 0 && propiedades.length > 0) {
                
                
                const ejemplosNoDisponibles = propiedades
                    .filter((p: any) => p.idEstadoPropiedad !== 1)
                    .slice(0, 3)
                    .map((p: any) => ({
                        id: p.idPropiedad,
                        nombre: p.nombre,
                        estado: p.idEstadoPropiedad,
                        idProyecto: p.idProyectoInmobiliario
                    }));
                
            }
            
            return propiedadesDisponibles;
            
        } catch (error) {
            console.error('Error al obtener propiedades disponibles:', error);
            return [];
        }
    }

    private calcularCrecimiento(actual: number, anterior: number, year?: number): number {
        // Si no hay datos del período anterior, no hay crecimiento para calcular
        if (anterior === 0) {
            return 0; // Retornar 0 para indicar que no hay datos de comparación
        }
        
        if (year && new Date().getFullYear() !== year) {
            return 0;
        }
        
        // Calcular el crecimiento, asegurando que no sea negativo
        const crecimiento = ((actual - anterior) / anterior) * 100;
        
        // Si el crecimiento es negativo, retornar 0 en su lugar
        return Math.max(0, Math.round(crecimiento));
    }

    public async getVentasMensuales(empresaId?: number, year?: number): Promise<VentasMensuales[]> {
        try {
            const { data: ventas } = await getVentas(1, 10000);
            
            if (!ventas || !Array.isArray(ventas)) {
                console.warn('No se encontraron datos de ventas para el gráfico');
                return [];
            }

            // Filtrar por empresa si se especifica
            let ventasFiltradas = [...ventas];
            if (empresaId) {
                ventasFiltradas = ventasFiltradas.filter(venta => venta.empresa_id === empresaId);
            }

            // Filtrar por año si se especifica
            if (year) {
                ventasFiltradas = ventasFiltradas.filter(venta => {
                    if (!venta.fecha_emision) return false;
                    return new Date(venta.fecha_emision).getFullYear() === year;
                });
            }

            // Si no hay ventas después del filtrado, retornar array vacío
            if (ventasFiltradas.length === 0) {
                console.warn(`No hay datos de ventas para el año ${year}`);
                return [];
            }

            const ventasPorMes: Record<string, number> = {};
            const meses = [
                'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
            ];

            // Inicializar todos los meses con 0
            meses.forEach(mes => {
                ventasPorMes[mes] = 0;
            });

            // Procesar ventas por mes
            ventasFiltradas.forEach(venta => {
                if (venta.fecha_emision) {
                    const fecha = new Date(venta.fecha_emision);
                    const mes = meses[fecha.getMonth()];
                    const total = typeof venta.total === 'string' 
                        ? parseFloat(venta.total) 
                        : venta.total;
                    ventasPorMes[mes] = (ventasPorMes[mes] || 0) + (isNaN(Number(total)) ? 0 : Number(total)); // Sumar monto de ventas
                }
            });

            // Convertir a array de objetos para el gráfico
            return meses.map(mes => ({
                mes,
                ventas: Math.round((ventasPorMes[mes] || 0) * 100) / 100
            }));
        } catch (error) {
            console.error('Error al obtener ventas mensuales:', error);
            return [];
        }
    }

    public async getCrecimientoClientes(periodo: Periodo, empresaId?: number, year?: number): Promise<CrecimientoClientes[]> {
        try {
            // Obtener datos de clientes
            const estadoAprobadaId = await getEstadoCotizacionAprobadaId();
            const response = await getCotizaciones(1, 10000);
            const cotizaciones = response?.data || [];

            const cotizacionesAprobadas = cotizaciones.filter(cotizacion => cotizacion.idEstadoCotizacion === estadoAprobadaId);
            
            const meses = [
                'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
            ];

            // Inicializar acumuladores
            const clientesPorMes: Record<string, Set<number>> = {};
            const anioFiltro = year || new Date().getFullYear();

            // Procesar clientes
            cotizacionesAprobadas.forEach(cotizacion => {
                if(!cotizacion.fechaCotizacion) return;
                const fecha = new Date(cotizacion.fechaCotizacion);
                if (isNaN(fecha.getTime())) return;
                
                // Filtrar por año si se proporciona
                if (fecha.getFullYear() !== anioFiltro) {
                    return;
                }
                
                const mes = meses[fecha.getMonth()];

                if(!clientesPorMes[mes]) {
                    clientesPorMes[mes] = new Set<number>();
                }
                if(cotizacion.idClienteInmobiliario) {
                    clientesPorMes[mes].add(cotizacion.idClienteInmobiliario);
                }
            });

            // Si no hay datos, retornar array vacío
            if (Object.keys(clientesPorMes).length === 0) {
                
                return [];
            }

            // Generar los 12 meses del año seleccionado
            const todosLosMeses: CrecimientoClientes[] = [];
            for (let mes = 0; mes < 12; mes++) {
                const mesNombre = meses[mes];
                const clientesMes = clientesPorMes[mesNombre] || new Set();
                todosLosMeses.push({
                    mes: mesNombre, 
                    totalClientes: clientesMes.size,
                    crecimiento: 0 // Se calculará después
                });
            }

            // Calcular crecimiento mes a mes
            for (let i = 1; i < todosLosMeses.length; i++) {
                const mesActual = todosLosMeses[i];
                const mesAnterior = todosLosMeses[i - 1];
                
                if (mesAnterior.totalClientes > 0) {
                    mesActual.crecimiento = this.calcularCrecimiento(
                        mesActual.totalClientes,
                        mesAnterior.totalClientes
                    );
                }
            }

            
            return todosLosMeses;
            
        } catch (error) {
            
            return [];
        }
    }

    public async obtenerDatosDashboard(periodo: Periodo = 'mes_actual', empresaId?: number, year?: number, moduloId?: number): Promise<DashboardData> {
        try {
            
            // Obtener datos en paralelo para mejor rendimiento
            const [
                totalVentas, 
                clientesActivos, 
                propiedadesDisponibles,
                ventasMensuales,
                crecimientoClientes,
                proyectosInmobiliarios
            ] = await Promise.all([
                this.getTotalVentas(periodo, empresaId, year),
                this.getClientesActivos(periodo, empresaId, year),
                this.getPropiedadesDisponibles(empresaId),
                this.getVentasMensuales(empresaId, year),
                this.getCrecimientoClientes(periodo, empresaId, year),
                this.getProyectosInmobiliarios(1, 1000)
            ]);

            // Calcular crecimiento de ventas vs período anterior (solo si hay datos del mismo año)
            let crecimientoVentas = 0;
            if (ventasMensuales.length > 1) {
                const ventasActuales = ventasMensuales[ventasMensuales.length - 1]?.ventas || 0;
                const ventasAnteriores = ventasMensuales[ventasMensuales.length - 2]?.ventas || 0;
                
                // Solo calcular crecimiento si hay datos del período anterior
                if (ventasAnteriores > 0) {
                    crecimientoVentas = this.calcularCrecimiento(ventasActuales, ventasAnteriores, year);
                }
            }

            // Calcular crecimiento de clientes vs período anterior (solo si hay datos del mismo año)
            let crecimientoClientesPorcentaje = 0;
            if (crecimientoClientes.length > 1) {
                const clientesActuales = crecimientoClientes[crecimientoClientes.length - 1]?.totalClientes || 0;
                const clientesAnteriores = crecimientoClientes[crecimientoClientes.length - 2]?.totalClientes || 0;
                
                // Solo calcular crecimiento si hay datos del período anterior
                if (clientesAnteriores > 0) {
                    crecimientoClientesPorcentaje = this.calcularCrecimiento(clientesActuales, clientesAnteriores, year);
                }
            }

            // Filtrar proyectos por empresa si se proporciona el ID
            const proyectosFiltrados = empresaId 
                ? proyectosInmobiliarios.filter(proyecto => proyecto.idEmpresa === empresaId)
                : proyectosInmobiliarios;

            return {
                metrics: {
                    totalVentas,
                    clientesActivos,
                    propiedadesDisponibles: propiedadesDisponibles.length,
                    crecimiento: crecimientoVentas, // Mantener para compatibilidad
                    crecimientoVentas,             // Nuevo campo
                    crecimientoClientes: crecimientoClientesPorcentaje // Nuevo campo
                },
                ventasMensuales,
                crecimientoClientes,
                proyectosInmobiliarios: proyectosFiltrados,
                propiedadesDisponibles: [],
                filters: {
                    periodo,
                    año: year,
                    moduloId: moduloId
                }
            };
        } catch (error) {
            console.error('Error al obtener datos del dashboard:', error);
            throw error;
        }
    }


    private async getProyectosInmobiliarios(page: number, perPage: number): Promise<any[]> {
        try {
            const response = await InmobiliariaApi.proyectoController.getProyectoList({

                    page,
                    perPage
                }
            );
            return response?.data || [];
        } catch (error) {
            console.error('Error al obtener proyectos inmobiliarios:', error);
            return [];
        }
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;