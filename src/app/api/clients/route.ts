import { NextResponse } from 'next/server';
import { addClient, getAllClients } from '@/lib/googleSheets';

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

    // Relaxed destructuring
    const { clientName = '', lastServiceDate = '', frequency = '', task = '', phone = '' } = body;

    // Only basic logic required: we need SOME starting point or it's totally blank, but we don't block.
    // If the user submits completely empty, that's their choice.

    // Fix Google Sheets formula error by forcing the phone number as text 
    // when it starts with +, =, -, etc.
    const safePhone = phone.trim().match(/^[=+\-@]/) ? `'${phone.trim()}` : phone.trim();

    const frequencyNumber = frequency ? parseInt(frequency, 10) : null;

    const result = await addClient({
      clientName: clientName.trim(),
      lastServiceDate: lastServiceDate.trim(),
      frequency: frequencyNumber !== null && !isNaN(frequencyNumber) ? frequencyNumber : 0,
      task: task.trim(),
      phone: safePhone,
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
