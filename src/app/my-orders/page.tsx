
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page is being consolidated into the /profile page.
// This component will redirect users to the correct location.
export default function MyOrdersRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/profile?tab=orders');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p className="mt-4 text-xl text-muted-foreground">Redirecting to your orders...</p>
        </div>
    );
}
