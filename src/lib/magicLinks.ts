export function getBaseUrl(request?: Request): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return 'http://localhost:3000';
}

export function buildClientConfirmationUrl(rowIndex: number, request?: Request): string {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new Error('Missing CRON_SECRET in environment configuration.');
  }

  if (!Number.isInteger(rowIndex) || rowIndex < 2) {
    throw new Error(`Invalid row index for confirmation link: ${rowIndex}`);
  }

  const url = new URL('/api/confirmar', getBaseUrl(request));
  url.searchParams.set('fila', String(rowIndex));
  url.searchParams.set('clave', cronSecret);
  return url.toString();
}
