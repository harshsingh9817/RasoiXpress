"use client";

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Home, User, ShieldCheck, HelpCircle, Bike, ListOrdered } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import HelpDialog from './HelpDialog';

const BottomNav = () => {
    const { isAuthenticated, isAdmin, isDelivery, isLoading: isAuthLoading } = useAuth();
    const pathname = usePathname();
    const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

    if (isAuthLoading || !isAuthenticated) {
        return null;
    }

    const getActiveClass = (path: string) => {
        return pathname.startsWith(path);
    };

    const profileLink = isDelivery ? "/delivery/profile" : "/profile";

    return (
        <>
            <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
                <nav className="flex h-16 items-center justify-around px-2">
                    {!isDelivery && (
                        <Link href="/" className={cn("flex flex-col items-center gap-1 p-2 rounded-md", getActiveClass('/') && pathname === '/' ? 'text-primary' : 'text-muted-foreground')}>
                            <Home className="h-6 w-6" />
                            <span className="text-xs font-medium">Menu</span>
                        </Link>
                    )}

                    {!isDelivery && !isAdmin && (
                        <Link href="/my-orders" className={cn("flex flex-col items-center gap-1 p-2 rounded-md", getActiveClass('/my-orders') ? 'text-primary' : 'text-muted-foreground')}>
                            <ListOrdered className="h-6 w-6" />
                            <span className="text-xs font-medium">My Orders</span>
                        </Link>
                    )}

                    <button onClick={() => setIsHelpDialogOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-md text-muted-foreground">
                        <HelpCircle className="h-6 w-6" />
                        <span className="text-xs font-medium">Help</span>
                    </button>

                    {isDelivery && (
                         <Link href="/delivery/dashboard" className={cn("flex flex-col items-center gap-1 p-2 rounded-md", getActiveClass('/delivery/dashboard') ? 'text-primary' : 'text-muted-foreground')}>
                            <Bike className="h-6 w-6" />
                            <span className="text-xs font-medium">Dashboard</span>
                        </Link>
                    )}

                    {isAdmin && (
                        <Link href="/admin" className={cn("flex flex-col items-center gap-1 p-2 rounded-md", getActiveClass('/admin') ? 'text-primary' : 'text-muted-foreground')}>
                            <ShieldCheck className="h-6 w-6" />
                            <span className="text-xs font-medium">Admin</span>
                        </Link>
                    )}

                    <Link href={profileLink} className={cn("flex flex-col items-center gap-1 p-2 rounded-md", getActiveClass(profileLink) ? 'text-primary' : 'text-muted-foreground')}>
                        <User className="h-6 w-6" />
                        <span className="text-xs font-medium">Profile</span>
                    </Link>
                </nav>
            </footer>
            <HelpDialog isOpen={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen} />
        </>
    );
};

export default BottomNav;
