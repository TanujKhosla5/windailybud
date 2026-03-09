import { useState, useEffect } from 'react';
import { todosApi, tagsApi } from '../lib/api';
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
  Clock
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

function TodoCard({ todo, tags, onUpdate, onDelete }) {
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
    <div className="task-card bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all">
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
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('matrix');
  const [filterTag, setFilterTag] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
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
      const [todosRes, tagsRes] = await Promise.all([
        todosApi.getAll({ status: 'open', is_one_minute: false }),
        tagsApi.getAll()
      ]);
      setTodos(todosRes.data);
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
      setNewTodo({ title: '', notes: '', tags: [], urgency_tier: 3, urgency_date: null, importance_tier: 3, importance_date: null });
      fetchData();
      toast.success('Task created');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const filteredTodos = filterTag === 'all' 
    ? todos 
    : todos.filter(t => t.tags?.includes(filterTag));

  const quadrants = {
    do_first: filteredTodos.filter(t => getQuadrant(t.urgency_tier, t.importance_tier) === 'do_first'),
    schedule: filteredTodos.filter(t => getQuadrant(t.urgency_tier, t.importance_tier) === 'schedule'),
    delegate: filteredTodos.filter(t => getQuadrant(t.urgency_tier, t.importance_tier) === 'delegate'),
    eliminate: filteredTodos.filter(t => getQuadrant(t.urgency_tier, t.importance_tier) === 'eliminate'),
  };

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
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200" data-testid="add-todo-btn">
                <Plus className="w-4 h-4 mr-2" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-300">Title *</Label>
                  <Input
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    placeholder="What needs to be done?"
                    className="bg-zinc-950 border-zinc-800"
                    data-testid="new-todo-title"
                  />
                </div>
                
                <div>
                  <Label className="text-zinc-300">Notes</Label>
                  <Textarea
                    value={newTodo.notes}
                    onChange={(e) => setNewTodo({ ...newTodo, notes: e.target.value })}
                    placeholder="Additional details..."
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
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200" data-testid="create-todo-btn">
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Matrix View */}
      {view === 'matrix' && (
        <div className="eisenhower-grid">
          {/* Do First - Urgent & Important */}
          <Card className="matrix-quadrant matrix-do-first">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <Flame className="w-4 h-4" /> DO FIRST
                <Badge variant="outline" className="ml-auto text-xs text-red-400 border-red-900">
                  {quadrants.do_first.length}
                </Badge>
              </CardTitle>
              <p className="text-xs text-zinc-500">Urgent & Important</p>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-3">
                  {quadrants.do_first.map(todo => (
                    <TodoCard key={todo.id} todo={todo} tags={tags} onUpdate={fetchData} onDelete={fetchData} />
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
                    <TodoCard key={todo.id} todo={todo} tags={tags} onUpdate={fetchData} onDelete={fetchData} />
                  ))}
                  {quadrants.schedule.length === 0 && (
                    <p className="text-sm text-zinc-600 text-center py-8">No scheduled tasks</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Delegate - Urgent & Not Important */}
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
                    <TodoCard key={todo.id} todo={todo} tags={tags} onUpdate={fetchData} onDelete={fetchData} />
                  ))}
                  {quadrants.delegate.length === 0 && (
                    <p className="text-sm text-zinc-600 text-center py-8">No tasks to delegate</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Eliminate - Not Urgent & Not Important */}
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
                    <TodoCard key={todo.id} todo={todo} tags={tags} onUpdate={fetchData} onDelete={fetchData} />
                  ))}
                  {quadrants.eliminate.length === 0 && (
                    <p className="text-sm text-zinc-600 text-center py-8">No low priority tasks</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
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
              <TodoCard key={todo.id} todo={todo} tags={tags} onUpdate={fetchData} onDelete={fetchData} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
