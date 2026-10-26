import { z } from 'zod';

export const ConsolidadoMutationSchema = z.object({
  representante: z.string().min(2, 'El nombre del representante es obligatorio'),
  correoAgente: z.string().email('Correo de agente inválido'),
  correoSupervisor: z.string().email('Correo de supervisor inválido'),
  coordinador: z.string().min(2, 'El coordinador es requerido'),
  campania: z.string().min(1, 'La campaña es requerida'),
  tipoGestion: z.enum(['PICK_UP', 'DELIVERY', 'TERMINALES', 'ACCESORIOS', 'EQUIPOS']),
  estado: z.enum(['PENDIENTE', 'CONTACTADO', 'VENTA', 'NO_DESEA', 'RECHAZADO']),
  dniCliente: z.string().regex(/^\d{8,12}$/, 'DNI debe contener entre 8 y 12 dígitos numéricos'),
  telefonoCliente: z.string().min(7, 'Teléfono debe tener al menos 7 dígitos'),
  observaciones: z.string().max(500).optional(),
  imagenEquipo: z.string().url().optional().or(z.literal('')),
});

export const BulkStatusUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'Selecciona al menos un registro'),
  nuevoEstado: z.enum(['PENDIENTE', 'CONTACTADO', 'VENTA', 'NO_DESEA', 'RECHAZADO']),
});

export type ConsolidadoMutationInput = z.infer<typeof ConsolidadoMutationSchema>;
