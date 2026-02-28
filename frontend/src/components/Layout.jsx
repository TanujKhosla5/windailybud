import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  ListTodo
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
    ]
  },
  {
    title: 'Daily Habits',
    icon: Activity,
    items: [
      { name: 'Today', href: '/habits/today', icon: CalendarDays },
      { name: 'My Progress', href: '/habits/progress', icon: TrendingUp },
      { name: 'Manage Habits', href: '/habits/manage', icon: Settings },
    ]
  }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (href) => location.pathname === href;

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-100" data-testid="user-menu-btn">
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
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-zinc-950 border-r border-zinc-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
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
                          ${isActive(item.href) 
                            ? 'active bg-zinc-800/50 text-zinc-100' 
                            : 'text-zinc-400 hover:text-zinc-100'
                          }
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
    </div>
  );
}
