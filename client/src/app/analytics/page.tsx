'use client'

import {
  Calendar,
  DollarSign,
  Download,
  Filter,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

// Sample data - in real app this would come from API
const revenueData = [
  { month: 'Jan', revenue: 45000, bundles: 12000, individual: 33000 },
  { month: 'Feb', revenue: 52000, bundles: 18000, individual: 34000 },
  { month: 'Mar', revenue: 48000, bundles: 15000, individual: 33000 },
  { month: 'Apr', revenue: 61000, bundles: 25000, individual: 36000 },
  { month: 'May', revenue: 55000, bundles: 20000, individual: 35000 },
  { month: 'Jun', revenue: 67000, bundles: 28000, individual: 39000 },
]

const bundlePerformanceData = [
  { name: 'Summer Beach Kit', revenue: 15400, orders: 230, aov: 67 },
  { name: 'Back to School', revenue: 12800, orders: 180, aov: 71 },
  { name: 'Skincare Essentials', revenue: 18200, orders: 340, aov: 54 },
  { name: 'Fitness Bundle', revenue: 9600, orders: 120, aov: 80 },
  { name: 'Winter Warmth', revenue: 11300, orders: 150, aov: 75 },
]

const customerSegmentData = [
  { name: 'VIP Customers', value: 35, color: '#3B82F6' },
  { name: 'Regular Buyers', value: 45, color: '#10B981' },
  { name: 'Occasional Shoppers', value: 20, color: '#F59E0B' },
]

const topProductsData = [
  { product: 'Wireless Headphones', sales: 450, revenue: 22500 },
  { product: 'Smartphone Case', sales: 380, revenue: 11400 },
  { product: 'Laptop Sleeve', sales: 320, revenue: 16000 },
  { product: 'Water Bottle', sales: 290, revenue: 8700 },
  { product: 'Bluetooth Speaker', sales: 250, revenue: 18750 },
]

interface StatsCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: any
}

