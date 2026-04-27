import { useState, useEffect } from 'react';
import { todosApi } from '../lib/api';
import { useAnchor } from '../contexts/AnchorContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Flame, X, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function DailyAnchorModal({ open, onClose }) {
  const { setAnchorTodo, todayStr } = useAnchor();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    todosApi
      .getAll({ status: 'open', is_one_minute: false })
      .then((res) => mounted && setTodos(res.data || []))
      .catch(() => mounted && setTodos([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [open]);

  const pickTodo = async (id) => {
    try {
      await setAnchorTodo(id);
      toast.success("Anchor locked in. Let's make today count.");
      onClose(true);
    } catch (e) {
      toast.error('Could not set anchor');
    }
  };

  const createAndAnchor = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await todosApi.create({
        title: newTitle.trim(),
        urgency_tier: 1,
        importance_tier: 1,
      });
      await setAnchorTodo(res.data.id);
      toast.success("Anchor created. Today's win is locked in.");
      onClose(true);
    } catch (e) {
      toast.error('Could not create task');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      data-testid="daily-anchor-modal"
    >
      <button
        onClick={() => onClose(false)}
        className="absolute top-6 right-6 text-zinc-500 hover:text-zinc-200 transition-colors p-2"
        data-testid="anchor-modal-close"
        aria-label="Skip for now"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30">
            <Flame className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-100 tracking-tight">
            What's the one thing that makes today a win?
          </h2>
          <p className="text-sm text-zinc-500">
            Pick one. Just one. Everything else is bonus.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Type a new anchor task…"
              className="bg-zinc-900 border-zinc-800 h-12 text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter') createAndAnchor();
              }}
              data-testid="anchor-new-input"
            />
            <Button
              onClick={createAndAnchor}
              disabled={!newTitle.trim() || creating}
              className="h-12 px-5 bg-amber-500 text-zinc-950 hover:bg-amber-400"
              data-testid="anchor-create-btn"
            >
              <Plus className="w-4 h-4 mr-1" /> Set
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <div className="h-px bg-zinc-800 flex-1" />
            <span>or pick from open tasks</span>
            <div className="h-px bg-zinc-800 flex-1" />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-center text-zinc-600 text-sm py-6">Loading…</p>
            ) : todos.length === 0 ? (
              <p className="text-center text-zinc-600 text-sm py-6">
                No open tasks yet — type one above.
              </p>
            ) : (
              todos.slice(0, 25).map((t) => (
                <button
                  key={t.id}
                  onClick={() => pickTodo(t.id)}
                  className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/80 rounded-lg px-4 py-3 transition-all group"
                  data-testid={`anchor-pick-${t.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                    <span className="text-zinc-200 truncate">{t.title}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => onClose(false)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            data-testid="anchor-skip-btn"
          >
            Skip — I'll set this later
          </button>
        </div>
      </div>
    </div>
  );
}
