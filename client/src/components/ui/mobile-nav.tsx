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
  MoreHorizontal,
  UserCircle,
  LogOut,
  HelpCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [location] = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  
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
    {
      label: "Support",
      icon: HelpCircle,
      href: "/contact-support",
    },
  ];
  
  const moreItems = [
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
    {
      label: "Profile",
      icon: UserCircle,
      href: "/profile",
    },
    {
      label: "Help & Support",
      icon: HelpCircle,
      onClick: () => {
        toast({
          title: "Help & Support",
          description: "Contact administrator for assistance at support@payrollpro.com",
        });
      },
    },
    {
      label: "Logout",
      icon: LogOut,
      onClick: () => logoutMutation.mutate(),
    }
  ];
  
  return (
    <nav className={cn(
      "md:hidden bg-white border-t border-neutral-200 fixed bottom-0 left-0 right-0 z-10",
      className
    )}>
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center py-2",
              location === item.href
                ? "text-primary"
                : "text-neutral-400 hover:text-primary"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