function StatsCard({ title, value, change, trend, icon: Icon }: StatsCardProps) {
  return (
    <div className='stats-card'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          <p className='text-2xl font-bold text-gray-900 mt-1'>{value}</p>
          <div
            className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp className='h-4 w-4 mr-1' />
            ) : (
              <TrendingDown className='h-4 w-4 mr-1' />
            )}
            {change}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${trend === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
          <Icon className={`h-6 w-6 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6m')

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/4 mb-6'></div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-32 bg-gray-200 rounded-lg'></div>
            ))}
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='h-80 bg-gray-200 rounded-lg'></div>
            <div className='h-80 bg-gray-200 rounded-lg'></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Analytics & Insights</h1>
          <p className='text-gray-600 mt-1'>Track performance and identify opportunities</p>
        </div>
        <div className='flex items-center space-x-3 mt-4 sm:mt-0'>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='1m'>Last Month</option>
            <option value='3m'>Last 3 Months</option>
            <option value='6m'>Last 6 Months</option>
            <option value='1y'>Last Year</option>
          </select>
          <Button variant='secondary' size='sm'>
            <Filter className='h-4 w-4 mr-2' />
            Filter
          </Button>
          <Button variant='secondary' size='sm'>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
          <Button variant='primary' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatsCard
          title='Total Revenue'
          value='€348,600'
          change='+12.5% vs last period'
          trend='up'
          icon={DollarSign}
        />
        <StatsCard
          title='Bundle Revenue'
          value='€118,200'
          change='+24.3% vs last period'
          trend='up'
          icon={Package}
        />
        <StatsCard
          title='Active Customers'
          value='2,847'
          change='+8.1% vs last period'
          trend='up'
          icon={Users}
        />
        <StatsCard
          title='Average Order Value'
          value='€67.45'
          change='-2.3% vs last period'
          trend='down'
          icon={ShoppingCart}
        />
      </div>

      {/* Charts Row 1 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Revenue Trend */}
        <Card title='Revenue Trend' subtitle='Bundle vs Individual product sales'>
          <ResponsiveContainer width='100%' height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='month' />
              <YAxis />
              <Tooltip formatter={(value) => [`€${value.toLocaleString()}`, '']} />
              <Legend />
              <Area
                type='monotone'
                dataKey='bundles'
                stackId='1'
                stroke='#3B82F6'
                fill='#3B82F6'
                name='Bundle Sales'
              />
              <Area
                type='monotone'
                dataKey='individual'
                stackId='1'
                stroke='#10B981'
                fill='#10B981'
                name='Individual Products'
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Customer Segments */}
        <Card title='Customer Segments' subtitle='Distribution by buying behavior'>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={customerSegmentData}
                cx='50%'
                cy='50%'
                innerRadius={60}
                outerRadius={100}
                dataKey='value'
                startAngle={90}
                endAngle={450}
              >
                {customerSegmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Bundle Performance */}
        <Card title='Top Performing Bundles' subtitle='Revenue and order volume'>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={bundlePerformanceData} layout='horizontal'>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis type='number' />
              <YAxis dataKey='name' type='category' width={100} />
              <Tooltip formatter={(value) => [`€${value.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey='revenue' fill='#3B82F6' />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Products */}
        <Card title='Best Selling Products' subtitle='Individual product performance'>
          <div className='space-y-3'>
            {topProductsData.map((product, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
              >
                <div>
                  <p className='font-medium text-gray-900'>{product.product}</p>
                  <p className='text-sm text-gray-600'>{product.sales} sales</p>
                </div>
                <div className='text-right'>
                  <p className='font-medium text-gray-900'>€{product.revenue.toLocaleString()}</p>
                  <div className='w-16 bg-gray-200 rounded-full h-2 mt-1'>
                    <div
                      className='bg-blue-600 h-2 rounded-full'
                      style={{ width: `${(product.sales / 450) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Insights Section */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <Card title='Key Insights' className='lg:col-span-2'>
          <div className='space-y-4'>
            <div className='flex items-start space-x-3 p-4 bg-green-50 rounded-lg'>
              <TrendingUp className='h-5 w-5 text-green-600 mt-0.5' />
              <div>
                <p className='font-medium text-green-800'>Bundle sales are outperforming</p>
                <p className='text-sm text-green-700'>
                  Bundle revenue increased 24.3% compared to individual product sales growth of 8.1%
                </p>
              </div>
            </div>
            <div className='flex items-start space-x-3 p-4 bg-blue-50 rounded-lg'>
              <Users className='h-5 w-5 text-blue-600 mt-0.5' />
              <div>
                <p className='font-medium text-blue-800'>VIP customers drive 35% of revenue</p>
                <p className='text-sm text-blue-700'>
                  Focus on retention strategies for high-value customer segment
                </p>
              </div>
            </div>
            <div className='flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg'>
              <Package className='h-5 w-5 text-yellow-600 mt-0.5' />
              <div>
                <p className='font-medium text-yellow-800'>
                  Seasonal bundles show strong performance
                </p>
                <p className='text-sm text-yellow-700'>
                  Summer and back-to-school bundles exceed forecasted revenue by 15%
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card title='Quick Actions'>
          <div className='space-y-3'>
            <Button className='w-full justify-start' variant='secondary'>
              <Calendar className='h-4 w-4 mr-2' />
              Schedule Bundle Review
            </Button>
            <Button className='w-full justify-start' variant='secondary'>
              <TrendingUp className='h-4 w-4 mr-2' />
              Create Performance Report
            </Button>
            <Button className='w-full justify-start' variant='secondary'>
              <Users className='h-4 w-4 mr-2' />
              Analyze Customer Segments
            </Button>
            <Button className='w-full justify-start' variant='primary'>
              <Package className='h-4 w-4 mr-2' />
              Create New Bundle
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
