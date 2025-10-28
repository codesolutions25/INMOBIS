import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import styles from './styles/ContactoEmergenciaList.module.css';



interface ContactoEmergenciaListProps {
  contactos: any[];
  onDelete: (id: number) => void;
  onEdit: (contacto: any) => void;
  isLoading: boolean;
}

const ContactoEmergenciaList: React.FC<ContactoEmergenciaListProps> = ({ contactos, onDelete, onEdit, isLoading }) => {
  if (isLoading) {
    return (
      <div className={styles.centeredMessage}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (contactos.length === 0) {
    return <div className={styles.centeredMessage}>No hay contactos de emergencia.</div>;
  }

  return (
    <div className={styles.listContainer}>
      {contactos.map((contacto) => (
        <div key={contacto.idAtencionContactoEmergencia} className={styles.listItem}>
          <div className={styles.contactInfo}>
            <span className={styles.contactName}>{`${contacto.nombre} ${contacto.apellidoPaterno} ${contacto.apellidoMaterno}`}</span>
            <div className={styles.contactDetails}>
              <span className={styles.contactPhone}>{contacto.telefonoPrincipal}</span>
              {contacto.numeroDocumento && 
                <span className={styles.contactDni}>DNI: {contacto.numeroDocumento}</span>
              }
            </div>
          </div>
          <div className={styles.actions}>
            <Button variant="outline" size="sm" onClick={() => onEdit(contacto)}>
              <Pencil size={16} />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(contacto.idAtencionContactoEmergencia)}>
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactoEmergenciaList;
