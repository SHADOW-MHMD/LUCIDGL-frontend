import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nodeio - Developer Portfolio & Social Platform',
  description: 'Premium developer portfolio and social platform with glassmorphism design',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950">
        {children}
      </body>
    </html>
  )
}
