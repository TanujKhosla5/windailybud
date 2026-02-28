import { useState, useEffect } from 'react';
import { todosApi } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Plus, 
  Zap,
  CheckCircle,
  Flame,
  Star,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

export default function OneMinuteOpen() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    notes: '',
    urgency_tier: 3,
    importance_tier: 3
  });

  const fetchData = async () => {
    try {
      const res = await todosApi.getAll({ status: 'open', is_one_minute: true });
      setTodos(res.data);
    } catch (error) {
      toast.error('Failed to load quick tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!newTodo.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      await todosApi.create({
        ...newTodo,
        is_one_minute: true,
        tags: []
      });
      setDialogOpen(false);
      setNewTodo({ title: '', notes: '', urgency_tier: 3, importance_tier: 3 });
      fetchData();
      toast.success('Quick task created');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleComplete = async (todoId) => {
    try {
      await todosApi.update(todoId, { status: 'closed' });
      fetchData();
      toast.success('Task completed!');
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleDelete = async (todoId) => {
    try {
      await todosApi.delete(todoId);
      fetchData();
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
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
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-zinc-100">1-Minute Tasks</h1>
          </div>
          <p className="text-sm text-zinc-500">{todos.length} quick tasks to complete</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 text-zinc-950 hover:bg-amber-400" data-testid="add-quick-task-btn">
              <Plus className="w-4 h-4 mr-2" /> Quick Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> New Quick Task
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">Title *</Label>
                <Input
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  placeholder="Quick task description"
                  className="bg-zinc-950 border-zinc-800"
                  data-testid="quick-task-title"
                />
              </div>
              
              <div>
                <Label className="text-zinc-300">Notes (optional)</Label>
                <Textarea
                  value={newTodo.notes}
                  onChange={(e) => setNewTodo({ ...newTodo, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  className="bg-zinc-950 border-zinc-800"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300">Urgency</Label>
                  <Select value={String(newTodo.urgency_tier)} onValueChange={(v) => setNewTodo({ ...newTodo, urgency_tier: parseInt(v) })}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="1">Tier 1</SelectItem>
                      <SelectItem value="2">Tier 2</SelectItem>
                      <SelectItem value="3">Tier 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-zinc-300">Importance</Label>
                  <Select value={String(newTodo.importance_tier)} onValueChange={(v) => setNewTodo({ ...newTodo, importance_tier: parseInt(v) })}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="1">Tier 1</SelectItem>
                      <SelectItem value="2">Tier 2</SelectItem>
                      <SelectItem value="3">Tier 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-amber-500 text-zinc-950 hover:bg-amber-400" data-testid="create-quick-task-btn">
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task List */}
      {todos.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No quick tasks. Add one that takes less than a minute!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {todos.map(todo => (
            <div 
              key={todo.id} 
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4 hover:border-zinc-700 transition-all group"
            >
              <button
                onClick={() => handleComplete(todo.id)}
                className="w-10 h-10 rounded-full bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center hover:bg-amber-500/20 hover:border-amber-500 transition-all flex-shrink-0"
                data-testid={`complete-quick-${todo.id}`}
              >
                <CheckCircle className="w-5 h-5 text-amber-400" />
              </button>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-zinc-100 truncate">{todo.title}</h3>
                {todo.notes && (
                  <p className="text-sm text-zinc-500 truncate">{todo.notes}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <Flame className="w-3 h-3 text-red-400" /> U{todo.urgency_tier}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <Star className="w-3 h-3 text-blue-400" /> I{todo.importance_tier}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 transition-all"
                data-testid={`delete-quick-${todo.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
