
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import CartSheet from '@/components/CartSheet'; 
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.replace('/'); 
    }
  }, [isAdmin, isLoading, isAuthenticated, router]);

  const handleGenerateRecommendations = async () => {
    setIsGeneratingRecs(true);
    try {
        const response = await fetch('/api/recommend', { method: 'POST' });
        if (!response.ok) {
            throw new Error("Failed to get a successful response from the server.");
        }
        await response.json(); 
        toast({
            title: "Recommendations Refresh Triggered",
            description: "New recommendations have been generated for users.",
            variant: "default"
        });
    } catch (error) {
        console.error("Failed to trigger recommendations:", error);
        toast({
            title: "Generation Failed",
            description: "Could not trigger recommendation generation. Please check the server logs.",
            variant: "destructive"
        });
    } finally {
        setIsGeneratingRecs(false);
    }
  }

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isLoading ? "Verifying access..." : "Access Denied. Redirecting..."}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-headline">Manage Food Items</CardTitle>
            <CardDescription>Add, edit, or remove food items from the menu.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Food item management will be here.</p>
            {/* Placeholder for future components for adding/editing food items */}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-headline">View Orders</CardTitle>
            <CardDescription>See current and past customer orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Order viewing interface will be here.</p>
            {/* Placeholder for future components for viewing orders */}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-headline flex items-center">
                    <Sparkles className="mr-2 h-6 w-6 text-accent" /> AI Recommendations
                </CardTitle>
                <CardDescription>Trigger AI to generate new dish recommendations for users.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                    This will generate new recommendations for all users, which they will see in their notification panel on their next visit.
                </p>
                <Button onClick={handleGenerateRecommendations} disabled={isGeneratingRecs} className="w-full">
                    {isGeneratingRecs ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Generate Now</>
                    )}
                </Button>
            </CardContent>
        </Card>
      </div>
      <CartSheet />
    </div>
  );
}
