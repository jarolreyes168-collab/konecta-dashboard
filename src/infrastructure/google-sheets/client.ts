import { google } from 'googleapis';
import { getAppsScriptSheetsClient } from './apps-script-client';

let sheetsClientInstance: any = null;

/**
 * Normaliza y repara la clave privada PEM eliminando comillas accidentales,
 * corrigiendo saltos de línea escapados (\n) o reales, auto-envolviendo en cabeceras
 * si se pegó solo el cuerpo Base64 sin cabeceras, extrayendo el contenido de un JSON
 * completo si se pegó el archivo entero, y formateando en bloques de 64 caracteres
 * estándar para compatibilidad total con OpenSSL 3.0 / Node.js crypto.
 */
export function formatPrivateKey(rawKey: string): string {
  if (!rawKey) return '';
  let key = rawKey.trim();

  // 1. Caso: Se pegó el archivo JSON completo en la variable
  if (key.startsWith('{') && key.endsWith('}')) {
    try {
      const parsed = JSON.parse(key);
      if (parsed.private_key) {
        key = String(parsed.private_key).trim();
      }
    } catch {
      // no era json válido
    }
  }

  // 2. Quitar comillas exteriores repetidas
  while ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  // 3. Reemplazar todas las variantes de \n literales escapadas (\\n, \r\n, \\\\n, etc.)
  key = key.replace(/\\+r/g, '\r').replace(/\\+n/g, '\n');

  // 4. Si NO tiene BEGIN pero tiene más de 100 caracteres (cuerpo Base64 puro sin cabeceras)
  if (!key.includes('BEGIN')) {
    const cleanOnly = key.replace(/[\s\r\n]+/g, '');
    const chunks = cleanOnly.match(/.{1,64}/g) || [cleanOnly];
    return `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
  }

  // 5. Detectar tipo exacto de cabecera PEM
  let header = '-----BEGIN PRIVATE KEY-----';
  let footer = '-----END PRIVATE KEY-----';

  if (key.includes('BEGIN RSA PRIVATE KEY')) {
    header = '-----BEGIN RSA PRIVATE KEY-----';
    footer = '-----END RSA PRIVATE KEY-----';
  } else if (key.includes('BEGIN ENCRYPTED PRIVATE KEY')) {
    header = '-----BEGIN ENCRYPTED PRIVATE KEY-----';
    footer = '-----END ENCRYPTED PRIVATE KEY-----';
  }

  // 6. Si tiene cabeceras, extraer y purificar el cuerpo Base64
  const startIndex = key.indexOf(header) + header.length;
  const endIndex = key.indexOf(footer);
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const body = key.slice(startIndex, endIndex);
    const cleanBody = body.replace(/[\s\r\n]+/g, '');
    const chunks = cleanBody.match(/.{1,64}/g) || [cleanBody];
    return `${header}\n${chunks.join('\n')}\n${footer}\n`;
  }

  return key;
}

/**
 * Retorna el cliente de Google Sheets:
 * 1. Si GOOGLE_APPS_SCRIPT_URL está definido, usa el puente Apps Script Webhook.
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

  let email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';

  // Si se pegó el JSON entero en GOOGLE_PRIVATE_KEY, extraer automáticamente también el client_email
  if (rawKey.startsWith('{') && rawKey.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawKey);
      if (parsed.client_email && !email) {
        email = parsed.client_email.trim();
      }
    } catch {
      // ignore
    }
  }

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
