import { google } from 'googleapis';

let sheetsClientInstance: ReturnType<typeof google.sheets> | null = null;

/**
 * Retorna un cliente singleton autenticado de Google Sheets API
 * mediante Cuenta de Servicio (Service Account) con JWT.
 */
/**
 * Normaliza y repara la clave privada PEM eliminando comillas accidentales,
 * corrigiendo saltos de línea escapados (\n) o reales, y asegurando
 * compatibilidad total con OpenSSL 3.0 / Node.js crypto.
 */
export function formatPrivateKey(rawKey: string): string {
  if (!rawKey) return '';
  let key = rawKey.trim();

  // 1. Quitar comillas exteriores ("..." o '...') si se pegó directamente desde un JSON o en Vercel
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  // 2. Soporte si la clave se guardó codificada en Base64
  if (!key.includes('BEGIN PRIVATE KEY') && !key.includes('-----')) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf8');
      if (decoded.includes('BEGIN PRIVATE KEY')) {
        key = decoded.trim();
      }
    } catch {
      // no es base64
    }
  }

  // 3. Normalizar todos los tipos de saltos de línea
  key = key
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');

  // 4. Asegurar formato estándar de cabeceras PEM
  key = key
    .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
    .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');

  // 5. Limpiar saltos de línea repetidos
  key = key.replace(/\n\s*\n/g, '\n').trim();

  return key;
}

export async function getGoogleSheetsClient() {
  if (sheetsClientInstance) {
    return sheetsClientInstance;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = formatPrivateKey(rawKey);

  if (!email || !privateKey) {
    throw new Error(
      'Faltan configurar las credenciales GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY en las variables de entorno.'
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClientInstance = google.sheets({ version: 'v4', auth });
  return sheetsClientInstance;
}

export function getTargetSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) {
    throw new Error('GOOGLE_SHEET_ID no está configurado en las variables de entorno.');
  }
  return id;
}
