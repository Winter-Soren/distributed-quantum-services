import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { generateToken, setAuthCookie } from '@/lib/auth';
import type { User, OTPRecord } from '@/types/user';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, otp, firstName, lastName, organization, designation } = body;

		// Validate required fields
		if (!email || !otp || !firstName || !lastName || !organization || !designation) {
			return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
		}

		const db = await getDatabase();

		// Check if user already exists
		const existingUser = await db.collection('users').findOne({ email });
		if (existingUser) {
			return NextResponse.json({ error: 'User already exists. Please sign in.' }, { status: 400 });
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

		// Create new user with 1-day trial
		const now = new Date();
		const trialEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

		const newUser: User = {
			email,
			firstName,
			lastName,
			organization,
			designation,
			trialEndsAt,
			isActive: true,
			hasSubscription: false,
			createdAt: now,
			updatedAt: now,
		};

		const result = await db.collection('users').insertOne(newUser);

		// Generate JWT token
		const token = await generateToken(result.insertedId.toString());
		await setAuthCookie(token);

		// Return user data (without sensitive info)
		return NextResponse.json({
			message: 'Account created successfully',
			user: {
				id: result.insertedId,
				email: newUser.email,
				firstName: newUser.firstName,
				lastName: newUser.lastName,
				organization: newUser.organization,
				designation: newUser.designation,
				trialEndsAt: newUser.trialEndsAt,
				hasSubscription: newUser.hasSubscription,
			},
		});
	} catch (error) {
		console.error('Signup error:', error);
		return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
	}
}
