import React, { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Proyecto } from "@/types/proyectos";
import { Propiedad } from "@/types/propiedades";
import { useAlert } from "@/contexts/AlertContext";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, id }) => {
  return (
    <div className="flex items-center space-x-3">
      <button
        type="button"
        id={id}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {label && (
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
      )}
    </div>
  );
};

export interface PlanPago {
  idPlanPagoPropiedad?: number;
  idPropiedad?: number;
  idTipoPlanPagoPropiedad?: number;
  idFrecuenciaPago?: number;
  descripcion: string;
  planPago: string;
  numeroCuota: number;
  interes: number;
  nuevoCosto: number;
  valorMinimo: number;
  frecuencia: string;
  mora: boolean;
  montoInicial: number;
  tasaInteres: number;
  cantidadCuotas: number;
  aplicaMora: boolean;
  fechaRegistro?: string;
}

interface TipoPlanPago {
  id: number;
  idTipoPlanPagoPropiedad?: number;
  id_tipo_plan_pago_propiedad?: number;
  nombre: string;
  descripcion?: string;
}

interface FrecuenciaPago {
  id: number;
  idFrecuenciaPago?: number;
  id_frecuencia_pago?: number;
  descripcion: string;
  nombre?: string;
}

export interface DetallePlanPago {
  id?: number;
  idPlanPago: number;
  descripcion: string;
  monto: number;
  fechaVencimiento: string;
  estado: string;
}

export const planPagoColumnas = [
  {
    header: "N°",
    accessorKey: "id",
    cell: ({ row }: any) => (
      <span className="font-medium text-gray-900 text-center">
        {row.index + 1}
      </span>
    ),
    size: 60,
  },
  {
    header: "Tipo plan de pago",
    accessorKey: "planPago",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-left">
        {row.original.planPago}
      </span>
    ),
    size: 150,
  },
  {
    header: "Cantidad de cuotas",
    accessorKey: "numeroCuota",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-center">
        {row.original.numeroCuota}
      </span>
    ),
    size: 120,
  },
  {
    header: "Interés",
    accessorKey: "interes",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-center">
        {row.original.interes}%
      </span>
    ),
    size: 80,
  },
  {
    header: "Nuevo Costo",
    accessorKey: "nuevoCosto",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-right font-medium">
        S/ {row.original.nuevoCosto?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    ),
    size: 120,
  },
  {
    header: "Valor mínimo",
    accessorKey: "valorMinimo",
    cell: ({ row }: any) => (
      <span className="text-gray-700 text-right">
        S/ {row.original.valorMinimo?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    ),
    size: 120,
  },
  {
    header: "Frecuencia",
    accessorKey: "frecuencia",
    cell: ({ row }: any) => (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {row.original.frecuencia}
      </span>
    ),
    size: 100,
  },
  {
    header: "Mora",
    accessorKey: "mora",
    cell: ({ row }: any) => (
      <span className="text-center">
        {row.original.mora ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Sí</span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">No</span>
        )}
      </span>
    ),
    size: 80,
  },
];

export const obtenerTipoPlanContado = async (): Promise<TipoPlanPago | null> => {
  try {
    const response = await fetch('api/proxy?service=plan_pago_al_contado_url');
    
    if (!response.ok) {
      throw new Error('Error al obtener tipo plan contado');
    }
    
    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error al obtener tipo plan contado:', error);
    return null;
  }
};

export const obtenerTipoPlanPorPartes = async (): Promise<TipoPlanPago | null> => {
  try {
    const response = await fetch('api/proxy?service=plan_pago_por_partes_url');
    
    if (!response.ok) {
      throw new Error('Error al obtener tipo plan por partes');
    }
    
    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error al obtener tipo plan por partes:', error);
    return null;
  }
};

