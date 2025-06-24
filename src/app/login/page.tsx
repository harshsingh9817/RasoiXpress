
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { KeyRound, LogInIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: isAuthLoading, sendPasswordReset } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);


  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/'); 
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(email, password);
    // Navigation is handled by onAuthStateChanged in AuthContext or if login fails, user stays here
    setIsSubmitting(false);
  };
  
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);
    await sendPasswordReset(resetEmail);
    setIsSendingReset(false);
    setIsResetDialogOpen(false);
    setResetEmail('');
  };

  const pageLoading = isAuthLoading || (!isAuthLoading && isAuthenticated);

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-3xl font-headline animate-fade-in-up">Welcome Back!</CardTitle>
            <CardDescription className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>Log in to access your Rasoi Xpress account.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs"
                    onClick={() => setIsResetDialogOpen(true)}
                  >
                    Forgot Password?
                  </Button>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={isSubmitting || isAuthLoading}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogInIcon className="mr-2 h-5 w-5" />}
                {isSubmitting ? 'Logging In...' : 'Log In'}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                  Sign Up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword}>
              <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="sr-only">Email</Label>
                    <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                    />
                    <p className="text-xs text-destructive font-bold px-1">
                      When email not found check your Spam message
                    </p>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSendingReset}>Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSendingReset}>
                  {isSendingReset ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                      "Send Reset Link"
                  )}
                  </Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
