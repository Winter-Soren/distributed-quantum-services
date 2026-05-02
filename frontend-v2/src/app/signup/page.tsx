'use client';

import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--ds-bg-base)' }}>
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<div
						className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
						style={{ background: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-border)' }}
					>
						<svg
							className="w-6 h-6"
							style={{ color: 'var(--ds-accent-blue)' }}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
					<h2 className="text-xl font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
						Quantum Platform
					</h2>
				</div>
				<div
					className="rounded-lg p-8"
					style={{ background: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-border)' }}
				>
					<SignupForm />
				</div>
			</div>
		</div>
	);
}
