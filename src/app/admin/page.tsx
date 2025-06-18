
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import CartSheet from '@/components/CartSheet'; // For layout consistency

export default function AdminPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.replace('/'); // Redirect to home if not admin or not authenticated
    }
  }, [isAdmin, isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isLoading ? "Loading..." : "Access Denied. Redirecting..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section className="text-center">
        <ShieldCheck className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Manage your application settings, food items, and orders.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Manage Food Items</CardTitle>
            <CardDescription>Add, edit, or remove food items from the menu.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Food item management will be here.</p>
            {/* Placeholder for future components */}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">View Orders</CardTitle>
            <CardDescription>See current and past customer orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Order viewing interface will be here.</p>
            {/* Placeholder for future components */}
          </CardContent>
        </Card>
      </div>
      <CartSheet />
    </div>
  );
}
