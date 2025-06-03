'use client'

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  DollarSign,
  Download,
  Filter,
  Package,
  RefreshCw,
  Target,
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
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  className?: string;
}

interface RevenueComparisonItem {
  point: number;
  predicted: number;
  actual: number;
  variance: number;
}

const revenueComparisonData: RevenueComparisonItem[] = [
  { point: 1, predicted: 45000, actual: 42000, variance: -3000 },
  { point: 2, predicted: 52000, actual: 55000, variance: 3000 },
  { point: 3, predicted: 48000, actual: 46500, variance: -1500 },
  { point: 4, predicted: 61000, actual: 63500, variance: 2500 },
  { point: 5, predicted: 55000, actual: 53200, variance: -1800 },
  { point: 6, predicted: 67000, actual: 69800, variance: 2800 },
];

// Price trend data with 35% margin
const priceTrendData = [
  { month: 'Jan', avgPrice: 45.20, avgCost: 29.38, margin: 35.0 },
  { month: 'Feb', avgPrice: 47.80, avgCost: 31.07, margin: 35.0 },
  { month: 'Mar', avgPrice: 46.50, avgCost: 30.23, margin: 35.0 },
  { month: 'Apr', avgPrice: 49.20, avgCost: 31.98, margin: 35.0 },
  { month: 'May', avgPrice: 48.90, avgCost: 31.79, margin: 35.0 },
  { month: 'Jun', avgPrice: 51.30, avgCost: 33.35, margin: 35.0 },
];

// Performance metrics
const performanceData = [
  { category: 'Electronics', predicted: 25000, actual: 27500, accuracy: 90 },
  { category: 'Clothing', predicted: 18000, actual: 16800, accuracy: 93 },
  { category: 'Home & Garden', predicted: 12000, actual: 11200, accuracy: 93 },
  { category: 'Sports', predicted: 8000, actual: 8900, accuracy: 89 },
  { category: 'Books', predicted: 5000, actual: 4800, accuracy: 96 },
]

// Forecast accuracy over time
const accuracyData = [
  { month: 'Jan', accuracy: 87, confidence: 0.82 },
  { month: 'Feb', accuracy: 92, confidence: 0.89 },
  { month: 'Mar', accuracy: 89, confidence: 0.85 },
  { month: 'Apr', accuracy: 94, confidence: 0.91 },
  { month: 'May', accuracy: 91, confidence: 0.88 },
  { month: 'Jun', accuracy: 93, confidence: 0.9 },
]

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
} as const;

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
} as const;

