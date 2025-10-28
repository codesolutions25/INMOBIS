"use client"

import { useState, useCallback, useEffect } from "react";
import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { useModalContainer } from "@/components/modal/ModalContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { PermissionsModal } from "./PermissionsModal";
import { SistemaUsuariosList } from "./components/SistemaUsuariosList";
import { EmpresaUsuariosList } from "./components/EmpresaUsuariosList";

import { Usuario } from "@/types/usuarios";

// Extend the Usuario type to include the esUsuarioEmpresa flag
type UsuarioConTipo = Usuario & {
    esUsuarioEmpresa: boolean;
    detalleUsuarioId?: number | null;
    idUsuarioOriginal: number;
    idPersona?: number | null;
};

export default function PermisoList() {
    const { user } = useAuth();
    const { selectedCompany } = useCompany();
    const isCompanyUser = user?.tipo_usuario === 'company';

    // Modal state
    const {
        setShowModalContainer,
        closeModal: closeModalFromHook,
        ModalContainer,
    } = useModalContainer();

    // State management
    const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null);
    const [usuarioEdit, setUsuarioEdit] = useState<UsuarioConTipo | undefined>(undefined);
    const { showAlert } = useAlert();
    const [searchTerm, setSearchTerm] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [usuarioToDelete, setUsuarioToDelete] = useState<UsuarioConTipo | null>(null);
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(isCompanyUser ? "empresa" : "sistema");

    // Handlers for user actions
    // const handleEdit = useCallback((usuario: UsuarioConTipo) => {
    //     setUsuarioEdit(usuario);
    //     setModalType("edit");
    //     setShowModalContainer(true);
    // }, [setShowModalContainer]);

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(inputValue);
        }, 500);

        return () => clearTimeout(timer);
    }, [inputValue]);

    const handlePermissions = useCallback((usuario: UsuarioConTipo) => {
        setUsuarioEdit({
            ...usuario,
            idUsuarioOriginal: usuario.idUsuarioOriginal || usuario.idUsuario
        });
        setIsPermissionsModalOpen(true);
    }, []);


    // const handleDelete = useCallback((usuario: UsuarioConTipo) => {
    //     setUsuarioToDelete(usuario);
    //     setDeleteDialogOpen(true);
    // }, []);

    // Modal handlers
    const handleCloseModal = useCallback(() => {
        setModalType(null);
        setUsuarioEdit(undefined);
        closeModalFromHook();
    }, [closeModalFromHook]);

    const handleClosePermissionsModal = useCallback(() => {
        setIsPermissionsModalOpen(false);
        setUsuarioEdit(undefined);
    }, []);

    return (
        <AdminCardLayout
        >
            <AdminCardLayout.Header>
                <h1 className="text-2xl font-bold">Gestión de Permisos</h1>
                <p className="text-muted-foreground">Administre los permisos de los usuarios del sistema</p>
            </AdminCardLayout.Header>
            <AdminCardLayout.Content>
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-6"
                >
                    <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
                        <TabsList className="w-full md:w-auto">
                            {!isCompanyUser && (
                                <TabsTrigger value="sistema">Usuarios del Sistema</TabsTrigger>
                            )}
                            <TabsTrigger value="empresa">
                                {isCompanyUser ? 'Usuarios' : 'Usuarios de Empresa'}
                            </TabsTrigger>
                        </TabsList>

                        <div className="w-full md:w-64">
                            <div className="relative">
                                <input
                                    type="search"
                                    placeholder="Buscar usuarios..."
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>


                        </div>
                    </div>

                    <TabsContent value="sistema">
                        <SistemaUsuariosList
                            onPermissions={handlePermissions}
                            searchTerm={inputValue}
                        />
                    </TabsContent>

                    <TabsContent value="empresa">
                        <EmpresaUsuariosList
                            onPermissions={handlePermissions}
                            searchTerm={inputValue}
                            companyId={selectedCompany?.idEmpresa}
                        />
                    </TabsContent>
                </Tabs>

            </AdminCardLayout.Content>

            {/* Modals */}


            {/* Permissions Modal */}
            <PermissionsModal
                isOpen={isPermissionsModalOpen}
                onClose={handleClosePermissionsModal}
                usuarioId={usuarioEdit?.idUsuarioOriginal || 0}
                tipoUsuario={usuarioEdit?.esUsuarioEmpresa ? 'empresa' : 'sistema'}
            />
        </AdminCardLayout>
    );
}