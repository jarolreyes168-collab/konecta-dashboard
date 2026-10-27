import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { formatPrivateKey } from '@/infrastructure/google-sheets/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const sheetId = process.env.GOOGLE_SHEET_ID || '';

  const formatted = formatPrivateKey(rawKey);

  let cryptoStatus = 'not_tested';
  let cryptoError = '';

  try {
    crypto.createPrivateKey(formatted);
    cryptoStatus = 'valid_pem_key_accepted_by_openssl';
  } catch (err: any) {
    cryptoStatus = 'failed';
    cryptoError = err.message || String(err);
  }

  return NextResponse.json({
    emailPresent: !!email,
    emailPrefix: email ? email.slice(0, 10) + '...' + email.slice(-15) : 'EMPTY',
    sheetIdPresent: !!sheetId,
    sheetId: sheetId,
    rawKeyLength: rawKey.length,
    rawKeyPreviewStart: rawKey.slice(0, 35),
    rawKeyPreviewEnd: rawKey.slice(-35),
    rawKeyIncludesBegin: rawKey.includes('BEGIN'),
    rawKeyIncludesEnd: rawKey.includes('END'),
    formattedKeyLength: formatted.length,
    formattedKeyPreviewStart: formatted.slice(0, 35),
    formattedKeyPreviewEnd: formatted.slice(-35),
    cryptoStatus,
    cryptoError,
  });
}
