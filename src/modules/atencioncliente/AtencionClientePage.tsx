"use client"

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AtencionList, { AtencionListRef } from "./AtencionList";
import ClienteAtencionesList from "./ClienteAtencionesList";
import AtencionForm from "./AtencionForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAlert } from "@/contexts/AlertContext";

export default function AtencionClientePage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const atencionListRef = useRef<AtencionListRef>(null);
  
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [tipoAtencion, setTipoAtencion] = useState<'consulta' | 'reclamo'>('consulta');
  const [showClientList, setShowClientList] = useState(true);

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setShowClientList(false);
  };

  const handleBackToList = () => {
    setShowClientList(true);
    setShowForm(false);
  };

  const handleNuevaConsulta = () => {
    setTipoAtencion('consulta');
    setShowForm(true);
  };

  const handleNuevoReclamo = () => {
    setTipoAtencion('reclamo');
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    showAlert("success", "Éxito", `${tipoAtencion === 'consulta' ? 'Consulta registrada' : 'Reclamo registrado'} correctamente`);
    if (atencionListRef.current) {
      atencionListRef.current.refresh();
    }
  };

  const handleOpenClientModal = () => {
    showAlert("info", "Información", "Funcionalidad de registro de cliente en desarrollo");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Atención al Cliente</h1>
        {!showClientList && (
          <Button onClick={handleBackToList} variant="outline">
            Volver a Lista de Clientes
          </Button>
        )}
      </div>

      {showClientList ? (
        <AtencionList 
          ref={atencionListRef}
          onOpenModal={handleOpenClientModal} 
          onClientSelect={handleClientSelect}
        />
      ) : (
        <div className="space-y-6">
          {selectedClient && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Datos del Cliente</h2>
                  <p><strong>Nombre:</strong> {selectedClient.nombres} {selectedClient.apellidos}</p>
                  <p><strong>DNI:</strong> {selectedClient.numeroDocumento}</p>
                  <p><strong>Teléfono:</strong> {selectedClient.telefono || 'No registrado'}</p>
                  <p><strong>Email:</strong> {selectedClient.email || 'No registrado'}</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Información Adicional</h2>
                  <p><strong>Dirección:</strong> {selectedClient.direccion || 'No registrada'}</p>
                  <p><strong>Fecha de Registro:</strong> {selectedClient.fechaRegistro || 'No disponible'}</p>
                </div>
              </div>
            </Card>
          )}

          {showForm ? (
            <AtencionForm 
              tipoAtencion={tipoAtencion}
              personaId={selectedClient?.id}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <ClienteAtencionesList 
              personaId={selectedClient?.id}
              onNuevaConsulta={handleNuevaConsulta}
              onNuevoReclamo={handleNuevoReclamo}
            />
          )}
        </div>
      )}
    </div>
  );
}
