'use client'

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Loader2,
  Package,
  TrendingUp,
} from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useEffect, useState } from 'react'

import Card from '@/components/ui/Card'

interface DashboardStats {
  avgOrderValue: number
  totalRevenue: number
  activeBundles: number
  stockAlerts: number
  revenueChange: number
  aovChange: number
}

interface RevenueTrendData {
  date: string
  revenue: number
  orders: number
  items: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  if (error) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <Card>
          <div className='text-center py-8'>
            <p className='text-red-600 mb-2'>Error loading dashboard:</p>
            <p className='text-sm text-gray-600 mb-4'>{error}</p>
            <button
              onClick={fetchDashboardStats}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    )
  }

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
          value={stats ? `€${stats.avgOrderValue.toFixed(2)}` : '-'}
          change={stats?.aovChange}
          icon={<DollarSign className='h-6 w-6' />}
          loading={loading}
        />
        <StatCard
          title='Total Revenue'
          value={stats ? `€${stats.totalRevenue.toLocaleString()}` : '-'}
          change={stats?.revenueChange}
          icon={<TrendingUp className='h-6 w-6' />}
          loading={loading}
        />
        <StatCard
          title='Active Bundles'
          value={stats ? stats.activeBundles.toString() : '-'}
          icon={<Package className='h-6 w-6' />}
          loading={loading}
        />
        <StatCard
          title='Stock Alerts'
          value={stats ? stats.stockAlerts.toString() : '-'}
          icon={<AlertTriangle className='h-6 w-6' />}
          variant='warning'
          loading={loading}
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
  const [trendData, setTrendData] = useState<RevenueTrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('http://127.0.0.1:5000/dashboard/revenue-trend')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        // Format the data for the chart
        const formattedData = data.map((item: RevenueTrendData) => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        }))
        setTrendData(formattedData)
      } catch (err) {
        console.error('Error fetching revenue trend:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch revenue trend')
      } finally {
        setLoading(false)
      }
    }

    fetchTrendData()
  }, [])

  if (loading) {
    return (
      <Card title='Revenue Trend' subtitle='Last 7 days'>
        <div className='h-64 flex items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card title='Revenue Trend' subtitle='Last 7 days'>
        <div className='h-64 flex items-center justify-center text-red-600'>
          <div className='text-center'>
            <p className='mb-2'>Error loading revenue trend</p>
            <p className='text-sm text-gray-500'>{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  const formatEuro = (value: number) => `€${value.toLocaleString()}`

  return (
    <Card title='Revenue Trend' subtitle='Last 7 days'>
      <div className='h-[400px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={trendData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='date' tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatEuro} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [`€${value.toLocaleString()}`, 'Revenue']}
              labelStyle={{ fontSize: 12 }}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend />
            <Line
              name='Daily Revenue'
              type='monotone'
              dataKey='revenue'
              stroke='#4F46E5'
              strokeWidth={2}
              dot={{ fill: '#4F46E5', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className='mt-4 grid grid-cols-3 gap-4'>
        <div className='text-center'>
          <p className='text-sm text-gray-500'>Total Revenue</p>
          <p className='text-lg font-semibold'>
            €{trendData.reduce((sum, day) => sum + day.revenue, 0).toLocaleString()}
          </p>
        </div>
        <div className='text-center'>
          <p className='text-sm text-gray-500'>Total Orders</p>
          <p className='text-lg font-semibold'>
            {trendData.reduce((sum, day) => sum + day.orders, 0)}
          </p>
        </div>
        <div className='text-center'>
          <p className='text-sm text-gray-500'>Total Items</p>
          <p className='text-lg font-semibold'>
            {trendData.reduce((sum, day) => sum + day.items, 0)}
          </p>
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
