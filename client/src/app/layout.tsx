import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import Sidebar from '@/components/ui/Sidebar'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bundle Pricing Dashboard',
  description: 'AI-Powered Bundling & Pricing Strategist',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <div className='flex h-screen bg-gray-50'>
          <Sidebar />
          <main className='flex-1 overflow-y-auto'>{children}</main>
        </div>
      </body>
    </html>
  )
}
