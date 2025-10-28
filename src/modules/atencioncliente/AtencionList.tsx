"use client"

import { useEffect, useState, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";

import { AdminCardLayout } from "@/layouts/AdminCardLayout";
import { Button } from '@/components/ui/button';
import MuiPagination from '@/components/ui/pagination';
import Datatable from "@/components/table/datatable";

import { Persona } from "@/types/persona";
import { getPersonas } from "@/services/apiPersona";
import { getPersonasColumns } from "./columns";

import { useAlert } from "@/contexts/AlertContext";
import styles from './styles/AtencionList.module.css';

export interface AtencionListRef {
    refresh: () => void;
}

export interface AtencionListProps {
    onOpenModal: () => void;
    onClientSelect: (client: any) => void;
    className?: string;
}

const AtencionList = forwardRef<AtencionListRef, AtencionListProps>(({ onOpenModal, onClientSelect, className }, ref) => {
    const { showAlert } = useAlert();

    const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const fetchPersonas = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getPersonas(1, 1000, ''); // Fetch all
            const personasData = response.data || [];
            const reversedData = [...personasData].reverse();
            setAllPersonas(reversedData);
            setPersonas(reversedData);
            setTotalPages(Math.ceil(reversedData.length / itemsPerPage));
        } catch (error) {
            console.error('Error al obtener datos de personas:', error);
            showAlert('error', 'Error', 'No se pudieron cargar los datos de personas.');
            setPersonas([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [showAlert, itemsPerPage]);

    useEffect(() => {
        fetchPersonas();
    }, [fetchPersonas]);

    useImperativeHandle(ref, () => ({
        refresh: fetchPersonas,
    }));

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        const filtro = value.trim().toLowerCase();
        const filtrados = allPersonas.filter(p =>
            p.numeroDocumento?.toLowerCase().includes(filtro)
        );
        setPersonas(filtrados);
        setTotalPages(Math.ceil(filtrados.length / itemsPerPage));
        setCurrentPage(1);
    }, [allPersonas, itemsPerPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const paginatedPersonas = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return personas.slice(startIndex, endIndex);
    }, [personas, currentPage, itemsPerPage]);

    const handleViewClient = useCallback((persona: Persona) => {
        onClientSelect(persona);
    }, [onClientSelect]);

    const columns = useMemo(() => getPersonasColumns({ 
        currentPage, 
        itemsPerPage,
        onView: handleViewClient
    }), [currentPage, itemsPerPage, handleViewClient]);

    return (
        <>
        <AdminCardLayout>
                <AdminCardLayout.Title>
                    <div className={styles.titleContainer}>
                        <div className={styles.searchContainer}>
                            <div className="relative">
                                <div className={styles.searchIcon}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={handleSearchChange}
                                    placeholder="Buscar por DNI..."
                                    maxLength={8}
                                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0C4A6E] focus:border-[#0C4A6E] bg-white shadow-sm"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={onOpenModal}
                            variant="default"
                        >
                            Registrar
                        </Button>
                    </div>
                </AdminCardLayout.Title>
                <AdminCardLayout.Header>
                    <div className="-mt-4"></div>
                </AdminCardLayout.Header>
                <AdminCardLayout.Content>
                    <div className="flex flex-col gap-4">
                    {isLoading ? (
                        <div className={styles.loadingSpinnerContainer}>
                            <div className={styles.loadingSpinner}></div>
                        </div>
                    ) : personas.length === 0 ? (
                        <div className={styles.noResults}>
                            {inputValue ? 'No se encontraron personas que coincidan con tu búsqueda' : 'No hay personas disponibles'}
                        </div>
                    ) : (
                        <>
                            <div className={styles.tableWrapper}>
                                <div className={styles.tableContainer}>
                                    <div className="h-full">
                                        <Datatable 
                                            data={paginatedPersonas} 
                                            columns={columns} 
                                        onRowDoubleClick={(persona) => onClientSelect(persona)} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.paginationContainer}>
                                <MuiPagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(_, value) => handlePageChange(value)}
                                    showFirstButton
                                    showLastButton
                                    className={styles.paginationContent}
                                />
                            </div>
                        </>
                    )}
                </div>
                </AdminCardLayout.Content>
            </AdminCardLayout>
        </>
    );
});

export default AtencionList;