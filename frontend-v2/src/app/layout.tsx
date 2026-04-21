import type { Metadata } from 'next';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
	title: 'Quantum Gates Dashboard',
	description: 'Frontend workspace for the distributed quantum coordinator.'
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang='en'
			className='h-full antialiased font-sans'
		>
			<body
				className='min-h-full flex flex-col'
				suppressHydrationWarning
			>
				<TooltipProvider>
					{children}
					<Toaster />
				</TooltipProvider>
			</body>
		</html>
	);
}
