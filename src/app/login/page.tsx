
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { KeyRound, LogInIcon, Eye, EyeOff, UserPlus } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.904,36.218,44,30.668,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);


export default function LoginPage() {
  const { login, signInWithGoogle, isAuthenticated, isLoading: isAuthLoading, sendPasswordReset } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
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
    await login(identifier, password);
    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    await signInWithGoogle();
    setIsSubmitting(false);
  }
  
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
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">Loading...</p>
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
            <div className="pt-4 flex flex-col gap-2">
                <p className="text-sm text-muted-foreground text-center">
                    Don&apos;t have an account?
                </p>
                <Button asChild className="w-full">
                    <Link href="/signup">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                    </Link>
                </Button>
            </div>
          </CardHeader>
          
            <CardContent className="space-y-4 pt-4 border-t">
              <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Email or Mobile Number</Label>
                    <Input id="identifier" type="text" placeholder="you@example.com or 9876543210" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
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
                   <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={isSubmitting || isAuthLoading}>
                    {isSubmitting ? <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> : <LogInIcon className="mr-2 h-5 w-5" />}
                    {isSubmitting ? 'Logging In...' : 'Log In'}
                  </Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting || isAuthLoading}>
                  <GoogleIcon />
                  Sign in with Google
              </Button>

            </CardContent>
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
                    <p className="text-xs text-muted-foreground px-1">
                      If you don't receive an email, please check your spam folder.
                    </p>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSendingReset}>Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSendingReset}>
                  {isSendingReset ? (
                      <><div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> Sending...</>
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
