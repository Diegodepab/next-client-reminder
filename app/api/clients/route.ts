import { NextResponse } from 'next/server';
import { addClient } from '@/lib/googleSheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { clientName, lastServiceDate, frequency, task, phone } = body;

    if (!clientName || !lastServiceDate || !frequency || !task || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    await addClient({
      clientName,
      lastServiceDate,
      frequency: parseInt(frequency),
      task,
      phone,
    });

    return NextResponse.json(
      { message: 'Client registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding client:', error);
    return NextResponse.json(
      { error: 'Failed to register client' },
      { status: 500 }
    );
  }
}
