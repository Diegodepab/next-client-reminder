import { NextResponse } from 'next/server';
import { addClient, deleteClient, getAllClients, updateClient } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clients = await getAllClients();
    return NextResponse.json({ clients }, { status: 200 });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { clientName = '', lastServiceDate = '', frequency = '', task = '', phone = '', nextDate = '' } = body;

    const safePhone = String(phone || '').trim().match(/^[=+\-@]/)
      ? `'${String(phone || '').trim()}`
      : String(phone || '').trim();

    const frequencyNumber = String(frequency || '').trim() ? parseInt(String(frequency || '').trim(), 10) : 0;

    const result = await addClient({
      clientName: String(clientName || '').trim(),
      lastServiceDate: String(lastServiceDate || '').trim(),
      frequency: Number.isFinite(frequencyNumber) ? frequencyNumber : 0,
      task: String(task || '').trim(),
      phone: safePhone,
      nextDate: String(nextDate || '').trim(),
    });

    return NextResponse.json(
      { message: 'Client registered successfully', details: result },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding client:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to register client';
    const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('Missing');
    return NextResponse.json(
      { error: isConfigError ? errorMessage : 'Failed to register client. Check server logs for details.' },
      { status: isConfigError ? 503 : 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const { rowIndex, clientName = '', lastServiceDate = '', frequency = '', task = '', phone = '', nextDate = '' } = body;

    const rowIndexNumber = typeof rowIndex === 'number' ? rowIndex : parseInt(String(rowIndex || ''), 10);
    if (!rowIndexNumber || rowIndexNumber < 2) {
      return NextResponse.json(
        { error: 'Invalid rowIndex parameter' },
        { status: 400 }
      );
    }

    const safePhone = String(phone || '').trim().match(/^[=+\-@]/)
      ? `'${String(phone || '').trim()}`
      : String(phone || '').trim();

    const frequencyNumber = String(frequency || '').trim() ? parseInt(String(frequency || '').trim(), 10) : 0;

    const result = await updateClient({
      rowIndex: rowIndexNumber,
      clientName: String(clientName || '').trim(),
      lastServiceDate: String(lastServiceDate || '').trim(),
      frequency: Number.isFinite(frequencyNumber) ? frequencyNumber : 0,
      task: String(task || '').trim(),
      phone: safePhone,
      nextDate: String(nextDate || '').trim(),
    });

    return NextResponse.json(
      { message: 'Client updated successfully', details: result },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = parseInt(searchParams.get('rowIndex') || '', 10);

    if (!rowIndex || rowIndex < 2) {
      return NextResponse.json(
        { error: 'Invalid rowIndex parameter' },
        { status: 400 }
      );
    }

    await deleteClient(rowIndex);
    return NextResponse.json(
      { message: 'Client deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete client' },
      { status: 500 }
    );
  }
}