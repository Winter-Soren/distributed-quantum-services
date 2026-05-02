import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

export async function generateToken(userId: string): Promise<string> {
	return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
		return decoded;
	} catch {
		return null;
	}
}

export async function setAuthCookie(token: string): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set('auth_token', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7, // 7 days
		path: '/',
	});
}

export async function clearAuthCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete('auth_token');
}

export async function getAuthToken(): Promise<string | null> {
	const cookieStore = await cookies();
	const cookie = cookieStore.get('auth_token');
	return cookie?.value || null;
}

export async function getCurrentUser(): Promise<User | null> {
	const token = await getAuthToken();
	if (!token) return null;

	const decoded = await verifyToken(token);
	if (!decoded) return null;

	const db = await getDatabase();
	const user = await db.collection<User>('users').findOne({
		_id: new ObjectId(decoded.userId),
	});

	return user;
}

export async function checkUserAccess(user: User): Promise<{
	hasAccess: boolean;
	reason?: string;
}> {
	if (!user.isActive) {
		return { hasAccess: false, reason: 'Account is inactive' };
	}

	const now = new Date();
	const trialExpired = user.trialEndsAt < now;

	if (trialExpired && !user.hasSubscription) {
		return {
			hasAccess: false,
			reason: 'Trial expired. Please subscribe to continue.',
		};
	}

	return { hasAccess: true };
}

export function generateOTP(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}
