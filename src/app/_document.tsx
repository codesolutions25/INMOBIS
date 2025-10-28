import { Html, Head, Main, NextScript } from 'next/document'

// Use environment variable directly for server-side rendering
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          async
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.recaptchaOptions = {
                siteKey: '${RECAPTCHA_SITE_KEY}',
                badge: 'bottomright'
              };
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
