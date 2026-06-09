import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nodeio - Developer Portfolio & Social Platform',
  description: 'Premium dark theme Aero Glass aesthetic social platform for developers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text overflow-x-hidden">
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
