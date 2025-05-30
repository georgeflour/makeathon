'use client'

import {
  BarChart3,
  Heart,
  LayoutDashboard,
  Menu,
  Package,
  Package2,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'

import { useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Bundles', href: '/bundles', icon: Package2 },
  { name: 'Favourites', href: '/favourites', icon: Heart },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <div className='lg:hidden fixed top-4 left-4 z-50'>
        <button onClick={() => setIsOpen(!isOpen)} className='bg-white p-2 rounded-md shadow-md'>
          {isOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className='flex flex-col h-full'>
          {/* Logo */}
          <div className='flex items-center px-6 py-4 border-b border-gray-200'>
            <TrendingUp className='h-8 w-8 text-blue-600' />
            <span className='ml-2 text-xl font-bold text-gray-900'>
              Bundle Pro
              <p className='text-xs text-gray-500'>
                Powered by <br></br>
                <span className='text-gray-900'>Hack to the Future</span>
              </p>
            </span>
          </div>

          {/* Navigation */}
          <nav className='flex-1 px-4 py-6 space-y-2'>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className='h-5 w-5 mr-3' />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className='px-4 py-4 border-t border-gray-200'>
            <div className='flex items-center'>
              <div className='h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center'>
                <span className='text-white text-sm font-medium'>JD</span>
              </div>
              <div className='ml-3'>
                <p className='text-sm font-medium text-gray-900'>John Doe</p>
                <p className='text-xs text-gray-500'>jdoe@notos.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden'
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
