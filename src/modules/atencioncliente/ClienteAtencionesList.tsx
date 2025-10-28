"use client"

import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Atencion, getAtencionesByPersona, deleteAtencion } from "@/services/apiAtencion";
import { Pencil, Trash2 } from 'lucide-react';
import { useAlert } from "@/contexts/AlertContext";
import { formatDate } from "@/utils/dateUtils";

interface ClienteAtencionesListProps {
  personaId: number | null;
  onNuevaConsulta: () => void;
  onNuevoReclamo: () => void;
}

export interface ClienteAtencionesListRef {
  refresh: () => void;
}

const ClienteAtencionesList = forwardRef<ClienteAtencionesListRef, ClienteAtencionesListProps>(({ personaId, onNuevaConsulta, onNuevoReclamo }, ref) => {
  const [atenciones, setAtenciones] = useState<Atencion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlert();

  const fetchAtenciones = useCallback(async () => {
    if (!personaId) {
      setAtenciones([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getAtencionesByPersona(personaId);
      setAtenciones(data);
    } catch (error) {
      console.error("Error al cargar atenciones:", error);
      showAlert("error", "Error", "No se pudieron cargar las atenciones del cliente");
    } finally {
      setIsLoading(false);
    }
  }, [personaId, showAlert]);

  useEffect(() => {
    fetchAtenciones();
  }, [fetchAtenciones]);

  useImperativeHandle(ref, () => ({
    refresh: fetchAtenciones,
  }));

  // Filtrar consultas y reclamos
  const consultas = atenciones.filter(a => a.idTipoAtencion === 1);
  const reclamos = atenciones.filter(a => a.idTipoAtencion === 2);

  const handleEdit = (atencion: Atencion) => {
    showAlert("info", "Función no implementada", "La edición de atenciones aún no está disponible.");
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta atención?")) {
      try {
        await deleteAtencion(id);
        showAlert("success", "Atención eliminada", "El registro de atención ha sido eliminado exitosamente.");
        fetchAtenciones(); // Recargar la lista
      } catch (error) {
        console.error("Error al eliminar la atención:", error);
        showAlert("error", "Error", "No se pudo eliminar la atención.");
      }
    }
  };

  const renderAtencionesList = (items: Atencion[]) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center p-8 text-gray-500">
          No hay registros disponibles
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">N°</th>
              <th scope="col" className="px-6 py-3">Fecha</th>
              <th scope="col" className="px-6 py-3">Canal</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3">Observaciones</th>
              <th scope="col" className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((atencion) => (
              <tr key={atencion.id_atencion} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">{atencion.id_atencion}</td>
                <td className="px-6 py-4">
                  {atencion.created_at ? formatDate(atencion.created_at) : 'N/A'}
                </td>
                <td className="px-6 py-4">Canal {atencion.idCanal}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    atencion.idEstadoAtencion === 1 ? 'bg-yellow-100 text-yellow-800' : 
                    atencion.idEstadoAtencion === 2 ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {atencion.idEstadoAtencion === 1 ? 'Pendiente' : 
                     atencion.idEstadoAtencion === 2 ? 'Resuelto' : 'Otro'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate">
                    {atencion.observaciones || 'Sin observaciones'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(atencion)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(atencion.id_atencion)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Atenciones del Cliente</h2>
        <div className="space-x-2">
          <Button onClick={onNuevaConsulta} variant="outline" size="sm">
            Nueva Consulta
          </Button>
          <Button onClick={onNuevoReclamo} variant="default" size="sm">
            Nuevo Reclamo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="consultas">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consultas">
            Consultas ({consultas.length})
          </TabsTrigger>
          <TabsTrigger value="reclamos">
            Reclamos ({reclamos.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="consultas" className="mt-4">
          {renderAtencionesList(consultas)}
        </TabsContent>
        <TabsContent value="reclamos" className="mt-4">
          {renderAtencionesList(reclamos)}
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default ClienteAtencionesList;
