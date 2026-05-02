'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

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

function PrimaryBtn({ children, disabled, style, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
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
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
				transition: 'background var(--ds-transition)',
				border: 'none',
				...(style ?? {}),
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

export function SigninForm() {
	const router = useRouter();
	const [step, setStep] = useState<'email' | 'otp'>('email');
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState('');
	const [otp, setOtp] = useState('');

	const requestOTP = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/auth/request-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, mode: 'signin' }),
			});
			const data = await res.json();
			if (!res.ok) { toast.error(data.error || 'Failed to send OTP'); return false; }
			return true;
		} catch { toast.error('Failed to send OTP'); return false; }
		finally { setLoading(false); }
	};

	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		const ok = await requestOTP();
		if (ok) { toast.success('OTP sent to your email'); setStep('otp'); }
	};

	const handleOTPSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (otp.length !== 6) { toast.error('Please enter the complete OTP'); return; }
		setLoading(true);
		try {
			const res = await fetch('/api/auth/signin', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, otp }),
			});
			const data = await res.json();
			if (!res.ok) { toast.error(data.error || 'Failed to sign in'); return; }
			toast.success('Signed in successfully!');
			router.push('/');
		} catch { toast.error('Failed to sign in'); }
		finally { setLoading(false); }
	};

	const heading: React.CSSProperties = { color: 'var(--ds-text-primary)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', textAlign: 'center' };
	const sub: React.CSSProperties = { color: 'var(--ds-text-secondary)', fontSize: 14, textAlign: 'center', marginTop: 4 };

	if (step === 'email') {
		return (
			<form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
				<div>
					<p style={heading}>Sign in to your account</p>
					<p style={sub}>Enter your email to receive a one-time code</p>
				</div>
				<div>
					<label htmlFor="email" style={{ display: 'block', color: 'var(--ds-text-secondary)', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Email</label>
					<DSInput id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
				</div>
				<PrimaryBtn type="submit" disabled={loading} style={{ width: '100%' }}>{loading ? 'Sending…' : 'Continue'}</PrimaryBtn>
				<p style={{ ...sub, marginTop: 0 }}>
					Don&apos;t have an account?{' '}
					<a href="/signup" style={{ color: 'var(--ds-accent-blue)', textDecoration: 'none', fontSize: 14 }}>
						Sign up
					</a>
				</p>
			</form>
		);
	}

	return (
		<form onSubmit={handleOTPSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<div>
				<p style={heading}>Enter verification code</p>
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
				<GhostBtn type="button" onClick={() => setStep('email')} style={{ flex: 1 }}>Back</GhostBtn>
				<PrimaryBtn type="submit" disabled={loading || otp.length !== 6} style={{ flex: 1 }}>{loading ? 'Verifying…' : 'Sign In'}</PrimaryBtn>
			</div>
			<div style={{ textAlign: 'center' }}>
				<button
					type="button"
					onClick={() => { requestOTP().then(ok => ok && toast.success('OTP resent')); }}
					disabled={loading}
					style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ds-text-secondary)', fontSize: 14, padding: 0, transition: 'color var(--ds-transition)' }}
					onMouseEnter={e => (e.currentTarget.style.color = 'var(--ds-text-primary)')}
					onMouseLeave={e => (e.currentTarget.style.color = 'var(--ds-text-secondary)')}
				>
					Didn&apos;t receive code? Resend
				</button>
			</div>
		</form>
	);
}
