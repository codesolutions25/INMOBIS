import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/search/SearchBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Persona } from "@/types/persona";
import { Usuario } from "@/types/usuarios";
import { UsuarioEmpresa } from "@/types/usuarioEmpresa";

type UsuarioUnion = Usuario | UsuarioEmpresa;

// Type guards
const isUsuario = (user: UsuarioUnion): user is Usuario => {
  return 'idUsuario' in user && 'idPersona' in user;
};

const isUsuarioEmpresa = (user: UsuarioUnion): user is UsuarioEmpresa => {
  return 'id' in user && 'id_persona' in user;
};

interface UserListSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredPersonas: Persona[];
  selectedPerson: Persona | null;
  usuarios: UsuarioUnion[];
  onPersonSelect: (persona: Persona) => void;
}

export function UserListSidebar({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  filteredPersonas,
  selectedPerson,
  usuarios,
  onPersonSelect,
}: UserListSidebarProps) {
  return (
    <div className="w-80 border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Lista de Personas</h2>
        <Tabs
          value={activeTab}
          onValueChange={onTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-2">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            placeholder="Buscar persona..."
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)] pr-2">
        <div className="space-y-1">
          {filteredPersonas.length > 0 ? (
            filteredPersonas.map((persona) => (
              <div
                key={persona.idPersona}
                className={cn(
                  "p-3 rounded-md cursor-pointer hover:bg-accent",
                  selectedPerson?.idPersona === persona.idPersona && "bg-accent"
                )}
                onClick={() => onPersonSelect(persona)}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium">
                    {persona.nombre} {persona.apellidoPaterno} {persona.apellidoMaterno || ''}
                  </div>
                  {usuarios.some(u => {
                    const idPersona = isUsuario(u) ? u.idPersona : u.id_persona;
                    return idPersona === persona.idPersona;
                  }) && (
                    <div className="flex space-x-2">
                      {usuarios.some(u => {
                        const idPersona = isUsuario(u) ? u.idPersona : u.id_persona;
                        return idPersona === persona.idPersona && isUsuario(u) && u.esSuperAdmin;
                      }) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      )}
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2",
                        usuarios.find(u => {
                          const idPersona = isUsuario(u) ? u.idPersona : u.id_persona;
                          return idPersona === persona.idPersona && isUsuario(u) && u.esSuperAdmin;
                        }) ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                      )}>
                        {usuarios.some(u => {
                          const idPersona = isUsuario(u) ? u.idPersona : u.id_persona;
                          return idPersona === persona.idPersona && isUsuario(u) && u.esSuperAdmin;
                        }) ? 'Admin' : 'Usuario'}
                      </span>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        usuarios.some(u => {
                          const idPersona = isUsuario(u) ? u.idPersona : u.id_persona;
                          return idPersona === persona.idPersona && (isUsuario(u) ? u.estaActivo : true);
                        }) ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      )}>
                        {usuarios.some(u => {
                          const idPersona = isUsuario(u) ? u.idPersona : u.id_persona;
                          return idPersona === persona.idPersona && (isUsuario(u) ? u.estaActivo : true);
                        }) ? 'Activo' : 'Inactivo'}
                      </span>
                      {activeTab === 'company' && usuarios.some(u => ('id_persona' in u && u.id_persona === persona.idPersona) || ('idPersona' in u && u.idPersona === persona.idPersona)) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Empresa
                        </span>
                      )}
                      {activeTab === 'system' && usuarios.some(u => ('idPersona' in u && u.idPersona === persona.idPersona) || ('id_persona' in u && u.id_persona === persona.idPersona && !('id_empresa' in u))) && (
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
  );
}