export const fetchApiData = async <T,>(endpoint: string, entityName: string): Promise<T[]> => {
  try {
    let allData: T[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const apiUrl = `/api/proxy?service=planes&path=${endpoint}&page=${currentPage}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Error al obtener ${entityName} (página ${currentPage}): ${response.status}`);
      }
      
      const data = await response.json();
      let pageData = [];
      
      // Extraer datos de la página actual
      if (Array.isArray(data)) {
        pageData = data;
        hasMorePages = false; // Si es un array directo, no hay paginación
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) {
          pageData = data.data;
          
          // Verificar si hay más páginas usando la información de meta
          if (data.meta) {
            const { page, pages, total } = data.meta;
            hasMorePages = page < pages;
          } else {
            // Si no hay meta, verificar si la página actual tiene datos
            hasMorePages = pageData.length > 0 && pageData.length >= 10; // Asumiendo 10 por página
          }
        } else if (Array.isArray(data.planes) || Array.isArray(data.planesPago)) {
          pageData = Array.isArray(data.planes) ? data.planes : data.planesPago;
          hasMorePages = false; // Estructura sin paginación
        } else if (data.id && typeof data.id === 'number') {
          pageData = [data];
          hasMorePages = false;
        } else {
          const posibleArray = Object.values(data).find(val => Array.isArray(val));
          if (posibleArray) {
            pageData = posibleArray;
          } else {
            pageData = Object.values(data).filter(val => typeof val === 'object' && val !== null);
          }
          hasMorePages = false;
        }
      }
      
      // Agregar datos de la página actual al total
      allData = [...allData, ...pageData];
      
      // Si no hay datos en esta página, detener
      if (pageData.length === 0) {
        hasMorePages = false;
      }
      
      currentPage++;
      
      // Protección contra bucles infinitos
      if (currentPage > 100) {
        console.warn(`Deteniendo obtención de ${entityName} después de 100 páginas`);
        hasMorePages = false;
      }
    }
    
    return allData as T[];
  } catch (error) {
    console.error(`Error al obtener ${entityName}:`, error);
    return [];
  }
};

export const cargarFrecuenciasPago = async (): Promise<FrecuenciaPago[]> => {
  return fetchApiData<FrecuenciaPago>('frecuencia-pago', 'frecuencias de pago');
};

export const obtenerTiposPlanesPago = async (): Promise<TipoPlanPago[]> => {
  return fetchApiData<TipoPlanPago>('tipos-plan-pago-propiedad', 'tipos de planes de pago');
};

