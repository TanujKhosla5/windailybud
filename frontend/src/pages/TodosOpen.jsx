import { useState, useEffect } from 'react';
import { todosApi, tagsApi } from '../lib/api';
import { useAnchor } from '../contexts/AnchorContext';
import BlitzMode from '../components/BlitzMode';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Plus, 
  Grid3X3, 
  List, 
  Flame, 
  Star, 
  Calendar as CalendarIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Zap,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { format } from 'date-fns';

const TIER_LABELS = {
  1: 'Tier 1 (High)',
  2: 'Tier 2 (Medium)',
  3: 'Tier 3 (Low)'
};

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', icon: Circle, class: 'text-blue-400' },
  in_progress: { label: 'In Progress', icon: Clock, class: 'text-amber-400' },
  closed: { label: 'Closed', icon: CheckCircle2, class: 'text-emerald-400' }
};

function getQuadrant(urgency, importance) {
  if (urgency <= 2 && importance <= 2) return 'do_first';
  if (urgency > 2 && importance <= 2) return 'schedule';
  if (urgency <= 2 && importance > 2) return 'delegate';
  return 'eliminate';
}

function TodoCard({ todo, tags, onUpdate, onDelete, isAnchor = false, isStale = false, dimmed = false, onSetAnchor }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(todo);

  const tagMap = {};
  tags.forEach(t => tagMap[t.label] = t);

  const handleStatusChange = async (newStatus) => {
    try {
      await todosApi.update(todo.id, { status: newStatus });
      onUpdate();
      toast.success(newStatus === 'closed' ? 'Task completed!' : 'Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSave = async () => {
    try {
      await todosApi.update(todo.id, editData);
      setEditing(false);
      onUpdate();
      toast.success('Task updated');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async () => {
    try {
      await todosApi.delete(todo.id);
      onDelete();
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const StatusIcon = STATUS_CONFIG[todo.status]?.icon || Circle;

  return (
    <div
      className={`task-card bg-zinc-900 border rounded-lg p-4 hover:border-zinc-700 transition-all relative ${
        isAnchor
          ? 'border-amber-500/60 ring-1 ring-amber-500/30 shadow-[0_0_20px_-8px_rgba(245,158,11,0.4)]'
          : isStale
          ? 'border-amber-500/30 animate-stale-pulse'
          : 'border-zinc-800'
      } ${dimmed ? 'opacity-50' : ''}`}
      data-testid={`todo-card-${todo.id}`}
    >
      {isAnchor && (
        <div className="absolute -top-2 -right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider shadow-md" data-testid={`anchor-badge-${todo.id}`}>
          <Flame className="w-3 h-3" /> Today's Anchor
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => handleStatusChange(todo.status === 'not_started' ? 'in_progress' : todo.status === 'in_progress' ? 'closed' : 'not_started')}
              className={`flex-shrink-0 ${STATUS_CONFIG[todo.status]?.class}`}
              data-testid={`status-toggle-${todo.id}`}
            >
              <StatusIcon className="w-5 h-5" />
            </button>
            <h3 className="font-medium text-zinc-100 truncate">{todo.title}</h3>
          </div>
          
          {todo.notes && (
            <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{todo.notes}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-2">
            {todo.tags?.map(tag => (
              <Badge key={tag} variant="outline" className={`tag-${tag.toLowerCase()} text-xs`}>
                {tag}
              </Badge>
            ))}
            
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Flame className="w-3 h-3 text-red-400" />
              <span>U{todo.urgency_tier}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Star className="w-3 h-3 text-blue-400" />
              <span>I{todo.importance_tier}</span>
            </div>
            
            {todo.urgency_date && (
              <span className="text-xs text-zinc-500">
                Due: {format(new Date(todo.urgency_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`todo-menu-${todo.id}`}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
            <DropdownMenuItem onClick={() => handleStatusChange('not_started')} className="cursor-pointer">
              <Circle className="w-4 h-4 mr-2 text-blue-400" /> Not Started
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('in_progress')} className="cursor-pointer">
              <Clock className="w-4 h-4 mr-2 text-amber-400" /> In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('closed')} className="cursor-pointer">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Mark Done
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {onSetAnchor && (
              <DropdownMenuItem onClick={() => onSetAnchor(todo.id)} className="cursor-pointer text-amber-400">
                <Flame className="w-4 h-4 mr-2" /> {isAnchor ? 'Already Anchor' : 'Set as Today\'s Anchor'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setEditing(true)} className="cursor-pointer">
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-400">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-300">Title</Label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div>
              <Label className="text-zinc-300">Notes</Label>
              <Textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300">Urgency</Label>
                <Select value={String(editData.urgency_tier)} onValueChange={(v) => setEditData({ ...editData, urgency_tier: parseInt(v) })}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="1">Tier 1 (High)</SelectItem>
                    <SelectItem value="2">Tier 2 (Medium)</SelectItem>
                    <SelectItem value="3">Tier 3 (Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Importance</Label>
                <Select value={String(editData.importance_tier)} onValueChange={(v) => setEditData({ ...editData, importance_tier: parseInt(v) })}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="1">Tier 1 (High)</SelectItem>
                    <SelectItem value="2">Tier 2 (Medium)</SelectItem>
                    <SelectItem value="3">Tier 3 (Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)} className="border-zinc-700">Cancel</Button>
              <Button onClick={handleSave} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TodosOpen() {
  const [todos, setTodos] = useState([]);
  const [oneMinTodos, setOneMinTodos] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('matrix');
  const [filterTag, setFilterTag] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem('windailybud_focus_mode') === '1');
  const [blitzOpen, setBlitzOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: urgent? 2: important? 3: details
  const [advanced, setAdvanced] = useState(false);
  const { anchor, setAnchorTodo, refresh: refreshAnchor } = useAnchor();
  const STALE_DAYS = parseInt(localStorage.getItem('windailybud_stale_days') || '2', 10);

  const [newTodo, setNewTodo] = useState({
    title: '',
    notes: '',
    tags: [],
    urgency_tier: 3,
    urgency_date: null,
    importance_tier: 3,
    importance_date: null
  });

  const fetchData = async () => {
    try {
      const [todosRes, oneMinRes, tagsRes] = await Promise.all([
        todosApi.getAll({ status: 'open', is_one_minute: false }),
        todosApi.getAll({ status: 'open', is_one_minute: true }),
        tagsApi.getAll()
      ]);
      setTodos(todosRes.data);
      setOneMinTodos(oneMinRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('windailybud_focus_mode', focusMode ? '1' : '0');
  }, [focusMode]);

  const handleSetAnchor = async (todoId) => {
    try {
      await setAnchorTodo(todoId);
      toast.success('Anchor set for today');
    } catch (e) {
      toast.error('Could not set anchor');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagInput.trim()) return;
    try {
      const response = await tagsApi.create({ label: newTagInput.trim() });
      setTags([...tags, response.data]);
      setNewTodo({ ...newTodo, tags: [...(newTodo.tags || []), newTagInput.trim()] });
      setNewTagInput('');
      toast.success('Tag created');
    } catch (error) {
      if (error.response?.data?.detail === 'Tag already exists') {
        // Tag exists, just add it to selection
        setNewTodo({ ...newTodo, tags: [...(newTodo.tags || []), newTagInput.trim()] });
        setNewTagInput('');
      } else {
        toast.error('Failed to create tag');
      }
    }
  };

  const handleCreate = async () => {
    if (!newTodo.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      await todosApi.create({
        ...newTodo,
        urgency_date: newTodo.urgency_date ? format(newTodo.urgency_date, 'yyyy-MM-dd') : null,
        importance_date: newTodo.importance_date ? format(newTodo.importance_date, 'yyyy-MM-dd') : null
      });
      setDialogOpen(false);
      setWizardStep(1);
      setAdvanced(false);
      setNewTodo({ title: '', notes: '', tags: [], urgency_tier: 3, urgency_date: null, importance_tier: 3, importance_date: null });
      fetchData();
      toast.success('Task created');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  // Capture-first: yes→tier 1, no→tier 3 (matches getQuadrant routing)
  const answerUrgent = (yes) => {
    setNewTodo({ ...newTodo, urgency_tier: yes ? 1 : 3 });
    setWizardStep(2);
  };
  const answerImportant = (yes) => {
    setNewTodo({ ...newTodo, importance_tier: yes ? 1 : 3 });
    setWizardStep(3);
  };

  const openCreateDialog = () => {
    setWizardStep(1);
    setAdvanced(false);
    setNewTodo({ title: '', notes: '', tags: [], urgency_tier: 3, urgency_date: null, importance_tier: 3, importance_date: null });
    setDialogOpen(true);
  };

  const filteredTodos = filterTag === 'all' 
    ? todos 
    : todos.filter(t => t.tags?.includes(filterTag));

  const filteredOneMin = filterTag === 'all'
    ? oneMinTodos
    : oneMinTodos.filter(t => t.tags?.includes(filterTag));

  const isStale = (todo) => {
    if (!todo.created_at || todo.status === 'closed') return false;
    const days = (Date.now() - new Date(todo.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > STALE_DAYS;
  };

  const quadrants = {
    do_first: filteredTodos.filter(t => getQuadrant(t.urgency_tier, t.importance_tier) === 'do_first'),
    schedule: filteredTodos.filter(t => getQuadrant(t.urgency_tier, t.importance_tier) === 'schedule'),
    delegate: filteredTodos.filter(t => getQuadrant(t.urgency_tier, t.importance_tier) === 'delegate'),
    eliminate: filteredTodos.filter(t => getQuadrant(t.urgency_tier, t.importance_tier) === 'eliminate'),
  };

  const cardProps = (todo, opts = {}) => ({
    todo,
    tags,
    onUpdate: () => { fetchData(); refreshAnchor(); },
    onDelete: () => { fetchData(); refreshAnchor(); },
    isAnchor: anchor?.todo_id === todo.id,
    isStale: opts.checkStale ? isStale(todo) : false,
    dimmed: focusMode && todo.status === 'closed',
    onSetAnchor: handleSetAnchor,
  });

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
          <h1 className="text-2xl font-bold text-zinc-100">Open Tasks</h1>
          <p className="text-sm text-zinc-500">{todos.length} tasks to complete</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800" data-testid="filter-tag-select">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map(tag => (
                <SelectItem key={tag.id} value={tag.label}>{tag.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <button
            onClick={() => setFocusMode((v) => !v)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              focusMode
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
            data-testid="focus-toggle-btn"
            title={focusMode ? 'Focus view on — Delegate & Later hidden' : 'Toggle focus view'}
          >
            <Eye className="w-3.5 h-3.5" /> {focusMode ? 'Focus On' : 'Focus'}
          </button>

          <Tabs value={view} onValueChange={setView} className="hidden sm:block">
            <TabsList className="bg-zinc-800/50">
              <TabsTrigger value="matrix" className="data-[state=active]:bg-zinc-700" data-testid="matrix-view-btn">
                <Grid3X3 className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-zinc-700" data-testid="list-view-btn">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); } else { openCreateDialog(); } }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200" data-testid="add-todo-btn">
                <Plus className="w-4 h-4 mr-2" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">
                  {wizardStep === 1 ? 'New task — Step 1 of 2' : wizardStep === 2 ? 'New task — Step 2 of 2' : 'Almost done'}
                </DialogTitle>
              </DialogHeader>

              {/* Step 1: Is it urgent? */}
              {wizardStep === 1 && (
                <div className="space-y-6 py-4" data-testid="wizard-step-urgent">
                  <div>
                    <Label className="text-zinc-300">What's the task?</Label>
                    <Input
                      autoFocus
                      value={newTodo.title}
                      onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                      placeholder="Just type it — sort it later"
                      className="bg-zinc-950 border-zinc-800 h-11 mt-1.5"
                      data-testid="new-todo-title"
                      onKeyDown={(e) => { if (e.key === 'Enter' && newTodo.title.trim()) setWizardStep(2); }}
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-400">Is this <span className="text-amber-300 font-medium">urgent</span>? (does it need attention soon?)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => answerUrgent(true)}
                        disabled={!newTodo.title.trim()}
                        className="py-4 rounded-lg border border-zinc-800 hover:border-red-500/50 bg-zinc-950 hover:bg-red-500/5 transition-colors text-zinc-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        data-testid="wizard-urgent-yes"
                      >
                        Yes, urgent
                      </button>
                      <button
                        type="button"
                        onClick={() => answerUrgent(false)}
                        disabled={!newTodo.title.trim()}
                        className="py-4 rounded-lg border border-zinc-800 hover:border-zinc-600 bg-zinc-950 hover:bg-zinc-900 transition-colors text-zinc-300 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        data-testid="wizard-urgent-no"
                      >
                        No, can wait
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Is it important? */}
              {wizardStep === 2 && (
                <div className="space-y-6 py-4" data-testid="wizard-step-important">
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm">
                    <span className="text-zinc-500">Task: </span>
                    <span className="text-zinc-200">{newTodo.title}</span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-400">Is this <span className="text-blue-300 font-medium">important</span>? (does it move you forward?)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => answerImportant(true)}
                        className="py-4 rounded-lg border border-zinc-800 hover:border-blue-500/50 bg-zinc-950 hover:bg-blue-500/5 transition-colors text-zinc-200 font-medium"
                        data-testid="wizard-important-yes"
                      >
                        Yes, important
                      </button>
                      <button
                        type="button"
                        onClick={() => answerImportant(false)}
                        className="py-4 rounded-lg border border-zinc-800 hover:border-zinc-600 bg-zinc-950 hover:bg-zinc-900 transition-colors text-zinc-300 font-medium"
                        data-testid="wizard-important-no"
                      >
                        Not really
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    ← back
                  </button>
                </div>
              )}

              {/* Step 3: Confirm + optional details */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500">Routing to: </span>
                      <span className="text-zinc-200 font-medium">
                        {getQuadrant(newTodo.urgency_tier, newTodo.importance_tier).replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <button onClick={() => setWizardStep(1)} className="text-xs text-zinc-500 hover:text-zinc-300" data-testid="wizard-restart">
                      Re-answer
                    </button>
                  </div>

                  <div>
                    <Label className="text-zinc-300">Notes (optional)</Label>
                    <Textarea
                      value={newTodo.notes}
                      onChange={(e) => setNewTodo({ ...newTodo, notes: e.target.value })}
                      placeholder="Additional details…"
                      className="bg-zinc-950 border-zinc-800"
                      data-testid="new-todo-notes"
                    />
                  </div>

                  <div>
                    <Label className="text-zinc-300">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => {
                            const current = newTodo.tags || [];
                            setNewTodo({
                              ...newTodo,
                              tags: current.includes(tag.label)
                                ? current.filter(t => t !== tag.label)
                                : [...current, tag.label]
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                            newTodo.tags?.includes(tag.label)
                              ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                          data-testid={`tag-${tag.label}`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Input
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="Add new tag..."
                        className="bg-zinc-950 border-zinc-800 flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateTag();
                          }
                        }}
                        data-testid="new-tag-input"
                      />
                      <Button
                        type="button"
                        onClick={handleCreateTag}
                        variant="outline"
                        className="border-zinc-700"
                        data-testid="add-tag-btn"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAdvanced((v) => !v)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                    data-testid="advanced-toggle-btn"
                  >
                    {advanced ? 'Hide advanced (tier U1/U2/U3 + dates)' : 'Show advanced (tier U1/U2/U3 + dates)'}
                  </button>

                  {advanced && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-zinc-300">Urgency Tier</Label>
                          <Select value={String(newTodo.urgency_tier)} onValueChange={(v) => setNewTodo({ ...newTodo, urgency_tier: parseInt(v) })}>
                            <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="new-todo-urgency">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                              <SelectItem value="1">Tier 1 (High)</SelectItem>
                              <SelectItem value="2">Tier 2 (Medium)</SelectItem>
                              <SelectItem value="3">Tier 3 (Low)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-zinc-300">Urgency Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal bg-zinc-950 border-zinc-800 text-zinc-400">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newTodo.urgency_date ? format(newTodo.urgency_date, 'MMM d, yyyy') : 'Pick date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                              <Calendar
                                mode="single"
                                selected={newTodo.urgency_date}
                                onSelect={(date) => setNewTodo({ ...newTodo, urgency_date: date })}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-zinc-300">Importance Tier</Label>
                          <Select value={String(newTodo.importance_tier)} onValueChange={(v) => setNewTodo({ ...newTodo, importance_tier: parseInt(v) })}>
                            <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="new-todo-importance">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                              <SelectItem value="1">Tier 1 (High)</SelectItem>
                              <SelectItem value="2">Tier 2 (Medium)</SelectItem>
                              <SelectItem value="3">Tier 3 (Low)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-zinc-300">Importance Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal bg-zinc-950 border-zinc-800 text-zinc-400">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newTodo.importance_date ? format(newTodo.importance_date, 'MMM d, yyyy') : 'Pick date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                              <Calendar
                                mode="single"
                                selected={newTodo.importance_date}
                                onSelect={(date) => setNewTodo({ ...newTodo, importance_date: date })}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200" data-testid="create-todo-btn">
                      Create Task
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 1-Min Quick Wins Strip */}
      {filteredOneMin.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-500/5 via-zinc-900 to-zinc-900 border-zinc-800" data-testid="one-min-strip">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Clear these first — under 1 min each
              <Badge variant="outline" className="ml-auto text-[10px] text-amber-400 border-amber-500/30">
                {filteredOneMin.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filteredOneMin.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  onClick={async () => {
                    try {
                      await todosApi.update(t.id, { status: 'closed' });
                      fetchData();
                      toast.success('Quick win!');
                    } catch (e) { toast.error('Failed'); }
                  }}
                  className="flex-shrink-0 max-w-[260px] flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors group"
                  data-testid={`one-min-quick-${t.id}`}
                  title="Mark done"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-zinc-300 truncate group-hover:text-zinc-100">{t.title}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 ml-auto" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matrix View */}
      {view === 'matrix' && (
        <div className={focusMode ? 'grid gap-4 lg:grid-cols-2' : 'eisenhower-grid'}>
          {/* Do First - Urgent & Important */}
          <Card className="matrix-quadrant matrix-do-first">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <Flame className="w-4 h-4" /> DO FIRST
                <Badge variant="outline" className="ml-auto text-xs text-red-400 border-red-900">
                  {quadrants.do_first.length}
                </Badge>
                {quadrants.do_first.length > 0 && (
                  <button
                    onClick={() => setBlitzOpen(true)}
                    className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 hover:bg-red-500/25 text-red-300 text-[10px] font-bold uppercase tracking-wider transition-colors"
                    data-testid="blitz-start-btn"
                    title="10-minute focused burst"
                  >
                    <Zap className="w-3 h-3" /> Blitz
                  </button>
                )}
              </CardTitle>
              <p className="text-xs text-zinc-500">Urgent & Important</p>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-3">
                  {quadrants.do_first.map(todo => (
                    <TodoCard key={todo.id} {...cardProps(todo, { checkStale: true })} />
                  ))}
                  {quadrants.do_first.length === 0 && (
                    <p className="text-sm text-zinc-600 text-center py-8">No urgent tasks</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Schedule - Not Urgent & Important */}
          <Card className="matrix-quadrant matrix-schedule">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                <Star className="w-4 h-4" /> SCHEDULE
                <Badge variant="outline" className="ml-auto text-xs text-blue-400 border-blue-900">
                  {quadrants.schedule.length}
                </Badge>
              </CardTitle>
              <p className="text-xs text-zinc-500">Important, Not Urgent</p>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-3">
                  {quadrants.schedule.map(todo => (
                    <TodoCard key={todo.id} {...cardProps(todo)} />
                  ))}
                  {quadrants.schedule.length === 0 && (
                    <p className="text-sm text-zinc-600 text-center py-8">No scheduled tasks</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Delegate - Urgent & Not Important */}
          {!focusMode && (
            <Card className="matrix-quadrant matrix-delegate">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> DELEGATE
                  <Badge variant="outline" className="ml-auto text-xs text-amber-400 border-amber-900">
                    {quadrants.delegate.length}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-zinc-500">Urgent, Not Important</p>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-3">
                    {quadrants.delegate.map(todo => (
                      <TodoCard key={todo.id} {...cardProps(todo)} />
                    ))}
                    {quadrants.delegate.length === 0 && (
                      <p className="text-sm text-zinc-600 text-center py-8">No tasks to delegate</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Eliminate - Not Urgent & Not Important */}
          {!focusMode && (
            <Card className="matrix-quadrant matrix-eliminate">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                  <Circle className="w-4 h-4" /> LATER / ELIMINATE
                  <Badge variant="outline" className="ml-auto text-xs text-zinc-400 border-zinc-700">
                    {quadrants.eliminate.length}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-zinc-500">Not Urgent, Not Important</p>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-3">
                    {quadrants.eliminate.map(todo => (
                      <TodoCard key={todo.id} {...cardProps(todo)} />
                    ))}
                    {quadrants.eliminate.length === 0 && (
                      <p className="text-sm text-zinc-600 text-center py-8">No low priority tasks</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <p className="text-zinc-500">No tasks yet. Create your first task!</p>
              </CardContent>
            </Card>
          ) : (
            filteredTodos.map(todo => (
              <TodoCard key={todo.id} {...cardProps(todo, { checkStale: getQuadrant(todo.urgency_tier, todo.importance_tier) === 'do_first' })} />
            ))
          )}
        </div>
      )}

      {blitzOpen && (
        <BlitzMode
          tasks={quadrants.do_first}
          onClose={() => { setBlitzOpen(false); fetchData(); }}
          onTaskUpdated={fetchData}
        />
      )}
    </div>
  );
}
