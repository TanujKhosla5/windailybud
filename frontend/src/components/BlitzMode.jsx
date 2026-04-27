import { useEffect, useState, useRef } from 'react';
import { todosApi } from '../lib/api';
import { Button } from './ui/button';
import { Flame, X, Check, SkipForward, Timer } from 'lucide-react';
import { toast } from 'sonner';

const BLITZ_SECONDS = 10 * 60;

export default function BlitzMode({ tasks, onClose, onTaskUpdated }) {
  const [queue, setQueue] = useState(tasks);
  const [secondsLeft, setSecondsLeft] = useState(BLITZ_SECONDS);
  const [done, setDone] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      toast.success(`Blitz over — ${done} done. Nice burst.`);
    }
  }, [secondsLeft, done]);

  const current = queue[0];

  const markDone = async () => {
    if (!current) return;
    try {
      await todosApi.update(current.id, { status: 'closed' });
      setDone((d) => d + 1);
      setQueue((q) => q.slice(1));
      onTaskUpdated && onTaskUpdated();
    } catch (e) {
      toast.error('Could not mark done');
    }
  };

  const skip = () => {
    setQueue((q) => q.slice(1).concat(q[0] ? [q[0]] : []));
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  };

  const progress = ((BLITZ_SECONDS - secondsLeft) / BLITZ_SECONDS) * 100;
  const timerColor =
    secondsLeft < 60 ? 'text-red-400' : secondsLeft < 180 ? 'text-amber-400' : 'text-zinc-100';

  return (
    <div
      className="fixed inset-0 z-[100] bg-zinc-950/98 backdrop-blur-md flex flex-col"
      data-testid="blitz-mode-overlay"
    >
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <Flame className="w-4 h-4 text-red-400" />
          <span className="font-semibold uppercase tracking-wider">Blitz Mode</span>
          <span className="text-zinc-700">·</span>
          <span>{done} done</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1 text-sm"
          data-testid="blitz-exit-btn"
        >
          Exit <X className="w-4 h-4" />
        </button>
      </div>

      {/* Timer */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Timer className={`w-5 h-5 ${timerColor}`} />
          <span className={`text-5xl font-mono font-semibold tabular-nums ${timerColor}`} data-testid="blitz-timer">
            {formatTime(secondsLeft)}
          </span>
        </div>
        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden max-w-md mx-auto">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Task */}
      <div className="flex-1 flex items-center justify-center px-6">
        {current ? (
          <div className="text-center max-w-2xl space-y-8 w-full">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-zinc-600">Right now</p>
              <h2 className="text-3xl sm:text-5xl font-semibold text-zinc-100 leading-tight" data-testid="blitz-current-title">
                {current.title}
              </h2>
              {current.notes && (
                <p className="text-zinc-500 text-base mt-3">{current.notes}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={markDone}
                size="lg"
                className="h-14 px-10 text-base bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold"
                data-testid="blitz-done-btn"
              >
                <Check className="w-5 h-5 mr-2" /> Done
              </Button>
              <Button
                onClick={skip}
                size="lg"
                variant="outline"
                className="h-14 px-10 text-base border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                data-testid="blitz-skip-btn"
                disabled={queue.length <= 1}
              >
                <SkipForward className="w-5 h-5 mr-2" /> Skip
              </Button>
            </div>

            <p className="text-xs text-zinc-600 pt-6">
              {queue.length} task{queue.length !== 1 ? 's' : ''} in the burst
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-semibold text-zinc-100">All clear.</h2>
            <p className="text-zinc-500">{done} task{done !== 1 ? 's' : ''} done in this blitz.</p>
            <Button onClick={onClose} className="mt-4 bg-zinc-100 text-zinc-950 hover:bg-zinc-200" data-testid="blitz-finish-btn">
              Finish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
