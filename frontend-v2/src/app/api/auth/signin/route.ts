import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { generateToken, setAuthCookie, checkUserAccess } from '@/lib/auth';
import type { User, OTPRecord } from '@/types/user';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, otp } = body;

		if (!email || !otp) {
			return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
		}

		const db = await getDatabase();

		// Find user
		const user = await db.collection<User>('users').findOne({ email });
		if (!user) {
			return NextResponse.json(
				{ error: 'No account found with this email. Please sign up.' },
				{ status: 404 }
			);
		}

		// Verify OTP
		const otpRecord = await db.collection<OTPRecord>('otps').findOne({
			email,
			otp,
			verified: false,
			expiresAt: { $gt: new Date() },
		});

		if (!otpRecord) {
			return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
		}

		// Mark OTP as verified
		await db.collection('otps').updateOne({ _id: otpRecord._id }, { $set: { verified: true } });

		// Check user access
		const accessCheck = await checkUserAccess(user);
		if (!accessCheck.hasAccess) {
			return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
		}

		// Update last login
		await db.collection('users').updateOne({ _id: user._id }, { $set: { updatedAt: new Date() } });

		// Generate JWT token
		const token = await generateToken(user._id!.toString());
		await setAuthCookie(token);

		// Calculate trial info
		const now = new Date();
		const trialDaysLeft = Math.max(
			0,
			Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
		);

		return NextResponse.json({
			message: 'Signed in successfully',
			user: {
				id: user._id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				organization: user.organization,
				designation: user.designation,
				trialEndsAt: user.trialEndsAt,
				trialDaysLeft,
				hasSubscription: user.hasSubscription,
			},
		});
	} catch (error) {
		console.error('Signin error:', error);
		return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
	}
}
