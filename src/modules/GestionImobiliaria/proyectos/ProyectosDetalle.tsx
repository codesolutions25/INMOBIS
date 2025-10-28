"use client"

import { Proyecto } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";
import { Home, MapPin, Tag, CalendarCheck2, CalendarMinus, Building2, FileText, Phone, Mail, MapPinned, Building, Image } from 'lucide-react';
import EntityDetailView from "@/components/detail/EntityDetailView";
import { formatDate } from "@/utils/dateUtils";
import { useEffect, useState } from "react";

import InmobiliariaApi from "@/modules/GestionImobiliaria/services/InmobiliariaApi";
import { Empresa } from "@/types/empresas";
import { Departamento, Provincia, Distrito, EstadoPropiedad } from "@/modules/GestionImobiliaria/models/inmobiliariaModels";

import ProyectoGaleria from "./ProyectoGaleria";
import styles from "./styles/ProyectosDetalle.module.css";
import { getEmpresas } from "@/services/apiEmpresa";

type ProyectosDetalleProps = {
    proyecto: Proyecto;
}

export default function ProyectosDetalle({ proyecto }: ProyectosDetalleProps) {
    // Estados para almacenar datos de ubicación y otros datos relacionados
    const [departamento, setDepartamento] = useState<string>("");
    const [provincia, setProvincia] = useState<string>("");
    const [distrito, setDistrito] = useState<string>("");
    const [empresa, setEmpresa] = useState<string>("");
    const [estadoPropiedad, setEstadoPropiedad] = useState<string>("");
    
    // Cargar datos relacionados al montar el componente
    useEffect(() => {
        const fetchRelatedData = async () => {
            if (!proyecto) return;
            
            try {
                // Cargar datos de ubicación
                const [departamentosData, provinciasData, distritosData, estadosPropiedadData] = await Promise.all([
                    InmobiliariaApi.ubicacionController.getDepartamentoList(),
                    InmobiliariaApi.ubicacionController.getProvinciaList(),
                    InmobiliariaApi.ubicacionController.getDistritoList(),
                    InmobiliariaApi.estadoPropiedadController.getEstadoPropiedadList()
                ]);
                
                // Cargar datos de empresa
                const empresasData = await getEmpresas();
                console.log('Datos recibidos:', {
                    distritosData,
                    provinciasData,
                    departamentosData,
                    proyecto
                  });
                
                // Encontrar el distrito seleccionado
                if (proyecto.idDistrito && distritosData?.data) {
                    const distritoObj = distritosData?.data.find((d: Distrito) => d.idDistrito === proyecto.idDistrito);
                    if (distritoObj) {
                        setDistrito(distritoObj.nombre);
                        
                        // Encontrar la provincia correspondiente
                        if (provinciasData?.data) {
                            const provinciaObj = provinciasData?.data.find((p: Provincia) => p.idProvincia === distritoObj.idProvincia);
                            if (provinciaObj) {
                                setProvincia(provinciaObj.nombre);
                                
                                // Encontrar el departamento correspondiente
                                if (departamentosData?.data) {
                                    const departamentoObj = departamentosData?.data.find(
                                        (d: Departamento) => d.idDepartamento === provinciaObj.idDepartamento
                                    );
                                    if (departamentoObj) {
                                        setDepartamento(departamentoObj.nombre);
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Encontrar la empresa
                if (proyecto.idEmpresa) {
                    const empresaObj = empresasData?.data.find((e: Empresa) => e.idEmpresa === proyecto.idEmpresa);
                    if (empresaObj) {
                        setEmpresa(empresaObj.razonSocial);
                    }
                }
                
                // Encontrar el estado de propiedad
                if (proyecto.idEstadoPropiedad && estadosPropiedadData?.data) {
                    const estadoPropiedadObj = estadosPropiedadData?.data.find(
                        (e: EstadoPropiedad) => e.idEstadoPropiedad === proyecto.idEstadoPropiedad
                    );
                    if (estadoPropiedadObj) {
                        setEstadoPropiedad(estadoPropiedadObj.nombre);
                    }
                }
            } catch (error) {
                console.error("Error al cargar datos relacionados:", error);
            }
        };
        
        fetchRelatedData();
    }, [proyecto]);
    // La información principal ahora se muestra en las secciones correspondientes
    const mainInfoItems: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [];

    const caracteristicasContent = (
        <div className={styles.infoGroup}>
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <CalendarCheck2 className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Fecha de inicio:</span>
                    <span className={styles.infoCardValue}>{formatDate(proyecto.fechaInicio)}</span>
                </div>
            </div>
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <CalendarMinus className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Fecha de fin:</span>
                    <span className={styles.infoCardValue}>{formatDate(proyecto.fechaFin)}</span>
                </div>
            </div>
        </div>
    )
    
    const InformacionContent = (
        <div className={styles.infoGroup}>
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Home className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Nombre del proyecto:</span>
                    <span className={styles.infoCardValue}>{proyecto.nombre}</span>
                </div>
            </div>
            
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Building className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Empresa:</span>
                    <span className={styles.infoCardValue}>{empresa || "No especificada"}</span>
                </div>
            </div>
            
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Tag className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Estado de propiedad:</span>
                    <span className={styles.infoCardValue}>{estadoPropiedad || "No especificado"}</span>
                </div>
            </div>
        </div>
    )

    // La descripción ahora está integrada en la sección de la galería
    
    const contactoContent = (
        <div className={styles.infoGroup}>
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Phone className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Teléfono:</span>
                    <span className={styles.infoCardValue}>
                        {proyecto.telefonoContacto || "No especificado"}
                    </span>
                </div>
            </div>
            <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                    <Mail className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Email:</span>
                    <span className={styles.infoCardValue}>
                        {proyecto.emailContacto || "No especificado"}
                    </span>
                </div>
            </div>
        </div>
    )
    
    // Sección de ubicación específica
    const ubicacionContent = (
        <div className={styles.locationGroup}>
            <div className={styles.locationCard}>
                <div className={styles.iconWrapper}>
                    <MapPin className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Departamento:</span>
                    <span className={styles.infoCardValue}>{departamento || "No especificado"}</span>
                </div>
            </div>
            <div className={styles.locationCard}>
                <div className={styles.iconWrapper}>
                    <MapPin className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Provincia:</span>
                    <span className={styles.infoCardValue}>{provincia || "No especificada"}</span>
                </div>
            </div>
            <div className={styles.locationCard}>
                <div className={styles.iconWrapper}>
                    <MapPin className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Distrito:</span>
                    <span className={styles.infoCardValue}>{distrito || "No especificado"}</span>
                </div>
            </div>
            <div className={styles.locationCard}>
                <div className={styles.iconWrapper}>
                    <MapPinned className={styles.infoCardIcon} />
                </div>
                <div className={styles.infoCardText}>
                    <span className={styles.infoCardLabel}>Dirección:</span>
                    <span className={styles.infoCardValue}>{proyecto.ubicacion || "No especificada"}</span>
                </div>
            </div>
        </div>
    )
    
    // Contenido para la galería
    const galeriaContent = (
        <div className={styles.galleryWrapper}>
            <ProyectoGaleria idProyecto={proyecto.idProyectoInmobiliario} />
        </div>
    );

    // Contenido para la descripción
    const descripcionContent = (
        <div className={styles.descriptionBox}>
            <p className={styles.descriptionParagraph}>
                {proyecto.descripcion || "No hay descripción disponible para este proyecto."}
            </p>
        </div>
    );

    // Reorganizamos las secciones
    const mainSections = [
        {
            title: "Galería de Imágenes",
            icon: <Image className={styles.sectionIcon} />,
            content: galeriaContent,
            className: "lg:col-span-2" // Columna izquierda
        },
        {
            title: "Descripción del Proyecto",
            icon: <FileText className={styles.sectionIcon} />,
            content: descripcionContent,
            className: "lg:col-span-2" // Columna izquierda
        },
        {
            title: "Información",
            icon: <Building2 className={styles.sectionIcon} />,
            content: InformacionContent, // Columna derecha
        },
        {
            title: "Contacto",
            icon: <Phone className={styles.sectionIcon} />,
            content: contactoContent, // Columna derecha
        },
        {
            title: "Características",
            icon: <Tag className={styles.sectionIcon} />,
            content: caracteristicasContent, // Columna derecha
        },
        {
            title: "Ubicación",
            icon: <MapPin className={styles.sectionIcon} />,
            content: ubicacionContent, // Columna derecha
        }
    ];

    return (
        <EntityDetailView
            title="Detalles del Proyecto"
            titleIcon={<Home className={styles.sectionIcon} />}
            mainInfoItems={mainInfoItems}
            sections={mainSections}
            fullWidthContent={null}
        />
    );
}
