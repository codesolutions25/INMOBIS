import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { MedioCaptacion } from '@/types/medioCaptacion';
import { DetalleMedioCaptacion } from '@/types/detalleMedioCaptacion';
import { AtencionMedioCaptacion } from '@/types/atencionMediosCaptacion';
import { createAtencionMedioCaptacion, updateMedioCaptacion } from '@/services/apiAtencionMediosCaptacion';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MedioCaptacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  idPersona?: number;
  catalogoMedios: MedioCaptacion[];
  catalogoDetalles: DetalleMedioCaptacion[];
  mediosCaptacionExistentes: AtencionMedioCaptacion[];
  initialData?: any;
}

const MedioCaptacionModal: React.FC<MedioCaptacionModalProps> = ({ isOpen, onClose, onSuccess, idPersona, catalogoMedios, catalogoDetalles, mediosCaptacionExistentes, initialData }) => {
  const [idMedioCaptacion, setIdMedioCaptacion] = useState<string>('');
  const [idDetalleMedioCaptacion, setIdDetalleMedioCaptacion] = useState<string>('');
  const [descripcion, setDescripcion] = useState('');
  const [detallesFiltrados, setDetallesFiltrados] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && isOpen) {
      setIdMedioCaptacion(initialData.idMedioCaptacion?.toString() || '');
      // Defer setting detail until details are loaded
    } else {
      setIdMedioCaptacion('');
      setIdDetalleMedioCaptacion('');
    }
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (initialData && isOpen && detallesFiltrados.length > 0) {
      setIdDetalleMedioCaptacion(initialData.idDetalleMedioCaptacion?.toString() || '');
    }
  }, [initialData, isOpen, detallesFiltrados]);

  useEffect(() => {
    if (idMedioCaptacion) {
      const idMedioCaptacionNum = Number(idMedioCaptacion);

      // Obtener los IDs de los detalles ya usados por este cliente para el medio seleccionado
      const detallesUsadosIds = new Set(
        mediosCaptacionExistentes
          .filter(mc => mc.idMedioCaptacion === idMedioCaptacionNum)
          .map(mc => mc.idDetalleMedioCaptacion)
      );

      // Filtrar el catálogo de detalles
      const detallesDisponibles = catalogoDetalles
        .filter(d => {
          const esDelMedioActual = d.idMedioCaptacion === idMedioCaptacionNum;
          const noEstaUsado = !detallesUsadosIds.has(d.idDetalleMedioCaptacion);
          // Si estamos editando, permitir que el detalle actual aparezca en la lista
          const esElDetalleActual = initialData?.idDetalleMedioCaptacion === d.idDetalleMedioCaptacion;

          return esDelMedioActual && (noEstaUsado || esElDetalleActual);
        })
        .map(d => ({ value: d.idDetalleMedioCaptacion.toString(), label: d.nombre }));

      setDetallesFiltrados(detallesDisponibles);
    } else {
      setDetallesFiltrados([]);
    }
  }, [idMedioCaptacion, catalogoDetalles, mediosCaptacionExistentes, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!idMedioCaptacion || !idDetalleMedioCaptacion) {
      setError('Por favor, seleccione todos los campos.');
      return;
    }

    try {
      if (initialData) {
        const updatePayload = {
          id_medio_captacion: parseInt(idMedioCaptacion, 10),
          id_detalle_medio_captacion: parseInt(idDetalleMedioCaptacion, 10),
        };
        await updateMedioCaptacion(initialData.idPersonaMedioCaptacion, updatePayload);
      } else {
        if (!idPersona) {
          setError('No se ha seleccionado un cliente.');
          return;
        }
        const createPayload = {
          idPersona: idPersona, // TypeScript now knows this is a number
          idMedioCaptacion: parseInt(idMedioCaptacion, 10),
          idDetalleMedioCaptacion: parseInt(idDetalleMedioCaptacion, 10),
        };
        await createAtencionMedioCaptacion(createPayload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error.');
    }
  };

  const mediosOptions = catalogoMedios.map(m => ({ value: m.idMedioCaptacion.toString(), label: m.nombre }));

  if (!isOpen) return null;

  return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Actualizar' : 'Registrar'} Medio de Captación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Combobox
              options={catalogoMedios.map(m => ({ value: m.idMedioCaptacion.toString(), label: m.nombre }))}
              selected={idMedioCaptacion}
              onChange={setIdMedioCaptacion}
              placeholder="Seleccione un medio"
            />
            <Combobox
              options={detallesFiltrados}
              selected={idDetalleMedioCaptacion}
              onChange={setIdDetalleMedioCaptacion}
              placeholder="Seleccione un detalle"
              disabled={!idMedioCaptacion}
            />

          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{initialData ? 'Actualizar' : 'Registrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
  );
};

export default MedioCaptacionModal;
