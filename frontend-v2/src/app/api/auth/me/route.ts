import { NextResponse } from 'next/server';
import { getCurrentUser, checkUserAccess } from '@/lib/auth';

export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const accessCheck = await checkUserAccess(user);
		const now = new Date();
		const trialDaysLeft = Math.max(
			0,
			Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
		);

		return NextResponse.json({
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
				hasAccess: accessCheck.hasAccess,
				accessMessage: accessCheck.reason,
			},
		});
	} catch (error) {
		console.error('Get user error:', error);
		return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
	}
}
