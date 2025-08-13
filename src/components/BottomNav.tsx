
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Home, User, ShieldCheck, HelpCircle, LayoutGrid, ListOrdered } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import HelpDialog from './HelpDialog';

const BottomNav = () => {
    const { isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();
    const pathname = usePathname();
    const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

    if (isAuthLoading || !isAuthenticated) {
        return null;
    }

    const getActiveClass = (path: string, exact: boolean = false) => {
        if (exact) return pathname === path;
        return pathname.startsWith(path);
    };

    const renderCustomerNav = () => (
        <>
            <Link href="/" className={cn("flex flex-col items-center gap-1 p-2 rounded-md", getActiveClass('/', true) ? 'text-primary' : 'text-muted-foreground')}>
                <Home className="h-6 w-6" />
                <span className="text-xs font-medium">Menu</span>
            </Link>
            <Link href="/categories" className={cn("flex flex-col items-center gap-1 p-2 rounded-md", getActiveClass('/categories') ? 'text-primary' : 'text-muted-foreground')}>
                <LayoutGrid className="h-6 w-6" />
                <span className="text-xs font-medium">Categories</span>
            </Link>
            <Link href="/my-orders" className={cn("flex flex-col items-center gap-1 p-2 rounded-md", getActiveClass('/my-orders') ? 'text-primary' : 'text-muted-foreground')}>
                <ListOrdered className="h-6 w-6" />
                <span className="text-xs font-medium">My Orders</span>
            </Link>
            <button onClick={() => setIsHelpDialogOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-md text-muted-foreground">
                <HelpCircle className="h-6 w-6" />
                <span className="text-xs font-medium">Help</span>
            </button>
            {isAdmin && (
                 <Link href="/admin" className={cn("flex flex-col items-center gap-1 p-2 rounded-md", getActiveClass('/admin') ? 'text-primary' : 'text-muted-foreground')}>
                    <ShieldCheck className="h-6 w-6" />
                    <span className="text-xs font-medium">Admin</span>
                </Link>
            )}
             <Link href="/profile" className={cn("flex flex-col items-center gap-1 p-2 rounded-md", getActiveClass('/profile') ? 'text-primary' : 'text-muted-foreground')}>
                <User className="h-6 w-6" />
                <span className="text-xs font-medium">Profile</span>
            </Link>
        </>
    );

    return (
        <>
            <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
                <nav className="flex h-16 items-center justify-around px-2">
                    {renderCustomerNav()}
                </nav>
            </footer>
            <HelpDialog isOpen={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen} />
        </>
    );
};

export default BottomNav;
