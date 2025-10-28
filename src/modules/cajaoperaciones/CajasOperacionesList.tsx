"use client"

import { Combobox } from "@/components/ui/combobox";
import { getCajas } from "@/services/apiCajas";
import { Caja } from "@/types/cajas";
import { useEffect, useState, useCallback, useMemo } from "react"
import { useAlert } from "@/contexts/AlertContext"
import { useModalContainer } from "@/components/modal/ModalContainer"
import { Button } from "@/components/ui/button"
import Datatable from "@/components/table/datatable"
import { getCajaOperacionColumns } from "./columns"
import {
  getMovimientosYOperaciones,
  type TransaccionUnificada
} from "@/services/apiCajaOperaciones"
import { AdminCardLayout } from "@/layouts/AdminCardLayout"
import { TipoOperacion } from "@/types/tiposoperacion"
import { getTiposOperacion } from "@/services/apiTiposOperacion"
import { useCompany } from "@/contexts/CompanyContext";
import { getPuntosVenta } from "@/services/apiPuntoVenta";
import { PuntoVenta } from "@/types/puntoventa";
import styles from "./styles/CajaOperaciones.module.css"
import MuiPagination from "@/components/ui/pagination";

export default function CajasOperacionesList() {
  // Modal state
  const {
    setShowModalContainer,
    closeModal: closeModalFromHook,
    ModalContainer
  } = useModalContainer()

  // State management
  const [modalType, setModalType] = useState<"register" | "edit" | "view" | null>(null)
  const [operacionEdit, setOperacionEdit] = useState<TransaccionUnificada | undefined>(undefined)
  const { showAlert } = useAlert()
  const [allOperaciones, setAllOperaciones] = useState<TransaccionUnificada[]>([]);
  const [filteredOperaciones, setFilteredOperaciones] = useState<TransaccionUnificada[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [tiposOperacion, setTiposOperacion] = useState<TipoOperacion[]>([])
  const [tiposOperacionMap, setTiposOperacionMap] = useState<Record<number, TipoOperacion>>({})
  const [operacionToDelete, setOperacionToDelete] = useState<TransaccionUnificada | null>(null)
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [selectedCaja, setSelectedCaja] = useState<number | null>(null);
  const [cajaSearchTerm, setCajaSearchTerm] = useState("");
  const [selectedTipoOperacion, setSelectedTipoOperacion] = useState<number | null>(null);
  const [tipoOperacionSearchTerm, setTipoOperacionSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateRangeError, setDateRangeError] = useState<string>('');

  // Add company context
  const { selectedCompany } = useCompany();
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([]);
  const [puntosVentaMap, setPuntosVentaMap] = useState<Record<number, PuntoVenta>>({});

  // Fetch tipo de operación
  const fetchTiposOperacion = useCallback(async () => {
    try {
      const response = await getTiposOperacion(1, 100);
      const tiposData = Array.isArray(response.data) ? response.data : [];
      setTiposOperacion(tiposData);
      const map = tiposData.reduce((acc: Record<number, TipoOperacion>, tipo) => {
        if (tipo && typeof tipo.idTipoOperacion === 'number') {
          acc[tipo.idTipoOperacion] = tipo;
        }
        return acc;
      }, {});
      setTiposOperacionMap(map);
    } catch (error) {
      showAlert('error', 'Error', 'No se pudieron cargar los tipos de operación');
    }
  }, [showAlert]);

  // Fetch puntos de venta when company changes
  useEffect(() => {
    const fetchPuntosVenta = async () => {
      if (selectedCompany) {
        try {
          const response = await getPuntosVenta(1, 1000);
          const puntosVentaData = response?.data || [];
          
          // Filter puntos de venta by selected company on client side
          const filteredPuntosVenta = puntosVentaData.filter(
            pv => pv.empresa_id === selectedCompany.idEmpresa
          );
          
          setPuntosVenta(filteredPuntosVenta);
          
          // Create a map for quick lookup
          const map: Record<number, PuntoVenta> = {};
          filteredPuntosVenta.forEach(pv => {
            if (pv.id_punto_venta) {
              map[pv.id_punto_venta] = pv;
            }
          });
          setPuntosVentaMap(map);
        } catch (error) {
          console.error('Error fetching puntos de venta:', error);
          showAlert('error', 'Error', 'No se pudieron cargar los puntos de venta');
        }
      } else {
        setPuntosVenta([]);
        setPuntosVentaMap({});
      }
    };

    fetchPuntosVenta();
  }, [selectedCompany]);

  // Fetch cajas
  const fetchCajas = useCallback(async () => {
    try {
      const response = await getCajas(1, 1000);
      let cajasData = response?.data || [];
      
      // Filter cajas by company's puntos de venta if a company is selected
      if (selectedCompany && puntosVenta.length > 0) {
        const puntosVentaIds = puntosVenta.map(pv => pv.id_punto_venta);
        cajasData = cajasData.filter(caja => 
          caja.id_punto_venta && puntosVentaIds.includes(caja.id_punto_venta)
        );
      }
      
      setCajas(cajasData);
    } catch (error) {
      console.error('Error fetching cajas:', error);
      showAlert('error', 'Error', 'No se pudieron cargar las cajas');
    }
  }, [selectedCompany, puntosVenta, showAlert]);

  // Fetch data
  const fetchOperaciones = useCallback(async () => {
    try {
      setIsLoading(true)

      // Fetch all data without date filters (filtering will be done on frontend)
      const response = await getMovimientosYOperaciones(
        1, // Always fetch first page
        10000, // Large number to get all records
        searchTerm,
        selectedCaja || undefined
      );

      // Apply company filter if a company is selected
      let filteredData = response.data || [];
      
      if (selectedCompany) {
        filteredData = filteredData.filter((operacion: TransaccionUnificada) => {
          // Find the caja for this operacion
          const caja = cajas.find(c => c.id_caja === operacion.id_caja);
          if (!caja) return false;
          
          // Check if the caja's punto de venta belongs to the selected company
          const puntoVenta = caja.id_punto_venta ? puntosVentaMap[caja.id_punto_venta] : null;
          return puntoVenta && puntoVenta.empresa_id === selectedCompany.idEmpresa;
        });
      }

      // Store filtered operations
      setAllOperaciones(filteredData);

      // Apply other filters and update filtered data
      applyFilters(filteredData);

    } catch (error) {
      console.error('Error fetching operaciones y movimientos:', error);
      showAlert('error', 'Error', 'No se pudieron cargar las operaciones y movimientos');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCaja, selectedCompany, cajas, puntosVentaMap, showAlert]);

  // Apply all active filters to the data
  const applyFilters = useCallback((data: TransaccionUnificada[]) => {
    let result = [...data];

    // Apply date filter if dates are selected
    if (startDate || endDate) {
      result = result.filter((operacion: TransaccionUnificada) => {
        if (!operacion.fecha) return true;

        try {
          const operacionDate = new Date(operacion.fecha);
          const operacionDateStr = operacionDate.toISOString().split('T')[0];

          // Parse start and end dates in local timezone if they exist
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;

          // Create date-only strings for comparison
          const startDateStr = start?.toISOString().split('T')[0];
          const endDateStr = end?.toISOString().split('T')[0];

          // Compare date strings directly (YYYY-MM-DD format)
          const isAfterOrEqualStart = !startDateStr || operacionDateStr >= startDateStr;
          const isBeforeOrEqualEnd = !endDateStr || operacionDateStr <= endDateStr;

          return isAfterOrEqualStart && isBeforeOrEqualEnd;
        } catch (error) {
          console.error('Error processing date for operation:', { error, operacion });
          return true; // Include operations with invalid dates
        }
      });
    }

    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((operacion) => {
        const matchesDescripcion = operacion.descripcion?.toLowerCase().includes(searchLower) || false;
        const matchesReferencia = operacion.referencia?.toLowerCase().includes(searchLower) || false;
        const matchesMonto = operacion.monto?.toString().includes(searchTerm) || false;

        return matchesDescripcion || matchesReferencia || matchesMonto;
      });
    }

    // Apply caja filter
    if (selectedCaja) {
      result = result.filter((operacion) => operacion.id_caja === selectedCaja);
    }

    // Apply tipo operacion filter
    if (selectedTipoOperacion) {
      result = result.filter((operacion) => operacion.id_tipo_operacion === selectedTipoOperacion);
    }

    // Update filtered data and pagination
    setFilteredOperaciones(result);
    setTotalItems(result.length);
    setTotalPages(Math.ceil(result.length / itemsPerPage));

    // Reset to first page when filters change
    setCurrentPage(1);

  }, [startDate, endDate, itemsPerPage, searchTerm, selectedCaja, selectedTipoOperacion]);

  // Re-apply filters when they change
  useEffect(() => {
    if (allOperaciones.length > 0) {
      applyFilters(allOperaciones);
    }
  }, [allOperaciones, applyFilters]);

  // Calculate paginated data based on current page and filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOperaciones.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredOperaciones, itemsPerPage]);

  // Cargar tipos de operación y cajas solo una vez o cuando refreshTrigger cambie
  useEffect(() => {
    fetchTiposOperacion();
    fetchCajas();
  }, [fetchTiposOperacion, fetchCajas, refreshTrigger]);

  // Cargar operaciones cuando cambie la página, búsqueda, o refreshTrigger
  useEffect(() => {
    fetchOperaciones();
  }, [fetchOperaciones, refreshTrigger]);

  // Handle search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(inputValue)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [inputValue])

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  // Format date to YYYY-MM-DD
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Set default date range to today
  useEffect(() => {
    const today = new Date();
    const todayStr = formatDateForInput(today);
    setStartDate(todayStr);
    setEndDate(todayStr);
  }, []);

  // Validate date range
  const validateDateRange = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateRangeError('La fecha de inicio no puede ser mayor a la fecha de fin');
      return false;
    }
    setDateRangeError('');
    return true;
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
    setDateRangeError('');
  };

  

  // Filtrar cajas basado en el término de búsqueda
  const filteredCajas = useMemo(() => {
    if (!cajaSearchTerm) return cajas;
    const searchLower = cajaSearchTerm.toLowerCase();
    return cajas.filter(caja =>
    (caja.nombre_caja?.toLowerCase().includes(searchLower) ||
      caja.id_caja.toString().includes(searchLower))
    );
  }, [cajas, cajaSearchTerm]);

  // Filtrar tipos de operación basado en el término de búsqueda
  const filteredTiposOperacion = useMemo(() => {
    if (!tipoOperacionSearchTerm) return tiposOperacion;
    const searchLower = tipoOperacionSearchTerm.toLowerCase();
    return tiposOperacion.filter(tipo =>
    (tipo.nombreTipoOperacion?.toLowerCase().includes(searchLower) ||
      tipo.idTipoOperacion.toString().includes(searchLower))
    );
  }, [tiposOperacion, tipoOperacionSearchTerm]);

  // Calculate summary values based on filtered operations
  const { totalIngresos, totalEgresos, saldoTotal } = useMemo(() => {
    const tipoIngreso = process.env.NEXT_PUBLIC_TIPO_MOVIMIENTO_INGRESO?.toLowerCase() || 'ingreso';
    const tipoEgreso = process.env.NEXT_PUBLIC_TIPO_MOVIMIENTO_EGRESO?.toLowerCase() || 'egreso';

    return filteredOperaciones.reduce((acc, operacion) => {
      const monto = Number(operacion.monto) || 0;

      // Since we're using the unified API, we'll use the tipo field to determine if it's an ingreso/egreso
      // This assumes the backend is setting the tipo_operacion correctly for both operaciones and movimientos
      const tipoOperacion = tiposOperacionMap[operacion.id_tipo_operacion || 0];

      if (tipoOperacion) {
        const nombreTipo = tipoOperacion.nombreTipoOperacion?.toLowerCase() || '';
        const isIngreso = nombreTipo === tipoIngreso;
        const isEgreso = nombreTipo === tipoEgreso;

        if (isIngreso) {
          acc.totalIngresos += monto;
        } else if (isEgreso) {
          acc.totalEgresos += monto;
        }
      }

      acc.saldoTotal = acc.totalIngresos - acc.totalEgresos;
      return acc;
    }, {
      totalIngresos: 0,
      totalEgresos: 0,
      saldoTotal: 0
    });
  }, [filteredOperaciones, tiposOperacionMap]);

  // Table columns with actions
  const columns = useMemo(
    () =>
      getCajaOperacionColumns({
        tiposOperacionMap,
        cajas, // Pass the cajas data to the columns
      }),
    [tiposOperacionMap, cajas]
  )

  // Format currency helper function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <>

      <div className={styles.adminTitle}>
        <AdminCardLayout.Title>
          <h1 className={styles.title}>Operaciones de Caja</h1>
        </AdminCardLayout.Title>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        {/* Saldo Total */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardTitle}>Saldo Total</div>
          <div className={styles.summaryCardValue}>
            S/ {formatCurrency(saldoTotal)}
          </div>
        </div>

        {/* Total Ingresos */}
        <div className={styles.summaryCardIncome}>
          <div className={styles.summaryCardTitleIncome}>Total Ingresos</div>
          <div className={styles.summaryCardValueIncome}>
            + S/ {formatCurrency(totalIngresos)}
          </div>
        </div>

        {/* Total Egresos */}
        <div className={styles.summaryCardExpense}>
          <div className={styles.summaryCardTitleExpense}>Total Egresos</div>
          <div className={styles.summaryCardValueExpense}>
            - S/ {formatCurrency(totalEgresos)}
          </div>
        </div>
      </div>

      <AdminCardLayout>
        <AdminCardLayout.Title>
          <div className={styles.searchContainer}>
            <h2 className={styles.searchTitle}>Lista de Operaciones de Caja</h2>
            <div className={styles.searchWrapper}>
              <div className={styles.searchInputWrapper}>
                <div className={styles.searchIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={styles.searchIconSvg} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por descripción o referencia..."
                  value={inputValue}
                  onChange={handleSearchChange}
                  autoComplete="off"
                  name="search-operacion-no-autocomplete"
                  className={styles.searchInput}
                />
              </div>
            </div>
          </div>
        </AdminCardLayout.Title>

        <AdminCardLayout.Header>
          <div className={styles.dateFiltersContainer}>
            <div>
              <label className={styles.dateLabel}>
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            <div>
              <label className={styles.dateLabel}>
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className={styles.dateInput}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearDateFilters}
                className={styles.dateClearButton}
              >
                Limpiar fechas
              </button>
            </div>
            {dateRangeError && (
              <div className={styles.dateErrorContainer}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.dateErrorIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {dateRangeError}
              </div>
            )}
          </div>

          <div className={styles.filterContainer}>
            <div className={styles.filterItem}>
              <label
                htmlFor="caja-combobox"
                className={styles.filterLabel}
              >
                Caja
              </label>
              <Combobox
                options={[
                  { label: 'Todas las cajas', value: '' },
                  ...cajas.map(c => ({
                    label: `${c.nombre_caja} (${c.id_caja})`,
                    value: c.id_caja.toString()
                  }))
                ]}
                selected={selectedCaja?.toString() || ''}
                onChange={(value) => setSelectedCaja(value ? Number(value) : null)}
                placeholder="Seleccione una caja"
               
              />
            </div>

            <div className={styles.filterItem}>
              <label
                htmlFor="tipo-operacion-combobox"
                className={styles.filterLabel}
              >
                Tipo de Operación
              </label>
              <Combobox
                options={[
                  { label: 'Todos los tipos', value: '' },
                  ...filteredTiposOperacion.map(tipo => ({
                    label: tipo.nombreTipoOperacion || `Tipo ${tipo.idTipoOperacion}`,
                    value: tipo.idTipoOperacion.toString()
                  }))
                ]}
                selected={selectedTipoOperacion?.toString() ?? ""}
                
                onChange={val => {
                  setSelectedTipoOperacion(val ? Number(val) : null);
                  setTipoOperacionSearchTerm("");
                }}
                placeholder="Buscar tipo de operación..."
               
                
              />
            </div>
          </div>
        </AdminCardLayout.Header>
        <AdminCardLayout.Content>
          <div className={styles.contentContainer}>
          </div>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
            </div>
          ) : filteredOperaciones.length === 0 ? (
            <div className={styles.emptyState}>
              {searchTerm ? 'No se encontraron operaciones que coincidan con tu búsqueda' : 'No hay operaciones disponibles'}
            </div>
          ) : (
            <Datatable
              columns={columns}
              data={paginatedData}
                         />
          )}

          {filteredOperaciones.length > 0 && !isLoading && totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <MuiPagination
                count={totalPages}
                page={currentPage}
                onChange={(_, value) => handlePageChange(value)}
                showFirstButton
                showLastButton
                className="flex items-center gap-2"
              />
            </div>
          )}
        </AdminCardLayout.Content>
      </AdminCardLayout>


    </>
  );
}