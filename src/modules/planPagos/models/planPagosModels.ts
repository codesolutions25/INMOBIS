
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        currentPage: number;
        lastPage: number;
        perPage: number;
        pages?: number; // <-- Campo opcional para reflejar la respuesta real del backend
    };
}

export interface PaginatedRequest {
    page: number;
    perPage: number;
    search?: string;
}

export interface FeriadosGlobales {
    idFeriadoGlobal?: number;
    fecha: string;
    descripcion: string;
}

export interface ConfigInteresMora {
    idConfigInteresMora?: number;
    idEmpresa: number;
    idTipoConfigFinanciera: number;
    montoFijo: number;
    aplicaDesdeDia: string;
    aplicaHastaDia: string;
    
}
