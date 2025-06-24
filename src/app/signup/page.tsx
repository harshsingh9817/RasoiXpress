
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { UserPlus, Loader2, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { RecaptchaVerifier, linkWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const { signup, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<'details' | 'verifyPhone'>('details');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Redirect if user is authenticated and is on the details step
    if (!isAuthLoading && isAuthenticated && step === 'details') {
      router.replace('/'); 
    }
  }, [isAuthenticated, isAuthLoading, router, step]);
  
  // This effect sets up the reCAPTCHA verifier when the component mounts.
  // It ensures the container div exists before trying to render the reCAPTCHA.
  useEffect(() => {
    // If a verifier has already been initialized, we don't need to do it again.
    // We just need to make sure we clean it up when the component unmounts.
    if ((window as any).recaptchaVerifier) {
      const verifier = (window as any).recaptchaVerifier;
      return () => {
        verifier.clear();
        (window as any).recaptchaVerifier = undefined;
      };
    }
    
    // We add a small delay to ensure the DOM is fully ready.
    // This is especially helpful in development environments with React's Strict Mode.
    const timeoutId = setTimeout(() => {
        try {
            const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'invisible',
              'callback': () => {
                // reCAPTCHA solved. This callback is mostly for show in invisible mode.
              },
              'expired-callback': () => {
                toast({ title: "reCAPTCHA Expired", description: "Please try sending the code again.", variant: "destructive" });
                // Clean up the expired verifier
                if ((window as any).recaptchaVerifier) {
                  (window as any).recaptchaVerifier.clear();
                  (window as any).recaptchaVerifier = undefined;
                }
              }
            });
            (window as any).recaptchaVerifier = recaptchaVerifier;
        } catch (error) {
            console.error("Failed to initialize reCAPTCHA", error);
        }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = undefined;
      }
    };
  }, [toast]);


  const handleSignupAndSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!/^\d{10}$/.test(phoneNumber)) {
        toast({ title: 'Invalid Phone Number', description: 'Please enter a valid 10-digit phone number.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    const signupSuccess = await signup(email, password, fullName);
    if (!signupSuccess) {
      setIsSubmitting(false);
      return; 
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!auth.currentUser) {
       toast({ title: 'Error', description: 'Could not find newly created user. Please try logging in.', variant: 'destructive' });
       setIsSubmitting(false);
       router.push('/login');
       return;
    }
    
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      if (!appVerifier) {
          throw new Error("reCAPTCHA verifier not initialized. Please wait a moment and try again.");
      }

      const fullPhoneNumber = `+91${phoneNumber}`;
      // Render the verifier before trying to link. This makes the invisible reCAPTCHA execute.
      await appVerifier.render();
      const confirmation = await linkWithPhoneNumber(auth.currentUser, fullPhoneNumber, appVerifier);
      
      setConfirmationResult(confirmation);
      setStep('verifyPhone');
      toast({ title: 'OTP Sent!', description: `A verification code has been sent to ${fullPhoneNumber}.` });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({ title: 'Could not send OTP', description: error.message || 'Please check the phone number and try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
     e.preventDefault();
     if (!confirmationResult || otp.length !== 6) {
        toast({ title: "Invalid OTP", description: "Please enter a valid 6-digit OTP.", variant: "destructive" });
        return;
     }
     setIsSubmitting(true);
     
     try {
       await confirmationResult.confirm(otp);
       toast({ title: 'Success!', description: 'Your phone number has been verified. Welcome!', variant: 'default' });
       router.push('/');
     } catch (error: any) {
       console.error("Error verifying OTP:", error);
       toast({ title: 'Invalid OTP', description: 'The code you entered is incorrect. Please try again.', variant: 'destructive' });
     } finally {
       setIsSubmitting(false);
     }
  };
  
  const pageLoading = isAuthLoading || (isAuthenticated && step === 'details');

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full max-w-md shadow-xl">
        {step === 'details' && (
          <>
            <CardHeader className="text-center">
              <UserPlus className="mx-auto h-12 w-12 text-primary mb-2" />
              <CardTitle className="text-3xl font-headline animate-fade-in-up">Create Your Account</CardTitle>
              <CardDescription className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>Join Rasoi Xpress to start ordering.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSignupAndSendOtp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" type="text" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex items-center">
                        <span className="inline-flex items-center px-3 h-10 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">+91</span>
                        <Input id="phone" type="tel" placeholder="9876543210" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="rounded-l-none" />
                    </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={isSubmitting || isAuthLoading}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Phone className="mr-2 h-5 w-5" />}
                  {isSubmitting ? 'Creating Account...' : 'Send Verification Code'}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Log In
                  </Link>
                </p>
              </CardFooter>
            </form>
          </>
        )}

        {step === 'verifyPhone' && (
          <>
            <CardHeader className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-primary mb-2" />
              <CardTitle className="text-3xl font-headline">Verify Your Phone</CardTitle>
              <CardDescription>Enter the 6-digit code sent to +91{phoneNumber}.</CardDescription>
            </CardHeader>
            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code (OTP)</Label>
                  <Input 
                    id="otp" 
                    type="text" 
                    placeholder="123456" 
                    required 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-[0.5rem]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={isSubmitting || isAuthLoading}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                  {isSubmitting ? 'Verifying...' : 'Verify & Finish Signup'}
                </Button>
                 <Button variant="link" onClick={() => setStep('details')}>Back</Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
      {/* This div is used by Firebase for the invisible reCAPTCHA and must be in the DOM */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
