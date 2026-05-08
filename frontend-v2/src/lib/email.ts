import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
	// Inline styles are intentional: CSS variables (var(--ds-*)) are not supported in email HTML.
	// These literal values are the resolved equivalents of the design tokens defined in globals.css:
	//   #0d1117 = --ds-bg-base, #1f2937 = --ds-bg-elevated, #f9fafb = --ds-text-primary,
	//   #9ca3af = --ds-text-secondary, #6b7280 = --ds-text-tertiary, #3b82f6 = --ds-accent-blue.
	try {
		await resend.emails.send({
			from: process.env.EMAIL_FROM || 'noreply@quantumplatform.com',
			to: email,
			subject: 'Your OTP Code - Quantum Platform',
			html: `
        <div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0d1117; color: #f9fafb; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #f9fafb;">Your OTP Code</h1>
          <p style="font-size: 14px; color: #9ca3af; margin-bottom: 24px;">
            Enter this code to complete your authentication:
          </p>
          <div style="background: #1f2937; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 600; letter-spacing: 8px; font-family: 'JetBrains Mono', monospace; color: #3b82f6;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
            This code will expire in 10 minutes.
          </p>
          <p style="font-size: 12px; color: #6b7280;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
		});
	} catch (error) {
		console.error('Failed to send OTP email:', error);
		throw new Error('Failed to send OTP email');
	}
}
