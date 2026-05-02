import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { generateOTP } from '@/lib/auth';
import { sendOTPEmail } from '@/lib/email';
import type { OTPRecord } from '@/types/user';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, mode } = body; // mode = 'signup' | 'signin' (defaults to 'signin' for backward compat)

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
		}

		const db = await getDatabase();

		// For sign-in: verify the user already exists before issuing an OTP
		if (mode !== 'signup') {
			const existingUser = await db.collection('users').findOne({ email });
			if (!existingUser) {
				return NextResponse.json(
					{ error: 'No account found with this email. Please sign up first.' },
					{ status: 404 }
				);
			}
		}

		const otp = generateOTP();

		// Delete any existing OTPs for this email
		await db.collection('otps').deleteMany({ email });

		// Create new OTP record
		const otpRecord: OTPRecord = {
			email,
			otp,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
			verified: false,
			createdAt: new Date(),
		};

		await db.collection('otps').insertOne(otpRecord);

		// Send OTP email
		await sendOTPEmail(email, otp);

		return NextResponse.json({
			message: 'OTP sent successfully',
			expiresIn: 600, // seconds
		});
	} catch (error) {
		console.error('Request OTP error:', error);
		return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
	}
}
