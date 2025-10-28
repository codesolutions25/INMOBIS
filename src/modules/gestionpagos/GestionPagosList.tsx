import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { getPersonas } from "@/services/apiPersona";
import type { Persona } from "@/types/persona";
import { Cuota } from "@/services/apiCuotas";
import { getCuotasPorPlanPago } from "@/services/apiCuotas";
import { getPlanPagoById, PlanPago } from "@/services/apiPlanesPago";

// Extend the PlanPago type to include the data wrapper
type PlanPagoResponse = PlanPago | { data: PlanPago };
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { ClienteSearch } from './components/ClienteSearch';
import { ClienteInfoCard } from './components/ClienteInfoCard';
import { ReservasTable } from './components/ReservasTable';
import { IndicadoresReserva } from './components/IndicadoresReserva';
import { PagosPendientes } from './components/PagosPendientes';
import { HistorialPagos } from './components/HistorialPagos';
import type { Reserva, Pago } from './types';

// Local type for the client search functionality
type SearchCliente = {
    id: string;
    nombre: string;
    documento: string;
    telefono: string;
    email: string;
    direccion?: string;
};

// Extend the Reserva type to include the payment plan ID
interface ReservaConPlanPago extends Omit<Reserva, 'idPlanPagoPropiedad'> {
    idPlanPagoPropiedad?: number | string;
}

