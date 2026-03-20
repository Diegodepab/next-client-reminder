'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
    const password = formData.get('password') as string;
    const secret = process.env.CRON_SECRET;

    if (!secret) {
        return { error: 'Server misconfiguration: CRON_SECRET is not set.' };
    }

    if (password === secret) {
        const cookieStore = await cookies();
        cookieStore.set('auth_token', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        redirect('/');
    }

    return { error: 'Invalid password' };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    redirect('/');
}
