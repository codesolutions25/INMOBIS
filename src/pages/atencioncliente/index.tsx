import AdminLayout from '@/layouts/AdminLayout';
import { useRef, useState, useEffect } from 'react';
import AtencionList from "@/modules/atencioncliente/AtencionList";
import styles from '@/modules/atencioncliente/styles/atencion.module.css'
import { Button } from '@/components/ui/button';
import ModalContainerComponent from '@/components/modal/ModalContainer';
import ClienteForm from '@/modules/atencioncliente/ClienteForm';
import AtencionTabs from '@/modules/atencioncliente/AtencionTabs';
import { getTiposGenero } from '@/services/apiTipoGenero';
import { TipoGenero } from '@/types/tipoGenero';
import { getDetallesContactosEmergencia, deleteContactoEmergencia } from '@/services/apiAtencionContactosEmergencia';
import { getMediosCaptacionByPersona } from '@/services/apiAtencionMediosCaptacion';
import { AtencionMedioCaptacion } from '@/types/atencionMediosCaptacion';
import ContactoEmergenciaModal from '@/modules/atencioncliente/ContactoEmergenciaModal';
import { getMediosCaptacion } from '@/services/apiMediosCaptacion';
import { getDetallesMedioCaptacion } from '@/services/apiDetallesMedioCaptacion';
import { useAlert } from '@/contexts/AlertContext';
import { MedioCaptacion } from '@/types/medioCaptacion';
import { DetalleMedioCaptacion } from '@/types/detalleMedioCaptacion';
import MedioCaptacionModal from '@/modules/atencioncliente/MedioCaptacionModal';
import {
  Pencil,
  ChevronLeft,
  Users,
} from 'lucide-react';
import Datatable from "@/components/table/datatable";
import { getContactosEmergenciaColumns } from '@/modules/atencioncliente/contactosColumns';
import { getMediosCaptacionColumns } from '@/modules/atencioncliente/mediosCaptacionColumns';
import { deleteMedioCaptacion } from '@/services/apiAtencionMediosCaptacion';
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

