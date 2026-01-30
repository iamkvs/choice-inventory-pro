import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { company, theme, setTheme, currentUser, isSidebarOpen } = useAppStore();

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200 transition-all duration-300',
        isSidebarOpen ? 'left-64' : 'left-16'
      )}
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* Left: Mobile Menu & Search */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-64 pl-10"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="text-gray-600 hover:text-gray-900"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-[10px]">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-auto">
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <p className="text-sm font-medium">Low Stock Alert</p>
                  <p className="text-xs text-gray-500">5 products are running low on stock</p>
                  <p className="text-[10px] text-gray-400">2 minutes ago</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <p className="text-sm font-medium">New Shipment Arrived</p>
                  <p className="text-xs text-gray-500">Shipment TRK-001 has been delivered</p>
                  <p className="text-[10px] text-gray-400">1 hour ago</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <p className="text-sm font-medium">Invoice Overdue</p>
                  <p className="text-xs text-gray-500">Invoice #INV-001 is now overdue</p>
                  <p className="text-[10px] text-gray-400">1 day ago</p>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Company Info */}
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
            {company?.logo ? (
              <img src={company.logo} alt={company.name} className="h-8 w-8 rounded object-cover" />
            ) : (
              <div className="h-8 w-8 rounded bg-[#0082f3] flex items-center justify-center text-white text-sm font-bold">
                {company?.name?.charAt(0) || 'C'}
              </div>
            )}
            <div className="hidden lg:block">
              <p className="text-sm font-medium">{company?.name || 'Your Company'}</p>
              <p className="text-xs text-gray-500">{currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
