import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Datatable from "@/components/table/datatable";
import { Button } from "@/components/ui/button";
import { Key, Trash2 } from "lucide-react";
import { getUsuarios } from "@/services/apiUsuarios";
import { useAlert } from "@/contexts/AlertContext";
import { ColumnDef } from "@tanstack/react-table";
import Pagination from "@/components/ui/pagination";

type UsuarioConTipo = {
    idUsuario: number;
    username: string;
    esSuperAdmin: boolean;
    estaActivo: boolean;
    esUsuarioEmpresa: boolean;
    detalleUsuarioId: number | null;
    idUsuarioOriginal: number;
};

interface SistemaUsuariosListProps {
    onPermissions: (usuario: UsuarioConTipo) => void;
    searchTerm: string;
}

export function SistemaUsuariosList({
    onPermissions,
    searchTerm,
}: SistemaUsuariosListProps) {
    const [usuarios, setUsuarios] = useState<UsuarioConTipo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0,
        limit: 10
    });
    const { showAlert } = useAlert();
    const isInitialMount = useRef(true);
    const itemsPerPage = 10;

    const fetchUsuarios = useCallback(async (pageNumber: number = 1, search: string = '') => {


        try {

            const response = await getUsuarios(pageNumber, itemsPerPage, search);
         
            const usuariosActivos = response.data.map((user: any) => ({
                idUsuario: user.idUsuario,
                username: user.username,
                esSuperAdmin: user.esSuperAdmin,
                estaActivo: user.estaActivo,
                esUsuarioEmpresa: false,
                detalleUsuarioId: null,
                idUsuarioOriginal: user.idUsuario,
                // Include additional fields that might be needed
                ...(user.idPersona && { idPersona: user.idPersona }),
                ...(user.createdAt && { createdAt: user.createdAt }),
                ...(user.updatedAt && { updatedAt: user.updatedAt })
            }));

            setUsuarios(usuariosActivos);
            setPagination({
                page: response.meta?.page || 1,
                pages: response.meta?.pages || 1,
                total: response.meta?.total || 0,
                limit: response.meta?.limit || itemsPerPage
            });
        } catch (error) {
            console.error('Error al cargar usuarios del sistema:', error);
            showAlert('error', 'Error', 'Error al cargar la lista de usuarios del sistema');
            setUsuarios([]);
            setPagination(prev => ({
                ...prev,
                page: 1,
                pages: 1,
                total: 0
            }));
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, showAlert]);

    // Effect for data fetching
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            fetchUsuarios(pagination.page, searchTerm);
            return;
        }

        fetchUsuarios(pagination.page, searchTerm);
    }, [fetchUsuarios, pagination.page, searchTerm]);

    const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, page: number) => {
        setPagination(prev => ({
            ...prev,
            page
        }));
    }, []);

    const columns = useMemo<ColumnDef<UsuarioConTipo>[]>(
        () => [
            {
                id: "#",
                header: "Ítem",
                cell: ({ row }) => row.index + 1,
                size: 60,
            },
            {
                accessorKey: "username",
                header: "Nombre de Usuario",
                size: 150,
            },
            {
                accessorKey: "esSuperAdmin",
                header: "Super Admin",
                cell: ({ row }) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.esSuperAdmin
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                        {row.original.esSuperAdmin ? 'Sí' : 'No'}
                    </span>
                ),
                size: 100,
            },
            {
                accessorKey: "estaActivo",
                header: "Estado",
                cell: ({ row }) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.estaActivo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {row.original.estaActivo ? 'Activo' : 'Inactivo'}
                    </span>
                ),
                size: 100,
            },
            {
                id: "actions",
                header: "Acciones",
                cell: ({ row }) => (
                    <div className="flex justify-center space-x-2">

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPermissions(row.original)}
                            title="Permisos"
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                        >
                            <Key className="h-4 w-4" />
                        </Button>

                    </div>
                ),
                size: 150,
            },
        ],
        [onPermissions]
    );

    const filteredData = useMemo(() => {
        if (!searchTerm) return usuarios;
        const term = searchTerm.toLowerCase();
        return usuarios.filter(user =>
            user.username.toLowerCase().includes(term)
        );
    }, [usuarios, searchTerm]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4A6E]"></div>
            </div>
        );
    }

    if (filteredData.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                {searchTerm
                    ? 'No se encontraron usuarios que coincidan con tu búsqueda'
                    : 'No hay usuarios del sistema disponibles'}
            </div>
        );
    }

    return (
        <div className="mt-4">
            <Datatable
                data={filteredData}
                columns={columns}
                key={`sistema-usuarios-${filteredData.length}`}
            />
            {pagination.pages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination
                        count={pagination.pages}
                        page={pagination.page}
                        onChange={handlePageChange}
                        showFirstButton
                        showLastButton
                        className="paginationContent"
                    />
                </div>
            )}
        </div>
    );
}
