"use client"

import { useEffect, useState, useMemo, useCallback } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { Dialog } from "@/components/ui/dialog";
import PlanPagosApi from "@/modules/planPagos/services/PlanPagosApi";
import Datatable from "@/components/table/datatable";
import { Button } from '@/components/ui/button';
import { Empresa } from "@/types/empresas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAlert } from "@/contexts/AlertContext";
import { getConfigInteresMoraColumns } from "@/modules/planPagos/configInteresMora/columns";
import { useCheckPermission } from "@/contexts/PermissionContext";
import { useCurrentOptionId } from "@/hooks/useCurrentOptionId";
import { useCompany } from "@/contexts/CompanyContext";
import MuiPagination from "@/components/ui/pagination";
import ConfigInteresMoraForm from "./ConfigInteresMoraForm";
import { ConfigInteresMora } from "@/modules/planPagos/models/planPagosModels";
import { getEmpresas } from "@/services/apiEmpresa";

export default function ConfigInteresMoraList() {
  const [loading, setLoading] = useState(false);
  const [allConfiguraciones, setAllConfiguraciones] = useState<ConfigInteresMora[]>([]);
  const [filteredConfiguraciones, setFilteredConfiguraciones] = useState<ConfigInteresMora[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [empresas, setEmpresas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [tiposConfiguracion, setTiposConfiguracion] = useState<Array<{ id: number; nombre: string }>>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<number | null>(null);

  const { showAlert } = useAlert();
  const { selectedCompany } = useCompany();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const currentOptionId = useCurrentOptionId();
  const checkPermission = useCheckPermission();
  const canCreate = currentOptionId ? checkPermission('crear') : false;
  const canEdit = currentOptionId ? checkPermission('editar') : false;
  const canDelete = currentOptionId ? checkPermission('eliminar') : false;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedCompany?.idEmpresa) {
        setLoading(false);
        return;
      }

      // Obtener todas las configuraciones sin paginación para calcular correctamente
      const response = await PlanPagosApi.configInteresMoraController.getConfigInteresMoraList(
        {
          page: 1,
          perPage: 1000 // Traer un número grande para obtener todos los registros
        },
        selectedCompany.idEmpresa
      );

      if (response) {
        // Ordenar por fecha de aplicación (más reciente primero)
        const sortedConfigs = [...response.data].sort((a, b) => 
          new Date(b.aplicaDesdeDia).getTime() - new Date(a.aplicaDesdeDia).getTime()
        );

        // Aplicar paginación manualmente
        const startIndex = (page - 1) * perPage;
        const paginatedData = sortedConfigs.slice(startIndex, startIndex + perPage);

        setAllConfiguraciones(sortedConfigs);
        setFilteredConfiguraciones(paginatedData);
        setTotalItems(sortedConfigs.length);
      }
    } catch (error) {
      console.error("Error al cargar configuraciones de mora:", error);
      showAlert("error", "Error", "No se pudieron cargar las configuraciones de mora");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, selectedCompany?.idEmpresa, showAlert]);

  // Filtrar y ordenar configuraciones
  useEffect(() => {
    if (!allConfiguraciones.length) return;

    let filtered = [...allConfiguraciones];

    // Filtrar por empresa seleccionada
    if (selectedCompany) {
      filtered = filtered.filter(c => c.idEmpresa === selectedCompany.idEmpresa);
    }

    // Aplicar paginación
    const startIndex = (page - 1) * perPage;
    const paginatedData = filtered.slice(startIndex, startIndex + perPage);

    setFilteredConfiguraciones(paginatedData);
    setTotalItems(filtered.length);
  }, [allConfiguraciones, selectedCompany, page, perPage]);

  // Cargar tipos de configuración
  useEffect(() => {
    const loadTiposConfiguracion = async () => {
      try {
        const tipos = await PlanPagosApi.configInteresMoraController.getTiposConfiguracion();
        setTiposConfiguracion(tipos || []);
      } catch (error) {
        console.error("Error al cargar tipos de configuración:", error);
        showAlert("error", "Error", "No se pudieron cargar los tipos de configuración");
      }
    };

    loadTiposConfiguracion();
  }, [showAlert]);

  // Cargar empresas cuando el componente se monta
  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        console.log('Cargando empresas...');
        const response = await getEmpresas(1, 1000);
        console.log('Respuesta de getEmpresas:', response);

        if (!response || !response.data) {
          console.error('No se recibieron datos de empresas');
          return;
        }

        // Asegurarse de que los datos tengan el formato correcto
        const empresasMapped = response.data
          .filter((empresa): empresa is Empresa =>
            !!empresa &&
            typeof empresa.idEmpresa !== 'undefined' &&
            !!empresa.razonSocial
          )
          .map(empresa => ({
            id: empresa.idEmpresa,
            nombre: empresa.razonSocial
          }));

        console.log('Empresas mapeadas:', empresasMapped);

        if (empresasMapped.length === 0) {
          console.warn('No se encontraron empresas válidas');
          showAlert('warning', 'Advertencia', 'No se encontraron empresas disponibles');
        }

        setEmpresas(empresasMapped);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
        showAlert('error', 'Error', 'No se pudieron cargar las empresas');
      }
    };

    loadEmpresas();
  }, [showAlert]);

  // Debug: Log when empresas changes
  useEffect(() => {
    console.log('Empresas actualizadas:', empresas);
  }, [empresas]);

  // Cargar datos cuando cambia la página
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = useCallback(() => {
    setModalContent(


      <ConfigInteresMoraForm
        empresas={empresas}
        tiposConfiguracion={tiposConfiguracion}
        onSuccess={() => {
          fetchData();
          setIsModalOpen(false);
        }}
        closeModal={() => setIsModalOpen(false)}
      />
    );
    setIsModalOpen(true);
  }, [empresas, tiposConfiguracion, fetchData]);

  const handleEdit = useCallback((config: ConfigInteresMora) => {
    setModalContent(
      <div className="p-4">

        <ConfigInteresMoraForm
          configuracion={{
            ...config,
            montoFijo: typeof config.montoFijo === 'string' ? parseFloat(config.montoFijo) : config.montoFijo || 0,
            aplicaDesdeDia: config.aplicaDesdeDia || '',
            aplicaHastaDia: config.aplicaHastaDia || ''
          }}
          empresas={empresas}
          tiposConfiguracion={tiposConfiguracion}
          onSuccess={() => {
            fetchData();
            setIsModalOpen(false);
          }}
          closeModal={() => setIsModalOpen(false)}
        />
      </div>
    );
    setIsModalOpen(true);
  }, [empresas, tiposConfiguracion, fetchData]);

  const handleDeleteClick = (id: number) => {
    setConfigToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!configToDelete) return;

    try {
      await PlanPagosApi.configInteresMoraController.deleteConfigInteresMora(configToDelete);
      showAlert("success", "Éxito", "Configuración eliminada correctamente");
      fetchData();
    } catch (error) {
      console.error("Error al eliminar configuración:", error);
      showAlert("error", "Error", "No se pudo eliminar la configuración");
    } finally {
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };


  const columns = useMemo(
    () => getConfigInteresMoraColumns({
      onEdit: canEdit ? handleEdit : undefined,
      onDelete: canDelete ? handleDeleteClick : undefined,
      empresas,
      tiposConfiguracion
    }),
    [canEdit, canDelete, handleEdit, handleDeleteClick, empresas, tiposConfiguracion]
  );

  return (
    <AdminCardLayout>
      <AdminCardLayout.Header>
        <div className="flex justify-between items-center w-full">
          <div>
            <AdminCardLayout.Title>Configuración de Interés por Mora</AdminCardLayout.Title>
            <p className="text-sm text-muted-foreground">Administra las configuraciones de interés por mora</p>
          </div>
          {canCreate && (
            <Button onClick={handleCreate}>
              Nueva Mora
            </Button>
          )}
        </div>
      </AdminCardLayout.Header>
      <AdminCardLayout.Content>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <Datatable
                columns={columns}
                data={filteredConfiguraciones}
              />
              {filteredConfiguraciones.length > 0 && (
                <div className="flex justify-center mt-4">
                  <MuiPagination
                    count={Math.ceil(totalItems / perPage)}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    showFirstButton
                    showLastButton
                    color="primary"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </AdminCardLayout.Content>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Desea continuar con la eliminación de esta configuración?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {modalContent}
      </Dialog>
    </AdminCardLayout>
  );
}
