
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { UserCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';
import { updateUserProfileData } from '@/lib/data';

export default function CompleteProfilePage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
    if (user) {
      setFullName(user.displayName || '');
    }
  }, [user, isAuthenticated, isAuthLoading, router]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }
    if (!fullName || !mobileNumber) {
      toast({ title: "Missing information", description: "Please fill out all fields.", variant: "destructive" });
      return;
    }
    
    if (!/^\d{10}$/.test(mobileNumber)) {
        toast({ title: "Invalid Mobile Number", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
      await updateUserProfileData(user.uid, { displayName: fullName, mobileNumber });
      toast({ title: "Profile Updated!", description: "Welcome to Rasoi Xpress!" });
      router.push('/profile?setup=true'); // Redirect to address setup
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({ title: 'Update Failed', description: error.message || "Could not update your profile.", variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <UserCheck className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-headline">Just One More Step</CardTitle>
          <CardDescription>Please confirm your details to continue.</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" type="text" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input id="mobileNumber" type="tel" placeholder="9876543210" required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
            </div>
             <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={isSubmitting || isAuthLoading}>
              {isSubmitting ? <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> : <UserCheck className="mr-2 h-5 w-5" />}
              {isSubmitting ? 'Saving...' : 'Save and Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
