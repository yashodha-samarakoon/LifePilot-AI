import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { SIDEBAR_NAV, APP_NAME } from '@/lib/constants';
import {
  LayoutDashboard,
  MessageSquare,
  Map,
  Target,
  FlaskConical,
  Sparkles,
  Settings,
  LogOut,
  Compass,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const iconMap = {
  LayoutDashboard,
  MessageSquare,
  Map,
  Target,
  FlaskConical,
  Sparkles,
  Settings,
};

export function Sidebar() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-[250px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-primary flex-shrink-0">
          <Compass className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-slate-900 truncate">{APP_NAME}</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-md hover:bg-slate-100 text-slate-400"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {SIDEBAR_NAV.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <div className={cn(
                'relative flex items-center justify-center',
                item.highlight && !collapsed && (
                  'after:absolute after:-right-1 after:-top-1 after:w-2 after:h-2 after:rounded-full after:bg-accent-500'
                )
              )}>
                {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
              </div>
              {!collapsed && (
                <span className={cn(item.highlight && 'text-primary-700 font-semibold')}>
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all w-full',
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
