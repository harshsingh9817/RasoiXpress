
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { LogInIcon } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import AnimatedDeliveryCycle from '@/components/icons/AnimatedDeliveryCycle';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';

export default function DeliveryLoginPage() {
  const { login, isDelivery, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (!isAuthLoading && isDelivery) {
      router.replace('/delivery/dashboard'); 
    }
  }, [isDelivery, isAuthLoading, router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(email, password);
    // Navigation is handled by AuthContext based on claims
    setIsSubmitting(false);
  };

  const pageLoading = isAuthLoading || (!isAuthLoading && isDelivery);

  if (pageLoading) {
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
          <div className="w-24 h-24 mx-auto text-primary mb-2">
            <AnimatedDeliveryCycle />
          </div>
          <CardTitle className="text-3xl font-headline">Delivery Partner Login</CardTitle>
          <CardDescription>Log in to manage your assigned orders.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="delivery@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={isSubmitting || isAuthLoading}>
              {isSubmitting ? <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> : <LogInIcon className="mr-2 h-5 w-5" />}
              {isSubmitting ? 'Logging In...' : 'Log In'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
