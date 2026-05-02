'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// -----------------------------------------------------------------------
// Design-system-aware primitives — all colours via CSS vars from globals.css
// -----------------------------------------------------------------------

const INPUT_BASE: React.CSSProperties = {
	background: 'var(--ds-bg-base)',
	border: '1px solid var(--ds-border)',
	color: 'var(--ds-text-primary)',
	borderRadius: 'var(--ds-radius-btn)',
	padding: '8px 12px',
	fontSize: 14,
	width: '100%',
	outline: 'none',
	transition: 'border-color var(--ds-transition), box-shadow var(--ds-transition)',
};
const INPUT_FOCUS: React.CSSProperties = {
	borderColor: 'var(--ds-border-focus)',
	boxShadow: 'var(--ds-focus-ring)',
};

function DSInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
	const [focused, setFocused] = useState(false);
	return (
		<input
			{...props}
			style={{ ...INPUT_BASE, ...(focused ? INPUT_FOCUS : {}), ...(props.style ?? {}) }}
			onFocus={e => { setFocused(true); props.onFocus?.(e); }}
			onBlur={e => { setFocused(false); props.onBlur?.(e); }}
		/>
	);
}

function DSLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
	return (
		<label
			htmlFor={htmlFor}
			style={{ display: 'block', color: 'var(--ds-text-secondary)', fontSize: 12, fontWeight: 500, marginBottom: 4 }}
		>
			{children}
		</label>
	);
}

