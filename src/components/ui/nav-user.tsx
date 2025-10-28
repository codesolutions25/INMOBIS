import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from 'next/navigation';
import React from 'react';
import { useState, useEffect } from 'react';
import { UsuarioPerfilModal } from '@/modules/usuarioPerfil/usuarioPerfilModal'
import { getPersona } from '@/services/apiPersona';
import { useAlert } from '@/contexts/AlertContext';
import { useCompany } from '@/contexts/CompanyContext';
import type { Persona } from '@/types/persona';
import type { User } from '@/types/userData';

interface NavUserProps {
  user: User;
  persona?: Persona;
}

export function NavUser({ user, persona }: NavUserProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [openPerfil, setOpenPerfil] = useState(false);
  const [personaData, setPersonaData] = useState<Persona | null>(null);
  const [cargandoPersona, setCargandoPersona] = useState(false);
  const { showAlert } = useAlert();
  const { selectedCompany } = useCompany();
  const [dropdownKey, setDropdownKey] = React.useState(0);

  React.useEffect(() => {
    if (!openPerfil) {
      setDropdownKey(prev => prev + 1);
    }
  }, [openPerfil]);

  // Limpiar personaData cuando cambia el usuario
  useEffect(() => {
    // Limpiar datos anteriores cuando cambia el usuario
    setPersonaData(null);
    setCargandoPersona(false);
  }, [user?.id]);

  useEffect(() => {
    const cargarPersona = async () => {
      // Si ya tenemos personaData o no hay user.idPersona, no cargar
      if (!user?.idPersona || personaData) {
        return;
      }

      try {
        setCargandoPersona(true);
        const data = await getPersona(user.idPersona);
        setPersonaData(data);
      } catch (error) {
        showAlert('error', 'Error', 'No se pudieron cargar los datos del perfil');
      } finally {
        setCargandoPersona(false);
      }
    };

    // Solo cargar si no tenemos personaData y tenemos idPersona
    if (user?.idPersona && !personaData && !cargandoPersona) {
      cargarPersona();
    }
  }, [user?.idPersona, persona, showAlert, personaData, cargandoPersona]);

  // Crear persona a partir de datos del usuario si no hay persona cargada
  useEffect(() => {
    if (user && !personaData && !cargandoPersona) {
      // Si el usuario tiene los campos de persona directamente, crear un objeto persona
      if (user.nombre && user.apellidoPaterno) {
        const personaFromUser: Persona = {
          idPersona: user.idPersona || 0,
          nombre: user.nombre,
          apellidoPaterno: user.apellidoPaterno,
          apellidoMaterno: user.apellidoMaterno || '',
          idTipoGenero: user.genero ? Number(user.genero) : 0,
          idTipoDocumento: 1, // Valor por defecto, ajustar según sea necesario
          numeroDocumento: user.numeroDocumento || '',
          telefonoPrincipal: user.telefonoPrincipal || '',
          telefonoSecundario: user.telefonoSecundario || '',
          direccion: user.direccion || '',
          fechaNacimiento: user.fechaNacimiento || new Date().toISOString().split('T')[0],
          correoElectronico: user.email || ''
        };
        setPersonaData(personaFromUser);
      }
    }
  }, [user, personaData, cargandoPersona]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      // Error silencioso - el contexto ya maneja los errores
    }
  };

  // Get initials from name
  const getInitials = () => {
    if (personaData?.nombre && personaData?.apellidoPaterno) {
      return `${personaData.nombre[0]}${personaData.apellidoPaterno[0]}`.toUpperCase();
    } else if (user.nombre && user.apellidoPaterno) {
      return `${user.nombre[0]}${user.apellidoPaterno[0]}`.toUpperCase();
    } else if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'US';
  };





  // Escuchar eventos de actualización del perfil de usuario
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      const { userId, personaData } = event.detail;
      if (userId === user?.id) {

        // Actualizar el estado local del usuario
        setPersonaData(personaData);

        // Actualizar el usuario en el contexto si es necesario
        if (typeof window !== 'undefined') {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...currentUser,
            telefonoPrincipal: personaData.telefonoPrincipal,
            email: personaData.correoElectronico,
            direccion: personaData.direccion
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);

      return () => {
        window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
      };
    }
  }, [user?.id]);

  // Renderizar el modal de perfil de usuario
  const renderProfileModal = () => {
    // Convertir personaData de Persona | null a Persona | undefined
    const persona = personaData || undefined;

    // Convertir selectedCompany de Empresa | null a Empresa | undefined
    const empresa = selectedCompany || undefined;

    return (
      <UsuarioPerfilModal
        key={`user-${user?.id}-${personaData?.idPersona}`} // Forzar recreación cuando cambie el ID
        open={openPerfil}
        onOpenChange={setOpenPerfil}
        user={{
          ...user,
          idPersona: user.idPersona || personaData?.idPersona // Asegurar que idPersona se pase correctamente
        }}
        persona={persona}
        empresa={empresa}
      />
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer">
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Menú de usuario"
              asChild
            >
              <div>
                <Avatar className="h-8 w-8 border border-gray-200">
                  <AvatarImage
                    src={user.avatar}
                    alt={`${user.nombre} ${user.apellidoPaterno}`}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-md border border-gray-200 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-gray-700 dark:bg-gray-800 z-[100]"
          align="end"
          sideOffset={8}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {personaData ?
                  `${personaData.nombre} ${personaData.apellidoPaterno} ${personaData.apellidoMaterno || ''}`.trim() :
                  user.nombre ?
                  `${user.nombre} ${user.apellidoPaterno || ''} ${user.apellidoMaterno || ''}`.trim() :
                  user.username
                }
              </p>
              {user.username && (
                <p className="text-xs leading-none text-muted-foreground">
                  @{user.username}
                </p>
              )}
              {(user.tipo_usuario || user.role) && (
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {user.tipo_usuario === 'regular' ? 'Administrador' : user.tipo_usuario || user.role?.toLowerCase()}
                </p>
              )}
              {user.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
              onSelect={() => { setOpenPerfil(true); }}
            >
              <button>Perfil</button>
              <DropdownMenuShortcut>Alt+P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20" onClick={handleLogout}>
            Cerrar sesión
            <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openPerfil && user && (
        <UsuarioPerfilModal
          open={openPerfil}
          onOpenChange={setOpenPerfil}
          user={user as any}
          persona={personaData || persona || undefined}
          empresa={selectedCompany as any}
        />
      )}
    </>
  )
}
