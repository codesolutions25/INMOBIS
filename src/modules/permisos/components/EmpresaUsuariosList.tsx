import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { getUsuariosEmpresa } from "@/services/apiUsuarioEmpresa";
import { getDetallesByUsuarioEmpresaId } from "@/services/apiDetalleUsuario";
import { getEmpresas } from "@/services/apiEmpresa";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext"; // Added useAuth import
import Datatable from "@/components/table/datatable";
import { Key, Trash2, Building2 } from "lucide-react";
import MuiPagination from "@/components/ui/pagination";

type UsuarioEmpresaConTipo = {
    idUsuario: number;
    username: string;
    esSuperAdmin: boolean;
    estaActivo: boolean;
    esUsuarioEmpresa: boolean;
    detalleUsuarioId: number | null;
    idUsuarioOriginal: number;
    idEmpresa?: number;
    empresaNombre?: string;
};

interface EmpresaUsuariosListProps {
    onPermissions: (usuario: UsuarioEmpresaConTipo) => void;
    searchTerm: string;
    companyId?: number; // Add companyId prop
}

export function EmpresaUsuariosList({
    onPermissions,
    searchTerm,
    companyId,
}: EmpresaUsuariosListProps) {
    const { user } = useAuth();
    const currentUserCompanyId = companyId || user?.id_empresa;
    const [usuarios, setUsuarios] = useState<UsuarioEmpresaConTipo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0,
        limit: 10
    });
    const [filteredUsuarios, setFilteredUsuarios] = useState<UsuarioEmpresaConTipo[]>([]);
    const [empresas, setEmpresas] = useState<Record<number, string>>({});
    const { showAlert } = useAlert();
    const isInitialMount = useRef(true);
    const itemsPerPage = 10; // Moved outside of state to prevent unnecessary re-renders

    const fetchEmpresas = useCallback(async () => {
        try {
            const response = await getEmpresas(1, 1000); // Fetch all companies
        
            const empresasMap = response.data.reduce((acc: Record<number, string>, empresa: any) => {
                acc[empresa.idEmpresa] = empresa.razonSocial || `Empresa ${empresa.idEmpresa}`;
                return acc;
            }, {});
         
            setEmpresas(empresasMap);
            return empresasMap;
        } catch (error) {
            console.error('Error al cargar las empresas:', error);
            showAlert('error', 'Error', 'No se pudieron cargar los nombres de las empresas');
            return {};
        }
    }, [showAlert]);

    const fetchUsuarios = useCallback(async (pageNumber: number = 1, searchTerm?: string) => {
        setIsLoading(true);
        try {
            // First fetch companies if not already loaded
            const empresasData = Object.keys(empresas).length === 0 ? await fetchEmpresas() : empresas;
            

            const allResponse = await getUsuariosEmpresa(1, 1000, searchTerm || '');
  
            
            if (!allResponse || !allResponse.data || !Array.isArray(allResponse.data)) {
                console.error('Invalid API response format:', allResponse);
                throw new Error('Formato de respuesta de API inválido');
            }
            
           
            
            // Filter users by company if companyId is provided
            const filteredData = currentUserCompanyId 
                ? allResponse.data.filter((user: any) => {
                    // Check both id_empresa and idEmpresa for compatibility
                    const userCompanyId = user.id_empresa || user.idEmpresa;
                    const matches = userCompanyId == currentUserCompanyId; // Loose equality for type safety
                    
                   
                    
                    return matches;
                })
                : allResponse.data;
                
            
            // Paginate the filtered results
            const start = (pageNumber - 1) * itemsPerPage;
            const paginatedData = filteredData.slice(start, start + itemsPerPage);
            
            const response = {
                data: paginatedData,
                meta: {
                    ...allResponse.meta,
                    total: filteredData.length,
                    page: pageNumber,
                    pages: Math.ceil(filteredData.length / itemsPerPage),
                    limit: itemsPerPage
                }
            };
            
            const usuariosTransformados = await Promise.all(
                response.data.map(async (empUser: any, index: number) => {
                    try {
                        
                        const userId = empUser.id_usuario_empresa || empUser.idUsuarioEmpresa || empUser.id;
                        if (!userId) {
                            console.error('Invalid user ID for user:', empUser);
                            return null;
                        }
                        
                        const detallesResponse = await getDetallesByUsuarioEmpresaId(userId);
                        const detalleUsuario = detallesResponse.length > 0 ? detallesResponse[0] : null;
                        
                        const userCompanyId = empUser.id_empresa || empUser.idEmpresa;
                        const userData = {
                            idUsuario: userId,
                            username: empUser.username || empUser.nombre_usuario || 'Sin nombre',
                            idPersona: empUser.id_persona || empUser.idPersona || empUser.persona?.idPersona || null,
                            idEmpresa: userCompanyId,
                            empresaNombre: empresasData[userCompanyId] || 'Sin empresa',
                            esSuperAdmin: false,
                            estaActivo: detalleUsuario ? detalleUsuario.estado : false,
                            esUsuarioEmpresa: true,
                            detalleUsuarioId: detalleUsuario?.id || null,
                            idUsuarioOriginal: userId,
                        };
                        
                        return userData;
                    } catch (error) {
                        console.error(`Error procesando usuario de empresa ${empUser.idUsuarioEmpresa}:`, error);
                        return null;
                    }
                })
            );

            const usuariosFiltrados = usuariosTransformados.filter(Boolean) as UsuarioEmpresaConTipo[];
            setUsuarios(usuariosFiltrados);
            setFilteredUsuarios(usuariosFiltrados);
            
            // Update pagination state from API response
            setPagination({
                page: response.meta?.page || 1,
                pages: response.meta?.pages || 1,
                total: response.meta?.total || 0,
                limit: response.meta?.limit || 10
            });
        } catch (error) {
            console.error('Error al cargar usuarios de empresa:', error);
            showAlert('error', 'Error', 'No se pudieron cargar los usuarios de empresa');
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
    }, [showAlert]);

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

    // Update filtered users when search term changes
    useEffect(() => {
        if (!searchTerm) {
            setFilteredUsuarios(usuarios);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = usuarios.filter(usuario => 
                usuario.username.toLowerCase().includes(term)
            );
            setFilteredUsuarios(filtered);
        }
    }, [searchTerm, usuarios]);

    const columns = useMemo<ColumnDef<UsuarioEmpresaConTipo>[]>(
        () => [
            {
                id: "#",
                header: "Ítem",
                cell: ({ row }) => row.index + 1,
                size: 60,
            },
            {
                accessorKey: "username",
                header: "Usuario",
            },
            {
                accessorKey: "empresaNombre",
                header: "Empresa",
                cell: ({ row }) => (
                    <div className="flex justify-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{row.original.empresaNombre || 'Sin empresa'}</span>
                    </div>
                ),
            },
            {
                accessorKey: "estaActivo",
                header: "Estado",
                cell: ({ row }) => (
                    <span className={`px-2 py-1 rounded-full text-xs ${row.original.estaActivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {row.original.estaActivo ? 'Activo' : 'Inactivo'}
                    </span>
                ),
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
                            title="Gestionar permisos"
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                        >
                            <Key className="h-4 w-4" />
                        </Button>
                       
                    </div>
                ),
            },
        ],
        [ onPermissions]
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <Datatable
                    columns={columns}
                    data={filteredUsuarios}
                />
                {isLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                )}
            </div>
            
            {pagination.pages > 1 && (
                <div className="flex justify-center mt-4">
                    <MuiPagination
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
