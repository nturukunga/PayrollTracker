import { ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Bell, User as UserIcon, ChevronDown, LogOut, Menu, DollarSign } from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { type User as UserType } from "@/lib/types";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function Layout({ children, title, actions }: LayoutProps) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: user, isLoading } = useQuery<UserType | null>({ 
    queryKey: ['/api/users/current']
  });

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <div className="pt-6 px-4">
                  <h2 className="text-lg font-medium">Navigation</h2>
                  <p className="text-sm text-muted-foreground">Application menu</p>
                </div>
                <Sidebar className="w-full shadow-none mt-2" />
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6" />
              <h1 className="text-xl font-medium">PayrollPro</h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isLoading && user && (
              <>
                <ThemeSwitcher />
                
                <Button variant="ghost" size="icon" className="text-white">
                  <Bell className="h-5 w-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 text-white">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary-light text-white">
                          {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">{user.fullName}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <div className="flex w-full items-center">
                          <UserIcon className="mr-2 h-4 w-4" />
                          Profile
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 pb-20 md:pb-6">
          {(title || actions) && (
            <div className="flex justify-between items-center mb-6">
              {title && <h1 className="text-2xl font-medium text-neutral-500">{title}</h1>}
              {actions && <div className="flex space-x-2">{actions}</div>}
            </div>
          )}
          
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4",
      subtitle ? "pb-4 border-b" : ""
    )}>
      <div>
        <h1 className="text-2xl font-medium text-neutral-500">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex space-x-2 w-full sm:w-auto justify-end">{actions}</div>}
    </div>
  );
}
