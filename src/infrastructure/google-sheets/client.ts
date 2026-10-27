import { google } from 'googleapis';
import { getAppsScriptSheetsClient } from './apps-script-client';

let sheetsClientInstance: any = null;

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

/**
 * Retorna el cliente de Google Sheets:
 * 1. Si GOOGLE_APPS_SCRIPT_URL está definido, usa el puente Apps Script Webhook
 *    (evita bloqueos de seguridad / directivas de uso compartido corporativo de Konecta).
 * 2. Si no, usa autenticación JWT con Service Account de Google Cloud.
 */
export async function getGoogleSheetsClient() {
  if (sheetsClientInstance) {
    return sheetsClientInstance;
  }

  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  if (appsScriptUrl) {
    sheetsClientInstance = getAppsScriptSheetsClient(appsScriptUrl);
    return sheetsClientInstance;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = formatPrivateKey(rawKey);

  if (!email || !privateKey) {
    throw new Error(
      'Faltan configurar las credenciales: Define GOOGLE_APPS_SCRIPT_URL o (GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY).'
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
    if (process.env.GOOGLE_APPS_SCRIPT_URL) {
      return 'APPS_SCRIPT_ACTIVE_SHEET';
    }
    throw new Error('GOOGLE_SHEET_ID no está configurado en las variables de entorno.');
  }
  return id;
}
