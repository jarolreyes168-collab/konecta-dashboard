export type ManagementType = 'PICK_UP' | 'DELIVERY' | 'TERMINALES' | 'ACCESORIOS' | 'EQUIPOS';
export type ManagementStatus = 'PENDIENTE' | 'CONTACTADO' | 'VENTA' | 'NO_DESEA' | 'RECHAZADO';
export type UserRole = 'ADMIN' | 'COORDINADOR' | 'SUPERVISOR' | 'AGENTE';

export interface ConsolidadoRecord {
  id: string;                       // Identificador unívoco o fila de la hoja
  fecha: string;                    // YYYY-MM-DD
  hora: string;                     // HH:mm:ss
  representante: string;            // Nombre del agente / asesor
  correoAgente: string;             // Email del agente
  correoSupervisor: string;         // Email del supervisor directo
  coordinador: string;              // Nombre / correo de coordinación
  campania: string;                 // Campaña (Portabilidad, Postpago, etc.)
  tipoGestion: ManagementType;      // Pick Up, Delivery, etc.
  estado: ManagementStatus;         // Venta, Pendiente, Contactado, etc.
  dniCliente: string;
  telefonoCliente: string;
  observaciones?: string;
  imagenEquipo?: string;
}

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
  photoUrl?: string;
}
