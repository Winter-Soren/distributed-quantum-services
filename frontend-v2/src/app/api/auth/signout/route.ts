import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
	try {
		await clearAuthCookie();
		return NextResponse.json({ message: 'Signed out successfully' });
	} catch (error) {
		console.error('Signout error:', error);
		return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
	}
}
