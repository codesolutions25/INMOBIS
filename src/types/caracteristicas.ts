export type CatalogoCaracteristica = {
    idCatalogoCaracteristicas: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    isReadOnly?: boolean; // Para controlar si el formulario de edición debe ser de solo lectura
    creadoEn: string;
}

export type CaracteristicaPropiedad = {
    idCatalogoCaracteristicas: number;
    idPropiedad: number;
    valor: string;
    createdAt: string;
    updatedAt: string;
}

// Tipo para el TransferList
export type CaracteristicaTransfer = CatalogoCaracteristica & {
    seleccionada: boolean;
    valor?: string;
}
