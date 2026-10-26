export type AuditEventType =
  | 'LOGIN'
  | 'MODULO'
  | 'BUSQUEDA'
  | 'FILTRO'
  | 'FORMULARIO'
  | 'EXPORTACION'
  | 'ERROR';

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  fecha: string;
  hora: string;
  email: string;
  nombre: string;
  rol: string;
  evento: AuditEventType;
  modulo: string;
  detalle: string;
}
