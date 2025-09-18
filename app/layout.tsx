import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import DisableNextDevTools from '@/components/disable-next-devtools'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
[data-nextjs-dev-tools-button],
[data-next-badge],
[data-next-badge-root],
[data-next-mark],
[data-nextjs-toast],
[data-nextjs-toast-wrapper] {
  display: none !important;
}
        `}</style>
      </head>
      <body>
        <DisableNextDevTools />
        {children}
      </body>
    </html>
  )
}
