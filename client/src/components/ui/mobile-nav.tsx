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
      isSheet: true,
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
      href: "#",
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
          item.isSheet ? (
            <Sheet key={item.label} open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <SheetTrigger asChild>
                <button 
                  className={cn(
                    "flex flex-col items-center py-2",
                    isMoreOpen
                      ? "text-primary"
                      : "text-neutral-400 hover:text-primary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh] rounded-t-xl pt-6">
                <SheetHeader>
                  <SheetTitle className="text-center mb-4">More Options</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-3 gap-4 p-2">
                  {moreItems.map((moreItem) => (
                    <div key={moreItem.label} className="flex flex-col items-center">
                      {moreItem.href ? (
                        <Link
                          href={moreItem.href}
                          onClick={() => setIsMoreOpen(false)}
                          className="flex flex-col items-center p-4 hover:bg-gray-100 rounded-lg w-full text-center"
                        >
                          <moreItem.icon className="h-6 w-6 mb-2 text-primary" />
                          <span className="text-sm">{moreItem.label}</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            setIsMoreOpen(false);
                            if (moreItem.onClick) moreItem.onClick();
                          }}
                          className="flex flex-col items-center p-4 hover:bg-gray-100 rounded-lg w-full text-center"
                        >
                          <moreItem.icon className="h-6 w-6 mb-2 text-primary" />
                          <span className="text-sm">{moreItem.label}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          ) : (
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
          )
        ))}
      </div>
    </nav>
  );
}
