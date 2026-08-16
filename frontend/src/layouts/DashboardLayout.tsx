```tsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Library,
  MessageSquare,
  Sparkles,
  BarChart3,
  FileText,
  Lightbulb,
  Route,
  Crown,
  Brain,
  CreditCard,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarGroups = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Learn', icon: Route, href: '/dashboard/learning-paths' },
      { label: 'AI Hub', icon: MessageSquare, href: '/dashboard/chat' },
      { label: 'Notes', icon: Library, href: '/dashboard/study-sets' },
      { label: 'Practice', icon: FileText, href: '/dashboard/exam-clone' },
      { label: 'Mistakes', icon: Lightbulb, href: '/dashboard/exam-clone/review-queue' },
      { label: 'Focus', icon: Brain, href: '/dashboard/focus' },
      { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
      { label: 'Billing', icon: Crown, href: '/dashboard/subscription' },
    ],
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transform transition-transform duration-200 lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#A76352] flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            <span className="text-xl font-bold tracking-wider text-[#221D17] dark:text-[#C6B19B]">
              PIRAX
            </span>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 p-4 space-y-4">
            {sidebarGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.title}
                </h3>

                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[#A76352]/10 text-[#A76352] dark:bg-[#C6B19B]/10 dark:text-[#C6B19B]'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="flex-shrink-0 p-4 pt-0 space-y-3">
            {user?.plan === 'free' && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#A76352]/10 to-[#C6B19B]/10 border border-[#A76352]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#A76352]" />
                  <span className="text-sm font-medium">Upgrade to Pro</span>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  Unlock advanced AI study features and unlimited workspaces.
                </p>

                <Button
                  size="sm"
                  className="w-full bg-[#A76352] hover:bg-[#8e5243] text-white"
                  asChild
                >
                  <Link to="/dashboard/subscription">Upgrade</Link>
                </Button>
              </div>
            )}

            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
              {t('common.settings')}
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="h-16 bg-card border-b border-border sticky top-0 z-30">
          <div className="h-full px-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            <LanguageSwitcher />

            <NotificationBell />

            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-green-600">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">
                    {user?.name || t('dashboard.userMenu.user')}
                  </p>

                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.plan} {t('common.plan')}
                  </p>
                </div>

                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />

                  <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <Link
                        to="/dashboard/subscription"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        {t('common.subscription')}

                        <span className="ml-auto px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium capitalize">
                          {user?.plan}
                        </span>
                      </Link>

                      <Link
                        to="/dashboard/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        {t('common.settings')}
                      </Link>

                      <div className="border-t border-border my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
```
