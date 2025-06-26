
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, Sparkles, Utensils, ClipboardList, LayoutTemplate, CreditCard, BarChart2, MessageSquare, Bike } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { user, isAdmin, isLoading, isAuthenticated, logout } = useAuth();
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
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-card border">
        <div className="text-center sm:text-left">
            <h1 className="text-3xl font-headline font-bold text-primary mb-1">Admin Dashboard</h1>
            <p className="text-md text-muted-foreground">
                Welcome, {user?.displayName || user?.email}! Manage your application.
            </p>
        </div>
        <Button onClick={logout} variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50">
            <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/menu" className="block h-full">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full hover:border-primary">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-headline flex items-center">
                  <Utensils className="mr-2 h-6 w-6 text-primary"/>
                  Manage Menu Items
              </CardTitle>
              <CardDescription>Add, edit, or remove food items from the menu.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Click here to manage all food items available in the application.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders" className="block h-full">
            <Card className="shadow-lg hover:shadow-xl transition-shadow h-full hover:border-primary">
                <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-headline flex items-center">
                    <ClipboardList className="mr-2 h-6 w-6 text-primary" />
                    View Orders
                </CardTitle>
                <CardDescription>See current and past customer orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Click here to browse all customer orders in the system.</p>
                </CardContent>
            </Card>
        </Link>

        <Link href="/admin/hero" className="block h-full">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full hover:border-primary">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-headline flex items-center">
                  <LayoutTemplate className="mr-2 h-6 w-6 text-primary"/>
                  Manage Hero Section
              </CardTitle>
              <CardDescription>Edit the headline and text of the homepage hero.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Click here to update the main banner on the homepage.</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/payment" className="block h-full">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full hover:border-primary">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-headline flex items-center">
                  <CreditCard className="mr-2 h-6 w-6 text-primary"/>
                  Manage Payments
              </CardTitle>
              <CardDescription>Configure UPI and QR code payment options.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Click here to set your UPI ID and QR code image URL.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics" className="block h-full">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full hover:border-primary">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-headline flex items-center">
                  <BarChart2 className="mr-2 h-6 w-6 text-primary"/>
                  View Analytics
              </CardTitle>
              <CardDescription>See sales data, profits, and company growth.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Click here to view the business analytics dashboard.</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/messaging" className="block h-full">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full hover:border-primary">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-headline flex items-center">
                  <MessageSquare className="mr-2 h-6 w-6 text-primary"/>
                  Send Messages
              </CardTitle>
              <CardDescription>Send direct messages to your customers.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Click here to send personalized notifications to users.</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/riders" className="block h-full">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full hover:border-primary">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-headline flex items-center">
                  <Bike className="mr-2 h-6 w-6 text-primary"/>
                  Manage Riders
              </CardTitle>
              <CardDescription>Add or remove delivery riders from the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Click here to manage rider accounts and access.</p>
            </CardContent>
          </Card>
        </Link>

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
    </div>
  );
}
