import { NextResponse } from 'next/server';
import { updateClientStatus } from '@/lib/googleSheets';
import { CLIENT_STATUS } from '@/lib/clientStatus';

export const dynamic = 'force-dynamic';

function renderHtml(title: string, message: string) {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at top, #312e81, #0f172a 58%);
        font-family: Arial, sans-serif;
        color: #e5e7eb;
      }
      .card {
        width: min(92vw, 560px);
        padding: 32px;
        border-radius: 24px;
        background: rgba(15, 23, 42, 0.92);
        border: 1px solid rgba(99, 102, 241, 0.35);
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.4);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 1.6rem;
      }
      p {
        margin: 0;
        line-height: 1.6;
        color: #cbd5e1;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>${title}</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`;
}

function htmlResponse(title: string, message: string, status = 200) {
  return new NextResponse(renderHtml(title, message), {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndexParam = searchParams.get('fila') || '';
    const secretParam = searchParams.get('clave') || '';
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || secretParam !== cronSecret) {
      return htmlResponse('Acceso no autorizado', 'El enlace no es valido o ha caducado.', 401);
    }

    const rowIndex = Number.parseInt(rowIndexParam, 10);
    if (!Number.isInteger(rowIndex) || rowIndex < 2) {
      return htmlResponse('Fila invalida', 'No se pudo identificar el cliente que quieres actualizar.', 400);
    }

    await updateClientStatus(rowIndex, CLIENT_STATUS.notified);

    return htmlResponse(
      'Cliente actualizado',
      '✅ Cliente actualizado con exito. Ya puedes cerrar esta ventana.'
    );
  } catch (error) {
    console.error('Confirmation route error:', error);
    return htmlResponse(
      'Error al actualizar',
      error instanceof Error ? error.message : 'No se pudo actualizar el cliente.',
      500
    );
  }
}