export default function ClientesPage() {
  const { showAlert } = useAlert();
  const atencionListRef = useRef<{ refresh: () => void }>(null);
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<any | null>(null);
  const [tiposGenero, setTiposGenero] = useState<{ value: string; label: string }[]>([]);
  const [contactosEmergencia, setContactosEmergencia] = useState<any[]>([]);
  const [mediosCaptacion, setMediosCaptacion] = useState<AtencionMedioCaptacion[]>([]);
  const [catalogoMedios, setCatalogoMedios] = useState<MedioCaptacion[]>([]);
  const [catalogoDetalles, setCatalogoDetalles] = useState<DetalleMedioCaptacion[]>([]);
  const [isContactoModalOpen, setContactoModalOpen] = useState(false);
  const [isMedioCaptacionModalOpen, setMedioCaptacionModalOpen] = useState(false);
  const [isContactosLoading, setIsContactosLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactoAEliminarId, setContactoAEliminarId] = useState<number | null>(null);
  const [medioCaptacionAEliminarId, setMedioCaptacionAEliminarId] = useState<number | null>(null);
  const [editingMedioCaptacion, setEditingMedioCaptacion] = useState<any | null>(null);
  const [isDeleteMedioCaptacionDialogOpen, setIsDeleteMedioCaptacionDialogOpen] = useState(false);
  const [isMediosCaptacionLoading, setIsMediosCaptacionLoading] = useState(false);
  const [contactoAEditar, setContactoAEditar] = useState<any | null>(null);
  const [isEditContactoModalOpen, setEditContactoModalOpen] = useState(false);

  const getGeneroNombre = (id: number) => {
    const genero = tiposGenero.find(g => g.value === String(id));
    return genero ? genero.label : 'N/A';
  };

  useEffect(() => {
    const fetchGeneros = async () => {
      try {
        const response = await getTiposGenero(1, 100); // Fetch all genres
        const formattedGeneros = response.data.map((g: TipoGenero) => ({
          value: g.idTipoGenero.toString(),
          label: g.nombre,
        }));
        setTiposGenero(formattedGeneros);
      } catch (error) {
        console.error("Error fetching generos:", error);
        // Optionally, show an alert to the user
      }
    };
    const fetchCatalogos = async () => {
      try {
        const [mediosData, detallesData] = await Promise.all([
          getMediosCaptacion(),
          getDetallesMedioCaptacion(),
        ]);
        setCatalogoMedios(mediosData);
        setCatalogoDetalles(detallesData);
      } catch (error) {
        console.error("Error fetching catalogos:", error);
      }
    };

    fetchGeneros();
    fetchCatalogos();
  }, []);

  const fetchContactosEmergencia = async (idPersona: number) => {
    setIsContactosLoading(true);
    try {
      const data = await getDetallesContactosEmergencia(idPersona);
      // Invertir el orden para mostrar los más recientes primero
      setContactosEmergencia([...data].reverse());
    } catch (error) {
      console.error('Error al obtener contactos de emergencia:', error);
      setContactosEmergencia([]);
    } finally {
      setIsContactosLoading(false);
    }
  };

  const fetchMediosCaptacion = async (idPersona: number) => {
    setIsMediosCaptacionLoading(true);
    try {
      const data = await getMediosCaptacionByPersona(idPersona);

      const mediosConNombres = data.map(mc => ({
        ...mc,
        medioCaptacionNombre: getMedioCaptacionNombre(mc.idMedioCaptacion),
        detalleMedioCaptacionNombre: getDetalleMedioCaptacionNombre(mc.idDetalleMedioCaptacion),
      }));
      setMediosCaptacion(mediosConNombres);
    } catch (error) {
      console.error("Error al obtener medios de captación:", error);
      showAlert('error', 'Error', 'No se pudieron obtener los medios de captación.');
    } finally {
      setIsMediosCaptacionLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      setEditedClient(selectedClient);
      fetchContactosEmergencia(selectedClient.idPersona);
      fetchMediosCaptacion(selectedClient.idPersona);
    } else {
      setContactosEmergencia([]); // Clear if no client is selected
      setMediosCaptacion([]);
    }
  }, [selectedClient]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedClient(selectedClient); // Revert changes
  };

  const handleEditSuccess = (updatedClient: any) => {
    setIsEditing(false);
    atencionListRef.current?.refresh();
    setSelectedClient(updatedClient);
  };

  const getMedioCaptacionNombre = (id: number) => {
    return catalogoMedios.find(m => m.idMedioCaptacion === id)?.nombre || 'Desconocido';
  };

  const getDetalleMedioCaptacionNombre = (id: number) => {
    return catalogoDetalles.find(d => d.idDetalleMedioCaptacion === id)?.nombre || 'Desconocido';
  };

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
  };

  const handleBackToList = () => {
    setSelectedClient(null);
    setIsEditing(false);
    setEditedClient(null);
    setContactosEmergencia([]);
    setMediosCaptacion([]);
  };

  const handleOpenRegisterModal = () => {
    setRegisterModalOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setRegisterModalOpen(false);
  };

  const handleRegistrationSuccess = (newClient: any) => {
    handleCloseRegisterModal();
    atencionListRef.current?.refresh();
    // Find the full client data to display, including the genre name
    const fullNewClient = {
      ...newClient,
      genero: {
        nombre: tiposGenero.find(g => g.value === newClient.idTipoGenero?.toString())?.label || ''
      }
    };
    setSelectedClient(fullNewClient);
  };

  const handleOpenContactoModal = () => setContactoModalOpen(true);
  const handleCloseContactoModal = () => setContactoModalOpen(false);

  const handleContactoSuccess = () => {
    if (selectedClient) {
      fetchContactosEmergencia(selectedClient.idPersona);
    }
    handleCloseContactoModal();
    showAlert('success', 'Éxito', 'Se ha registrado el contacto de emergencia con éxito');
  };



  const handleDeleteContacto = (id: number) => {
    setContactoAEliminarId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (contactoAEliminarId && selectedClient) {
      try {
        await deleteContactoEmergencia(contactoAEliminarId);
        showAlert('success', 'Éxito', 'Contacto de emergencia eliminado con éxito.');
        fetchContactosEmergencia(selectedClient.idPersona);
      } catch (error) {
        console.error("Error al eliminar contacto:", error);
        showAlert('error', 'Error', 'No se pudo eliminar el contacto de emergencia.');
      } finally {
        setIsDeleteDialogOpen(false);
        setContactoAEliminarId(null);
      }
    }
  };

  const handleEditContacto = (contacto: any) => {
    // El 'contacto' que llega es plano. Lo pasamos directamente.
    setContactoAEditar(contacto);
    setEditContactoModalOpen(true);
  };

  const handleCloseEditContactoModal = () => {
    setEditContactoModalOpen(false);
    setContactoAEditar(null);
  };

  const handleEditContactoSuccess = () => {
    handleCloseEditContactoModal();
    if (selectedClient) {
      fetchContactosEmergencia(selectedClient.idPersona);
    }
  };

  const handleOpenMedioCaptacionModal = () => setMedioCaptacionModalOpen(true);
  const handleCloseMedioCaptacionModal = () => {
    setMedioCaptacionModalOpen(false);
    setEditingMedioCaptacion(null);
  };

  const handleMedioCaptacionSuccess = async () => {
    showAlert('success', 'Éxito', 'Se ha registrado el medio de captación con éxito.');
    if (selectedClient) {
      await fetchMediosCaptacion(selectedClient.idPersona);
    }
    handleCloseMedioCaptacionModal();
  };

  const handleDeleteMedioCaptacion = (id: number) => {
    setMedioCaptacionAEliminarId(id);
    setIsDeleteMedioCaptacionDialogOpen(true);
  };

  const handleEditMedioCaptacion = (medioCaptacion: any) => {
    setEditingMedioCaptacion(medioCaptacion);
    handleOpenMedioCaptacionModal();
  };

  const handleConfirmDeleteMedioCaptacion = async () => {
    if (medioCaptacionAEliminarId && selectedClient) {
      try {
        await deleteMedioCaptacion(medioCaptacionAEliminarId);
        showAlert('success', 'Éxito', 'Medio de captación eliminado con éxito.');
        fetchMediosCaptacion(selectedClient.idPersona);
      } catch (error) {
        console.error("Error al eliminar medio de captación:", error);
        showAlert('error', 'Error', 'No se pudo eliminar el medio de captación.');
      } finally {
        setIsDeleteMedioCaptacionDialogOpen(false);
        setMedioCaptacionAEliminarId(null);
      }
    }
  };

  const columnsContactos = getContactosEmergenciaColumns({ onDelete: handleDeleteContacto, onEdit: handleEditContacto });
  const columnsMediosCaptacion = getMediosCaptacionColumns({
    onDelete: handleDeleteMedioCaptacion,
    onEdit: handleEditMedioCaptacion,
  });

  return (
    <AdminLayout moduleName="Atención al cliente">
      <div className="px-4 md:px-6 lg:px-8 pb-8">
        {!selectedClient ? (
          <div className={`${styles.fullScreenSection} ${selectedClient ? styles.hidden : ''}`}>
            <AtencionList
              ref={atencionListRef}
              onClientSelect={handleClientSelect}
              onOpenModal={handleOpenRegisterModal}
            />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Button variant="default" size="sm" onClick={handleBackToList}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver a la lista
              </Button>
            </div>

            {isEditing ? (
              <ClienteForm
                initialData={editedClient}
                onSuccess={handleEditSuccess}
                closeModal={handleCancelEdit}
              />
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Columna Izquierda */}
                <div className="lg:w-2/5 flex flex-col gap-6">
                  <div className={styles.subSection}>
                    <div className={styles.subSectionHeader}>
                      <h4>Detalles del cliente</h4>
                      <Button variant="outline" size="sm" onClick={handleEdit}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
                    </div>
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailItem}> <span className={styles.detailLabel}>Nombre</span> <p>{selectedClient.nombre}</p> </div>
                      <div className={styles.detailItem}> <span className={styles.detailLabel}>Apellido Paterno</span> <p>{selectedClient.apellidoPaterno}</p> </div>
                      <div className={styles.detailItem}> <span className={styles.detailLabel}>Apellido Materno</span> <p>{selectedClient.apellidoMaterno}</p> </div>
                      <div className={styles.detailItem}> <span className={styles.detailLabel}>N° de DNI</span> <p>{selectedClient.numeroDocumento}</p> </div>
                      <div className={styles.detailItem}> <span className={styles.detailLabel}>Teléfono Principal</span> <p>{selectedClient.telefonoPrincipal}</p> </div>
                      <div className={styles.detailItem}> <span className={styles.detailLabel}>Teléfono Secundario</span> <p>{selectedClient.telefonoSecundario || 'N/A'}</p> </div>
                      <div className={styles.detailItem}> <span className={styles.detailLabel}>Género</span> <p>{getGeneroNombre(selectedClient.idTipoGenero)}</p> </div>
                      <div className={styles.detailItem}> <span className={styles.detailLabel}>Fecha de Nacimiento</span> <p>{new Date(selectedClient.fechaNacimiento).toLocaleDateString()}</p> </div>
                      <div className={styles.detailItem}> <span className={styles.detailLabel}>Correo Electrónico</span> <p>{selectedClient.correoElectronico}</p> </div>
                      <div className={styles.detailItem} style={{ gridColumn: 'span 3' }}> <span className={styles.detailLabel}>Dirección</span> <p>{selectedClient.direccion}</p> </div>
                    </div>
                  </div>

                  <div className={styles.subSection}>
                    <div className={styles.subSectionHeader}>
                      <h4>Contactos de Emergencia</h4>
                      <Button size="sm" onClick={handleOpenContactoModal}>Registrar</Button>
                    </div>
                    <div className={styles.fixedHeightContainer}>
                      {isContactosLoading ? (
                        <p className={styles.loadingText}>Cargando contactos...</p>
                      ) : contactosEmergencia.length > 0 ? (
                        <div className={styles.datatableWrapper}>
                          <Datatable columns={columnsContactos} data={contactosEmergencia} />
                        </div>
                      ) : (
                        <div className={styles.emptyState}>
                          <div className={styles.emptyStateContent}>
                            <div className={styles.emptyStateIcon}>
                              <Users size={28} />
                            </div>
                            <h3 className={styles.emptyStateTitle}>No hay contactos de emergencia</h3>
                            <p className={styles.emptyStateDescription}>
                              Seleccione un contacto o registre uno nuevo para agregarlo como contacto de emergencia.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.subSection}>
                    <div className={styles.subSectionHeader}>
                      <h4>Medios de Captación</h4>
                      <Button size="sm" onClick={handleOpenMedioCaptacionModal}>Registrar</Button>
                    </div>
                    <div className={styles.fixedHeightContainer}>
                      {isMediosCaptacionLoading ? (
                        <p className={styles.loadingText}>Cargando medios...</p>
                      ) : mediosCaptacion.length > 0 ? (
                        <div className={styles.datatableWrapper}>
                          <Datatable columns={columnsMediosCaptacion} data={[...mediosCaptacion].reverse()} />
                        </div>
                      ) : (
                        <div className={styles.emptyState}>
                          <div className={styles.emptyStateContent}>
                            <div className={styles.emptyStateIcon}>
                              <Users size={28} />
                            </div>
                            <h3 className={styles.emptyStateTitle}>No hay medios de captación</h3>
                            <p className={styles.emptyStateDescription}>
                              Seleccione un medio o registre uno nuevo para agregarlo como medio de captación.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className="lg:w-3/5 flex flex-col gap-6">
                  <AtencionTabs 
                    idPersona={selectedClient?.idPersona} 
                    idEmpresa={selectedClient?.idEmpresa}
                    clienteNombre={`${selectedClient?.nombre || ''} ${selectedClient?.apellidoPaterno || ''} ${selectedClient?.apellidoMaterno || ''}`.trim() || 'Cliente no especificado'}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {isRegisterModalOpen && (
          <ModalContainerComponent onClose={handleCloseRegisterModal}>
            <ClienteForm
              onSuccess={handleRegistrationSuccess}
              closeModal={handleCloseRegisterModal}
            />
          </ModalContainerComponent>
        )}

        {isMedioCaptacionModalOpen && selectedClient && (
          <ModalContainerComponent onClose={handleCloseMedioCaptacionModal}>
            <MedioCaptacionModal
              isOpen={isMedioCaptacionModalOpen}
              onClose={handleCloseMedioCaptacionModal}
              onSuccess={handleMedioCaptacionSuccess}
              idPersona={selectedClient.idPersona}
              catalogoMedios={catalogoMedios}
              catalogoDetalles={catalogoDetalles}
              mediosCaptacionExistentes={mediosCaptacion}
              initialData={editingMedioCaptacion}
              key={editingMedioCaptacion ? editingMedioCaptacion.idPersonaMedioCaptacion : 'new'}
            />
          </ModalContainerComponent>
        )}

        {isContactoModalOpen && selectedClient && (
          <ModalContainerComponent onClose={handleCloseContactoModal}>
            <ContactoEmergenciaModal
              onSuccess={handleContactoSuccess}
              onClose={handleCloseContactoModal}
              idCliente={selectedClient.idPersona}
              contactosExistentes={contactosEmergencia.map(c => c?.idPersonaContactoEmergencia || c?.idPersona).filter(Boolean)}
            />
          </ModalContainerComponent>
        )}

        {isEditContactoModalOpen && contactoAEditar && (
          <ModalContainerComponent onClose={handleCloseEditContactoModal}>
            <ClienteForm
              initialData={contactoAEditar}
              onSuccess={handleEditContactoSuccess}
              closeModal={handleCloseEditContactoModal}
            />
          </ModalContainerComponent>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro de eliminar este contacto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteMedioCaptacionDialogOpen} onOpenChange={setIsDeleteMedioCaptacionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro de eliminar este medio de captación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteMedioCaptacion}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}