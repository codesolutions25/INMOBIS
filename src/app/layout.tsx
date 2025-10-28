'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <GoogleReCaptchaProvider
          reCaptchaKey={RECAPTCHA_SITE_KEY}
          scriptProps={{
            async: true,
            defer: true,
            appendTo: 'head',
            nonce: undefined
          }}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleReCaptchaProvider>
      </body>
    </html>
  );
}
