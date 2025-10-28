"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useAlert } from '@/contexts/AlertContext';
import { Proyecto } from "@/types/proyectos";
import { Propiedad } from "@/types/propiedades";
import { Persona } from "@/types/persona";
import {
  PlanPago,
  ResumenSeleccion,
  FormularioPlanPago,
  planPagoColumnas,
  obtenerPlanesPago,
  eliminarPlanPago
} from './planPagoConfig';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PlanPagoSelectProps {
  proyecto: Proyecto | null;
  propiedad: Propiedad | null;
  idCotizacion?: number;
  idEmpresa?: number;
  idUsuario?: number;
  cliente?: Persona;
  clienteId?: number;
  onPlanSeleccionado?: (plan: PlanPago) => void;
  onClose?: () => void;
  onPlanCreated?: () => Promise<void>;
  planesAnulados?: Set<number>;
  planesAprobados?: Set<number>;
}

const PlanPagoSelect: React.FC<PlanPagoSelectProps> = ({
  proyecto,
  propiedad,
  idCotizacion,
  idEmpresa,
  idUsuario,
  cliente,
  clienteId,
  onPlanSeleccionado,
  onClose,
  onPlanCreated,
  planesAnulados = new Set(),
  planesAprobados = new Set()
}) => {
  const { showAlert } = useAlert();
  const [planesPago, setPlanesPago] = useState<PlanPago[]>([]);
  const [cargando, setCargando] = useState(false);
  const [showFormulario, setShowFormulario] = useState(false);
  const [planEditando, setPlanEditando] = useState<PlanPago | null>(null);
  const [planVisualizando, setPlanVisualizando] = useState<PlanPago | null>(null);
  const [showVisualizacion, setShowVisualizacion] = useState(false);
  // Estados para el modal de confirmación de eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planAEliminar, setPlanAEliminar] = useState<PlanPago | null>(null);
  

  // Cargar planes de pago existentes cuando cambia la propiedad o la cotización
  useEffect(() => {
    if (propiedad?.idPropiedad) {
      cargarPlanesPago();
    } 
  }, [idCotizacion, propiedad]);

  // Debug: Verificar que se reciben los planes aprobados
  useEffect(() => {
  
  }, [planesAprobados, planesAnulados]);

  const cargarPlanesPago = async () => {
    if (!propiedad || !propiedad.idPropiedad) {
      console.warn('No hay propiedad seleccionada para cargar planes de pago');
      return;
    }
    
    setCargando(true);
    try {
       
      const planes = await obtenerPlanesPago(
        {}, 
        '', 
        idCotizacion, 
        propiedad.idPropiedad,
        propiedad.precio
      );
      
      setPlanesPago(planes);
    } catch (error) {
      showAlert('error', 'Error', 'No se pudieron cargar los planes de pago');
    } finally {
      setCargando(false);
    }
  };

  const handleNuevoPlan = () => {
    setPlanEditando(null);
    setShowFormulario(true);
  };

  const handleEditarPlan = (plan: PlanPago) => {
    // Verificar si el plan está anulado
    if (plan.idPlanPagoPropiedad && planesAnulados.has(plan.idPlanPagoPropiedad)) {
      showAlert('warning', 'Plan Anulado', 'No se puede editar un plan de pago que ha sido anulado');
      return;
    }
    
    // Verificar si el plan está aprobado
    if (plan.idPlanPagoPropiedad && planesAprobados.has(plan.idPlanPagoPropiedad)) {
      showAlert('warning', 'Plan Aprobado', 'No se puede editar un plan de pago que ha sido aprobado');
      return;
    }
    
    setPlanEditando(plan);
    setShowFormulario(true);
  };

  const handleEliminarPlan = (plan: PlanPago) => {
    if (!plan.idPlanPagoPropiedad) {
      showAlert('error', 'Error', 'No se puede eliminar: ID del plan no válido');
      return;
    }
    
    // Verificar si el plan está anulado
    if (planesAnulados.has(plan.idPlanPagoPropiedad)) {
      showAlert('warning', 'Plan Anulado', 'No se puede eliminar un plan de pago que ha sido anulado');
      return;
    }
    
    // Verificar si el plan está aprobado
    if (planesAprobados.has(plan.idPlanPagoPropiedad)) {
      showAlert('warning', 'Plan Aprobado', 'No se puede eliminar un plan de pago que ha sido aprobado');
      return;
    }
    
    // Abrir modal de confirmación
    setPlanAEliminar(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeletePlan = async () => {
    if (!planAEliminar?.idPlanPagoPropiedad) return;

    try {
      // Llamar a la API para eliminar
      await eliminarPlanPago(planAEliminar.idPlanPagoPropiedad);
      
      // Actualizar la lista local
      setPlanesPago(prev => prev.filter(p => p.idPlanPagoPropiedad !== planAEliminar.idPlanPagoPropiedad));
      showAlert('success', 'Éxito', 'Plan de pago eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar plan:', error);
      showAlert('error', 'Error', 'No se pudo eliminar el plan de pago');
    } finally {
      // Cerrar modal y limpiar estado
      setIsDeleteDialogOpen(false);
      setPlanAEliminar(null);
    }
  };

  const handleGuardarPlan = async (planData: PlanPago) => {
    try {
      // Siempre recargar los planes desde la API para obtener los datos más actualizados
      await cargarPlanesPago();
      
      if (planEditando) {
        showAlert('success', 'Éxito', 'Plan de pago actualizado correctamente');
        // Notificar al componente padre que se actualizó un plan
        if (onPlanCreated) {
          await onPlanCreated();
        }
      } else {
        showAlert('success', 'Éxito', 'Plan de pago creado correctamente');
        // Notificar al componente padre que se creó un nuevo plan
        if (onPlanCreated) {
          await onPlanCreated();
        }
      }
      
      setShowFormulario(false);
      setPlanEditando(null); // Limpiar el plan en edición
    } catch (error) {
      console.error('Error al guardar plan de pago:', error);
      showAlert('error', 'Error', 'No se pudo guardar el plan de pago');
    }
  };

  const handleSeleccionarPlan = (plan: PlanPago) => {
    if (onPlanSeleccionado) {
      onPlanSeleccionado(plan);
    }
    showAlert('success', 'Plan Seleccionado', `Se ha seleccionado el plan: ${plan.idTipoPlanPagoPropiedad}`);
  };


  const precioBase = propiedad?.precio || 0;

  return (
    <div className="w-full h-full p-6 space-y-6 bg-white overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurar Planes de Pago</h1>
      </div>

      <ResumenSeleccion proyecto={proyecto} propiedad={propiedad} />

      {!proyecto || !propiedad ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 text-center">
              ❌ Debe completar la selección de proyecto y propiedad antes de configurar planes de pago
            </p>
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={onClose}>
                Volver a Cotización
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Planes de Pago</h2>
              <p className="text-gray-600 mt-1">
                Configure los planes de pago para la propiedad seleccionada
              </p>
            </div>
            <Button onClick={handleNuevoPlan} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Plan
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Planes de Pago Configurados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cargando ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : planesPago.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay planes de pago configurados</p>
                  <p className="text-sm mt-2">Haga clic en "Nuevo Plan" para agregar el primero</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-72">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {planPagoColumnas.map((columna) => (
                          <TableHead key={columna.accessorKey} style={{ width: columna.size }}>
                            {columna.header}
                          </TableHead>
                        ))}
                        <TableHead className="text-center" style={{ width: 180 }}>
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planesPago.map((plan, index) => {
                        const isAnulado = plan.idPlanPagoPropiedad && planesAnulados.has(plan.idPlanPagoPropiedad);
                        const isAprobado = plan.idPlanPagoPropiedad && planesAprobados.has(plan.idPlanPagoPropiedad);
                        const isBlocked = isAnulado || isAprobado;
                        
                        return (
                          <TableRow 
                            key={plan.idPlanPagoPropiedad} 
                            className={`hover:bg-gray-50 ${
                              isAnulado ? 'bg-red-50 opacity-75' : 
                              isAprobado ? 'bg-green-50 opacity-75' : ''
                            }`}
                          >
                            {planPagoColumnas.map((columna) => (
                              <TableCell key={columna.accessorKey} className={isBlocked ? 'text-gray-500' : ''}>
                                {columna.cell ? 
                                  columna.cell({ row: { original: plan, index } }) : 
                                  (plan as any)[columna.accessorKey]
                                }
                              </TableCell>
                            ))}
                            <TableCell>
                              {isAnulado ? (
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="text-xs text-red-600 font-medium">Plan Anulado</div>
                                  <div className="text-xs text-gray-500">Sin acciones disponibles</div>
                                </div>
                              ) : isAprobado ? (
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="text-xs text-green-600 font-medium">Plan Aprobado</div>
                                  <div className="text-xs text-gray-500">Sin acciones disponibles</div>
                                </div>
                              ) : (
                                <div className="flex justify-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditarPlan(plan)}
                                    className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100"
                                    title="Editar"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEliminarPlan(plan)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Volver a Cotización
            </Button>
          </div>
        </>
      )}

      <Dialog open={showFormulario} onOpenChange={setShowFormulario}>
        <DialogContent className="!max-w-none w-[40vw] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 !overflow-visible p-6 !z-50">
          <DialogHeader>
            <DialogTitle>
              {planEditando ? 'Editar Plan de Pago' : 'Nuevo Plan de Pago'}
            </DialogTitle>
          </DialogHeader>
          <FormularioPlanPago
            planPago={planEditando}
            onGuardar={handleGuardarPlan}
            onCancelar={() => setShowFormulario(false)}
            precioBase={precioBase}
            proyecto={proyecto}
            propiedad={propiedad}
            idEmpresa={idEmpresa}
            idUsuario={idUsuario}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showVisualizacion} onOpenChange={setShowVisualizacion}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Plan de Pago</DialogTitle>
          </DialogHeader>
          {planVisualizando && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Tipo de Plan:</span>
                      <p className="font-semibold">{planVisualizando.idTipoPlanPagoPropiedad}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Número de Cuotas:</span>
                      <p className="font-semibold">{planVisualizando.cantidadCuotas}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Interés:</span>
                      <p className="font-semibold">{planVisualizando.tasaInteres}%</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Frecuencia:</span>
                      <p className="font-semibold">{planVisualizando.idFrecuenciaPago}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Costo por Cuota:</span>
                      <p className="font-semibold text-green-600">
                        S/ {planVisualizando.montoInicial?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Valor Mínimo:</span>
                      <p className="font-semibold">
                        S/ {planVisualizando.montoInicial?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Mora:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        planVisualizando.aplicaMora ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {planVisualizando.aplicaMora ? "Sí" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Total a Pagar:</span>
                      <p className="font-bold text-blue-600">
                        S/ {((planVisualizando.montoInicial || 0) * (planVisualizando.cantidadCuotas || 1)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowVisualizacion(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => {
                  handleSeleccionarPlan(planVisualizando);
                  setShowVisualizacion(false);
                }}>
                  Seleccionar Este Plan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar plan de pago */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este plan de pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El plan "{planAEliminar?.planPago}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeletePlan}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlanPagoSelect;