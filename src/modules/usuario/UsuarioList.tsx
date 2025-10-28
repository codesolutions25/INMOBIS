"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Usuario } from "@/types/usuarios";
import { UsuarioEmpresa } from "@/types/usuarioEmpresa";
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Persona } from "@/types/persona";
import { getPersonas } from "@/services/apiPersona";
import { getUsuarios, getUsuariosEmpresaByPersonaId, deleteUsuario as deleteSystemUser, getUsuariosSistemaByPersonaId } from "@/services/apiUsuarios";
import {  getUsuariosEmpresa,  deleteUsuarioEmpresa } from "@/services/apiUsuarioEmpresa";

import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import UsuarioForm from "./UsuarioForm";
import { Tabs,  TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDetallesByUsuarioId, getDetallesByUsuarioEmpresaId, updateDetalleUsuario,  deleteDetalleUsuario } from "@/services/apiDetalleUsuario";
import { DetalleUsuario } from "@/types/detalleUsuario";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/search/SearchBar";

export default function UsuarioList() {
    const { user } = useAuth();
    const isCompanyUser = user?.tipo_usuario === 'company';
    
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [usuariosEmpresa, setUsuariosEmpresa] = useState<UsuarioEmpresa[]>([]);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<Persona | null>(null);
    const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState(isCompanyUser ? "company" : "system");
    const [historialAcceso, setHistorialAcceso] = useState<DetalleUsuario[]>([]);
    const [editingUser, setEditingUser] = useState<{username: string, type: 'company' | 'system'} | null>(null);
    const { showAlert } = useAlert();
    const formRef = useRef<any>(null);
    const fetchUsuarios = useCallback(async () => {
        try {
            setLoading(true);
            // First, fetch all users
            const [allSystemUsers, allCompanyUsers] = await Promise.all([
                getUsuarios(1, 1000),
                getUsuariosEmpresa(1, 1000)
            ]);

            setUsuarios(allSystemUsers.data);
            
            // Filter company users by the logged-in user's company ID if they are a company user
            const filteredCompanyUsers = isCompanyUser && user?.id_empresa
                ? allCompanyUsers.data.filter((u: UsuarioEmpresa) => u.id_empresa === user.id_empresa)
                : allCompanyUsers.data;
                
            setUsuariosEmpresa(filteredCompanyUsers);
        } catch (error) {
            console.error("Error fetching usuarios:", error);
            showAlert('error', 'Error', 'No se pudieron cargar los usuarios');
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    const fetchPersonas = useCallback(async () => {
        try {
            const response = await getPersonas(1, 100);
            setPersonas(response.data);
        } catch (error) {
            console.error("Error fetching personas:", error);
            showAlert('error', 'Error', 'No se pudieron cargar las personas');
        }
    }, [showAlert]);

    const loadUserData = useCallback(async (persona: Persona) => {
        try {
            setLoading(true);
            setIsEditing(false);
            setSelectedUsuario(null);
            
            if (activeTab === 'system') {
                // System user logic
                try {
                    const usuarios = await getUsuariosSistemaByPersonaId(persona.idPersona, true);
                    
                    if (usuarios && usuarios.length > 0) {
                        // Load access history for all system users
                        const allHistorial = await Promise.all(
                            usuarios.map(async (usuario:any) => {
                                const detalles = await getDetallesByUsuarioId(usuario.idUsuario);
                                return detalles.map((detalle:any) => ({
                                    ...detalle,
                                    id_usuario: detalle.id_usuario || usuario.idUsuario,
                                    username: usuario.username || detalle.username
                                }));
                            })
                        );
                        
                        // Flatten the array of arrays into a single array
                        const flattenedHistorial = allHistorial.flat();
                        setHistorialAcceso(flattenedHistorial);
                    } else {
                        setHistorialAcceso([]);
                    }
                } catch (error) {
                    console.error('Error loading system user data:', error);
                    setHistorialAcceso([]);
                }
            } else {
                // Company user logic
                try {
                    const usuarios:any = await getUsuariosEmpresaByPersonaId(persona.idPersona, true);
                    
                    if (usuarios && usuarios.length > 0) {
                        // Filter users by company if user is a company user
                        const filteredUsuarios = isCompanyUser && user?.id_empresa
                            ? usuarios.filter((usuario:any) => usuario.idEmpresa === user.id_empresa)
                            : usuarios;

                        

                        if (filteredUsuarios.length > 0) {
                            // Load access history for filtered users
                            const allHistorial = await Promise.all(
                                filteredUsuarios.map(async (usuario:any) => {
                                    const detalles = await getDetallesByUsuarioEmpresaId(usuario.idUsuarioEmpresa);
                                    return detalles.map((detalle:any) => ({
                                        ...detalle,
                                        id_usuario_empresa: detalle.id_usuario_empresa || usuario.idUsuarioEmpresa,
                                        username: usuario.username
                                    }));
                                })
                            );
                            
                            // Flatten the array of arrays into a single array
                            const flattenedHistorial = allHistorial.flat();
                            console.log('Company user access history:', flattenedHistorial);
                            setHistorialAcceso(flattenedHistorial);
                        } else {
                            console.log('No users found for the current company');
                            setHistorialAcceso([]);
                        }
                    } else {
                        console.log('No company users found for this person');
                        setHistorialAcceso([]);
                    }
                } catch (error) {
                    console.error('Error loading company user data:', error);
                    showAlert('error', 'Error', 'No se pudieron cargar los datos del usuario de empresa');
                    setHistorialAcceso([]);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            showAlert('error', 'Error', 'No se pudieron cargar los datos del usuario');
        } finally {
            setLoading(false);
        }
    }, [activeTab, showAlert]);

    const handlePersonSelect = useCallback((persona: Persona) => {
   
        setSelectedPerson(persona);
        setIsEditing(false); // Ensure we're in creation mode
        setSelectedUsuario(null); // Clear any selected user
        setEditingUser(null); // Clear any editing user
        loadUserData(persona);
    }, [loadUserData]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSelectedPerson(null);
        setSelectedUsuario(null);
        setHistorialAcceso([]);
        setIsEditing(false);
        setEditingUser(null);
    };

    const handleEditClick = (usuario: Usuario) => {
        setSelectedUsuario(usuario);
        setIsEditing(true);
        // Scroll to form
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchUsuarios();
        fetchPersonas();
    }, [fetchUsuarios, fetchPersonas]);

    const handleSuccess = useCallback(async () => {
        if (selectedPerson) {
            try {
                setLoading(true);
                
                // Recargar los datos del usuario actual
                if (activeTab === 'system') {
                    const usuarios = await getUsuariosSistemaByPersonaId(selectedPerson.idPersona, true);
                   
                    if (usuarios && usuarios.length > 0) {
                        // Load access history for all system users
                        const allHistorial = await Promise.all(
                            usuarios.map(async (usuario:any) => {
                                const detalles = await getDetallesByUsuarioId(usuario.idUsuario);
                                return detalles.map((detalle:any) => ({
                                    ...detalle,
                                    id_usuario: detalle.id_usuario || usuario.idUsuario,
                                    username: detalle.username
                                }));
                            })
                        );
                        
                        // Flatten the array of arrays into a single array
                        const flattenedHistorial = allHistorial.flat();
                        setHistorialAcceso(flattenedHistorial);
                        
                        // Set the first user as selected if none is selected
                        if (usuarios.length > 0) {
                            setSelectedUsuario(usuarios[0]);
                        }
                    } else {
                        setHistorialAcceso([]);
                        setSelectedUsuario(null);
                    }
                } else {
                    // For company users, get all users for this persona
                    const usuarios = await getUsuariosEmpresaByPersonaId(selectedPerson.idPersona, true);
                    
                    if (usuarios && usuarios.length > 0) {
                        // Load access history for all users
                        const allHistorial = await Promise.all(
                            usuarios.map(async (usuario:any) => {
                                const detalles = await getDetallesByUsuarioEmpresaId(usuario.idUsuarioEmpresa);
                                return detalles.map((detalle:any) => ({
                                    ...detalle,
                                    id_usuario_empresa: detalle.id_usuario_empresa || usuario.idUsuarioEmpresa,
                                    username: detalle.usuarioEmpresa?.username || usuario.username || detalle.username
                                }));
                            })
                        );
                        
                        // Flatten the array of arrays into a single array
                        const flattenedHistorial = allHistorial.flat();
                        setHistorialAcceso(flattenedHistorial);
                        
                        // Set the first user as selected if none is selected
                        if (usuarios.length > 0) {
                            setSelectedUsuario(usuarios[0]);
                        }
                    } else {
                        setHistorialAcceso([]);
                        setSelectedUsuario(null);
                    }
                }
                
                // Refresh the main user list
                await fetchUsuarios();
                
            } catch (error) {
                console.error('Error refreshing user data:', error);
                showAlert('error', 'Error', 'No se pudieron actualizar los datos');
            } finally {
                setLoading(false);
                setIsEditing(false);
                setEditingUser(null);
            }
        } else {
            // If no person is selected, just refresh the user list
            fetchUsuarios();
            setIsEditing(false);
            setEditingUser(null);
        }
        
        showAlert('success', 'Éxito', 'Operación completada correctamente');
    }, [selectedPerson, activeTab, fetchUsuarios, showAlert]);

    const handleEditAccess = useCallback(async (acceso: any) => {
        try {
            setLoading(true);
            
            // Find the user associated with this access record
            let userToEdit: any = null;
            
            if (activeTab === 'system') {
                // For system users
                const usuarios = await getUsuariosSistemaByPersonaId(selectedPerson?.idPersona || 0, true);
                userToEdit = usuarios.find(u => u.idUsuario === acceso.id_usuario) || null;
                
                
                
                if (userToEdit) {
                    // Format dates for the form (YYYY-MM-DD)
                    const formatDate = (date: string | Date | null | undefined): string => {
                        
                        if (!date) {
                            console.log('Date is null/undefined, returning empty string');
                            return '';
                        }
                        try {
                            const d = new Date(date);
                            if (isNaN(d.getTime())) {
                                console.log('Invalid date, returning empty string');
                                return '';
                            }
                            const formatted = d.toISOString().split('T')[0];
                            console.log('Formatted date:', formatted);
                            return formatted;
                        } catch (error) {
                            console.error('Error formatting date:', error);
                            return '';
                        }
                    };

                    // Add access details to the user object with properly formatted dates
                    userToEdit = {
                        ...userToEdit,
                        fechaInicio: formatDate(acceso.fechaInicio),
                        fechaFin: formatDate(acceso.fechaFin),
                        estaActivo: acceso.estado
                    };
                }
            } else {
                // For company users
                const usuarios = await getUsuariosEmpresaByPersonaId(selectedPerson?.idPersona || 0, true);
                userToEdit = usuarios.find((u:any) => u.idUsuarioEmpresa === acceso.id_usuario_empresa) || null;
                
                if (userToEdit) {
                    // Same date formatting logic as above
                    const formatDate = (date: string | Date | null | undefined): string => {
                        
                        if (!date) {
                            
                            return '';
                        }
                        try {
                            const d = new Date(date);
                            if (isNaN(d.getTime())) {
                                
                                return '';
                            }
                            const formatted = d.toISOString().split('T')[0];
                            
                            return formatted;
                        } catch (error) {
                            
                            return '';
                        }
                    };

                    userToEdit = {
                        ...userToEdit,
                        fechaInicio: formatDate(acceso.fechaInicio),
                        fechaFin: formatDate(acceso.fechaFin),
                        estaActivo: acceso.estado
                    };
                    
                }
            }

            if (userToEdit) {
                // Set the user to edit and enable edit mode
                setSelectedUsuario(userToEdit);
                setIsEditing(true);
                setEditingUser({
                    username: userToEdit.username || '',
                    type: activeTab === 'system' ? 'system' : 'company'
                });
                
                // Scroll to the form
                formRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else {
                showAlert('warning', 'Advertencia', 'No se pudo cargar la información del usuario para editar');
            }
        } catch (error) {
            console.error('Error loading user for editing:', error);
            showAlert('error', 'Error', 'No se pudo cargar la información para editar');
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedPerson, showAlert]);

    const handleToggleStatus = async (acceso: DetalleUsuario) => {
        try {
            // Prepare the update data with the required IDs
            const updateData: Partial<DetalleUsuario> = {
                estado: !acceso.estado
            };

            console.log('Datos del acceso:', acceso); // Debug log
            
            // For DetalleUsuario, we should use the direct id_usuario_empresa
            if (acceso.id_usuario_empresa) {
                updateData.id_usuario_empresa = acceso.id_usuario_empresa;
                
                console.log('Actualizando detalle con datos:', updateData);
                
                await updateDetalleUsuario(acceso.id, updateData);
                showAlert('success', 'Éxito', `Acceso ${!acceso.estado ? 'activado' : 'desactivado'} correctamente`);
                
                // Refresh the access history
                if (selectedPerson) {
                    await loadUserData(selectedPerson);
                }
            } else {
                console.error('No se pudo determinar el ID de usuario-empresa:', acceso);
                throw new Error('No se pudo determinar el ID de usuario-empresa');
            }
        } catch (error) {
            console.error('Error al actualizar el estado del acceso:', error);
            showAlert('error', 'Error', `No se pudo actualizar el estado del acceso: ${error}`);
        }
    };

    const handleDeleteUser = async (usuario: Usuario | UsuarioEmpresa) => {
        if (!window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
            return;
        }

        try {
            setLoading(true);
            
            if (activeTab === 'system') {
                // Eliminar usuario del sistema
                const systemUser = usuario as Usuario;
                await deleteSystemUser(systemUser.idUsuario || 0);
                showAlert('success', 'Éxito', 'Usuario del sistema eliminado correctamente');
            } else {
                // Eliminar usuario de empresa
                const companyUser = usuario as any;
                
                // Primero, obtener los detalles del usuario para eliminarlos
                try {
                    const detalles = await getDetallesByUsuarioEmpresaId(companyUser.idUsuarioEmpresa || 0);
                    if (detalles && detalles.length > 0) {
                        // Aquí necesitarías implementar la función deleteDetalleUsuario en tu servicio
                        // y luego llamarla para cada detalle
                        for (const detalle of detalles) {
                            try {
                                await deleteDetalleUsuario(detalle.id);
                            } catch (error) {
                                console.error(`Error al eliminar detalle ${detalle.id}:`, error);
                                // Continuar con la eliminación incluso si falla un detalle
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error al obtener detalles del usuario:', error);
                    // Continuar con la eliminación del usuario aunque falle la eliminación de detalles
                }
                
                // Luego, eliminar el usuario de empresa
                await deleteUsuarioEmpresa(companyUser.idUsuarioEmpresa || 0);
                showAlert('success', 'Éxito', 'Usuario de empresa eliminado correctamente');
            }
            
            // Recargar la lista de usuarios
            fetchUsuarios();
            
            // Limpiar el formulario si el usuario eliminado es el que se está editando
            if (selectedUsuario && 'idUsuario' in usuario && selectedUsuario.idUsuario === usuario.idUsuario) {
                setSelectedUsuario(null);
                setEditingUser(null);
            } else if (selectedUsuario && 'idUsuarioEmpresa' in usuario && 
                      'idUsuarioEmpresa' in selectedUsuario && 
                      selectedUsuario.idUsuarioEmpresa === usuario.idUsuarioEmpresa) {
                setSelectedUsuario(null);
                setEditingUser(null);
            }
            
        } catch (error) {
            console.error('Error al eliminar el usuario:', error);
            showAlert('error', 'Error', 'No se pudo eliminar el usuario');
        } finally {
            setLoading(false);
        }
    };

    const filteredPersonas = useMemo(() => {
        if (!searchTerm) return personas;
        const searchLower = searchTerm.toLowerCase();
        return personas.filter(persona => (
            persona.nombre.toLowerCase().includes(searchLower) ||
            (persona.apellidoPaterno || '').toLowerCase().includes(searchLower) ||
            (persona.apellidoMaterno || '').toLowerCase().includes(searchLower) ||
            (persona.numeroDocumento || '').toLowerCase().includes(searchLower)
        ));
    }, [personas, searchTerm]);

    return (
        <div className="flex flex-col md:flex-row h-screen">
            <div className="w-full md:w-80 border-b md:border-r flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold mb-4">Lista de Personas</h2>
                    <Tabs
                        value={activeTab}
                        onValueChange={handleTabChange}
                        className="w-full"
                    >
                        <TabsList className={`grid w-full ${isCompanyUser ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {!isCompanyUser && (
                                <TabsTrigger value="system">Sistema</TabsTrigger>
                            )}
                            <TabsTrigger value="company">Empresa</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="mt-2">
                        <SearchBar
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            placeholder="Buscar persona..."
                        />
                    </div>
                </div>

                <ScrollArea className="h-[400px] md:h-[calc(100vh-250px)] pr-2">
                    <div className="space-y-1">
                        {filteredPersonas.length > 0 ? (
                            filteredPersonas.map((persona) => (
                                <div
                                    key={persona.idPersona}
                                    className={cn(
                                        "p-3 rounded-md cursor-pointer hover:bg-accent",
                                        selectedPerson?.idPersona === persona.idPersona && "bg-accent"
                                    )}
                                    onClick={() => handlePersonSelect(persona)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium">
                                            {persona.nombre} {persona.apellidoPaterno} {persona.apellidoMaterno || ''}
                                        </div>
                                        {usuarios.find(u => u.idPersona === persona.idPersona) && (
                                            <div className="flex space-x-2">
                                                {usuarios.find(u => u.idPersona === persona.idPersona)?.esSuperAdmin && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                        Admin
                                                    </span>
                                                )}
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                    usuarios.find(u => u.idPersona === persona.idPersona)?.estaActivo
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                )}>
                                                    {usuarios.find(u => u.idPersona === persona.idPersona)?.estaActivo ? 'Activo' : 'Inactivo'}
                                                </span>
                                                {activeTab === 'company' && usuarios.some((u:any) => u.idPersona === persona.idPersona && u.idEmpresa) && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        Empresa
                                                    </span>
                                                )}
                                                {activeTab === 'system' && usuarios.some((u:any) => u.idPersona === persona.idPersona && !u.idEmpresa) && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Sistema
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        DNI: {persona.numeroDocumento || 'No especificado'}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {searchTerm ? 'No se encontraron personas' : 'No hay personas registradas'}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col h-full p-4 space-y-4 ">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-4">
                            {activeTab === 'system' ? 'Usuario del Sistema' : 'Usuario de Empresa'}
                            {editingUser && (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Editando: {editingUser.username}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedPerson ? (
                            <UsuarioForm
                                ref={formRef}
                                persona={selectedPerson}
                                usuario={selectedUsuario || undefined}
                                isEditing={isEditing}
                                onSuccess={() => {
                                    // Reset form state
                                    setIsEditing(false);
                                    setEditingUser(null);
                                    setSelectedUsuario(null);
                                    
                                    // Reload the user data to refresh the list
                                    if (selectedPerson) {
                                        loadUserData(selectedPerson);
                                    }
                                }}
                                isSystemUser={activeTab === 'system'}
                                activeTab={activeTab}
                                empresaId={activeTab === 'company' ? 1 : undefined}
                            />
                        ) : (
                            <div className="text-center py-12 border rounded-lg bg-muted/20">
                                <h3 className="text-lg font-medium">Ninguna persona seleccionada</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Seleccione una persona para ver sus accesos o crear uno nuevo.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Access History Card - Only show when a person is selected */}
                {selectedPerson && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Acceso</CardTitle>
                            <CardDescription>Registro de accesos del usuario seleccionado</CardDescription>
                        </CardHeader>
                        <CardContent>
                            
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Fecha de Inicio</TableHead>
                                            <TableHead>Fecha de Fin</TableHead>
                                            <TableHead>Usuario</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        
                                        {loading ? (
                                            console.log('Loading access history...'),
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-4">
                                                    Cargando...
                                                </TableCell>
                                            </TableRow>
                                        ) : historialAcceso && historialAcceso.length > 0 ? (
                                            historialAcceso.map((acceso:any, index:number) => {
                                                 return (
                                                <TableRow key={`${acceso.id}-${index}`}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        {acceso.fechaInicio
                                                            ? new Date(acceso.fechaInicio).toLocaleDateString()
                                                            : 'No especificado'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {acceso.fechaFin
                                                            ? new Date(acceso.fechaFin).toLocaleDateString()
                                                            : 'No especificado'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {acceso.usuarioEmpresa?.username || acceso.usuario?.username || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={cn(
                                                            "px-2 py-1 rounded text-xs",
                                                            acceso.estado
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        )}>
                                                            {acceso.estado ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
                                                                onClick={() => handleEditAccess(acceso)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )})
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-4">
                                                    No hay registros de acceso para este usuario.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                          
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}