// Función para eliminar un plan de pago
export const eliminarPlanPago = async (idPlan: number): Promise<boolean> => {
  try {
    const apiUrl = `${process.env.PLAN_PAGOS_SERVICE_URL}/planes-pago/${idPlan}`;
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al eliminar plan de pago: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar plan de pago:', error);
    throw error;
  }
};
export const obtenerPlanesPago = async (
  filtros: Record<string, any> = {},
  busqueda: string = "",
  idCotizacion?: number,
  idPropiedad?: number,
  precioPropiedad?: number
): Promise<PlanPago[]> => {
  try {
    const [tiposPlanesPago, frecuenciasPago] = await Promise.all([
      obtenerTiposPlanesPago(),
      cargarFrecuenciasPago()
    ]);
    
    const planesArray = await fetchApiData<any>('planes-pago', 'planes de pago');
    
    // Filtrar SIEMPRE por propiedad específica - no mostrar planes globales
    const planesFiltrados = idPropiedad && idPropiedad > 0
      ? planesArray.filter((plan: any) => {
          if (!plan || typeof plan !== 'object') return false;
          
          const planIdPropiedad = plan.id_propiedad || plan.idPropiedad;
          const coincide = planIdPropiedad === idPropiedad;
          
         
          
          return coincide;
        })
      : []; // Si no hay idPropiedad válido, no mostrar ningún plan
    
    let precioPropiedadBase = 0;
    
    if (precioPropiedad && precioPropiedad > 0) {
      precioPropiedadBase = precioPropiedad;
    } 
    else if (idPropiedad && typeof idPropiedad === 'number') {
      try {
        const urlPropiedad = `/api/proxy?service=inmobiliaria&path=propiedades/${idPropiedad}`;
        const respPropiedad = await fetch(urlPropiedad);
        
        if (respPropiedad.ok) {
          const datosPropiedad = await respPropiedad.json();
          
          if (datosPropiedad && datosPropiedad.data && datosPropiedad.data.precio) {
            precioPropiedadBase = Number(datosPropiedad.data.precio);
          } else if (datosPropiedad && datosPropiedad.precio) {
            precioPropiedadBase = Number(datosPropiedad.precio);
          } else if (datosPropiedad && typeof datosPropiedad === 'object') {
            const posiblePrecio = Object.entries(datosPropiedad).find(([key, value]) => 
              (key.includes('precio') || key.includes('price') || key === 'valor' || key === 'monto') && 
              (typeof value === 'number' || typeof value === 'string') && Number(value) > 0
            );
            
            if (posiblePrecio) {
              precioPropiedadBase = Number(posiblePrecio[1]);
            }
          }
          
          if (precioPropiedadBase <= 0) {
            precioPropiedadBase = 10000;
          }
        } else {
          precioPropiedadBase = 10000;
        }
      } catch (error) {
        console.error(`Error al obtener precio de propiedad ${idPropiedad}:`, error);
        precioPropiedadBase = 10000;
      }
    } else {
      precioPropiedadBase = 10000;
    }
    
    const planesPago: PlanPago[] = planesFiltrados.map((plan: any) => {
      const cantidadCuotas = plan.cantidad_cuotas || plan.cantidadCuotas || 0;
      
      const idTipoPlan = plan.id_tipo_plan_pago_propiedad || plan.idTipoPlanPagoPropiedad;
      const tipoPlanObj = tiposPlanesPago.find(tipo => 
        tipo.id === idTipoPlan || 
        tipo.idTipoPlanPagoPropiedad === idTipoPlan || 
        tipo.id_tipo_plan_pago_propiedad === idTipoPlan
      );
      
      const idFrecuencia = plan.id_frecuencia_pago || plan.idFrecuenciaPago;
      const frecuenciaObj = frecuenciasPago.find(freq => 
        freq.id === idFrecuencia || 
        freq.idFrecuenciaPago === idFrecuencia
      );
      
      const nombreTipoPlan = tipoPlanObj ? tipoPlanObj.nombre : (cantidadCuotas === 1 ? 'Al Contado' : 'Por Partes');
      
      const nombreFrecuencia = frecuenciaObj ? frecuenciaObj.nombre : (idFrecuencia ? `Frecuencia ${idFrecuencia}` : 'No especificada');
      
      const precioBase = precioPropiedadBase > 0 ? precioPropiedadBase : 10000;
      
      const tasaInteres = plan.tasa_interes || plan.tasaInteres || 0;
      const valorMinimo = plan.monto_inicial || plan.montoInicial || 0;
      
      let nuevoCosto = precioBase;
      
      // Calcular el nuevo costo usando la misma fórmula que el cronograma
      if (tasaInteres > 0 && cantidadCuotas > 1) {
        // TEM (Tasa Efectiva Mensual) = interés anual / 12
        const tem = tasaInteres / 12 / 100; // Convertir a decimal
        
        // Saldo capital inicial después del valor mínimo
        const saldoCapitalInicial = precioBase - valorMinimo;
        
        if (saldoCapitalInicial > 0) {
          // Calcular cuota fija mensual para las cuotas restantes
          const n = cantidadCuotas; // Número total de cuotas
          const cuotaFijaMensual = saldoCapitalInicial * (tem * Math.pow(1 + tem, n)) / (Math.pow(1 + tem, n) - 1);
          
          // Calcular el total de intereses que se pagarán
          const totalCuotasMensuales = cuotaFijaMensual * cantidadCuotas;
          const totalInteres = totalCuotasMensuales - saldoCapitalInicial;
          
          // Nuevo costo = precio base + total de intereses
          nuevoCosto = precioBase + totalInteres;
        }
      } else if (tasaInteres > 0 && cantidadCuotas === 1) {
        // Para planes al contado con interés (caso especial)
        const factorInteres = 1 + (tasaInteres / 100);
        nuevoCosto = precioBase * factorInteres;
      }
      
      if (isNaN(nuevoCosto) || nuevoCosto <= 0) {
        nuevoCosto = precioBase;
      }
      
      return {
        idPlanPagoPropiedad: plan.id || plan.idPlanPagoPropiedad,
        planPago: nombreTipoPlan,
        numeroCuota: cantidadCuotas,
        interes: tasaInteres,
        nuevoCosto: nuevoCosto,
        valorMinimo: plan.monto_inicial || plan.montoInicial,
        frecuencia: nombreFrecuencia || 'No especificada',
        mora: Boolean(plan.aplica_mora || plan.aplicaMora),
        montoInicial: plan.monto_inicial || plan.montoInicial,
        tasaInteres: tasaInteres,
        descripcion: plan.descripcion,
        cantidadCuotas: cantidadCuotas,
        aplicaMora: Boolean(plan.aplica_mora || plan.aplicaMora)
      };
    });
    
    return planesPago;
  } catch (error) {
    console.error('Error al obtener planes de pago:', error);
    return [];
  }
};

