
import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  PieChart, 
  Settings, 
  Menu, 
  X,
  Package,
  Search,
  Home,
  UserPlus,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  // Default to closed sidebar on desktop
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const navigation = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Party Management', path: '/parties', icon: Users },
    { name: 'Invoice & Billing', path: '/invoices', icon: FileText },
    { name: 'Reports', path: '/reports', icon: PieChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-0 left-0 z-50 p-4 lg:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleSidebar}
          className="bg-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - narrow design similar to the image */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform duration-300 ease-in-out border-r border-gray-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:inset-auto" // Always show on desktop
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header - simpler to match design */}
          <div className="p-4 border-b flex items-center justify-between">
            <Link to="/" className="flex items-center" onClick={closeSidebar}>
              <span className="text-xl font-bold text-primary">BizSwift</span>
            </Link>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={closeSidebar}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation items - simplified style to match design */}
          <nav className="mt-4 flex-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium",
                    isActive
                      ? "bg-gray-100 text-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  onClick={closeSidebar}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-gray-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header bar with search and user */}
        <header className="bg-white border-b border-gray-200 py-2 px-4 flex items-center justify-between">
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="search"
                placeholder="Search..."
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              className="text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
            </Button>
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-medium">
              BS
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
