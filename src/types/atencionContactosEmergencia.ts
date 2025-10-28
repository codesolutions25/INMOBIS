import { Persona } from "./persona";

export type AtencionContactoEmergencia = {
  idAtencionContactoEmergencia: number;
  idPersonaAtencion: number;
  idPersonaContactoEmergencia: number;
  personaContactoEmergencia?: Persona; // Incluirá los detalles de la persona de contacto
}
