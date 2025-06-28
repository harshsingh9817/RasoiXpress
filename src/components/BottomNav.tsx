
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, User, ShieldCheck, HelpCircle, Bike, ListOrdered } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import HelpDialog from './HelpDialog';
import { Skeleton } from './ui/skeleton';

const BottomNav = () => {
    const { isAuthenticated, isAdmin, isDelivery, isLoading: isAuthLoading } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

    if (isAuthLoading) {
        return (
            <footer className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background/95 md:hidden">
                <div className="flex h-full items-center justify-around px-2">
                    <Skeleton className="h-10 w-12 rounded-md" />
                    <Skeleton className="h-10 w-12 rounded-md" />
                    <Skeleton className="h-10 w-12 rounded-md" />
                </div>
            </footer>
        )
    }

    if (!isAuthenticated) {
        return null;
    }

    const getActiveClass = (path: string, exact: boolean = true, tabName?: string) => {
        const isPathMatch = exact ? pathname === path : pathname.startsWith(path);
        if (tabName) {
            return isPathMatch && searchParams.get('tab') === tabName;
        }
        return isPathMatch;
    };

    const profileLink = isDelivery ? "/delivery/profile" : "/profile";
    const isProfilePage = pathname === '/profile' && searchParams.get('tab') !== 'orders';

    return (
        <>
            <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
                <nav className="flex h-16 items-center justify-around px-2">
                    {!isDelivery && (
                        <Link href="/" className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors hover:text-primary", getActiveClass('/') ? 'text-primary' : 'text-muted-foreground')}>
                            <Home className="h-6 w-6" />
                            <span className="text-xs font-medium">Menu</span>
                        </Link>
                    )}

                    {!isDelivery && !isAdmin && (
                        <Link href="/profile?tab=orders" className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors hover:text-primary", getActiveClass('/profile', true, 'orders') ? 'text-primary' : 'text-muted-foreground')}>
                            <ListOrdered className="h-6 w-6" />
                            <span className="text-xs font-medium">My Orders</span>
                        </Link>
                    )}

                    <button onClick={() => setIsHelpDialogOpen(true)} className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md text-muted-foreground transition-colors hover:text-primary")}>
                        <HelpCircle className="h-6 w-6" />
                        <span className="text-xs font-medium">Help</span>
                    </button>

                    {isDelivery && (
                         <Link href="/delivery/dashboard" className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors hover:text-primary", getActiveClass('/delivery/dashboard') ? 'text-primary' : 'text-muted-foreground')}>
                            <Bike className="h-6 w-6" />
                            <span className="text-xs font-medium">Dashboard</span>
                        </Link>
                    )}

                    {isAdmin && (
                        <Link href="/admin" className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors hover:text-primary", getActiveClass('/admin', false) ? 'text-primary' : 'text-muted-foreground')}>
                            <ShieldCheck className="h-6 w-6" />
                            <span className="text-xs font-medium">Admin</span>
                        </Link>
                    )}

                    <Link href={profileLink} className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors hover:text-primary", getActiveClass(profileLink, false) && !getActiveClass('/profile', true, 'orders') ? 'text-primary' : 'text-muted-foreground')}>
                        <User className="h-6 w-6" />
                        <span className="text-xs font-medium">Profile</span>
                    </Link>
                </nav>
            </footer>
            {/* The dialog is rendered here, controlled by this component's state */}
            <HelpDialog isOpen={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen} />
        </>
    );
};

export default BottomNav;
