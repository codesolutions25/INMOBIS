import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPersonas } from '@/services/apiPersona';
import { createContactoEmergencia } from '@/services/apiAtencionContactosEmergencia';
import { Persona } from '@/types/persona';
import styles from '@/modules/atencioncliente/styles/atencion.module.css';
import ModalContainerComponent from '@/components/modal/ModalContainer';
import PersonaRegisterForm, { PersonaFormRef } from '@/modules/atencioncliente/PersonaRegisterForm';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ContactoEmergenciaModalProps {
  onSuccess: () => void;
  onClose: () => void;
  idCliente: number;
  contactosExistentes: number[];
}

const ContactoEmergenciaModal = ({ onClose, onSuccess, idCliente, contactosExistentes }: ContactoEmergenciaModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'search' | 'create' | 'view' | 'edit'>('search');
  // Clave única para forzar el remontaje del componente PersonaRegisterForm cuando cambiamos a modo create
  const [formKey, setFormKey] = useState<number>(0);

  const formRef = useRef<PersonaFormRef>(null);

  const fetchPersonas = async () => {
    setLoading(true);
    try {
      const response = await getPersonas(1, 50, searchTerm);
      const filteredPersonas = response.data.filter(
        p => p.idPersona !== idCliente && !contactosExistentes.includes(p.idPersona)
      );
      setPersonas(filteredPersonas); // Ya no invertimos el orden porque la API ya lo entrega en orden ascendente
    } catch (error) {
      console.error('Error al buscar personas:', error);
      setPersonas([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      if (searchTerm.length >= 1 || searchTerm.length === 0) {
        fetchPersonas();
      }
    }, 500);

    return () => clearTimeout(debounceFetch);
  }, [searchTerm, idCliente, contactosExistentes]);

  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setMode('view');
  };

  const handleLinkContact = async () => {
    if (!selectedPersona || !idCliente) return;

    try {
      await createContactoEmergencia({
        idPersonaAtencion: idCliente,
        idPersonaContactoEmergencia: selectedPersona.idPersona
      });
      onSuccess();
    } catch (error) {
      console.error('Error al vincular contacto:', error);
      const errorMessage = (error as any).response?.data?.message || 'No se pudo vincular el contacto';
      toast.error(errorMessage);
    }
  };

  const handleNewPerson = () => {
    // Primero reseteamos valores
    setSelectedPersona(null);

    // Incrementamos el formKey para forzar el remontaje completo del formulario
    setFormKey(prevKey => prevKey + 1);

    // Asegurarnos de resetear el formulario antes de cambiar el modo
    if (formRef.current) {
      formRef.current.resetForm();
    }

    // Cambiamos el modo a create después de resetear
    setTimeout(() => {
      setMode('create');
    }, 10);
  };

  const handleFormSuccess = (persona: Persona) => {
    const message = mode === 'create' ? 'Persona creada con éxito' : 'Persona actualizada con éxito';
    toast.success(message);

    // Actualizar la lista y seleccionar la persona
    fetchPersonas(); // Para refrescar la lista con los nuevos datos
    setSelectedPersona(persona);
    setMode('view');
  };

  const handleCancel = () => {
    onClose();
  };

  const renderRightColumn = () => {
    if (mode === 'search') {
      return (
        <div className={styles.placeholder}>
          <h3 className={styles.modalPlaceholderTitle}>Seleccione un contacto</h3>
          <p className={styles.modalPlaceholderDescription}>
            Seleccione un contacto de la lista o registre uno nuevo para agregarlo como contacto de emergencia.
          </p>
        </div>
      );
    }

    return (
      <PersonaRegisterForm
        key={mode === 'create' ? `create-form-${formKey}` : `edit-view-form-${selectedPersona?.idPersona || 0}`}
        ref={formRef}
        onSuccess={handleFormSuccess}
        onCancel={() => setMode(mode === 'edit' ? 'view' : 'search')}
        initialData={selectedPersona} // Será null para 'create'
        isReadOnly={mode === 'view'}
      />
    );
  };

  const renderFooterButtons = () => {
    if (mode === 'search') {
      return <Button variant="outline" onClick={onClose}>Cerrar</Button>;
    }

    if (mode === 'view') {
      return (
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="secondary" onClick={() => setMode('edit')}>Editar</Button>
          <Button onClick={handleLinkContact}>Vincular Contacto</Button>
        </>
      );
    }

    if (mode === 'create' || mode === 'edit') {
      return (
        <>
          <Button variant="outline" onClick={mode === 'create' ? onClose : () => setMode('view')}>
            Cancelar
          </Button>
          <Button onClick={() => formRef.current?.submit()}>
            {mode === 'create' ? 'Guardar' : 'Guardar Cambios'}
          </Button>
        </>
      );
    }

    return null;
  };

  return (
    <ModalContainerComponent onClose={onClose}>
      <DialogContent className={styles.largeModal}>
        <DialogHeader>
          <DialogTitle>Registrar Contacto de Emergencia</DialogTitle>
        </DialogHeader>
        <div className={styles.modalLayout}>
          <div className={styles.leftColumn}>
            <div className={styles.searchActions}>
              <div className={styles.searchInputWrapper}>
                <Input
                  placeholder="Buscar persona..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={handleNewPerson} variant="secondary">Nuevo</Button>
            </div>
            {loading ? <p>Cargando...</p> : (
              <div className={styles.fixedHeightTableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Apellidos y Nombres</th>
                      <th>DNI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personas.map((persona) => (
                      <tr 
                        key={persona.idPersona} 
                        onClick={() => {
                          // En móviles, seleccionar con un solo toque
                          if (window.innerWidth <= 768) {
                            handleSelectPersona(persona);
                          }
                        }}
                        onDoubleClick={() => handleSelectPersona(persona)}
                        style={{ cursor: 'pointer' }} 
                        className={selectedPersona?.idPersona === persona.idPersona ? styles.selectedRow : ''}
                      >
                        <td>{`${persona.apellidoPaterno} ${persona.apellidoMaterno}, ${persona.nombre}`}</td>
                        <td>{persona.numeroDocumento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className={`${styles.rightColumn} ${mode === 'search' ? styles.rightColumnPlaceholder : ''}`}>
            {renderRightColumn()}
          </div>
        </div>
        <DialogFooter className={styles.modalActionsLarge}>
          {renderFooterButtons()}
        </DialogFooter>
      </DialogContent>
    </ModalContainerComponent>
  );
};

export default ContactoEmergenciaModal;
