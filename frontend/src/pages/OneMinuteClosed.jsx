import { useState, useEffect } from 'react';
import { todosApi } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  CheckCircle2, 
  RotateCcw,
  Trash2,
  Zap,
  Flame,
  Star,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { format } from 'date-fns';

export default function OneMinuteClosed() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await todosApi.getAll({ status: 'closed', is_one_minute: true });
      setTodos(res.data);
    } catch (error) {
      toast.error('Failed to load completed quick tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReopen = async (todoId) => {
    try {
      await todosApi.update(todoId, { status: 'not_started' });
      fetchData();
      toast.success('Task reopened');
    } catch (error) {
      toast.error('Failed to reopen task');
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
      <div>
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-emerald-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Completed Quick Tasks</h1>
        </div>
        <p className="text-sm text-zinc-500">{todos.length} quick tasks done</p>
      </div>

      {/* Task List */}
      {todos.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No completed quick tasks yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {todos.map(todo => (
            <div 
              key={todo.id} 
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4 hover:border-zinc-700 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-zinc-400 line-through truncate">{todo.title}</h3>
                {todo.notes && (
                  <p className="text-sm text-zinc-600 truncate">{todo.notes}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-zinc-600">
                    <Flame className="w-3 h-3" /> U{todo.urgency_tier}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-600">
                    <Star className="w-3 h-3" /> I{todo.importance_tier}
                  </span>
                  {todo.closed_at && (
                    <span className="text-xs text-emerald-600">
                      Done: {format(new Date(todo.closed_at), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`quick-closed-menu-${todo.id}`}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem onClick={() => handleReopen(todo.id)} className="cursor-pointer">
                    <RotateCcw className="w-4 h-4 mr-2" /> Reopen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(todo.id)} className="cursor-pointer text-red-400">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
