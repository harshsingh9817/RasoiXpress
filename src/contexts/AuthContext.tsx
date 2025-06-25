
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
  type User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getIdTokenResult,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDelivery: boolean; // Add delivery role
  login: (email?: string, password?: string) => Promise<void>;
  signup: (email?: string, password?: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false); // Add delivery state
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      if (!currentUser) {
        setIsAdmin(false);
        setIsDelivery(false);
        setUser(null);
        
        // Define all public paths. Everything else requires authentication.
        const publicPaths = ['/login', '/signup', '/delivery/login'];
        
        // Check if the current path is public.
        const isPublicPath = publicPaths.includes(pathname);

        // Redirect if the current path is not public.
        if (!isPublicPath && !pathname.startsWith('/restaurants')) {
            // Delivery personnel should be redirected to their specific login page.
            if (pathname.startsWith('/delivery')) {
                router.replace('/delivery/login');
            } else {
                router.replace('/login');
            }
        }
        
        setIsLoading(false);
        return;
      }

      setUser(currentUser);
      try {
        const idTokenResult = await getIdTokenResult(currentUser, true);
        const isAdminClaim = !!idTokenResult.claims.admin || currentUser.email === 'admin@example.com';
        const isDeliveryClaim = !!idTokenResult.claims.delivery || currentUser.email === 'delivery@example.com';
        
        setIsAdmin(isAdminClaim);
        setIsDelivery(isDeliveryClaim);

        const isLoginPage = pathname === '/login' || pathname === '/signup';
        const isDeliveryLoginPage = pathname === '/delivery/login';

        // Redirect based on role
        if (isDeliveryClaim) {
          if (!pathname.startsWith('/delivery')) router.replace('/delivery/dashboard');
        } else if (isAdminClaim) {
          if (isLoginPage || isDeliveryLoginPage) router.replace('/admin');
        } else { // Regular user
          if (pathname.startsWith('/admin') || pathname.startsWith('/delivery')) router.replace('/');
        }

      } catch (error) {
        console.error("Error getting user claims:", error);
        setIsAdmin(false);
        setIsDelivery(false);
        if (pathname.startsWith('/admin') || pathname.startsWith('/delivery')) {
          router.replace('/');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]); 

  const sendPasswordReset = async (email: string) => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your inbox for a link to reset your password. If not found, please check your spam folder.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error("Firebase password reset error:", error);
      let description = 'Could not send password reset email. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        description = 'This email is not registered. Please check the email address.';
      }
      toast({
        title: 'Error Sending Email',
        description,
        variant: 'destructive',
      });
    }
  };

  const login = async (email?: string, password?: string) => {
    if (!email || !password) {
      toast({ title: 'Login Error', description: 'Email and password are required.', variant: 'destructive' });
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const isSpecialAccount = userCredential.user.email === 'admin@example.com' || userCredential.user.email === 'delivery@example.com';

      // For regular users, check if their email is verified.
      if (!userCredential.user.emailVerified && !isSpecialAccount) {
        await firebaseSignOut(auth); // Log them out immediately
        toast({
          title: "Email Not Verified",
          description: "A verification link was sent to your email upon signup. Please verify your email before logging in.",
          variant: "destructive",
          duration: 10000,
        });
        return; // Stop the login process
      }
      
      // onAuthStateChanged will handle UI updates and redirects.
      toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });
      // Redirects will be handled by onAuthStateChanged.

    } catch (error: any) {
      const isSpecialAccount = email === 'delivery@example.com' || email === 'admin@example.com';

      if (isSpecialAccount && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (userCredential.user) {
            const displayName = email === 'admin@example.com' ? 'Admin User' : 'Delivery Partner';
            await updateProfile(userCredential.user, { displayName });
            await userCredential.user.getIdToken(true); 
          }
          toast({ title: 'Special Account Created!', description: 'Welcome! Logging you in now.', variant: 'default' });
          if (email === 'admin@example.com') {
             router.push('/admin');
          } else {
             router.push('/delivery/dashboard');
          }
          return; 
        } catch (signupError: any) {
          console.error("Firebase auto-signup error for special user:", signupError);
        }
      }

      console.error("Firebase login error:", error);
      let description = 'An unexpected error occurred during login. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = 'The email or password you entered is incorrect. Please check your credentials and try again.';
      } else if (error.message) {
        description = error.message;
      }
      toast({ title: 'Login Failed', description, variant: 'destructive' });
    }
  };

  const signup = async (email?: string, password?: string, fullName?: string): Promise<void> => {
    if (!email || !password || !fullName) {
      toast({
        title: 'Signup Error',
        description: 'Full name, email and password are required.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: fullName });
        // Send verification email
        await sendEmailVerification(userCredential.user);
      }
      
      // Log the user out so they must verify before logging in.
      await firebaseSignOut(auth);
      
      toast({ 
        title: 'Account Created! Please Verify Your Email.', 
        description: "We've sent a verification link to your email. Please click the link in the email to activate your account before logging in.", 
        variant: 'default',
        duration: 10000 // Give user time to read
      });
      
      // Redirect to login page after successful signup.
      router.push('/login');

    } catch (error: any) {
      console.error("Firebase signup error:", error);
      let description = 'Could not create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email address is already in use by another account.';
      } else if (error.code === 'auth/weak-password') {
        description = 'The password is too weak. Please use at least 6 characters.';
      } else if (error.message) {
        description = error.message;
      }
      toast({
        title: 'Signup Failed',
        description,
        variant: 'destructive',
      });
    }
  };

  const logout = async () => {
    const wasDelivery = isDelivery;
    try {
      await firebaseSignOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.', variant: 'default' });
      if (wasDelivery) {
          router.push('/delivery/login');
      } else {
          router.push('/login');
      }
    } catch (error: any) {
      console.error("Firebase logout error:", error);
      toast({ title: 'Logout Failed', description: error.message || 'Could not log out.', variant: 'destructive' });
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, isDelivery, login, signup, logout, isLoading, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
