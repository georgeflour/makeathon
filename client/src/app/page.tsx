'use client'

import { useApi } from '@/hooks/useApi'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Package,
  TrendingUp,
} from 'lucide-react'

import { useEffect, useState } from 'react'

import Card from '@/components/ui/Card'

import { apiClient } from '@/lib/api'

interface DashboardStats {
  avgOrderValue: number
  totalRevenue: number
  activeBundles: number
  stockAlerts: number
  revenueChange: number
  aovChange: number
}

export default function Dashboard() {
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>(
    () => apiClient.getOrderStats(),
    []
  )

  const mockStats: DashboardStats = {
    avgOrderValue: 127.5,
    totalRevenue: 45680,
    activeBundles: 23,
    stockAlerts: 7,
    revenueChange: 12.5,
    aovChange: 8.2,
  }

  const displayStats = stats || mockStats

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600 mt-1'>AI-Powered Bundling & Pricing Overview</p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <StatCard
          title='Average Order Value'
          value={`€${displayStats.avgOrderValue.toFixed(2)}`}
          change={displayStats.aovChange}
          icon={<DollarSign className='h-6 w-6' />}
          loading={statsLoading}
        />
        <StatCard
          title='Total Revenue'
          value={`€${displayStats.totalRevenue.toLocaleString()}`}
          change={displayStats.revenueChange}
          icon={<TrendingUp className='h-6 w-6' />}
          loading={statsLoading}
        />
        <StatCard
          title='Active Bundles'
          value={displayStats.activeBundles.toString()}
          icon={<Package className='h-6 w-6' />}
          loading={statsLoading}
        />
        <StatCard
          title='Stock Alerts'
          value={displayStats.stockAlerts.toString()}
          icon={<AlertTriangle className='h-6 w-6' />}
          variant='warning'
          loading={statsLoading}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <RevenueChart />
        <RecentActivity />
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  change?: number
  icon: React.ReactNode
  variant?: 'default' | 'warning'
  loading?: boolean
}

function StatCard({ title, value, change, icon, variant = 'default', loading }: StatCardProps) {
  if (loading) {
    return (
      <div className='stats-card'>
        <div className='animate-pulse'>
          <div className='flex items-center justify-between mb-2'>
            <div className='h-4 bg-gray-200 rounded w-24'></div>
            <div className='h-6 w-6 bg-gray-200 rounded'></div>
          </div>
          <div className='h-8 bg-gray-200 rounded w-32 mb-2'></div>
          <div className='h-3 bg-gray-200 rounded w-20'></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`stats-card ${variant === 'warning' ? 'border-orange-200 bg-orange-50' : ''}`}>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='text-sm font-medium text-gray-600'>{title}</h3>
        <div
          className={`p-2 rounded-lg ${
            variant === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
          }`}
        >
          {icon}
        </div>
      </div>
      <div className='mb-2'>
        <p className='text-2xl font-bold text-gray-900'>{value}</p>
      </div>
      {change !== undefined && (
        <div className='flex items-center text-sm'>
          {change > 0 ? (
            <ArrowUpRight className='h-4 w-4 text-green-500 mr-1' />
          ) : (
            <ArrowDownRight className='h-4 w-4 text-red-500 mr-1' />
          )}
          <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
            {Math.abs(change)}%
          </span>
          <span className='text-gray-500 ml-1'>vs last month</span>
        </div>
      )}
    </div>
  )
}

function RevenueChart() {
  return (
    <Card title='Revenue Trend' subtitle='Last 7 days'>
      <div className='h-64 flex items-center justify-center text-gray-500'>
        <div className='text-center'>
          <TrendingUp className='h-12 w-12 mx-auto mb-2 text-gray-400' />
          <p>Revenue chart will be displayed here</p>
          <p className='text-sm text-gray-400'>Connected to backend API</p>
        </div>
      </div>
    </Card>
  )
}

function RecentActivity() {
  const activities = [
    {
      id: 1,
      action: 'Bundle "Summer Essentials" created',
      time: '2 hours ago',
      type: 'bundle',
    },
    {
      id: 2,
      action: 'Low stock alert: Blue T-Shirt XL',
      time: '4 hours ago',
      type: 'alert',
    },
    {
      id: 3,
      action: 'Price optimized for "Weekend Getaway" bundle',
      time: '6 hours ago',
      type: 'optimization',
    },
    {
      id: 4,
      action: 'New customer segment identified',
      time: '1 day ago',
      type: 'segment',
    },
  ]

  return (
    <Card title='Recent Activity' subtitle='Latest updates and alerts'>
      <div className='space-y-4'>
        {activities.map((activity) => (
          <div key={activity.id} className='flex items-start space-x-3'>
            <div
              className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === 'alert'
                  ? 'bg-orange-400'
                  : activity.type === 'optimization'
                    ? 'bg-green-400'
                    : activity.type === 'segment'
                      ? 'bg-purple-400'
                      : 'bg-blue-400'
              }`}
            />
            <div className='flex-1 min-w-0'>
              <p className='text-sm text-gray-900'>{activity.action}</p>
              <p className='text-xs text-gray-500'>{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