interface ResumenSeleccionProps {
  proyecto: Proyecto | null;
  propiedad: Propiedad | null;
}

export const ResumenSeleccion: React.FC<ResumenSeleccionProps> = ({ 
  proyecto, 
  propiedad 
}) => {
  return (
    <div className="mb-8">
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-2 h-6 bg-blue-600 rounded mr-3"></div>
          Resumen de Selección
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proyecto && (
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full uppercase tracking-wide">
                  Proyecto Seleccionado
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 text-lg leading-tight">
                {proyecto.nombre}
              </h4>
            </div>
          )}

          {propiedad && (
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full uppercase tracking-wide">
                  Propiedad Seleccionada
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 text-lg leading-tight mb-2">
                {propiedad.nombre}
              </h4>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Precio:</span>
                <span className="font-bold text-green-600 text-xl">
                  S/ {propiedad.precio?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!proyecto && !propiedad && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800 text-center">
              ⚠️ Debe seleccionar un proyecto y una propiedad antes de configurar los planes de pago
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface FormularioPlanPagoProps {
  planPago?: PlanPago | null;
  onGuardar: (planPago: PlanPago) => void;
  onCancelar: () => void;
  precioBase?: number;
  proyecto?: any;
  propiedad?: any;
  idEmpresa?: number;
  idUsuario?: number;
}

export const FormularioPlanPago: React.FC<FormularioPlanPagoProps> = ({
  planPago,
  onGuardar,
  onCancelar,
  precioBase = 0,
  proyecto,
  propiedad,
  idEmpresa,
  idUsuario
}) => {
  const [tiposPlan, setTiposPlan] = useState<TipoPlanPago[]>([]);
  const [cargandoTipos, setCargandoTipos] = useState(false);
  const [frecuenciasPago, setFrecuenciasPago] = useState<FrecuenciaPago[]>([]);
  const [cargandoFrecuencias, setCargandoFrecuencias] = useState(false);
  const { showAlert } = useAlert();
  
  const [formData, setFormData] = useState<Partial<PlanPago>>({
    planPago: planPago?.planPago || '',
    numeroCuota: planPago?.numeroCuota || 1,
    interes: planPago?.interes || 0,
    nuevoCosto: planPago?.nuevoCosto || 0,
    valorMinimo: planPago?.valorMinimo || 0,
    frecuencia: planPago?.frecuencia || '',
    mora: planPago?.mora || false,
    montoInicial: planPago?.montoInicial || 0,
    tasaInteres: planPago?.tasaInteres || 0,
  });
  
  const [camposEditables, setCamposEditables] = useState({
    numeroCuota: true,
    interes: true
  });

  useEffect(() => {
    const cargarTiposPlanes = async () => {
      setCargandoTipos(true);
      try {
        const url = `/api/proxy?service=planes&path=tipos-plan-pago-propiedad`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error al cargar tipos de plan: ${response.status}`);
        }
        
        const data = await response.json();
        const tiposData = data?.data || data?.items || data?.results || data || [];
        
        if (Array.isArray(tiposData)) {
          setTiposPlan(tiposData);
        } else {
          throw new Error('Formato de datos de tipos de plan no válido');
        }
      } catch (error) {
        console.error('Error al cargar tipos de plan:', error);
      } finally {
        setCargandoTipos(false);
      }
    };
    
    cargarTiposPlanes();
  }, []);

  useEffect(() => {
    const cargarFrecuenciasDePago = async () => {
      setCargandoFrecuencias(true);
      try {
        const url = `/api/proxy?service=planes&path=frecuencia-pago`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error al cargar frecuencias: ${response.status}`);
        }
        
        const data = await response.json();
        const frecuenciasData = data?.data || data?.items || data?.results || data || [];
        
        if (Array.isArray(frecuenciasData)) {
          setFrecuenciasPago(frecuenciasData);
        } else {
          throw new Error('Formato de datos de frecuencias no válido');
        }
      } catch (error) {
        console.error('Error al cargar frecuencias de pago:', error);
      } finally {
        setCargandoFrecuencias(false);
      }
    };
    
    cargarFrecuenciasDePago();
  }, []);

  useEffect(() => {
    if (planPago && tiposPlan.length > 0 && frecuenciasPago.length > 0) {
      const tipoEncontrado = tiposPlan.find(tipo => 
        (tipo as any)?.nombre === planPago.planPago || 
        (tipo as any)?.descripcion === planPago.planPago ||
        (tipo as any)?.name === planPago.planPago
      );
      
      const frecuenciaEncontrada = frecuenciasPago.find(freq => 
        (freq as any)?.descripcion === planPago.frecuencia || 
        (freq as any)?.nombre === planPago.frecuencia ||
        (freq as any)?.name === planPago.frecuencia
      );
      
      if (tipoEncontrado || frecuenciaEncontrada) {
        setFormData(prev => ({
          ...prev,
          ...(tipoEncontrado && { planPago: ((tipoEncontrado as any)?.id || (tipoEncontrado as any)?.idTipoPlanPagoPropiedad)?.toString() }),
          ...(frecuenciaEncontrada && { frecuencia: ((frecuenciaEncontrada as any)?.id || (frecuenciaEncontrada as any)?.idFrecuenciaPago)?.toString() })
        }));
        
        console.log('Valores mapeados para edición:', {
          tipoOriginal: planPago.planPago,
          tipoEncontrado: tipoEncontrado,
          frecuenciaOriginal: planPago.frecuencia,
          frecuenciaEncontrada: frecuenciaEncontrada
        });
      }
    }
  }, [planPago, tiposPlan, frecuenciasPago]);

  useEffect(() => {
    if (precioBase > 0) {
      const interesPorcentaje = (formData.interes || 0) / 100;
      const costoConInteres = precioBase * (1 + interesPorcentaje);
      const totalCostoConInteres = Number(costoConInteres.toFixed(2));
      
      setFormData(prev => ({
        ...prev,
        nuevoCosto: totalCostoConInteres
      }));
      
      console.log('Cálculo actualizado:', {
        precioBase,
        interes: formData.interes,
        interesPorcentaje,
        costoConInteres,
        totalCostoConInteres
      });
    }
  }, [formData.interes, precioBase]);

  const validarFormulario = (): { esValido: boolean; errores: string[] } => {
    const errores: string[] = [];
    
    if (!formData.planPago) {
      errores.push('Debe seleccionar un plan de pago');
    }
    
    if (!formData.numeroCuota || formData.numeroCuota <= 0) {
      errores.push('El número de cuotas debe ser mayor a 0');
    }
    
    if (typeof formData.montoInicial === 'number' && formData.montoInicial < 0) {
      errores.push('El pago inicial no puede ser negativo');
    }
    
    if (!formData.frecuencia) {
      errores.push('Debe seleccionar una frecuencia de pago');
    }
    
    if (typeof formData.interes === 'number' && (formData.interes < 0 || formData.interes > 100)) {
      errores.push('El interés debe estar entre 0% y 100%');
    }
    
    if (precioBase <= 0) {
      errores.push('El precio base de la propiedad no es válido');
    }
    
    return {
      esValido: errores.length === 0,
      errores
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { esValido, errores } = validarFormulario();
    
    if (!esValido) {
      showAlert('error', 'Error de validación', errores.join('\n'));
      return;
    }

    try {
      const tipoPlanId = formData.planPago ? parseInt(formData.planPago) : null;
      const frecuenciaId = formData.frecuencia ? parseInt(formData.frecuencia) : null;

      if (!tipoPlanId) {
        throw new Error('Debe seleccionar un tipo de plan de pago válido');
      }
      
      if (!frecuenciaId) {
        throw new Error('Debe seleccionar una frecuencia de pago válida');
      }
      
      const tipoPlanSeleccionado = tiposPlan.find(tipo => {
        const id = tipo.id || tipo.idTipoPlanPagoPropiedad || tipo.id_tipo_plan_pago_propiedad;
        return id && id.toString() === formData.planPago;
      });
      const nombrePlan = tipoPlanSeleccionado?.nombre || 'Plan';
      const esAlContado = nombrePlan.toLowerCase().includes('contado');
      
      if (!propiedad || !propiedad.idPropiedad) {
        throw new Error('No se ha proporcionado el ID de la propiedad');
      }
      
      const planPagoData = {
        id_empresa: idEmpresa,
        id_usuario: idUsuario,
        id_propiedad: propiedad.idPropiedad,
        id_tipo_plan_pago_propiedad: tipoPlanId,
        descripcion: `Plan de pago ${esAlContado ? 'Al Contado' : 'Por Partes'} - ${propiedad?.nombre || 'propiedad'}`,
        monto_inicial: formData.montoInicial,
        cantidad_cuotas: formData.numeroCuota,
        id_frecuencia_pago: frecuenciaId,
        aplica_mora: formData.mora,
        tasa_interes: formData.interes
      };

      const baseUrl = `/api/proxy?service=planes&path=planes-pago`;
      const isEditing = planPago && planPago.idPlanPagoPropiedad;
      
      let apiUrl = baseUrl;
      let method = 'POST';
      
      if (isEditing) {
        apiUrl = `${baseUrl}/${planPago.idPlanPagoPropiedad}`;
        method = 'PATCH';
      }
      
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planPagoData)
      });
      
      if (!response.ok) {
        const errorMessage = isEditing ? 'actualizar' : 'crear';
        throw new Error(`Error al ${errorMessage} plan de pago: ${response.status}`);
      }

      const responseData = await response.json();
      onGuardar(formData as PlanPago);
    } catch (error) {
      console.error('Error al guardar plan de pago:', error);
      alert(`Error al guardar plan de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'interes' && (value < 0 || value > 100)) {
      value = Math.max(0, Math.min(100, value));
    }
    
    if (field === 'numeroCuota' && value <= 0) {
      value = 1;
    }
    
    if (field === 'montoInicial' && value < 0) {
      value = 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComboboxChange = (field: string, value: any) => {
    if (field === 'planPago') {
      const tipoPlanSeleccionado = tiposPlan.find(tipo => {
        const id = tipo.id || tipo.idTipoPlanPagoPropiedad || tipo.id_tipo_plan_pago_propiedad;
        return id && id.toString() === value;
      });
      const nombrePlan = tipoPlanSeleccionado?.nombre || '';
      const esAlContado = nombrePlan.toLowerCase().includes('contado');
      setCamposEditables({
        numeroCuota: !esAlContado,
        interes: !esAlContado
      });
      
      if (esAlContado) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          numeroCuota: 1,
          interes: 0
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: value   
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const opcionesTipoPlan = Array.isArray(tiposPlan) ? tiposPlan.map(tipo => {
    const id = tipo.id || tipo.idTipoPlanPagoPropiedad || tipo.id_tipo_plan_pago_propiedad;
    return {
      label: tipo.nombre || '',
      value: id ? id.toString() : ''
    };
  }) : [];

  let opcionesFrecuencia = Array.isArray(frecuenciasPago) ? frecuenciasPago.map((freq: any, index: number) => {
    const id = freq.id || freq.id_frecuencia_pago || freq.idFrecuenciaPago;
    const label = freq.descripcion || freq.nombre || freq.label || `Frecuencia ${id}`;
    const value = id ? id.toString() : ''; 
    
    return { label, value };
  }) : [];
  
  opcionesFrecuencia = opcionesFrecuencia.filter(opt => opt.value);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full max-w-none space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Tipo plan de pago</Label>
            <Combobox
              options={opcionesTipoPlan}
              selected={formData.planPago}
              onChange={(value) => handleComboboxChange('planPago', value)}
              placeholder={cargandoTipos ? "Cargando tipos..." : "Seleccionar tipo de plan"}
              disabled={cargandoTipos}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Cuotas</Label>
            <div className="relative w-full mt-2">
              <Input
                type="number"
                min="1"
                max="60"
                value={formData.numeroCuota}
                onChange={(e) => handleInputChange('numeroCuota', parseInt(e.target.value) || 1)}
                className={`text-sm font-medium w-full ${!camposEditables.numeroCuota ? '' : ''}`}
                placeholder="Número de cuotas"
                readOnly={!camposEditables.numeroCuota}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Costo</Label>
            <div className="relative w-full mt-2">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm z-10">S/</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={precioBase}
                readOnly
                className="pl-8 text-sm font-medium w-full"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Interés</Label>
            <div className="relative w-full mt-2">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm z-10">%</span>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.interes}
                onChange={(e) => {
                  const valor = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  handleInputChange('interes', valor);
                }}
                className="pl-8 text-sm font-medium w-full"
                placeholder="0"
                readOnly={!camposEditables.interes}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Costo + Interés</Label>
            <div className="relative w-full mt-2">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm z-10">S/</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.nuevoCosto}
                readOnly
                className="pl-8 text-sm font-medium w-full"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Monto Inicial (S/)</Label>
            <div className="relative w-full mt-2">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm z-10">S/</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.montoInicial}
                onChange={(e) => handleInputChange('montoInicial', parseFloat(e.target.value) || 0)}
                className="pl-8 text-sm font-medium w-full"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Frecuencia</Label>
            <Combobox
              options={opcionesFrecuencia}
              selected={formData.frecuencia}
              onChange={(value) => handleInputChange('frecuencia', value)}
              placeholder={cargandoFrecuencias ? "Cargando frecuencias..." : "Seleccionar frecuencia"}
              disabled={cargandoFrecuencias}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Mora</Label>
            <div className="relative w-full mt-2 border rounded-md px-2 py-1.5 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{formData.mora ? "Sí" : "No"}</span>
                <Switch
                  checked={formData.mora || false}
                  onChange={(checked) => handleInputChange('mora', checked)}
                  id="mora-switch"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancelar}
            className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-50 text-sm font-medium"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          >
            {planPago ? 'Actualizar' : 'Agregar'} Plan de Pago
          </Button>
        </div>
      </form>
    </div>
  );
};

export const planPagoConfig = {
  columnas: planPagoColumnas,
  obtenerDatos: obtenerPlanesPago,
};

// Componente para mostrar la lista de planes configurados en la cotización
interface ListaPlanesConfiguradosProps {
  planes: PlanPago[];
  precioBase: number;
  onGestionar: () => void;
  onGenerarCronograma: (plan: PlanPago) => void;
  onReservar: (plan: PlanPago) => void;
  onAnular: (plan: PlanPago) => void;
  onMantenerReserva?: (plan: PlanPago) => void;
  onAnularReserva?: (plan: PlanPago) => void;
  planesGenerados?: Set<number>;
  planesReservados?: Set<number>;
  fechasReserva?: Map<number, Date>;
  planesAnulados?: Set<number>;
  planesAprobados?: Set<number>;
}

export const ListaPlanesConfigurados: React.FC<ListaPlanesConfiguradosProps> = ({
  planes,
  precioBase,
  onGestionar,
  onGenerarCronograma,
  onReservar,
  onAnular,
  onMantenerReserva,
  onAnularReserva,
  planesGenerados = new Set(),
  planesReservados = new Set(),
  fechasReserva = new Map(),
  planesAnulados = new Set(),
  planesAprobados = new Set(),
}) => {
  if (!planes || planes.length === 0) {
    return null;
  }

  // Verificar si hay alguna reserva activa - REMOVIDO para permitir gestión de nuevos planes
  // const hayReservaActiva = planesReservados.size > 0;

  return (
    <div className="w-full space-y-4">
      {/* Header con botón Gestionar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Planes de Pago Configurados</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onGestionar}
          disabled={planesAprobados.size > 0}
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Gestionar
        </Button>
      </div>

      {/* Tabla de planes con altura fija y scroll */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  N°
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Plan de Pago
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Interés
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Precio Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Cronograma
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Acciones
                </th>
              </tr>
            </thead>
          </table>
        </div>
        
        {/* Contenedor con scroll para el tbody */}
        <div className="max-h-42 overflow-y-auto">
          <table className="w-full">
            <tbody className="bg-white divide-y divide-gray-200">
              {planes.map((plan, index) => (
                <tr key={plan.idPlanPagoPropiedad || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center w-16">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {plan.planPago}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center w-20">
                    {plan.interes}%
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right w-32">
                    S/ {plan.nuevoCosto?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGenerarCronograma(plan)}
                      disabled={planesAnulados.has(plan.idPlanPagoPropiedad!)}
                      className={`text-xs ${planesAnulados.has(plan.idPlanPagoPropiedad!) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {planesAnulados.has(plan.idPlanPagoPropiedad!) ? 'Anulado' : planesAprobados.has(plan.idPlanPagoPropiedad!) ? 'Ver' : planesGenerados?.has(plan.idPlanPagoPropiedad!) ? 'Ver' : 'Generar'}
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-center w-40">
                    {planesAnulados.has(plan.idPlanPagoPropiedad!) ? (
                      <div className="space-y-1">
                        <div className="text-xs text-red-600 font-medium">Plan Anulado</div>
                      </div>
                    ) : planesAprobados.has(plan.idPlanPagoPropiedad!) ? (
                      <div className="space-y-1">
                        <div className="text-xs text-green-600 font-medium">Reserva Exitosa</div>
                      </div>
                    ) : planesReservados.has(plan.idPlanPagoPropiedad!) ? (
                      <div className="space-y-2">
                        <div className="text-xs text-green-600 font-medium">🏠 Reservado</div>
                        <div className="text-xs text-gray-700 font-medium">
                          💰 Monto: S/ {(plan.montoInicial || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          📋 Estado: Pendiente
                        </div>
                        {fechasReserva.has(plan.idPlanPagoPropiedad!) && (
                          <div className="text-xs text-orange-600 font-medium">
                            ⏰ Pagar hasta: {fechasReserva.get(plan.idPlanPagoPropiedad!)?.toLocaleDateString('es-PE')}
                          </div>
                        )}
                        <div className="flex flex-col gap-1 mt-2">
                          <Button
                            size="sm"
                            onClick={() => onMantenerReserva && onMantenerReserva(plan)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1"
                            title="Marcar reserva como pagada"
                          >
                            ✅ Mantener
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onAnularReserva && onAnularReserva(plan)}
                            className="text-xs text-red-600 border-red-300 hover:bg-red-50 px-2 py-1"
                            title="Cancelar la reserva"
                          >
                            ❌ Anular
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => onReservar(plan)}
                          disabled={!planesGenerados?.has(plan.idPlanPagoPropiedad!)}
                          className={`text-xs ${
                            planesGenerados?.has(plan.idPlanPagoPropiedad!) 
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : 'bg-gray-300 cursor-not-allowed'
                          }`}
                          title={
                            !planesGenerados?.has(plan.idPlanPagoPropiedad!) 
                              ? 'Debe generar la cotización primero' 
                              : 'Reservar este plan'
                          }
                        >
                          Reservar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAnular(plan)}
                          disabled={!planesGenerados?.has(plan.idPlanPagoPropiedad!)}
                          className={`text-xs ${
                            planesGenerados?.has(plan.idPlanPagoPropiedad!)
                              ? 'text-red-600 border-red-300 hover:bg-red-50'
                              : 'text-gray-400 border-gray-200 cursor-not-allowed'
                          }`}
                          title={
                            !planesGenerados?.has(plan.idPlanPagoPropiedad!) 
                              ? 'Debe generar la cotización primero' 
                              : 'Anular este plan'
                          }
                        >
                          Anular
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default planPagoConfig;
