/**
 * Sanitiza valores antes de escribirlos en Google Sheets o exportar a Excel.
 * Evita la vulnerabilidad de Formula Injection (CSV / Spreadsheet Injection)
 * si un valor de usuario comienza con '=', '+', '-', '@' o tabulaciones.
 */
export function sanitizeForSpreadsheet(val: unknown, maxLength = 500): string {
  if (val === null || val === undefined) return '';
  let str = String(val).replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLength);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}