const GestionPagosList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState<SearchCliente | null>(null);
    const [selectedReserva, setSelectedReserva] = useState<ReservaConPlanPago | null>(null);
    const [searchResults, setSearchResults] = useState<Persona[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [cuotas, setCuotas] = useState<Cuota[]>([]);
    const [isLoadingCuotas, setIsLoadingCuotas] = useState(false);
    const [aplicaMora, setAplicaMora] = useState<boolean>(false);

    // Function to handle search
    const handleSearch = async (searchText: string) => {
        if (!searchText.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await getPersonas(1, 1000, searchText);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error al buscar clientes:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Add debounce for search
    // Load initial clients and handle search
    useEffect(() => {
        const searchTimeout = setTimeout(() => {
            const fetchClients = async () => {
                setIsSearching(true);
                try {
                    const response = await getPersonas(1, 10, searchTerm.trim());
                    setSearchResults(response.data);
                } catch (error) {
                    console.error('Error al buscar clientes:', error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            };

            fetchClients();
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [searchTerm]);

    // Load initial clients on component mount
    useEffect(() => {
        const loadInitialClients = async () => {
            if (searchResults.length === 0) {
                setIsSearching(true);
                try {
                    const response = await getPersonas(1, 10, '');
                    setSearchResults(response.data);
                } catch (error) {
                    console.error('Error al cargar clientes:', error);
                } finally {
                    setIsSearching(false);
                }
            }
        };

        loadInitialClients();
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setClienteSeleccionado(null);
    };

    // Mapear de Persona a Cliente para mantener compatibilidad
    const handleSelectClient = (persona: Persona | null) => {
        // Reset all related states when a new client is selected
        setSelectedReserva(null);
        setCuotas([]);
        if (!persona) {
            setClienteSeleccionado(null);
            return;
        }
        
        const cliente: SearchCliente = {
            id: persona.idPersona.toString(),
            nombre: `${persona.nombre} ${persona.apellidoPaterno} ${persona.apellidoMaterno}`.trim(),
            documento: persona.numeroDocumento || '',
            telefono: persona.telefonoPrincipal || '',
            email: persona.correoElectronico || '',
            direccion: persona.direccion || ''
        };
        
        setClienteSeleccionado(cliente);
    };

    const handleSelectReserva = async (reserva: ReservaConPlanPago) => {
        setSelectedReserva(reserva);
        if (reserva.idPlanPagoPropiedad) {
            setIsLoadingCuotas(true);
            try {
                const planPagoId = typeof reserva.idPlanPagoPropiedad === 'string' 
                    ? parseInt(reserva.idPlanPagoPropiedad, 10) 
                    : reserva.idPlanPagoPropiedad;
                // Obtener cuotas y datos del plan de pago en paralelo
                const [cuotasData, planPagoResponse] = await Promise.all([
                    getCuotasPorPlanPago(planPagoId),
                    (getPlanPagoById(planPagoId) as Promise<PlanPagoResponse>).catch(error => {
                        console.warn('No se pudo obtener información del plan de pago:', error);
                        return { data: { aplicaMora: false } } as PlanPagoResponse; // Asegurar la estructura de respuesta
                    })
                ]);
                
                
                
                // Manejar tanto la respuesta directa como la respuesta envuelta en data
                const planPagoData = 'data' in planPagoResponse ? planPagoResponse.data : planPagoResponse;
                const aplicaMoraValue = Boolean(planPagoData?.aplicaMora);
                
                
                
                setCuotas(cuotasData);
                setAplicaMora(aplicaMoraValue);
            } catch (error) {
                console.error('Error al cargar datos del plan de pago:', error);
                setCuotas([]);
                setAplicaMora(false);
            } finally {
                setIsLoadingCuotas(false);
            }
        } else {
            console.log('No idPlanPagoPropiedad in reserva');
            setCuotas([]);
        }
    };

    const handlePagoRealizado = async () => {
        if (selectedReserva?.idPlanPagoPropiedad) {
            try {
                // Recargar las cuotas después de un pago exitoso
                const planPagoId = typeof selectedReserva.idPlanPagoPropiedad === 'string' 
                    ? parseInt(selectedReserva.idPlanPagoPropiedad, 10) 
                    : selectedReserva.idPlanPagoPropiedad;
                const cuotasData = await getCuotasPorPlanPago(planPagoId);
                
                setCuotas(cuotasData);
                
                // Aquí podrías agregar lógica adicional después de un pago exitoso,
                // como mostrar una notificación o actualizar el historial de pagos
                console.log('Pago realizado con éxito');
            } catch (error) {
                console.error('Error al actualizar las cuotas después del pago:', error);
            }
        }
    };

    // Mapear SearchCliente a Cliente para el ClienteInfoCard
    const mapToClienteInfo = (cliente: SearchCliente | null) => {
        if (!cliente) return null;
        return {
            id: parseInt(cliente.id),
            nombre: cliente.nombre,
            documento: cliente.documento,
            telefono: cliente.telefono,
            email: cliente.email,
            direccion: cliente.direccion || ''
        };
    };


    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6">Gestión de Pagos</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Columna izquierda: Búsqueda de clientes */}
                <div className="lg:col-span-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Buscar Cliente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ClienteSearch
                                searchTerm={searchTerm}
                                searchResults={searchResults}
                                isSearching={isSearching}
                                onSearchChange={handleSearchChange}
                                onSearch={() => handleSearch(searchTerm)}
                                onClearSearch={() => {
                                    setSearchTerm('');
                                    setClienteSeleccionado(null);
                                    setSearchResults([]);
                                    setSelectedReserva(null);
                                    setCuotas([]);
                                }}
                                selectedClient={clienteSeleccionado ? {
                                    idPersona: parseInt(clienteSeleccionado.id),
                                    nombre: clienteSeleccionado.nombre.split(' ')[0],
                                    apellidoPaterno: clienteSeleccionado.nombre.split(' ')[1] || '',
                                    apellidoMaterno: clienteSeleccionado.nombre.split(' ')[2] || '',
                                    idTipoGenero: 1, // Default value, adjust as needed
                                    idTipoDocumento: 1, // Default value, adjust as needed
                                    numeroDocumento: clienteSeleccionado.documento,
                                    telefonoPrincipal: clienteSeleccionado.telefono,
                                    telefonoSecundario: '',
                                    correoElectronico: clienteSeleccionado.email,
                                    direccion: clienteSeleccionado.direccion || '',
                                    fechaNacimiento: '' // Add default value
                                } : null}
                                onSelectClient={handleSelectClient}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Columna derecha: Información del cliente */}
                <div className="lg:col-span-8 space-y-4">
                    {clienteSeleccionado ? (
                        <>
                            {/* Información del cliente */}
                            <ClienteInfoCard cliente={mapToClienteInfo(clienteSeleccionado)} />

                            {/* Tabla de reservas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reservas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ReservasTable
                                        clienteId={clienteSeleccionado?.id ? parseInt(clienteSeleccionado.id) : undefined}
                                        reservaSeleccionada={selectedReserva}
                                        onSelectReserva={handleSelectReserva}
                                    />
                                </CardContent>
                            </Card>

                            {selectedReserva && (
                                <>
                                    <IndicadoresReserva
                                        reserva={selectedReserva}
                                        cuotas={cuotas}
                                    />

                                    {/* Tabla de pagos pendientes */}
                                </>
                            )}
                            {selectedReserva && (
                                <PagosPendientes 
                                    reserva={selectedReserva}
                                    cliente={clienteSeleccionado}
                                    onPagoRealizado={handlePagoRealizado}
                                    cuotas={cuotas}
                                    isLoading={isLoadingCuotas}
                                    idPlanPagoPropiedad={selectedReserva.idPlanPagoPropiedad}
                                    aplicaMora={aplicaMora}
                                />
                            )}

                            {/* Historial de pagos */}
                            {selectedReserva && (
                                <HistorialPagos
                                reserva={selectedReserva}
                                cliente={clienteSeleccionado}
                                    cuotas={cuotas}
                                    lote={selectedReserva.lote}
                                />
                            )}
                        </>
                    ) : (
                        <Card className="flex items-center justify-center h-64">
                            <CardContent className="text-center p-6">
                                <p className="text-gray-500">Seleccione un cliente para ver su información de pagos</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GestionPagosList;