function PrimaryBtn({ children, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const [hov, setHov] = useState(false);
	return (
		<button
			{...rest}
			disabled={disabled}
			style={{
				background: hov && !disabled ? 'var(--ds-accent-blue-hover)' : 'var(--ds-accent-blue)',
				color: '#ffffff',
				borderRadius: 'var(--ds-radius-btn)',
				padding: '8px 16px',
				fontSize: 14,
				fontWeight: 500,
				width: '100%',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
				transition: 'background var(--ds-transition)',
				border: 'none',
			}}
			onMouseEnter={() => setHov(true)}
			onMouseLeave={() => setHov(false)}
		>
			{children}
		</button>
	);
}

function GhostBtn({ children, disabled, style, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const [hov, setHov] = useState(false);
	return (
		<button
			{...rest}
			disabled={disabled}
			style={{
				background: hov && !disabled ? 'var(--ds-bg-hover)' : 'transparent',
				color: 'var(--ds-text-secondary)',
				border: '1px solid var(--ds-border)',
				borderRadius: 'var(--ds-radius-btn)',
				padding: '8px 16px',
				fontSize: 14,
				fontWeight: 500,
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
				transition: 'background var(--ds-transition)',
				...(style ?? {}),
			}}
			onMouseEnter={() => setHov(true)}
			onMouseLeave={() => setHov(false)}
		>
			{children}
		</button>
	);
}

// -----------------------------------------------------------------------
// SignupForm
// -----------------------------------------------------------------------

export function SignupForm() {
	const router = useRouter();
	const [step, setStep] = useState<'email' | 'details' | 'otp'>('email');
	const [loading, setLoading] = useState(false);

	const [email, setEmail] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [organization, setOrganization] = useState('');
	const [designation, setDesignation] = useState('');
	const [otp, setOtp] = useState('');

	const handleEmailSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setStep('details');
	};

	const handleDetailsSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const res = await fetch('/api/auth/request-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, mode: 'signup' }),
			});
			const data = await res.json();
			if (!res.ok) { toast.error(data.error || 'Failed to send OTP'); return; }
			toast.success('OTP sent to your email');
			setStep('otp');
		} catch { toast.error('Failed to send OTP'); }
		finally { setLoading(false); }
	};

	const handleOTPSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (otp.length !== 6) { toast.error('Please enter the complete OTP'); return; }
		setLoading(true);
		try {
			const res = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, otp, firstName, lastName, organization, designation }),
			});
			const data = await res.json();
			if (!res.ok) { toast.error(data.error || 'Failed to create account'); return; }
			toast.success('Account created successfully!');
			router.push('/');
		} catch { toast.error('Failed to create account'); }
		finally { setLoading(false); }
	};

	const resendOTP = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/auth/request-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, mode: 'signup' }),
			});
			const data = await res.json();
			if (!res.ok) { toast.error(data.error || 'Failed to resend OTP'); return; }
			toast.success('OTP resent to your email');
		} catch { toast.error('Failed to resend OTP'); }
		finally { setLoading(false); }
	};

	const heading: React.CSSProperties = { color: 'var(--ds-text-primary)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', textAlign: 'center' };
	const sub: React.CSSProperties = { color: 'var(--ds-text-secondary)', fontSize: 14, textAlign: 'center', marginTop: 4 };
	const link: React.CSSProperties = { color: 'var(--ds-accent-blue)', textDecoration: 'none', fontSize: 14 };

	if (step === 'email') {
		return (
			<form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
				<div>
					<p style={heading}>Create your account</p>
					<p style={sub}>Get started with a free 1-day trial</p>
				</div>
				<div>
					<DSLabel htmlFor="email">Email</DSLabel>
					<DSInput id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
				</div>
				<PrimaryBtn type="submit">Continue</PrimaryBtn>
				<p style={{ ...sub, marginTop: 0 }}>
					Already have an account?{' '}
					<a href="/signin" style={link}>Sign in</a>
				</p>
			</form>
		);
	}

	if (step === 'details') {
		return (
			<form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
				<div>
					<p style={heading}>Tell us about yourself</p>
					<p style={sub}>We&apos;ll send an OTP to verify your email</p>
				</div>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
					<div>
						<DSLabel htmlFor="firstName">First Name</DSLabel>
						<DSInput id="firstName" type="text" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} required />
					</div>
					<div>
						<DSLabel htmlFor="lastName">Last Name</DSLabel>
						<DSInput id="lastName" type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} required />
					</div>
				</div>
				<div>
					<DSLabel htmlFor="organization">Organization</DSLabel>
					<DSInput id="organization" type="text" placeholder="Company Inc." value={organization} onChange={e => setOrganization(e.target.value)} required />
				</div>
				<div>
					<DSLabel htmlFor="designation">Designation</DSLabel>
					<DSInput id="designation" type="text" placeholder="Software Engineer" value={designation} onChange={e => setDesignation(e.target.value)} required />
				</div>
				<div style={{ display: 'flex', gap: 12 }}>
					<GhostBtn type="button" onClick={() => setStep('email')} style={{ flex: 1 }}>Back</GhostBtn>
					<PrimaryBtn type="submit" disabled={loading} style={{ flex: 1 } as React.CSSProperties}>{loading ? 'Sending…' : 'Send OTP'}</PrimaryBtn>
				</div>
			</form>
		);
	}

	return (
		<form onSubmit={handleOTPSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<div>
				<p style={heading}>Verify your email</p>
				<p style={sub}>
					Enter the 6-digit code sent to{' '}
					<span style={{ color: 'var(--ds-text-primary)' }}>{email}</span>
				</p>
			</div>
			<div style={{ display: 'flex', justifyContent: 'center' }}>
				<InputOTP maxLength={6} value={otp} onChange={setOtp}>
					<InputOTPGroup>
						{[0,1,2,3,4,5].map(i => (
							<InputOTPSlot
								key={i}
								index={i}
								style={{ background: 'var(--ds-bg-base)', border: '1px solid var(--ds-border)', color: 'var(--ds-text-primary)' } as React.CSSProperties}
							/>
						))}
					</InputOTPGroup>
				</InputOTP>
			</div>
			<div style={{ display: 'flex', gap: 12 }}>
				<GhostBtn type="button" onClick={() => setStep('details')} style={{ flex: 1 }}>Back</GhostBtn>
				<PrimaryBtn type="submit" disabled={loading || otp.length !== 6} style={{ flex: 1 } as React.CSSProperties}>{loading ? 'Verifying…' : 'Create Account'}</PrimaryBtn>
			</div>
			<div style={{ textAlign: 'center' }}>
				<button
					type="button"
					onClick={resendOTP}
					disabled={loading}
					style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ds-text-secondary)', fontSize: 14, padding: 0 }}
					onMouseEnter={e => (e.currentTarget.style.color = 'var(--ds-text-primary)')}
					onMouseLeave={e => (e.currentTarget.style.color = 'var(--ds-text-secondary)')}
				>
					Didn&apos;t receive code? Resend
				</button>
			</div>
		</form>
	);
}