function StatsCard({ title, value, subValue, change, trend, icon: Icon, variant = 'default' }: StatsCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'danger':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  return (
    <div className={`p-6 rounded-lg border shadow-sm ${getVariantStyles()}`}>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          <p className='text-2xl font-bold text-gray-900 mt-1'>{value}</p>
          {subValue && <p className='text-sm text-gray-500 mt-1'>{subValue}</p>}
          {change && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {trend === 'up' && <TrendingUp className='h-4 w-4 mr-1' />}
              {trend === 'down' && <TrendingDown className='h-4 w-4 mr-1' />}
              {change}
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${
            variant === 'success'
              ? 'bg-green-100'
              : variant === 'warning'
                ? 'bg-yellow-100'
                : variant === 'danger'
                  ? 'bg-red-100'
                  : trend === 'up'
                    ? 'bg-green-100'
                    : 'bg-blue-100'
          }`}
        >
          <Icon
            className={`h-6 w-6 ${
              variant === 'success'
                ? 'text-green-600'
                : variant === 'warning'
                  ? 'text-yellow-600'
                  : variant === 'danger'
                    ? 'text-red-600'
                    : trend === 'up'
                      ? 'text-green-600'
                      : 'text-blue-600'
            }`}
          />
        </div>
      </div>
    </div>
  )
}

function Card({ title, subtitle, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className='p-6 pb-4'>
          {title && <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>}
          {subtitle && <p className='text-sm text-gray-600 mt-1'>{subtitle}</p>}
        </div>
      )}
      <div className='p-6 pt-0'>{children}</div>
    </div>
  )
}

function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface TrendData {
  current_month?: string;
  previous_month?: string;
  trend_percentage?: number;
  current_month_total?: number;
  previous_month_total?: number;
}

export default function RevenueAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m');
  const [viewType, setViewType] = useState('overview');
  const [sum, setSum] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendData>({});
  const [trendError, setTrendError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<Array<{ point: number; sum: number; predrev: number }>>([]);
  const [priceData, setPriceData] = useState(priceTrendData);
  const [predrev, setPredictedRevenue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchSum(),
          fetchPrediction(),
          fetchTrend()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this only runs once on mount

  const fetchSum = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSum(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrediction = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics-prediction`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Prediction:', data);
      setPredictedRevenue(data.predicted_revenue);  // assuming it's { "predicted_revenue": number }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchTrend = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics-trend`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Trend data:', data);
      setTrendData(data);
    } catch (err) {
      setTrendError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  useEffect(() => {
    // Create simple trend data based on actual and predicted values
    if (sum && predrev) {
      const newRevenueData = [
        { point: 1, sum: sum, predrev: predrev * 0.9 },
        { point: 2, sum: sum * 1.1, predrev: predrev }
      ];
      setRevenueData(newRevenueData);
    }
  }, [sum, predrev, trendData]);

  // Calculate actual revenue by summing existing actual values + the fetched total sum:
  const actualRevenue = Number(sum);
  const predictedRevenue = Number(predrev);
  const forecastAccuracy = predictedRevenue !== 0
    ? Number((predictedRevenue / actualRevenue).toPrecision(7))
    : 0;

  const avgVariance = revenueComparisonData
    .map(d => d.variance)
    .reduce((sum, variance) => sum + Math.abs(variance), 0) / revenueComparisonData.length;

  if (loading) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/3 mb-6'></div>
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
    <div className='p-6 max-w-7xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Revenue Analytics</h1>
          <p className='text-gray-600 mt-1'>
            Compare predictions with actual performance and track price trends
          </p>
        </div>
        <div className='flex items-center space-x-3 mt-4 sm:mt-0'>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='3m'>Last 3 Months</option>
            <option value='6m'>Last 6 Months</option>
            <option value='12m'>Last Year</option>
            <option value='24m'>Last 2 Years</option>
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
          title='Actual Revenue'
          value={`€${actualRevenue.toLocaleString()}`}
          subValue={`${trendData.current_month || 'Current month'}`}
          change={trendData.trend_percentage != null ? `${trendData.trend_percentage > 0 ? '+' : ''}${trendData.trend_percentage.toFixed(1)}% vs last month` : 'Calculating...'}
          trend={trendData.trend_percentage != null && trendData.trend_percentage > 0 ? 'up' : 'down'}
          icon={DollarSign}
          variant={trendData.trend_percentage != null && trendData.trend_percentage > 0 ? 'success' : 'danger'}
        />
        <StatsCard
          title="Predicted Revenue"
          value={predictedRevenue !== null ? `€${predictedRevenue.toLocaleString()}` : 'N/A'}
          subValue="Current month"
          change={`${((predictedRevenue - actualRevenue) / actualRevenue * 100).toFixed(1)}% variance`}
          icon={Target}
          trend={predictedRevenue > actualRevenue ? 'up' : 'down'}
        />
        <StatsCard
          title='Forecast Accuracy'
          value={`${forecastAccuracy}%`}
          subValue="Current month"
          change={`vs ${trendData.previous_month || 'last month'}`}
          trend={forecastAccuracy >= 90 ? 'up' : 'down'}
          icon={CheckCircle}
          variant={forecastAccuracy >= 90 ? 'success' : 'warning'}
        />
        <StatsCard
          title="Price Trend"
          value={`€${trendData.current_month_total?.toLocaleString() || '0'}`}
          subValue={`vs €${trendData.previous_month_total?.toLocaleString() || '0'}`}
          change={trendData.trend_percentage != null ? `${trendData.trend_percentage > 0 ? '+' : ''}${trendData.trend_percentage.toFixed(1)}% growth` : 'Calculating...'}
          trend={trendData.trend_percentage != null && trendData.trend_percentage > 0 ? 'up' : 'down'}
          icon={TrendingUp}
          variant={trendData.trend_percentage != null && trendData.trend_percentage > 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Main Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Revenue Prediction vs Actual */}
        <Card title="Revenue: Predicted vs Actual" subtitle="Trend comparison">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={revenueData.length > 0 ? revenueData : revenueComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="point" label={{ value: 'Time', position: 'bottom' }} />
              <YAxis tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value, name) => [
                  `€${value.toLocaleString()}`,
                  name === 'predicted' ? 'Predicted Revenue' : 'Actual Revenue'
                ]}
                labelFormatter={(label) => `Point ${label}`}
              />
              <Legend />
              <Line type="monotone" dataKey="sum" stroke="#8884d8" name="Actual Revenue" />
              <Line type="monotone" dataKey="predrev" stroke="#82ca9d" name="Predicted Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Price Trends & Margins */}
        <Card title="Price Trends & Profit Margins" subtitle="Average selling price and margin evolution">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="price" orientation="left" tickFormatter={(value) => `€${value}`} />
              <YAxis yAxisId="margin" orientation="right" tickFormatter={(value) => `${value}%`} domain={[0, 40]} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'margin') return [`${value}%`, 'Profit Margin']
                  return [`€${value}`, name === 'avgPrice' ? 'Avg Price' : 'Avg Cost']
                }}
              />
              <Legend />
              <Area
                yAxisId='price'
                type='monotone'
                dataKey='avgCost'
                stackId='1'
                stroke='#EF4444'
                fill='#FEE2E2'
                name='Average Cost'
              />
              <Area
                yAxisId='price'
                type='monotone'
                dataKey='avgPrice'
                stroke='#3B82F6'
                fill='#DBEAFE'
                name='Average Price'
              />
              <Line
                yAxisId='margin'
                type='monotone'
                dataKey='margin'
                stroke='#F59E0B'
                strokeWidth={3}
                name='Profit Margin %'
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Category Performance */}
        <Card
          title='Prediction Accuracy by Category'
          subtitle='How well we predict revenue by product category'
        >
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='category' angle={-45} textAnchor='end' height={100} />
              <YAxis
                yAxisId='revenue'
                orientation='left'
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId='accuracy'
                orientation='right'
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'accuracy') return [`${value}%`, 'Accuracy']
                  return [
                    `€${value.toLocaleString()}`,
                    name === 'predicted' ? 'Predicted' : 'Actual',
                  ]
                }}
              />
              <Bar yAxisId='revenue' dataKey='predicted' fill='#94A3B8' name='Predicted' />
              <Bar yAxisId='revenue' dataKey='actual' fill='#3B82F6' name='Actual' />
              <Line
                yAxisId='accuracy'
                type='monotone'
                dataKey='accuracy'
                stroke='#10B981'
                strokeWidth={2}
                name='Accuracy %'
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Forecast Accuracy Trend */}
        <Card
          title='Forecast Accuracy Over Time'
          subtitle='Model performance and confidence levels'
        >
          <ResponsiveContainer width='100%' height={300}>
            <AreaChart data={accuracyData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='month' />
              <YAxis domain={[80, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip
                formatter={(value, name: string) => [
                  typeof value === 'number' ? (name === 'confidence' ? `${(value * 100).toFixed(1)}%` : `${value}%`) : `${value}`,
                  name === 'confidence' ? 'Confidence Level' : 'Accuracy',
                ]}
              />
              <ReferenceLine y={90} stroke='#EF4444' strokeDasharray='3 3' label='Target: 90%' />
              <Area
                type='monotone'
                dataKey='accuracy'
                stroke='#10B981'
                fill='#DCFCE7'
                name='Accuracy %'
              />
              <Line
                type='monotone'
                dataKey='confidence'
                stroke='#F59E0B'
                strokeWidth={2}
                name='Confidence Level'
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Insights and Actions */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <Card title='Key Insights' subtitle='' className='lg:col-span-2'>
          <div className='space-y-4'>
            <div className='flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200'>
              <CheckCircle className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
              <div>
                <p className='font-medium text-green-800'>Strong forecast accuracy maintained</p>
                <p className='text-sm text-green-700 mt-1'>
                  Current accuracy of 93% exceeds target threshold. Model reliability is improving
                  month over month.
                </p>
              </div>
            </div>

            <div className='flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <TrendingUp className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
              <div>
                <p className='font-medium text-blue-800'>Revenue outperforming predictions</p>
                <p className='text-sm text-blue-700 mt-1'>
                  Actual revenue is 12.5% higher than predicted, indicating conservative forecasting
                  or market growth.
                </p>
              </div>
            </div>

            <div className='flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
              <AlertTriangle className='h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0' />
              <div>
                <p className='font-medium text-yellow-800'>
                  Electronics category shows higher variance
                </p>
                <p className='text-sm text-yellow-700 mt-1'>
                  While overall accuracy is good, electronics predictions have 10% variance -
                  consider seasonal adjustments.
                </p>
              </div>
            </div>

            <div className='flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200'>
              <BarChart3 className='h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0' />
              <div>
                <p className='font-medium text-purple-800'>Profit margins stabilizing</p>
                <p className='text-sm text-purple-700 mt-1'>
                  Margin consistency at ~39% suggests good pricing strategy and cost control
                  measures.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card title='Quick Actions' subtitle=''>
          <div className='space-y-3'>
            <Button className='w-full justify-start text-left' variant='secondary'>
              <Target className='h-4 w-4 mr-2 flex-shrink-0' />
              <span>Adjust Forecast Model</span>
            </Button>
            <Button className='w-full justify-start text-left' variant='secondary'>
              <TrendingUp className='h-4 w-4 mr-2 flex-shrink-0' />
              <span>Analyze Price Elasticity</span>
            </Button>
            <Button className='w-full justify-start text-left' variant='secondary'>
              <Calendar className='h-4 w-4 mr-2 flex-shrink-0' />
              <span>Schedule Revenue Review</span>
            </Button>
            <Button className='w-full justify-start text-left' variant='secondary'>
              <Users className='h-4 w-4 mr-2 flex-shrink-0' />
              <span>Segment Analysis</span>
            </Button>
            <Button className='w-full justify-start text-left' variant='primary'>
              <Package className='h-4 w-4 mr-2 flex-shrink-0' />
              <span>Create Forecast Report</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
