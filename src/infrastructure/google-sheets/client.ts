import { google } from 'googleapis';

let sheetsClientInstance: ReturnType<typeof google.sheets> | null = null;

/**
 * Retorna un cliente singleton autenticado de Google Sheets API
 * mediante Cuenta de Servicio (Service Account) con JWT.
 */
export async function getGoogleSheetsClient() {
  if (sheetsClientInstance) {
    return sheetsClientInstance;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Reemplazo de saltos de línea literales en la clave privada RSA
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = rawKey.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    // Si aún no se configuran credenciales en el .env.local, provee advertencia detallada
    throw new Error(
      'Faltan configurar las credenciales GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY en .env.local'
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
