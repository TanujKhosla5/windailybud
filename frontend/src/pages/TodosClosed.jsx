import { useState, useEffect } from 'react';
import { todosApi, tagsApi } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  CheckCircle2, 
  RotateCcw,
  Trash2,
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

export default function TodosClosed() {
  const [todos, setTodos] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState('all');

  const fetchData = async () => {
    try {
      const [todosRes, tagsRes] = await Promise.all([
        todosApi.getAll({ status: 'closed', is_one_minute: false }),
        tagsApi.getAll()
      ]);
      setTodos(todosRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      toast.error('Failed to load completed tasks');
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

  const filteredTodos = filterTag === 'all' 
    ? todos 
    : todos.filter(t => t.tags?.includes(filterTag));

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
          <h1 className="text-2xl font-bold text-zinc-100">Completed Tasks</h1>
          <p className="text-sm text-zinc-500">{todos.length} tasks completed</p>
        </div>
        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800" data-testid="filter-tag-closed">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Tags</SelectItem>
            {tags.map(tag => (
              <SelectItem key={tag.id} value={tag.label}>{tag.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {filteredTodos.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No completed tasks yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map(todo => (
            <div 
              key={todo.id} 
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <h3 className="font-medium text-zinc-400 line-through truncate">{todo.title}</h3>
                  </div>
                  
                  {todo.notes && (
                    <p className="text-sm text-zinc-600 line-clamp-2 mb-3 ml-7">{todo.notes}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 ml-7">
                    {todo.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs opacity-60">
                        {tag}
                      </Badge>
                    ))}
                    
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <Flame className="w-3 h-3" />
                      <span>U{todo.urgency_tier}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <Star className="w-3 h-3" />
                      <span>I{todo.importance_tier}</span>
                    </div>
                    
                    {todo.closed_at && (
                      <span className="text-xs text-emerald-600">
                        Completed: {format(new Date(todo.closed_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`closed-todo-menu-${todo.id}`}>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
