"use client";

import { useState, useEffect, useCallback } from 'react';
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { Button } from '@/components/ui/button';
import Datatable from "@/components/table/datatable";
import { Combobox } from '@/components/ui/combobox';
import { useAlert } from "@/contexts/AlertContext";
import { useCompany } from "@/contexts/CompanyContext";
import { TextField } from '@mui/material';
import { crearAtencionProyecto } from '@/services/apiAtencionProyecto';
import { crearAtencionPropiedad } from '@/services/apiAtencionPropiedad';
import styles from '@/modules/atencioncliente/components/styles/Proyect&PropiSelect.module.css';

export interface ProyectPropiSelectProps {
  titulo: string;
  filtros: {
    nombre: string;
    opciones: { value: string | number; label: string }[];
    valorInicial?: string | number;
  }[];
  columnas: any[];
  obtenerDatos: (filtros: Record<string, any>, busqueda: string, idEmpresa?: number) => Promise<any[]>;
  renderizarInformacion: (item: any) => React.ReactNode;
  renderizarGaleria?: (item: any) => React.ReactNode;
  onConfirmar?: (item: any, observaciones?: string) => void;
  idAtencion?: number;
  className?: string;
}

const ProyectPropiSelect = ({
  titulo,
  filtros,
  columnas,
  obtenerDatos,
  renderizarInformacion,
  renderizarGaleria,
  onConfirmar,
  idAtencion,
  className
}: ProyectPropiSelectProps) => {
  const { showAlert } = useAlert();

  const [datos, setDatos] = useState<any[]>([]);
  const { selectedCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [itemSeleccionado, setItemSeleccionado] = useState<any | null>(null);
  const [filtrosActivos, setFiltrosActivos] = useState<Record<string, any>>({});
  const [filtrosPendientes, setFiltrosPendientes] = useState<Record<string, any>>({});
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const filtrosIniciales: Record<string, any> = {};
    filtros.forEach(filtro => {
      filtrosIniciales[filtro.nombre] = filtro.valorInicial || 
        (filtro.opciones.length > 0 ? filtro.opciones[0].value : '');
    });
    setFiltrosActivos(filtrosIniciales);
    setFiltrosPendientes(filtrosIniciales);
  }, [filtros]);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('ID de atención disponible en ProyectPropiSelect:', idAtencion);
      
      const datosObtenidos = await obtenerDatos(filtrosActivos, busqueda);
      setDatos(datosObtenidos);
      if (datosObtenidos.length === 0) {
        setItemSeleccionado(null);
      }
    } catch (error) {
      console.error('Error al obtener datos:', error);
      showAlert('error', 'Error', 'No se pudieron cargar los datos.');
      setDatos([]);
    } finally {
      setIsLoading(false);
    }
  }, [obtenerDatos, filtrosActivos, busqueda, showAlert, idAtencion]);

  useEffect(() => {
    cargarDatos();
  }, [obtenerDatos, filtrosActivos, busqueda, showAlert, idAtencion]);

  const handleFiltroChange = (nombre: string, valor: any) => {
    setFiltrosPendientes(prev => ({
      ...prev,
      [nombre]: valor
    }));
  };

  const handleBusquedaChange = (valor: string) => {
    setBusqueda(valor);
  };

  const aplicarFiltros = async () => {
    setFiltrosActivos(filtrosPendientes);
    
    setIsLoading(true);
    try {
      const resultado = await obtenerDatos(filtrosPendientes, busqueda, selectedCompany?.idEmpresa);
      setDatos(resultado);
      if (resultado.length === 0) {
        setItemSeleccionado(null);
      }
    } catch (error) {
      console.error('Error al obtener datos:', error);
      showAlert('error', 'Error', 'No se pudieron cargar los datos.');
      setDatos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = (item: any) => {
    // Verificar si la propiedad está reservada por otro cliente
    if (item.reservadaPorOtro) {
      showAlert('warning', 'Propiedad No Disponible', 'Esta propiedad ya está reservada por otro cliente y no se puede seleccionar.');
      return;
    }
    
    setItemSeleccionado(item);
    // Generar automáticamente la observación cuando se selecciona un proyecto
    if (item && item.nombre) {
      setObservaciones(`Cliente interesado por proyecto "${item.nombre}"`);
    }
  };
  
  const isItemSelected = (item: any) => {
    if (!itemSeleccionado || !item) return false;
    
    if ('id' in itemSeleccionado && 'id' in item) {
      return itemSeleccionado.id === item.id;
    } else if ('id_proyecto' in itemSeleccionado && 'id_proyecto' in item) {
      return itemSeleccionado.id_proyecto === item.id_proyecto;
    } else if ('codigo' in itemSeleccionado && 'codigo' in item) {
      return itemSeleccionado.codigo === item.codigo;
    }
    
    return JSON.stringify(itemSeleccionado) === JSON.stringify(item);
  };

  const handleObservacionesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setObservaciones(e.target.value);
  };

  const handleConfirmar = async () => {
    if (!itemSeleccionado) {
      showAlert('error', 'Error', 'No se ha seleccionado ningún elemento.');
      return;
    }
    
    if (!idAtencion) {
      showAlert('error', 'Error', 'No se ha proporcionado el ID de atención.');
      return;
    }
    
    setGuardando(true);
    
    try {
      const fechaActual = new Date().toISOString();
      const idAtencionNumero = Number(idAtencion);
      
      const esProyecto = itemSeleccionado.idProyectoInmobiliario || itemSeleccionado.id_proyecto;
      const esPropiedad = itemSeleccionado.idPropiedad || itemSeleccionado.id_propiedad;
      
      if (esProyecto && !esPropiedad) {
        const proyectoId = itemSeleccionado.id_proyecto || itemSeleccionado.idProyectoInmobiliario || itemSeleccionado.id;
        
        const idProyectoNumero = Number(proyectoId);
        
        const datosAEnviar = {
          id_atencion: idAtencionNumero,
          id_proyecto_inmobiliario: idProyectoNumero,
          fecha_registro: fechaActual,
          observaciones: observaciones
        };
        
        await crearAtencionProyecto(datosAEnviar);
        
        if (!onConfirmar) {
          showAlert('success', 'Éxito', `Proyecto asociado correctamente a la atención #${idAtencion}.`);
        }
      } else if (esPropiedad) {
        const propiedadId = itemSeleccionado.idPropiedad || itemSeleccionado.id_propiedad || itemSeleccionado.id;
        
        const idPropiedadNumero = Number(propiedadId);
        
        const datosAEnviar = {
          id_atencion: idAtencionNumero,
          id_propiedad: idPropiedadNumero,
          fecha_registro: fechaActual,
          observaciones: observaciones
        };
        
        await crearAtencionPropiedad(datosAEnviar);
        
        if (!onConfirmar) {
          showAlert('success', 'Éxito', `Propiedad asociada correctamente a la atención #${idAtencion}.`);
        }
      } else {
        throw new Error('No se pudo determinar si el elemento seleccionado es un proyecto o una propiedad.');
      }
      
      if (onConfirmar) {
        onConfirmar(itemSeleccionado, observaciones);
      }
    } catch (error) {
      console.error('Error al guardar la atención:', error);
      showAlert('error', 'Error', 'No se pudo guardar la asociación.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={`${styles.mainContainer} ${className || ''}`}>
      <AdminCardLayout>
        <AdminCardLayout.Header>
          <AdminCardLayout.Title>
            {titulo}
          </AdminCardLayout.Title>
        </AdminCardLayout.Header>
        <AdminCardLayout.Content className="overflow-y-auto flex-grow flex flex-col">
          <div className={styles.controlsContainer}>
            <div className={styles.filtrosContainer}>
              {/* Filtros de ubicación independientes */}
              {filtros.map((filtro, index) => (
                <div key={index} className={styles.filtroItem}>
                  <label className={styles.filtroLabel}>{filtro.nombre}</label>
                  <Combobox
                    options={filtro.opciones.map(opcion => ({
                      value: String(opcion.value),
                      label: opcion.label
                    }))}
                    selected={String(filtrosPendientes[filtro.nombre] || '')}
                    onChange={(value) => handleFiltroChange(filtro.nombre, value)}
                    placeholder={`Seleccionar ${filtro.nombre.toLowerCase()}...`}
                  />
                </div>
              ))}
              <Button 
                className={styles.filtroButton} 
                onClick={aplicarFiltros}
              >
                Buscar
              </Button>
              
              {/* Botón de confirmación a la altura de los filtros */}
              {onConfirmar && itemSeleccionado && (
                <Button 
                  className={styles.confirmButtonHeader} 
                  onClick={handleConfirmar}
                  disabled={!itemSeleccionado || !observaciones || guardando}
                >
                  {guardando ? 'Guardando...' : 'Confirmar selección'}
                </Button>
              )}
            </div>
          </div>

          <div className={styles.tableContainer}>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Cargando datos...</p>
              </div>
            ) : datos.length === 0 ? (
              <div className={styles.noResultsContainer}>
                <p>No se encontraron resultados.</p>
              </div>
            ) : (
              <div className={styles.scrollableTableContainer}>
                <Datatable 
                  columns={columnas} 
                  data={datos} 
                  onRowDoubleClick={handleItemSelect}
                  rowClassName={(row: any) => {
                    if (row.reservadaPorOtro) {
                      return styles.reservedRow;
                    }
                    return isItemSelected(row) ? styles.selectedRow : '';
                  }}
                />
              </div>
            )}
          </div>

          {itemSeleccionado && (
            <div className={styles.detalleContainer}>
              <div className={styles.infoContainer}>
                {renderizarInformacion(itemSeleccionado)}
              </div>
              <div className={styles.galeriaContainer}>
                {renderizarGaleria ? renderizarGaleria(itemSeleccionado) : <div>Sin galería disponible</div>}
              </div>
            </div>
          )}

          {onConfirmar && (
            <div className={styles.confirmContainer}>
              {itemSeleccionado && (
                <div className={styles.observacionesContainer}>
                  <TextField
                    label="Observaciones"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    maxRows={6}
                    value={observaciones}
                    onChange={handleObservacionesChange}
                    placeholder="Ingrese observaciones sobre el proyecto"
                    className={styles.observacionesInput}
                  />
                </div>
              )}
            </div>
          )}
        </AdminCardLayout.Content>
      </AdminCardLayout>
    </div>
  );
};

export default ProyectPropiSelect;
