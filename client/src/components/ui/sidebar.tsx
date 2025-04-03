import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Clock,
  FileText,
  Settings,
  HelpCircle,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
    },
    {
      label: "Employees",
      icon: Users,
      href: "/employees",
    },
    {
      label: "Payroll",
      icon: DollarSign,
      href: "/payroll",
    },
    {
      label: "Attendance",
      icon: Clock,
      href: "/attendance",
    },
    {
      label: "Reports",
      icon: FileText,
      href: "/reports",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];
  
  const filteredNavItems = searchQuery.length > 0
    ? navItems.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : navItems;
  
  return (
    <aside className={cn(
      "bg-white shadow-lg w-64 flex-shrink-0 hidden md:block",
      className
    )}>
      <nav className="h-full py-4">
        <div className="px-4 mb-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">
              <Search className="h-4 w-4" />
            </span>
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-full rounded-md bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-neutral-500 hover:bg-blue-50",
                location === item.href && "text-primary bg-blue-50 border-r-4 border-primary"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        
        <div className="absolute bottom-0 w-full p-4">
          <div className="flex items-center px-4 py-3 text-neutral-500 hover:bg-blue-50 cursor-pointer">
            <HelpCircle className="mr-3 h-5 w-5" />
            <span>Help & Support</span>
          </div>
        </div>
      </nav>
    </aside>
  );
}
