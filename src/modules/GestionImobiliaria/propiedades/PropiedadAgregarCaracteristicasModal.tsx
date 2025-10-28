import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
  Autocomplete,
  TextField,
  Box,
  CircularProgress,
  Chip
} from "@mui/material";
import { Textarea } from "@/components/ui/textarea";
import { CatalogoCaracteristica } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi";
import styles from "./styles/PropiedadAgregarCaracteristicasModal.module.css";

interface PropiedadAgregarCaracteristicasModalProps {
  open: boolean;
  onClose: () => void;
  propiedadId: number;
  catalogoNoAsignado: CatalogoCaracteristica[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onSuccess: () => Promise<void>;
  isMounted: React.RefObject<boolean>;
}

export default function PropiedadAgregarCaracteristicasModal({
  open,
  onClose,
  propiedadId,
  catalogoNoAsignado,
  loading,
  setLoading,
  onSuccess,
  isMounted
}: PropiedadAgregarCaracteristicasModalProps) {
  
  const [selectedToAdd, setSelectedToAdd] = useState<CatalogoCaracteristica[]>([]);
  const [addValues, setAddValues] = useState<{ [key: number]: string }>({});

  const handleClose = () => {
    setSelectedToAdd([]);
    setAddValues({});
    onClose();
  };

  // Función para agregar características
  const handleAddCaracteristicas = async () => {
    if (!isMounted.current) return;

    setLoading(true);

    try {
      console.log(`Agregando ${selectedToAdd.length} características a la propiedad ${propiedadId}`);

      // Crear cada característica con su valor correspondiente
      for (const cat of selectedToAdd) {
        const valor = addValues[cat.idCatalogoCaracteristicas] || '';
        console.log(`Agregando característica ${cat.nombre} (ID: ${cat.idCatalogoCaracteristicas}) con valor: ${valor}`);

        await InmobiliariaApi.propiedadController.agregarCaracteristica(propiedadId, {
          idCatalogoCaracteristicas: cat.idCatalogoCaracteristicas,
          valor: valor
        });
      }

      if (isMounted.current) {
        handleClose();
        await onSuccess(); // Refresca tras agregar
      }
    } catch (error) {
      console.error('Error al agregar características:', error);

      if (isMounted.current) {
        alert("Error al agregar características: " + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    }

    if (isMounted.current) {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth={false}
      PaperProps={{
        className: styles.dialogPaper
      }}
    >
      <DialogTitle className={styles.dialogTitle}>
        Agregar Características
      </DialogTitle>
      <DialogContent className={styles.dialogContent}>
        {loading ? (
          <Box className={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : catalogoNoAsignado.length === 0 ? (
          <Box className={styles.emptyStateContainer}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 className="text-xl font-semibold mt-4 mb-2">No hay más características disponibles</h3>
            <p className="text-gray-500">Todas las características del catálogo ya han sido asignadas a esta propiedad.</p>
          </Box>
        ) : (
          <>
            <Autocomplete
              multiple
              options={catalogoNoAsignado}
              getOptionLabel={(option) => option.nombre}
              value={selectedToAdd}
              onChange={(_, newValue) => setSelectedToAdd(newValue)}
              disableCloseOnSelect
              ListboxProps={{
                style: { maxHeight: 250 }
              }}
              renderOption={(props, option, { selected }) => (
                <li {...props} key={option.idCatalogoCaracteristicas}>
                  <Box component="span" className="block w-full py-1">
                    {option.nombre}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Seleccionar características"
                  placeholder="Buscar..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  className={styles.autocompleteInput}
                />
              )}
              className={styles.autocomplete}
              classes={{
                endAdornment: styles.autocompleteEndAdornment,
                root: styles.autocompleteLabel
              }}
              limitTags={3}
              ChipProps={{ 
                className: styles.chip,
                classes: {
                  label: styles.chipLabel
                }
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Box
                    component="span"
                    key={index}
                    className={styles.chipContainer}
                  >
                    <Chip
                      label={option.nombre}
                      {...getTagProps({ index })}
                      className={styles.customChip}
                      classes={{
                        deleteIcon: styles.customChipDeleteIcon
                      }}
                    />
                  </Box>
                ))
              }
            />

            {selectedToAdd.length > 0 && (
              <Box className={styles.selectedItemsContainer}>
                <h3 className="text-lg font-semibold mb-3">Valores para las características seleccionadas:</h3>
                <Box className={styles.scrollableContainer}>
                  {selectedToAdd.map((cat) => (
                    <Box 
                      key={cat.idCatalogoCaracteristicas} 
                      className={styles.itemBox}
                    >
                      <Box className={styles.itemLabel}>
                        {cat.nombre}
                      </Box>
                      <Textarea
                        className={`w-full ${styles.textarea}`}
                        placeholder={`Ingrese el valor para ${cat.nombre}`}
                        value={addValues[cat.idCatalogoCaracteristicas] || ''}
                        onChange={(e) => setAddValues({
                          ...addValues,
                          [cat.idCatalogoCaracteristicas]: e.target.value
                        })}
                        rows={4}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <MuiButton 
          onClick={handleClose} 
          variant="outlined"
          className={styles.cancelButton}
        >
          Cancelar
        </MuiButton>
        {catalogoNoAsignado.length > 0 && (
          <MuiButton
            onClick={handleAddCaracteristicas}
            variant="contained"
            disabled={loading || selectedToAdd.length === 0}
            className={styles.saveButton}
          >
            Guardar
          </MuiButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
