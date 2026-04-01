import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getNotificationSettings, updateNotificationSettings } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

async function ensureAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value === 'authenticated';
}

export async function GET() {
  try {
    if (!await ensureAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getNotificationSettings();
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!await ensureAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const settings = await updateNotificationSettings(body && typeof body === 'object' ? body : {});
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
