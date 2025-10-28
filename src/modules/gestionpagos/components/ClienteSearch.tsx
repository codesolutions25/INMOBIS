import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Persona } from "@/types/persona";

interface ClienteSearchProps {
  searchTerm: string;
  searchResults: Persona[];
  isSearching: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onSelectClient: (client: Persona) => void;
  selectedClient: Persona | null;
}

export function ClienteSearch({
  searchTerm,
  searchResults,
  isSearching,
  onSearchChange,
  onSearch,
  onClearSearch,
  onSelectClient,
  selectedClient,
}: ClienteSearchProps) {
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    onSearch();
    setShowResults(true);
  };

  const handleSelectClient = (client: Persona) => {
    onSelectClient(client);
    setShowResults(false);
  };

  const handleClearSelection = () => {
    onSelectClient(null as any);
    onClearSearch();
    setShowResults(false);
  };
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por documento o nombre..."
          className="pl-9 w-full"
          value={searchTerm}
          onChange={onSearchChange}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
      </div>

      {isSearching ? (
        <div className="text-center p-4 text-sm text-muted-foreground">
          Buscando clientes...
        </div>
      ) : searchResults.length > 0 ? (
        <div className="border rounded-md divide-y">
          {searchResults.map((cliente) => (
            <div 
              key={cliente.idPersona}
              className={cn(
                "p-3 hover:bg-accent cursor-pointer flex items-center space-x-3",
                selectedClient?.idPersona === cliente.idPersona && "bg-accent"
              )}
              onClick={() => handleSelectClient(cliente)}
            >
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {cliente.numeroDocumento}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : searchTerm ? (
        <div className="text-center p-4 text-sm text-muted-foreground">
          No se encontraron clientes
        </div>
      ) : null}

      {selectedClient && (
        <div className="border rounded-md p-3 bg-accent/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">
                {selectedClient.nombre} {selectedClient.apellidoPaterno} {selectedClient.apellidoMaterno}
              </h4>
              <p className="text-xs text-muted-foreground">
                {selectedClient.numeroDocumento}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Limpiar selección</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
