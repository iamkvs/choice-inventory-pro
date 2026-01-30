import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  Ship, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Boxes
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'master', 'sales', 'user'] },
  { path: '/inventory', label: 'Inventory', icon: Package, roles: ['admin', 'master', 'sales', 'user'] },
  { path: '/shipments', label: 'Shipments', icon: Ship, roles: ['admin', 'master', 'sales', 'user'] },
  { path: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'master', 'sales', 'user'] },
  { path: '/invoices', label: 'Invoices', icon: FileText, roles: ['admin', 'master', 'sales'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'master'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'master'] },
];

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar, currentUser, logout, hasRole } = useAppStore();
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => hasRole(item.roles));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-[#1a1a1a] text-white transition-all duration-300',
        isSidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {isSidebarOpen ? (
          <div className="flex items-center gap-2">
            <Boxes className="h-8 w-8 text-[#0082f3]" />
            <div>
              <h1 className="text-lg font-bold">Choice</h1>
              <p className="text-[10px] text-gray-400">Inventory System</p>
            </div>
          </div>
        ) : (
          <Boxes className="h-8 w-8 text-[#0082f3]" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white hover:bg-white/10"
        >
          {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                isActive
                  ? 'bg-[#0082f3] text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white',
                !isSidebarOpen && 'justify-center'
              )}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-white/10 p-3">
        {isSidebarOpen ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-[#0082f3] flex items-center justify-center text-sm font-medium">
                {currentUser?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{currentUser?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-gray-400 hover:text-white hover:bg-white/10"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-gray-400 hover:text-white hover:bg-white/10"
            onClick={logout}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Developer Credit */}
      {isSidebarOpen && (
        <div className="border-t border-white/10 p-3 text-center">
          <p className="text-[10px] text-gray-500">Developed by</p>
          <p className="text-[10px] text-gray-400">Prashanth KV</p>
          <p className="text-[9px] text-gray-500">Choice16 Studio</p>
        </div>
      )}
    </aside>
  );
}
