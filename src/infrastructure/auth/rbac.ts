import { UserRole } from '@/core/domain/consolidado.entity';
import { QueryFilter } from '@/core/ports/data-repository.port';

// Extraídos de Codigo.gs.txt y AdminPanel.gs.txt
export const CORREOS_COORDINADORES = [
  'jarol.reyes@konecta.com',
  'monica.modesto@konecta.com',
  'u77115341@konecta.com',
  'ysabel.casas@konecta.com',
  'fabricio.rojas@konecta.com',
  'ricardo.quispe@konecta.com',
  'u46955750@konecta.com',
  'u70148872@konecta.com',
  'omar.torres@konecta.com',
  'u73801699@konecta.com',
  'u75932429@konecta.com',
  'vanessa.chuquinaupa@konecta.com',
  'adallarosa@konecta.com',
  'estefanny.rodriguez@konecta.com',
  'ana.torres.mosquera@konecta.com',
  'u5447675@konecta.com',
  'vanessa.torres@konecta.com',
  'cesar.bejarano@konecta.com',
];

export const CORREOS_SUPERVISORES = [
  'bo.app@konecta.com',
  'u40147813@konecta.com',
  'ronild.arevalo@konecta.com',
  'u73038855@konecta.com',
  'rolando.estrada@konecta.com',
  'u48180648@konecta.com',
  'liderespostpago@konecta.com',
  'efrain.huaman@konecta.com',
  'carlos.bazan@konecta.com',
  'u70782979@konecta.com',
  'lourdes.ruiz@konecta.com',
  'luis.veramatos@konecta.com',
  'milagros.melgarejo.esquivel@konecta.com',
  'cynthia.gamarra@konecta.com',
  'keren.arrioja@konecta.com',
  'daniel.manrique@konecta.com',
  'anadela.vega@konecta.com',
  'u77213252@konecta.com',
];

export function resolveUserRole(email: string): UserRole {
  const norm = email.toLowerCase().trim();
  if (norm === 'jarol.reyes@konecta.com') return 'ADMIN';
  if (CORREOS_COORDINADORES.includes(norm)) return 'COORDINADOR';
  if (CORREOS_SUPERVISORES.includes(norm)) return 'SUPERVISOR';
  return 'AGENTE';
}

export function getRoleBasedFilters(role: UserRole, userEmail: string): QueryFilter[] {
  const norm = userEmail.toLowerCase().trim();

  switch (role) {
    case 'ADMIN':
    case 'COORDINADOR':
      // Coordinación y Administración tienen visibilidad total de la base
      return [];
    case 'SUPERVISOR':
      // El supervisor visualiza únicamente a su equipo directo
      return [{ field: 'correoSupervisor', operator: 'eq', value: norm }];
    case 'AGENTE':
    default:
      // El asesor estándar visualiza únicamente sus propias transacciones
      return [{ field: 'correoAgente', operator: 'eq', value: norm }];
  }
}
