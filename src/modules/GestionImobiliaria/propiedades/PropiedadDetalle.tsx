"use client"

import { CaracteristicaPropiedad, Propiedad, CatalogoCaracteristica, Proyecto, TipoPropiedad, EstadoPropiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import { Building2, FileText, Home, Image, Box, Tag, DollarSign, MapPinHouse, SquareChevronRight, MapPinned, Ruler, BedDouble, Bath, Car, Info } from 'lucide-react';
import PropiedadCaracteristicasModal from "./PropiedadCaracteristicasModal";
import EntityDetailView from "@/components/detail/EntityDetailView";
import { useEffect, useState, useCallback } from "react";
import PropiedadesGaleria from "./PropiedadesGaleria";
import styles from "./styles/PropiedadDetalle.module.css";
import InmobiliariaApi from "../services/InmobiliariaApi";

type PropiedadDetalleProps = {
    propiedad: Propiedad;
}

export default function PropiedadDetalle({ propiedad }: PropiedadDetalleProps) {
    const [proyectoNombre, setProyectoNombre] = useState<string>("");
    const [tipoPropiedad, setTipoPropiedad] = useState<string>("");
    const [estadoPropiedad, setEstadoPropiedad] = useState<string>("");
    
    // Estado para controlar la apertura del modal de características
    const [caracteristicasModalOpen, setCaracteristicasModalOpen] = useState<boolean>(false);
    const [caracteristicasPropiedad, setCaracteristicasPropiedad] = useState<Array<CaracteristicaPropiedad & { nombre: string; descripcion?: string; activo?: boolean }>>([]);
    const [isLoadingCaracteristicas, setIsLoadingCaracteristicas] = useState<boolean>(false);
    
    // Función para cargar las características de la propiedad
    const fetchCaracteristicas = useCallback(async () => {
      try {
        setIsLoadingCaracteristicas(true);
        
        // 1. Obtener características de esta propiedad
        let caracteristicas = [];
        try {
          caracteristicas = await InmobiliariaApi.caracteristicasPropiedadController
            .getByPropiedadId(propiedad.idPropiedad);
          
          // Si no hay características, retornar array vacío
          if (!caracteristicas || !Array.isArray(caracteristicas) || caracteristicas.length === 0) {
            console.log(`No se encontraron características para la propiedad con ID: ${propiedad.idPropiedad}`);
            setCaracteristicasPropiedad([]);
            return;
          }
        } catch (error) {
          // Si hay un error (como 404), asumimos que no hay características
          console.log(`No se encontraron características para la propiedad con ID: ${propiedad.idPropiedad}`, error);
          setCaracteristicasPropiedad([]);
          return;
        }

        // 2. Obtener el catálogo completo
        const catalogoResponse = await InmobiliariaApi.catalogoCaracteristicaController
          .getCatalogoCaracteristicaList({ page: 1, perPage: 1000 }); // Asegurar que traiga todos los registros
          
        if (!catalogoResponse?.data || !Array.isArray(catalogoResponse.data)) {
          console.error('Error: Formato de catálogo de características inválido');
          return;
        }

        // 3. Mapear los datos
        const caracteristicasConDetalle = caracteristicas
          .filter((caract): caract is CaracteristicaPropiedad => 
            !!caract.idCatalogoCaracteristicas
          )
          .map((caract: CaracteristicaPropiedad) => {
            const detalle = catalogoResponse.data.find((cat: CatalogoCaracteristica) => 
              cat.idCatalogoCaracteristicas === caract.idCatalogoCaracteristicas
            );
            
            if (!detalle) {
              console.warn(`No se encontró el detalle para la característica con ID: ${caract.idCatalogoCaracteristicas}`);
              return null;
            }

            return {
              ...caract,
              nombre: detalle.nombre || `Característica #${caract.idCatalogoCaracteristicas}`,
              descripcion: detalle.descripcion || '',
              activo: detalle.activo ?? true
            };
          })
          .filter((caract): caract is CaracteristicaPropiedad & { 
            nombre: string; 
            descripcion: string; 
            activo: boolean 
          } => caract !== null);

        setCaracteristicasPropiedad(caracteristicasConDetalle);
      } catch (error) {
        console.error('Error al cargar características:', error);
        setCaracteristicasPropiedad([]);
      } finally {
        setIsLoadingCaracteristicas(false);
      }
    }, [propiedad.idPropiedad]);

    // Cargar datos relacionados al montar el componente
    useEffect(() => {
        const fetchRelatedData = async () => {
            try {
                const [proyectosResponse, tiposPropiedadResponse, estadosPropiedadResponse] = await Promise.all([
                    InmobiliariaApi.proyectoController.getProyectoList(),
                    InmobiliariaApi.tipoPropiedadController.getTipoPropiedadList(),
                    InmobiliariaApi.estadoPropiedadController.getEstadoPropiedadList()
                ]);
                
                // Validar y procesar proyectos
                if (proyectosResponse?.data && Array.isArray(proyectosResponse.data)) {
                    const proyecto = proyectosResponse.data.find(
                        (p: Proyecto) => p.idProyectoInmobiliario === propiedad.idProyectoInmobiliario
                    );
                    if (proyecto) {
                        setProyectoNombre(proyecto.nombre);
                    }
                } else {
                    console.warn('Formato de respuesta de proyectos inesperado:', proyectosResponse);
                }
                
                // Validar y procesar tipos de propiedad
                if (propiedad.idTiposPropiedad) {
                    if (tiposPropiedadResponse?.data && Array.isArray(tiposPropiedadResponse.data)) {
                        const tipoObj = tiposPropiedadResponse.data.find((t: TipoPropiedad) => 
                            t.idTiposPropiedad === propiedad.idTiposPropiedad ||
                            (t as any).id === propiedad.idTiposPropiedad
                        );
                        if (tipoObj?.nombre) {
                            setTipoPropiedad(tipoObj.nombre);
                        } else {
                            console.warn('No se encontró el tipo de propiedad con ID:', propiedad.idTiposPropiedad);
                        }
                    } else {
                        console.warn('Formato de respuesta de tipos de propiedad inesperado:', tiposPropiedadResponse);
                    }
                }
                
                // Validar y procesar estados de propiedad
                if (propiedad.idEstadoPropiedad) {
                    if (estadosPropiedadResponse?.data && Array.isArray(estadosPropiedadResponse.data)) {
                        const estadoObj = estadosPropiedadResponse.data.find((e: EstadoPropiedad) => 
                            e.idEstadoPropiedad === propiedad.idEstadoPropiedad ||
                            (e as any).id === propiedad.idEstadoPropiedad
                        );
                        if (estadoObj?.nombre) {
                            setEstadoPropiedad(estadoObj.nombre);
                        } else {
                            console.warn('No se encontró el estado de propiedad con ID:', propiedad.idEstadoPropiedad);
                        }
                    } else {
                        console.warn('Formato de respuesta de estados de propiedad inesperado:', estadosPropiedadResponse);
                    }
                }
                
            } catch (error) {
                console.error('Error al cargar datos relacionados:', error);
                // Opcional: Mostrar notificación al usuario
                // toast.error('Error al cargar información adicional de la propiedad');
            }
        };

        fetchRelatedData();
        fetchCaracteristicas(); // Solo llamamos a fetchCaracteristicas una vez
    }, [propiedad.idProyectoInmobiliario, propiedad.idTiposPropiedad, propiedad.idEstadoPropiedad]);
    
    const mainInfoItems: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [];
    // Función para formatear el precio como moneda peruana
    const formatPrecio = (precio: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2
        }).format(precio);
    };
    
    const informacionContent = (
        <div className={styles.infoGroup}>
            
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Home className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Nombre:</span>
                    <span className={styles.infoCardValue}>{propiedad.nombre}</span>
                </div>
            </div>

            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Building2 className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Proyecto Inmobiliario:</span>
                    <span className={styles.infoCardValue}>{proyectoNombre}</span>
                </div>
            </div>

            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <SquareChevronRight className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Código Propiedad:</span>
                    <span className={styles.infoCardValue}>{propiedad.codigoPropiedad}</span>
                </div>
            </div>

            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <MapPinHouse className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Tipo Propiedad:</span>
                    <span className={styles.infoCardValue}>{tipoPropiedad}</span>
                </div>
            </div>

            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <MapPinned className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Dirección:</span>
                    <span className={styles.infoCardValue}>{propiedad.direccion}</span>
                </div>
            </div>

            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Tag className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Estado Propiedad:</span>
                    <span className={styles.infoCardValue}>{estadoPropiedad}</span>
                </div>
            </div>
            
        </div>
    );
    
    // Contenido de la sección de características
    const caracteristicasContent = (
        <div className={styles.infoGroup}>

            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Ruler className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Área:</span>
                    <span className={styles.infoCardValue}>{propiedad.areaM2} m²</span>
                </div>
            </div>
            
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Building2 className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Pisos:</span>
                    <span className={styles.infoCardValue}>{propiedad.piso}</span>
                </div>
            </div>
            
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <BedDouble className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Habitaciones:</span>
                    <span className={styles.infoCardValue}>{propiedad.numeroHabitaciones}</span>
                </div>
            </div>
            
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Bath className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Baños:</span>
                    <span className={styles.infoCardValue}>{propiedad.numeroBanos}</span>
                </div>
            </div>
            
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Car className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Estacionamiento:</span>
                    <span className={styles.infoCardValue}>
                        {propiedad.estacionamiento ? "Sí" : "No"}
                    </span>
                </div>
            </div>
            
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <DollarSign className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Precio:</span>
                    <span className={styles.infoCardValue}>{formatPrecio(propiedad.precio)}</span>
                </div>
            </div>
        </div>
    );
    
    
    
    // Contenido de la sección de características extendidas
    const caracteristicasExtendidasContent = (
        <div className={styles.caracteristicasContainer}>
            {isLoadingCaracteristicas ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                </div>
            ) : (
                <>
                    {caracteristicasPropiedad.length > 0 ? (
                        <div className={styles.infoGroupLarge}>
                            {caracteristicasPropiedad.map((caracteristica, index) => (
                                <div key={index} className={styles.caracteristicaCard}>
                                    <div className={styles.caracteristicaIconWrapper}>
                                        <Box className={styles.caracteristicaIcon} />
                                    </div>
                                    <div className={styles.caracteristicaContent}>
                                        <span className={styles.caracteristicaTitle}>{caracteristica.nombre}:</span>
                                        <p className={styles.caracteristicaValue}>
                                            {caracteristica.valor || 'Sin valor'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <Info className={styles.emptyStateIcon} />
                            <p className={styles.emptyStateText}>No hay características adicionales asignadas.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    const galeriaContent = (
        <div className={styles.galleryWrapper}>
            <PropiedadesGaleria idPropiedad={propiedad.idPropiedad} />
        </div>
    );

    const descripcionContent = (
        <div className={styles.descripcionContainer}>
            <p className={styles.descripcionText}>
                {propiedad.descripcion || "No hay descripción disponible para esta propiedad."}
            </p>
        </div>
    );

    // Definición de las secciones para el componente genérico
    const mainSections = [
        {
            title: "Galería de Imágenes",
            icon: <Image className={styles.sectionIcon} />,
            content: galeriaContent,
            className: "lg:col-span-2"
        },
        {
            title: "Descripción de la Propiedad",
            icon: <FileText className={styles.sectionIcon} />,
            content: descripcionContent,
            className: "lg:col-span-2"
        },
        {
            title: "Información",
            icon: <Building2 className={styles.sectionIcon} />,
            content: informacionContent,
        },
        {
            title: "Características",
            icon: <Tag className={styles.sectionIcon} />,
            content: caracteristicasContent,
        },
        {
            title: "Características Adicionales",
            icon: <Box className={styles.sectionIcon} />,
            content: caracteristicasExtendidasContent,
            className: "lg:col-span-3" // Ocupa todo el ancho
        }
    ];
    
    return (
        <>
            <EntityDetailView
                title="Detalles de la Propiedad"
                titleIcon={<Home className={styles.sectionIcon} />}
                mainInfoItems={mainInfoItems}
                sections={mainSections}
                fullWidthContent={null}
            />
            
            {propiedad.idPropiedad && (
                <PropiedadCaracteristicasModal
                    propiedadId={propiedad.idPropiedad}
                    open={caracteristicasModalOpen}
                    onClose={() => {
                        setCaracteristicasModalOpen(false);
                        fetchCaracteristicas();
                    }}
                />
            )}
        </>
    );
}
