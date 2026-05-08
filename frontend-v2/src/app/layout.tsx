import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-sans',
	display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
	variable: '--font-mono',
	subsets: ['latin'],
	display: 'swap'
});

export const metadata: Metadata = {
	title: 'Quantum Platform',
	description: 'Quantum Computing Platform'
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang='en'
			className={cn(
				'h-full',
				'antialiased',
				inter.variable,
				jetbrainsMono.variable,
				'font-sans'
			)}
		>
			<TooltipProvider>
				<body className='min-h-full flex flex-col'>
					<AuthProvider>
						{children}
						<Toaster />
					</AuthProvider>
				</body>
			</TooltipProvider>
		</html>
	);
}
