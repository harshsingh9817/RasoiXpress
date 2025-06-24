
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Home, User, LogIn, ShieldCheck, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import HelpDialog from './HelpDialog';
import { Skeleton } from './ui/skeleton';

const BottomNav = () => {
    const { isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();
    const pathname = usePathname();
    const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

    // Function to determine if a link is active
    const getActiveClass = (href: string, isPrefix: boolean = false) => {
        const isActive = isPrefix ? pathname.startsWith(href) : pathname === href;
        return isActive ? 'text-primary' : 'text-muted-foreground';
    };

    return (
        <>
            <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
                <nav className="flex h-16 items-center justify-around px-2">
                    <Link href="/" className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors hover:text-primary", getActiveClass('/'))}>
                        <Home className="h-6 w-6" />
                        <span className="text-xs font-medium">Menu</span>
                    </Link>

                    <button onClick={() => setIsHelpDialogOpen(true)} className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md text-muted-foreground transition-colors hover:text-primary")}>
                        <HelpCircle className="h-6 w-6" />
                        <span className="text-xs font-medium">Help</span>
                    </button>

                    {isAuthLoading ? (
                        <div className="flex flex-col items-center justify-center gap-1 p-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-2 w-10 rounded-sm" />
                        </div>
                    ) : isAuthenticated ? (
                        isAdmin ? (
                            <Link href="/admin" className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors hover:text-primary", getActiveClass('/admin', true))}>
                                <ShieldCheck className="h-6 w-6" />
                                <span className="text-xs font-medium">Admin</span>
                            </Link>
                        ) : (
                            <Link href="/profile" className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors hover:text-primary", getActiveClass('/profile', true))}>
                                <User className="h-6 w-6" />
                                <span className="text-xs font-medium">Profile</span>
                            </Link>
                        )
                    ) : (
                        <Link href="/login" className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors hover:text-primary", getActiveClass('/login'))}>
                            <LogIn className="h-6 w-6" />
                            <span className="text-xs font-medium">Login</span>
                        </Link>
                    )}
                </nav>
            </footer>
            {/* The dialog is rendered here, controlled by this component's state */}
            <HelpDialog isOpen={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen} />
        </>
    );
};

export default BottomNav;
