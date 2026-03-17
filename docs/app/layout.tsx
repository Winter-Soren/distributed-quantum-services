import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';

const sans = localFont({
  src: './fonts/geist-latin.woff2',
  variable: '--font-sans',
});

const mono = localFont({
  src: './fonts/geist-mono-latin.woff2',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Distributed Quantum Services',
    template: '%s | Distributed Quantum Services',
  },
  description:
    'Documentation for a research-oriented distributed quantum orchestration stack built with py-libp2p, FastAPI, SQLite, and Qiskit.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-fd-background text-fd-foreground antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
