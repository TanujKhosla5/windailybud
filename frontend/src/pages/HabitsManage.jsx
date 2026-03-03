import { useState, useEffect } from 'react';
import { habitsApi } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Plus,
  Settings,
  Trash2,
  Pencil,
  Pill,
  Dumbbell,
  Brain,
  Wind,
  Heart,
  Users,
  BookOpen,
  Droplets
} from 'lucide-react';

const CATEGORY_CONFIG = {
  supplementation: { icon: Pill, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Supplementation' },
  physical: { icon: Dumbbell, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Physical Health' },
  brain: { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Brain Health' },
  lung: { icon: Wind, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Lung Health' },
  mental: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Mental Health' },
  social: { icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Social' },
  learning: { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Learning' },
  water_intake: { icon: Droplets, color: 'text-sky-400', bg: 'bg-sky-500/10', label: 'Water Intake' },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const UNITS = [
  { value: 'count', label: 'Count' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'km', label: 'Kilometres' },
  { value: 'reps', label: 'Reps' },
  { value: 'sets', label: 'Sets' },
];

const WATER_UNITS = [
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'l', label: 'Litres (l)' },
];

export default function HabitsManage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('supplementation');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabit, setNewHabit] = useState({
    name: '',
    category: 'supplementation',
    goal_days_per_week: 7,
    unit: 'count',
    target_per_session: 1,
    target_days: [...DAYS],
    dose_tablets: null,
    dose_per_tablet: null,
    dose_unit: 'mg',
    water_target: null,
    water_unit: 'ml'
  });

  const fetchHabits = async () => {
    try {
      const res = await habitsApi.getAll();
      setHabits(res.data);
    } catch (error) {
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleCreate = async () => {
    if (!newHabit.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await habitsApi.create({
        ...newHabit,
        category: activeCategory
      });
      setDialogOpen(false);
      resetForm();
      fetchHabits();
      toast.success('Habit created');
    } catch (error) {
      toast.error('Failed to create habit');
    }
  };

  const handleUpdate = async () => {
    if (!editingHabit) return;
    try {
      await habitsApi.update(editingHabit.id, editingHabit);
      setEditingHabit(null);
      fetchHabits();
      toast.success('Habit updated');
    } catch (error) {
      toast.error('Failed to update habit');
    }
  };

  const handleToggleActive = async (habit) => {
    try {
      await habitsApi.update(habit.id, { is_active: !habit.is_active });
      fetchHabits();
      toast.success(habit.is_active ? 'Habit paused' : 'Habit activated');
    } catch (error) {
      toast.error('Failed to update habit');
    }
  };

  const handleDelete = async (habitId) => {
    try {
      await habitsApi.delete(habitId);
      fetchHabits();
      toast.success('Habit deleted');
    } catch (error) {
      toast.error('Failed to delete habit');
    }
  };

  const resetForm = () => {
    setNewHabit({
      name: '',
      category: activeCategory,
      goal_days_per_week: 7,
      unit: 'count',
      target_per_session: 1,
      target_days: [...DAYS],
      dose_tablets: null,
      dose_per_tablet: null,
      dose_unit: 'mg'
    });
  };

  const toggleDay = (day, isNew = true) => {
    if (isNew) {
      const days = newHabit.target_days.includes(day)
        ? newHabit.target_days.filter(d => d !== day)
        : [...newHabit.target_days, day];
      setNewHabit({ ...newHabit, target_days: days });
    } else if (editingHabit) {
      const days = editingHabit.target_days.includes(day)
        ? editingHabit.target_days.filter(d => d !== day)
        : [...editingHabit.target_days, day];
      setEditingHabit({ ...editingHabit, target_days: days });
    }
  };

  const filteredHabits = habits.filter(h => h.category === activeCategory);

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
          <h1 className="text-2xl font-bold text-zinc-100">Manage Habits</h1>
          <p className="text-sm text-zinc-500">Configure your daily habits</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200" data-testid="add-habit-btn">
              <Plus className="w-4 h-4 mr-2" /> Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">Category</Label>
                <Select value={activeCategory} onValueChange={(v) => {
                  setActiveCategory(v);
                  setNewHabit({ ...newHabit, category: v });
                }}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-zinc-300">Name *</Label>
                <Input
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="Habit name"
                  className="bg-zinc-950 border-zinc-800"
                  data-testid="habit-name-input"
                />
              </div>
              
              <div>
                <Label className="text-zinc-300">Goal (days/week)</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={newHabit.goal_days_per_week}
                  onChange={(e) => setNewHabit({ ...newHabit, goal_days_per_week: parseInt(e.target.value) || 7 })}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
              
              {activeCategory !== 'supplementation' && activeCategory !== 'social' && activeCategory !== 'water_intake' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-300">Target per Session</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newHabit.target_per_session}
                        onChange={(e) => setNewHabit({ ...newHabit, target_per_session: parseFloat(e.target.value) || 1 })}
                        className="bg-zinc-950 border-zinc-800"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Unit</Label>
                      <Select value={newHabit.unit} onValueChange={(v) => setNewHabit({ ...newHabit, unit: v })}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {UNITS.map(u => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              
              {activeCategory === 'supplementation' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-zinc-300">Tablets per day</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newHabit.dose_tablets || ''}
                        onChange={(e) => setNewHabit({ ...newHabit, dose_tablets: parseInt(e.target.value) || null })}
                        className="bg-zinc-950 border-zinc-800"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Dose per tablet</Label>
                      <Input
                        type="number"
                        min={0}
                        value={newHabit.dose_per_tablet || ''}
                        onChange={(e) => setNewHabit({ ...newHabit, dose_per_tablet: parseFloat(e.target.value) || null })}
                        className="bg-zinc-950 border-zinc-800"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Unit</Label>
                      <Select value={newHabit.dose_unit || 'mg'} onValueChange={(v) => setNewHabit({ ...newHabit, dose_unit: v })}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          <SelectItem value="mg">mg</SelectItem>
                          <SelectItem value="mcg">mcg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newHabit.dose_tablets && newHabit.dose_per_tablet && (
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <Label className="text-zinc-400 text-sm">Total dose per day</Label>
                      <p className="text-lg font-semibold text-zinc-100">
                        {newHabit.dose_tablets * newHabit.dose_per_tablet} {newHabit.dose_unit || 'mg'}
                      </p>
                    </div>
                  )}
                </>
              )}
              
              {activeCategory === 'water_intake' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-300">Target per day</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newHabit.water_target || ''}
                        onChange={(e) => setNewHabit({ ...newHabit, water_target: parseFloat(e.target.value) || null })}
                        className="bg-zinc-950 border-zinc-800"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Unit</Label>
                      <Select value={newHabit.water_unit || 'ml'} onValueChange={(v) => setNewHabit({ ...newHabit, water_unit: v })}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {WATER_UNITS.map(u => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              
              {activeCategory !== 'water_intake' && (
                <div>
                  <Label className="text-zinc-300">Target Days</Label>
                  <div className="flex gap-2 mt-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day, true)}
                        className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                          newHabit.target_days.includes(day)
                            ? 'bg-zinc-100 text-zinc-950'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-zinc-700">
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200" data-testid="create-habit-btn">
                  Create Habit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-zinc-800/50 flex-wrap h-auto gap-1 p-1">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const count = habits.filter(h => h.category === key).length;
            return (
              <TabsTrigger 
                key={key} 
                value={key}
                className="data-[state=active]:bg-zinc-700 flex items-center gap-2"
                data-testid={`category-tab-${key}`}
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className="hidden sm:inline">{config.label}</span>
                <span className="text-xs text-zinc-500">({count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(CATEGORY_CONFIG).map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="space-y-3">
              {filteredHabits.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-zinc-500">No habits in this category</p>
                  </CardContent>
                </Card>
              ) : (
                filteredHabits.map(habit => (
                  <Card key={habit.id} className={`bg-zinc-900 border-zinc-800 ${!habit.is_active ? 'opacity-50' : ''}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <Switch
                            checked={habit.is_active}
                            onCheckedChange={() => handleToggleActive(habit)}
                            data-testid={`habit-active-${habit.id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-zinc-100 truncate">{habit.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-zinc-500">
                              <span>{habit.target_per_session} {habit.unit}</span>
                              <span>{habit.goal_days_per_week}x/week</span>
                              {habit.dose_tablets && habit.dose_per_tablet && (
                                <span>{habit.dose_tablets * habit.dose_per_tablet}{habit.dose_unit}</span>
                              )}
                            </div>
                            <div className="flex gap-1 mt-2">
                              {DAYS.map(day => (
                                <span
                                  key={day}
                                  className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                                    habit.target_days.includes(day)
                                      ? 'bg-zinc-700 text-zinc-300'
                                      : 'bg-zinc-900 text-zinc-600'
                                  }`}
                                >
                                  {day.charAt(0)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingHabit(habit)}
                            className="h-8 w-8"
                            data-testid={`edit-habit-${habit.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {!habit.is_default && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(habit.id)}
                              className="h-8 w-8 text-red-400 hover:text-red-300"
                              data-testid={`delete-habit-${habit.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={(open) => !open && setEditingHabit(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Edit Habit</DialogTitle>
          </DialogHeader>
          {editingHabit && (
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">Name</Label>
                <Input
                  value={editingHabit.name}
                  onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
              
              <div>
                <Label className="text-zinc-300">Goal (days/week)</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={editingHabit.goal_days_per_week}
                  onChange={(e) => setEditingHabit({ ...editingHabit, goal_days_per_week: parseInt(e.target.value) || 7 })}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
              
              {editingHabit.category !== 'supplementation' && editingHabit.category !== 'social' && editingHabit.category !== 'water_intake' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-300">Target per Session</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editingHabit.target_per_session}
                        onChange={(e) => setEditingHabit({ ...editingHabit, target_per_session: parseFloat(e.target.value) || 1 })}
                        className="bg-zinc-950 border-zinc-800"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Unit</Label>
                      <Select value={editingHabit.unit} onValueChange={(v) => setEditingHabit({ ...editingHabit, unit: v })}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {UNITS.map(u => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              
              {editingHabit.category === 'supplementation' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-zinc-300">Tablets per day</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editingHabit.dose_tablets || ''}
                        onChange={(e) => setEditingHabit({ ...editingHabit, dose_tablets: parseInt(e.target.value) || null })}
                        className="bg-zinc-950 border-zinc-800"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Dose per tablet</Label>
                      <Input
                        type="number"
                        min={0}
                        value={editingHabit.dose_per_tablet || ''}
                        onChange={(e) => setEditingHabit({ ...editingHabit, dose_per_tablet: parseFloat(e.target.value) || null })}
                        className="bg-zinc-950 border-zinc-800"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Unit</Label>
                      <Select value={editingHabit.dose_unit || 'mg'} onValueChange={(v) => setEditingHabit({ ...editingHabit, dose_unit: v })}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          <SelectItem value="mg">mg</SelectItem>
                          <SelectItem value="mcg">mcg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {editingHabit.dose_tablets && editingHabit.dose_per_tablet && (
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <Label className="text-zinc-400 text-sm">Total dose per day</Label>
                      <p className="text-lg font-semibold text-zinc-100">
                        {editingHabit.dose_tablets * editingHabit.dose_per_tablet} {editingHabit.dose_unit || 'mg'}
                      </p>
                    </div>
                  )}
                </>
              )}
              
              {editingHabit.category === 'water_intake' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-300">Target per day</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editingHabit.water_target || ''}
                        onChange={(e) => setEditingHabit({ ...editingHabit, water_target: parseFloat(e.target.value) || null })}
                        className="bg-zinc-950 border-zinc-800"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Unit</Label>
                      <Select value={editingHabit.water_unit || 'ml'} onValueChange={(v) => setEditingHabit({ ...editingHabit, water_unit: v })}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {WATER_UNITS.map(u => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              
              {editingHabit.category !== 'water_intake' && (
                <div>
                  <Label className="text-zinc-300">Target Days</Label>
                  <div className="flex gap-2 mt-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day, false)}
                        className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                          editingHabit.target_days.includes(day)
                            ? 'bg-zinc-100 text-zinc-950'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingHabit(null)} className="border-zinc-700">
                  Cancel
                </Button>
                <Button onClick={handleUpdate} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
