import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShoppingCart, Package, FolderOpen, 
  CreditCard, ArrowUpCircle, Settings, Shield, Menu, X,
  Store, ClipboardList, User, PawPrint, GitBranch, GraduationCap, 
  UsersRound, Calendar, ChevronDown, ChevronRight, Receipt, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

function SidebarLogo() {
  const { data: settings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const s = await base44.entities.AppSettings.list();
      return s[0] || {};
    },
    staleTime: 60000,
  });

  return (
    <div className="p-5 border-b border-sidebar-border">
      <div className="flex items-center gap-3">
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt="logo" className="w-10 h-10 rounded-xl object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <PawPrint className="h-5 w-5 text-white" />
          </div>
        )}
        <div>
          <h1 className="font-bold text-sidebar-foreground text-lg leading-tight">
            {settings?.company_name || 'PetDining'}
          </h1>
          <p className="text-xs text-sidebar-foreground/60">PetForm</p>
        </div>
      </div>
    </div>
  );
}

const adminGroups = [
  {
    id: 'accounts',
    label: '帳戶與審批',
    emoji: '📋',
    items: [
      { label: '控制台總覽', icon: LayoutDashboard, path: '/admin' },
      { label: '帳戶申請', icon: ClipboardList, path: '/admin/applications', badge: true },
      { label: '帳戶管理', icon: Users, path: '/admin/customers' },
      { label: '用戶管理', icon: UsersRound, path: '/admin/users' },
      { label: '管理員', icon: Shield, path: '/admin/admins' },
    ],
  },
  {
    id: 'store',
    label: '分店與產品',
    emoji: '🏪',
    items: [
      { label: '分店管理', icon: GitBranch, path: '/admin/branches' },
      { label: '產品管理', icon: Package, path: '/admin/products', stockBadge: true },
      { label: '分類管理', icon: FolderOpen, path: '/admin/categories' },
    ],
  },
  {
    id: 'finance',
    label: '訂單與財務',
    emoji: '📦',
    items: [
      { label: '訂單管理', icon: ClipboardList, path: '/admin/orders' },
      { label: 'Credits 管理', icon: CreditCard, path: '/admin/credits' },
      { label: 'Top-up 管理', icon: ArrowUpCircle, path: '/admin/topups' },
      { label: '交易記錄', icon: Receipt, path: '/admin/transactions' },
    ],
  },
  {
    id: 'courses',
    label: '課程與導師',
    emoji: '📚',
    items: [
      { label: '課程管理', icon: GraduationCap, path: '/admin/courses' },
      { label: '導師管理', icon: User, path: '/admin/instructors' },
      { label: '報名管理', icon: UsersRound, path: '/admin/enrollments' },
      { label: '學員管理', icon: UsersRound, path: '/admin/students' },
      { label: '時間表', icon: Calendar, path: '/admin/schedule' },
    ],
  },
  {
    id: 'system',
    label: '系統設定',
    emoji: '⚙️',
    items: [
      { label: '系統設定', icon: Settings, path: '/admin/settings' },
    ],
  },
];

const businessClientNav = [
  { label: '課程目錄', icon: GraduationCap, path: '/courses' },
  { label: '我的課程', icon: GraduationCap, path: '/my-courses' },
  { label: '產品目錄', icon: Package, path: '/products' },
  { label: '我的Credits', icon: CreditCard, path: '/credits' },
  { label: '購物車', icon: ShoppingCart, path: '/cart' },
  { label: '訂單記錄', icon: ClipboardList, path: '/orders' },
  { label: '我的帳戶', icon: User, path: '/account' },
];

const generalClientNav = [
  { label: '課程目錄', icon: GraduationCap, path: '/courses' },
  { label: '我的課程', icon: GraduationCap, path: '/my-courses' },
  { label: '購物車', icon: ShoppingCart, path: '/cart' },
  { label: '訂單記錄', icon: ClipboardList, path: '/orders' },
  { label: '我的帳戶', icon: User, path: '/account' },
];

const STORAGE_KEY = 'admin_sidebar_expanded';

function getInitialExpanded(location, groups = adminGroups) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const autoExpand = {};
    groups.forEach(g => {
      const hasActive = g.items.some(item =>
        location.pathname === item.path ||
        (item.path !== '/admin' && location.pathname.startsWith(item.path))
      );
      autoExpand[g.id] = hasActive ? true : (saved[g.id] ?? false);
    });
    return autoExpand;
  } catch {
    return {};
  }
}

