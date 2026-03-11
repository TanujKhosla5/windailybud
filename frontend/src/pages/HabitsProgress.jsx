import { useState, useEffect } from 'react';
import { analyticsApi, habitsApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { 
  TrendingUp,
  Award,
  Calendar,
  Pill,
  Dumbbell,
  Brain,
  Wind,
  Heart,
  Users,
  BookOpen,
  Droplets
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

const CATEGORY_CONFIG = {
  supplementation: { icon: Pill, color: '#f59e0b', label: 'Supplementation' },
  physical: { icon: Dumbbell, color: '#ef4444', label: 'Physical Health' },
  brain: { icon: Brain, color: '#8b5cf6', label: 'Brain Health' },
  lung: { icon: Wind, color: '#06b6d4', label: 'Lung Health' },
  mental: { icon: Heart, color: '#ec4899', label: 'Mental Health' },
  social: { icon: Users, color: '#10b981', label: 'Social' },
  learning: { icon: BookOpen, color: '#3b82f6', label: 'Learning' },
  water_intake: { icon: Droplets, color: '#0ea5e9', label: 'Water Intake' },
};

export default function HabitsProgress() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');

  const getDateRange = () => {
    const end = new Date();
    let start;
    
    if (dateRange === 'week') {
      start = startOfWeek(end);
    } else if (dateRange === 'month') {
      start = subDays(end, 30);
    } else {
      start = subDays(end, 90);
    }
    
    return {
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd')
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { start_date, end_date } = getDateRange();
      const res = await analyticsApi.getHabits({ start_date, end_date });
      setAnalytics(res.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-100 rounded-full animate-spin" />
      </div>
    );
  }

  const categoryData = Object.entries(analytics?.categories || {}).map(([key, value]) => ({
    name: CATEGORY_CONFIG[key]?.label || key,
    score: value,
    color: CATEGORY_CONFIG[key]?.color || '#71717a'
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">My Progress</h1>
          <p className="text-sm text-zinc-500">Track your habit consistency</p>
        </div>
        
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800" data-testid="date-range-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 relative">
              <svg className="w-24 h-24 progress-ring">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - (analytics?.overall_score || 0) / 100)}`}
                  strokeLinecap="round"
                  className="progress-ring-circle"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center">
                <Award className="w-10 h-10 text-emerald-400" />
              </span>
            </div>
            <div>
              <p className="text-4xl font-bold text-zinc-100">{analytics?.overall_score || 0}%</p>
              <p className="text-zinc-500">Overall Score</p>
              <p className="text-sm text-zinc-600 mt-1">
                Based on {analytics?.habits?.length || 0} active habits
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const score = analytics?.categories?.[key] || 0;
          const Icon = config.icon;
          
          return (
            <Card key={key} className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-100">{config.label}</p>
                  </div>
                  <span className="text-2xl font-bold text-zinc-100">{score}%</span>
                </div>
                <Progress 
                  value={score} 
                  className="h-2 bg-zinc-800"
                  style={{ '--progress-color': config.color }}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Chart */}
      {categoryData.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" domain={[0, 100]} stroke="#52525b" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    stroke="#52525b"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fafafa' }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Habit Scores */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Habit Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
            <span className="text-sm font-medium text-zinc-400">Habit</span>
            <span className="text-sm font-medium text-zinc-400">Weekly Target %</span>
          </div>
          <div className="space-y-4">
            {analytics?.habits?.map(habit => {
              const config = CATEGORY_CONFIG[habit.category];
              
              return (
                <div key={habit.habit_id} className="flex items-center gap-4">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${config?.color || '#71717a'}20` }}
                  >
                    {config?.icon && <config.icon className="w-4 h-4" style={{ color: config.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-zinc-100 truncate">{habit.habit_name}</p>
                      <span className="text-sm font-medium text-zinc-400 ml-2">
                        {habit.overall_score}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>Frequency: {habit.frequency_score}%</span>
                      <span>Volume: {habit.volume_score}%</span>
                      <span>{habit.days_completed}/{habit.days_targeted} days</span>
                    </div>
                    <Progress 
                      value={habit.overall_score} 
                      className="h-1.5 mt-2 bg-zinc-800"
                    />
                  </div>
                </div>
              );
            })}
            
            {(!analytics?.habits || analytics.habits.length === 0) && (
              <p className="text-center text-zinc-500 py-8">
                No habit data for this period
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
