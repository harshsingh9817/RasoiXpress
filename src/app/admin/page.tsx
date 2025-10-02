
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LogOut, Utensils, ClipboardList, LayoutTemplate, CreditCard, BarChart2,
  MessageSquare, LifeBuoy, Tag, LayoutGrid, ShieldCheck
} from 'lucide-react';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const adminNavItems = [
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/menu', label: 'Menu', icon: Utensils },
  { href: '/admin/categories', label: 'Categories', icon: LayoutGrid },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/hero', label: 'Hero', icon: LayoutTemplate },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/messaging', label: 'Messages', icon: MessageSquare },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/payment', label: 'Settings', icon: CreditCard },
];

export default function AdminPage() {
  const { user, isAdmin, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
          <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">
          {isLoading ? "Verifying access..." : "Access Denied. Redirecting..."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2 flex items-center justify-center">
          <ShieldCheck className="mr-3 h-10 w-10" />
          Admin Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome, {user?.displayName || user?.email}! Manage your application from here.
        </p>
      </section>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {adminNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'group inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-3 text-sm font-medium',
                pathname === item.href
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

       <div className="text-center mt-8">
           <Button onClick={logout} variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50">
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
       </div>
    </div>
  );
}
