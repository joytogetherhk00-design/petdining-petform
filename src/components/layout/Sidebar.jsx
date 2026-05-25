import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShoppingCart, Package, FolderOpen, 
  CreditCard, ArrowUpCircle, Settings, Shield, Menu, X,
  Store, ClipboardList, User, PawPrint, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

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

const adminNav = [
  { label: '控制台總覽', icon: LayoutDashboard, path: '/admin' },
  { label: '客戶管理', icon: Users, path: '/admin/customers' },
  { label: '分店管理', icon: GitBranch, path: '/admin/branches' },
  { label: '訂單管理', icon: ClipboardList, path: '/admin/orders' },
  { label: '產品管理', icon: Package, path: '/admin/products' },
  { label: '分類管理', icon: FolderOpen, path: '/admin/categories' },
  { label: 'Credits 管理', icon: CreditCard, path: '/admin/credits' },
  { label: 'Top-up 管理', icon: ArrowUpCircle, path: '/admin/topups' },
  { label: '系統設定', icon: Settings, path: '/admin/settings' },
  { label: '管理員', icon: Shield, path: '/admin/admins' },
];

const customerNav = [
  { label: '產品目錄', icon: Store, path: '/' },
  { label: '購物車', icon: ShoppingCart, path: '/cart' },
  { label: '訂單記錄', icon: ClipboardList, path: '/orders' },
  { label: '我的帳戶', icon: User, path: '/account' },
];

export default function Sidebar({ isAdmin }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const nav = isAdmin ? adminNav : customerNav;

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
        "fixed top-0 left-0 h-full w-64 bg-sidebar z-40 flex flex-col transition-transform duration-300",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <SidebarLogo />

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = location.pathname === item.path || 
              (item.path !== '/' && item.path !== '/admin' && location.pathname.startsWith(item.path));
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
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Switch mode */}
        <div className="p-3 border-t border-sidebar-border">
          <Link
            to={isAdmin ? '/' : '/admin'}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
          >
            {isAdmin ? <Store className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            {isAdmin ? '切換至客戶端' : '管理後台'}
          </Link>
        </div>
      </aside>
    </>
  );
}