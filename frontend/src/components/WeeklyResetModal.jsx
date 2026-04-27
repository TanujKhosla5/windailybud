import { useEffect, useState } from 'react';
import { todosApi } from '../lib/api';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, RotateCcw, Flame, Trash2, Archive, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// Quadrants per the existing routing in TodosOpen.jsx:
// urgency_tier <= 2 + importance_tier <= 2 → do_first
// urgency_tier > 2 + importance_tier <= 2 → schedule
// urgency_tier <= 2 + importance_tier > 2 → delegate
// urgency_tier > 2 + importance_tier > 2 → eliminate

const daysSince = (iso) => {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export default function WeeklyResetModal({ open, onClose }) {
  const [items, setItems] = useState([]); // {id, title, kind: 'schedule_stale'|'eliminate'}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    todosApi
      .getAll({ status: 'open', is_one_minute: false })
      .then((res) => {
        const all = res.data || [];
        const list = [];
        all.forEach((t) => {
          const u = t.urgency_tier;
          const i = t.importance_tier;
          if (u > 2 && i <= 2 && daysSince(t.created_at) > 7) {
            list.push({ ...t, kind: 'schedule_stale' });
          } else if (u > 2 && i > 2) {
            list.push({ ...t, kind: 'eliminate' });
          }
        });
        setItems(list);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  const remove = (id) => setItems((arr) => arr.filter((x) => x.id !== id));

  const moveToDoFirst = async (item) => {
    try {
      await todosApi.update(item.id, { urgency_tier: 1, importance_tier: 1 });
      remove(item.id);
      toast.success('Moved to Do First');
    } catch (e) {
      toast.error('Failed to move');
    }
  };

  const park = async (item) => {
    try {
      await todosApi.update(item.id, { urgency_tier: 3, importance_tier: 3 });
      remove(item.id);
      toast.success('Parked in Later');
    } catch (e) {
      toast.error('Failed to park');
    }
  };

  const keep = (item) => {
    remove(item.id);
  };

  const del = async (item) => {
    try {
      await todosApi.delete(item.id);
      remove(item.id);
      toast.success('Deleted');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4"
      data-testid="weekly-reset-modal"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-zinc-500 hover:text-zinc-200 p-2"
        data-testid="weekly-reset-close"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/15 border border-blue-500/30">
            <RotateCcw className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100">Sunday reset</h2>
          <p className="text-sm text-zinc-500">
            Tidy up stale Schedule items and the Later list. One tap each. No pressure.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-zinc-600 text-sm py-10">Loading…</p>
        ) : items.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 py-12 text-center">
            <p className="text-zinc-400">All clean. Nothing to review this week.</p>
            <Button onClick={onClose} className="mt-4 bg-zinc-100 text-zinc-950 hover:bg-zinc-200" data-testid="weekly-reset-done">
              Looks good
            </Button>
          </Card>
        ) : (
          <>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="bg-zinc-900 border-zinc-800 p-4"
                  data-testid={`weekly-item-${item.id}`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span
                          className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
                            item.kind === 'schedule_stale'
                              ? 'bg-blue-500/15 text-blue-400'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {item.kind === 'schedule_stale'
                            ? `Schedule · ${daysSince(item.created_at)}d old`
                            : 'Later'}
                        </span>
                        <p className="text-zinc-100 font-medium truncate">{item.title}</p>
                        {item.notes && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.kind === 'schedule_stale' ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => moveToDoFirst(item)}
                            className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 h-9"
                            data-testid={`weekly-move-do-first-${item.id}`}
                          >
                            <Flame className="w-3.5 h-3.5 mr-1.5" /> Move to Do First
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => park(item)}
                            className="border-zinc-700 text-zinc-300 h-9"
                            data-testid={`weekly-park-${item.id}`}
                          >
                            <Archive className="w-3.5 h-3.5 mr-1.5" /> Park
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => keep(item)}
                            className="text-zinc-500 hover:text-zinc-300 h-9"
                            data-testid={`weekly-keep-${item.id}`}
                          >
                            Keep <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => keep(item)}
                            className="text-zinc-300 hover:bg-zinc-800 h-9"
                            data-testid={`weekly-keep-${item.id}`}
                          >
                            Keep
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => del(item)}
                            className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 h-9"
                            data-testid={`weekly-delete-${item.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Button onClick={onClose} variant="outline" className="border-zinc-700" data-testid="weekly-reset-finish">
                Done for now
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
