import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Clock,
  FileText,
  Settings,
  MoreHorizontal
} from "lucide-react";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [location] = useLocation();
  
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
      label: "More",
      icon: MoreHorizontal,
      href: "#",
      onClick: () => {
        // Possible implementation: show a modal with more options
      },
    },
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
            onClick={item.onClick}
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
