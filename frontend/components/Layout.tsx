import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Package, 
  ArrowUpDown, 
  Building2, 
  BarChart3, 
  Home,
  Menu,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Transactions', href: '/transactions', icon: ArrowUpDown },
  { name: 'Assets', href: '/assets', icon: Building2 },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const NavItems = () => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 flex-col border-r bg-white dark:bg-gray-800 lg:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Package className="h-6 w-6 text-blue-600" />
          <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
            Inventory Pro
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavItems />
        </nav>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-1 flex-col lg:hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 dark:bg-gray-800">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center border-b px-6">
                  <Package className="h-6 w-6 text-blue-600" />
                  <span className="ml-2 text-lg font-semibold">Inventory Pro</span>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                  <NavItems />
                </nav>
              </SheetContent>
            </Sheet>
            <Package className="ml-2 h-6 w-6 text-blue-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
              Inventory Pro
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>

      {/* Desktop Main Content */}
      <div className="hidden flex-1 flex-col lg:flex">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
