import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

export const metadata = {
  metadataBase: new URL('https://deltavpn.com'),
  title: 'delta VPN | Enterprise IAM & Diagnostic Support',
  description:
    'Secure, high-leverage VPN diagnostics for enterprise infrastructure. Real-time telemetry, latency optimization, and automated IAM security.',
  keywords: [
    'VPN',
    'IAM',
    'Network Security',
    'Latency Diagnostics',
    'Enterprise VPN',
  ],
  openGraph: {
    title: 'delta VPN | Enterprise IAM Hub',
    description:
      'The AI-powered diagnostic hub for secure, scalable network infrastructure.',
    url: 'https://deltavpn.com',
    siteName: 'delta VPN',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
        {/* Sonner global toast portal configuration */}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
