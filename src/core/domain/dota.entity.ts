export interface DotaAgent {
  correo: string;
  usuario: string;
  dni: string;
  campania: string;
  origenContacto?: string;
  nombre: string;
  correoSupervisor: string;
  correoCoordinador: string;
}

export interface DotaHierarchyResponse {
  isSupervisor: boolean;
  isCoordinador: boolean;
  supervisorEmail: string;
  agentes: DotaAgent[];
}
