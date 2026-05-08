'use client';

import { AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/contexts/auth-context';

const AUTH_DISABLED =
	process.env.NODE_ENV === 'development' ||
	process.env.NEXT_PUBLIC_AUTH_REQUIRED === 'false';

export function TrialBanner() {
	const { user } = useAuth();

	if (AUTH_DISABLED || !user || user.hasSubscription) {
		return null;
	}

	const daysLeft = user.trialDaysLeft;
	const isExpiring = daysLeft <= 3;
	const hasExpired = daysLeft <= 0;

	const bannerBase = {
		background: 'var(--ds-bg-elevated)',
		borderBottom: '1px solid var(--ds-border)',
	};
	const linkCls = 'px-4 py-2 text-white text-sm font-medium rounded-md transition-colors';

	if (hasExpired) {
		return (
			<div style={bannerBase}>
				<div className="max-w-7xl mx-auto px-4 py-3">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<AlertCircle className="w-5 h-5" style={{ color: 'var(--ds-accent-red)' }} />
							<p className="text-sm" style={{ color: 'var(--ds-text-primary)' }}>
								Your trial has expired. Subscribe to continue using the platform.
							</p>
						</div>
						<Link
							href="/subscription"
							className={linkCls}
							style={{ background: 'var(--ds-accent-blue)' }}
							onMouseEnter={e => (e.currentTarget.style.background = 'var(--ds-accent-blue-hover)')}
							onMouseLeave={e => (e.currentTarget.style.background = 'var(--ds-accent-blue)')}
						>
							Subscribe Now
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (isExpiring) {
		return (
			<div style={bannerBase}>
				<div className="max-w-7xl mx-auto px-4 py-3">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<Clock className="w-5 h-5" style={{ color: 'var(--ds-accent-yellow)' }} />
							<p className="text-sm" style={{ color: 'var(--ds-text-primary)' }}>
								<span className="font-medium">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span> left
								in your trial. Subscribe to keep access.
							</p>
						</div>
						<Link
							href="/subscription"
							className={linkCls}
							style={{ background: 'var(--ds-accent-blue)' }}
							onMouseEnter={e => (e.currentTarget.style.background = 'var(--ds-accent-blue-hover)')}
							onMouseLeave={e => (e.currentTarget.style.background = 'var(--ds-accent-blue)')}
						>
							View Plans
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={bannerBase}>
			<div className="max-w-7xl mx-auto px-4 py-2">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div
							className="px-2 py-1 rounded text-xs font-medium"
							style={{ background: 'var(--ds-accent-blue-muted)', color: 'var(--ds-accent-blue)' }}
						>
							TRIAL
						</div>
						<p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
							{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
