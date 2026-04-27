import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AnchorProvider, useAnchor } from '../contexts/AnchorContext';
import DailyAnchorModal from './DailyAnchorModal';
import WeeklyResetModal from './WeeklyResetModal';
import {
  CheckSquare,
  Activity,
  BarChart2,
  Settings,
  Menu,
  X,
  LogOut,
  Zap,
  Clock,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  ListTodo,
  Trophy,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const navigation = [
  {
    title: 'To-Dos',
    icon: CheckSquare,
    items: [
      { name: 'Open', href: '/todos/open', icon: ListTodo },
      { name: 'Closed', href: '/todos/closed', icon: CheckCircle2 },
      { name: '1-Min Open', href: '/todos/quick/open', icon: Zap },
      { name: '1-Min Closed', href: '/todos/quick/closed', icon: Clock },
    ],
  },
  {
    title: 'Daily Habits',
    icon: Activity,
    items: [
      { name: 'Today', href: '/habits/today', icon: CalendarDays },
      { name: 'My Progress', href: '/habits/progress', icon: TrendingUp },
      { name: 'Manage Habits', href: '/habits/manage', icon: Settings },
    ],
  },
  {
    title: 'Activities',
    icon: Trophy,
    items: [{ name: 'Log & Search', href: '/activities', icon: Trophy }],
  },
];

function isoWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day); // back to Sunday
  return d.toISOString().slice(0, 10);
}

function AnchorNudge({ onOpen, variant = 'desktop' }) {
  const { anchor, loaded } = useAnchor();
  if (!loaded) return null;
  if (anchor) {
    return (
      <button
        onClick={onOpen}
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/15 transition-colors"
        data-testid={`anchor-pill-set-${variant}`}
        title="Today's anchor is locked in"
      >
        <Flame className="w-3.5 h-3.5" /> Anchor set
      </button>
    );
  }
  return (
    <button
      onClick={onOpen}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium hover:border-amber-500/40 hover:text-amber-300 transition-colors"
      data-testid={`anchor-pill-empty-${variant}`}
    >
      <Flame className="w-3.5 h-3.5" /> Set today's anchor
    </button>
  );
}

function LayoutInner() {
  const { user, logout } = useAuth();
  const { anchor, loaded } = useAnchor();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [anchorModalOpen, setAnchorModalOpen] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const location = useLocation();

  const isActive = (href) => location.pathname === href;

  // Auto-prompt the anchor modal once per local day if not set AND not skipped today
  useEffect(() => {
    if (!loaded || !user?.id) return;
    const today = new Date().toISOString().slice(0, 10);
    const seenKey = `windailybud_anchor_seen_${user.id}_${today}`;
    if (anchor) return;
    if (localStorage.getItem(seenKey)) return;
    const t = setTimeout(() => setAnchorModalOpen(true), 350);
    return () => clearTimeout(t);
  }, [loaded, anchor, user?.id]);

  // Auto-prompt weekly reset on Sundays once per week per device
  useEffect(() => {
    if (!user?.id) return;
    const today = new Date();
    if (today.getDay() !== 0) return; // 0 = Sunday
    const weekKey = `windailybud_weekly_reset_${user.id}_${isoWeekStart(today)}`;
    if (localStorage.getItem(weekKey)) return;
    const t = setTimeout(() => setWeeklyOpen(true), 800);
    return () => clearTimeout(t);
  }, [user?.id]);

  const closeAnchorModal = (set) => {
    setAnchorModalOpen(false);
    if (!set && user?.id) {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`windailybud_anchor_seen_${user.id}_${today}`, '1');
    }
  };

  const closeWeeklyModal = () => {
    setWeeklyOpen(false);
    if (user?.id) {
      localStorage.setItem(`windailybud_weekly_reset_${user.id}_${isoWeekStart(new Date())}`, '1');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile header */}
      <header className="lg:hidden glass-header sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
          data-testid="mobile-menu-btn"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-zinc-100">WindailyBud</h1>
        <div className="flex items-center gap-2">
          <AnchorNudge variant="mobile" onOpen={() => setAnchorModalOpen(true)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-100"
                data-testid="user-menu-btn"
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-zinc-100">{user?.name}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem onClick={logout} className="text-red-400 cursor-pointer" data-testid="logout-btn-mobile">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-zinc-950 border-r border-zinc-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between border-b border-zinc-800">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">WindailyBud</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-zinc-400 hover:text-zinc-100"
              data-testid="close-sidebar-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Anchor pill (desktop) */}
          <div className="hidden lg:flex px-4 py-3 border-b border-zinc-800 items-center justify-between">
            <AnchorNudge variant="desktop" onOpen={() => setAnchorModalOpen(true)} />
            <button
              onClick={() => setWeeklyOpen(true)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-md hover:bg-zinc-900"
              title="Weekly reset"
              data-testid="weekly-reset-trigger"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-6">
              {navigation.map((section) => (
                <div key={section.title}>
                  <div className="flex items-center gap-2 px-3 mb-2">
                    <section.icon className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {section.title}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          sidebar-link flex items-center gap-3 px-3 py-2 rounded-md text-sm
                          transition-colors duration-200
                          ${isActive(item.href) ? 'active bg-zinc-800/50 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'}
                        `}
                        data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="p-4 border-t border-zinc-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                  data-testid="user-profile-btn"
                >
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-100">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-zinc-100 truncate">{user?.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 bg-zinc-900 border-zinc-800">
                <DropdownMenuItem onClick={logout} className="text-red-400 cursor-pointer" data-testid="logout-btn">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      <DailyAnchorModal open={anchorModalOpen} onClose={closeAnchorModal} />
      <WeeklyResetModal open={weeklyOpen} onClose={closeWeeklyModal} />
    </div>
  );
}

export default function Layout() {
  return (
    <AnchorProvider>
      <LayoutInner />
    </AnchorProvider>
  );
}
