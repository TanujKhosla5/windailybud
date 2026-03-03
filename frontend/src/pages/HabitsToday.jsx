import { useState, useEffect } from 'react';
import { habitsApi, habitLogsApi } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { 
  CalendarDays, 
  ChevronRight,
  Pill,
  Dumbbell,
  Brain,
  Wind,
  Heart,
  Users,
  BookOpen,
  Droplets
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';

const CATEGORY_CONFIG = {
  supplementation: { icon: Pill, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  physical: { icon: Dumbbell, color: 'text-red-400', bg: 'bg-red-500/10' },
  brain: { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  lung: { icon: Wind, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  mental: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  social: { icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  learning: { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  water_intake: { icon: Droplets, color: 'text-sky-400', bg: 'bg-sky-500/10' },
};

const CATEGORY_LABELS = {
  supplementation: 'Supplementation',
  physical: 'Physical Health',
  brain: 'Brain Health',
  lung: 'Lung Health',
  mental: 'Mental Health',
  social: 'Social',
  learning: 'Learning',
  water_intake: 'Water Intake',
};

const DAY_MAP = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
};

export default function HabitsToday() {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedCategories, setExpandedCategories] = useState({
    supplementation: true,
    physical: true,
    brain: true,
    lung: true,
    mental: true,
    social: true,
    learning: true,
    water_intake: true
  });

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayName = DAY_MAP[selectedDate.getDay()];

  const fetchData = async () => {
    try {
      const [habitsRes, logsRes] = await Promise.all([
        habitsApi.getAll(),
        habitLogsApi.getAll({ start_date: dateStr, end_date: dateStr })
      ]);
      setHabits(habitsRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateStr]);

  const handleLogHabit = async (habit, isDone, percentAchieved = 100) => {
    try {
      await habitLogsApi.create({
        habit_id: habit.id,
        log_date: dateStr,
        is_done: isDone,
        percent_achieved: percentAchieved
      });
      fetchData();
      toast.success(isDone ? 'Habit completed!' : 'Habit logged');
    } catch (error) {
      toast.error('Failed to log habit');
    }
  };

  const getHabitLog = (habitId) => {
    return logs.find(l => l.habit_id === habitId);
  };

  // Filter habits that are active and targeted for this day
  const filteredHabits = habits.filter(h => 
    h.is_active && h.target_days.includes(dayName)
  );

  // Group by category
  const habitsByCategory = {};
  filteredHabits.forEach(habit => {
    if (!habitsByCategory[habit.category]) {
      habitsByCategory[habit.category] = [];
    }
    habitsByCategory[habit.category].push(habit);
  });

  // Calculate completion stats
  const totalHabits = filteredHabits.length;
  const completedHabits = filteredHabits.filter(h => getHabitLog(h.id)?.is_done).length;
  const completionPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-100 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Daily Habits</h1>
          <p className="text-sm text-zinc-500">
            {isToday(selectedDate) ? "Today's" : format(selectedDate, 'MMM d')} check-in
          </p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-zinc-900 border-zinc-800" data-testid="date-picker-btn">
              <CalendarDays className="w-4 h-4 mr-2" />
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Daily Summary Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-zinc-100">{completedHabits}/{totalHabits}</p>
              <p className="text-sm text-zinc-500">habits completed</p>
            </div>
            <div className="w-20 h-20 relative">
              <svg className="w-20 h-20 progress-ring">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - completionPercent / 100)}`}
                  strokeLinecap="round"
                  className="progress-ring-circle"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-zinc-100">
                {completionPercent}%
              </span>
            </div>
          </div>
          <Progress value={completionPercent} className="h-2 bg-zinc-800" />
        </CardContent>
      </Card>

      {/* Habits by Category */}
      {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
        const categoryHabits = habitsByCategory[category] || [];
        if (categoryHabits.length === 0) return null;
        
        const config = CATEGORY_CONFIG[category];
        const Icon = config.icon;
        const categoryCompleted = categoryHabits.filter(h => getHabitLog(h.id)?.is_done).length;
        
        return (
          <Collapsible
            key={category}
            open={expandedCategories[category]}
            onOpenChange={(open) => setExpandedCategories({ ...expandedCategories, [category]: open })}
          >
            <Card className="bg-zinc-900 border-zinc-800">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-zinc-800/50 transition-colors rounded-t-lg">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <span className="text-zinc-100">{label}</span>
                        <p className="text-xs text-zinc-500 font-normal">
                          {categoryCompleted}/{categoryHabits.length} completed
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-zinc-500 transition-transform ${expandedCategories[category] ? 'rotate-90' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="divide-y divide-zinc-800">
                    {categoryHabits.map(habit => {
                      const log = getHabitLog(habit.id);
                      const isDone = log?.is_done;
                      const percent = log?.percent_achieved || 0;
                      
                      return (
                        <HabitRow
                          key={habit.id}
                          habit={habit}
                          isDone={isDone}
                          onComplete={() => handleLogHabit(habit, true, 100)}
                          onSkip={() => handleLogHabit(habit, false, 0)}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      {totalHabits === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <CalendarDays className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No habits scheduled for {dayName}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HabitRow({ habit, isDone, onComplete, onSkip }) {
  const isSupplementation = habit.category === 'supplementation';
  const hasResponse = isDone !== undefined;

  const getTargetDisplay = () => {
    if (isSupplementation && habit.dose_tablets && habit.dose_per_tablet) {
      const total = habit.dose_tablets * habit.dose_per_tablet;
      return `${total}${habit.dose_unit || 'mg'}`;
    }
    return `${habit.target_per_session} ${habit.unit}`;
  };

  return (
    <div className="py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-zinc-100">{habit.name}</h4>
          <p className="text-sm text-zinc-500">Target: {getTargetDisplay()}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onSkip}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasResponse && !isDone
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-transparent'
            }`}
            data-testid={`habit-skip-${habit.id}`}
          >
            {isSupplementation ? 'Not Taken' : 'Not Done'}
          </button>
          
          <button
            onClick={onComplete}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDone
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-transparent'
            }`}
            data-testid={`habit-complete-${habit.id}`}
          >
            {isSupplementation ? 'Taken' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