function AdminNav({ pendingApps, lowStockCount, onClose, groups }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => getInitialExpanded(location));

  // Auto-expand group for current page when route changes
  useEffect(() => {
    groups.forEach(g => {
      const hasActive = g.items.some(item =>
        location.pathname === item.path ||
        (item.path !== '/admin' && location.pathname.startsWith(item.path))
      );
      if (hasActive) {
        setExpanded(prev => ({ ...prev, [g.id]: true }));
      }
    });
  }, [location.pathname, groups]);

  const toggle = (id) => {
    setExpanded(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <nav className="flex-1 p-3 overflow-y-auto space-y-1 min-h-0">
      {groups.map(group => {
        const isOpen = !!expanded[group.id];
        const hasActive = group.items.some(item =>
          location.pathname === item.path ||
          (item.path !== '/admin' && location.pathname.startsWith(item.path))
        );

        return (
          <div key={group.id}>
            {/* Group Header */}
            <button
              onClick={() => toggle(group.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all",
                hasActive
                  ? "text-sidebar-primary bg-sidebar-accent"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
              )}
            >
              <span>{group.emoji}</span>
              <span className="flex-1 text-left">{group.label}</span>
              {isOpen
                ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              }
            </button>

            {/* Group Items */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="pl-2 pt-1 pb-1 space-y-0.5">
                {group.items.map(item => {
                  const active = location.pathname === item.path ||
                    (item.path !== '/admin' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                      {item.badge && pendingApps > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                          {pendingApps}
                        </span>
                      )}
                      {item.stockBadge && lowStockCount > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                          {lowStockCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// Paths course_admin is allowed to see in the sidebar
const COURSE_ADMIN_PATHS = new Set(['/admin', '/admin/courses', '/admin/instructors', '/admin/enrollments', '/admin/students', '/admin/schedule']);

export default function Sidebar({ isAdmin, userType, isPreview }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const adminRole = isAdmin ? (user?.admin_role || 'super_admin') : null;

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  let nav;
  if (!isAdmin) {
    nav = userType === 'business' ? businessClientNav : generalClientNav;
  }

  // Filter groups for course_admin
  const visibleGroups = isAdmin && adminRole === 'course_admin'
    ? adminGroups.map(g => ({
        ...g,
        items: g.items.filter(item => COURSE_ADMIN_PATHS.has(item.path))
      })).filter(g => g.items.length > 0)
    : adminGroups;

  const { data: pendingApps = [] } = useQuery({
    queryKey: ['pendingApplicationsCount'],
    queryFn: () => base44.entities.Application.filter({ status: 'pending' }),
    enabled: isAdmin,
    staleTime: 30000,
  });

  const { data: settings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => { const s = await base44.entities.AppSettings.list(); return s[0] || {}; },
    enabled: isAdmin,
    staleTime: 60000,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => base44.entities.Products.list(),
    enabled: isAdmin,
    staleTime: 60000,
  });

  const threshold = settings?.low_stock_threshold ?? 10;
  const lowStockCount = allProducts.filter(p => p.status === 'active' && (p.stock ?? 0) <= threshold).length;

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden bg-sidebar text-sidebar-foreground"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-sidebar z-40 flex flex-col transition-transform duration-300 overflow-hidden",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarLogo />

        {/* Admin grouped nav */}
        {isAdmin && (
          <AdminNav
            pendingApps={pendingApps.length}
            lowStockCount={lowStockCount}
            onClose={() => setOpen(false)}
            groups={visibleGroups}
          />
        )}

        {/* Client flat nav */}
        {!isAdmin && (
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
            {nav.map((item) => {
              const active = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Admin Footer */}
        {isAdmin && (
          <div className="p-3 border-t border-sidebar-border space-y-1">
            {adminRole !== 'course_admin' && (
              <>
                <div className="text-xs text-sidebar-foreground/50 font-medium mb-2">預覽視角</div>
                <Link
                  to="/products?preview=business"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
                >
                  <Users className="h-4 w-4" />
                  商業客戶端
                </Link>
                <Link
                  to="/courses?preview=general"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
                >
                  <GraduationCap className="h-4 w-4" />
                  一般客戶端
                </Link>
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
                >
                  <Store className="h-4 w-4" />
                  返回首頁
                </Link>
              </>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-destructive/20 hover:text-destructive transition-all mt-1"
            >
              <LogOut className="h-4 w-4" />
              登出
            </button>
          </div>
        )}

        {/* Customer Footer */}
        {!isAdmin && (
          <div className="p-3 border-t border-sidebar-border space-y-1">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-primary bg-sidebar-primary/10 hover:bg-sidebar-primary/20 transition-all"
              >
                <Shield className="h-4 w-4" />
                管理後台
              </Link>
            )}
            {userType === 'business' && (
              <Link
                to="/products"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
              >
                <Package className="h-4 w-4" />
                產品目錄
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-destructive/20 hover:text-destructive transition-all"
            >
              <LogOut className="h-4 w-4" />
              登出
            </button>
          </div>
        )}
      </aside>
    </>
  );
}