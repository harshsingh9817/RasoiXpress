
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname }
from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
  type User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getIdTokenResult,
  updateProfile
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
        const isProtectedAdminRoute = pathname.startsWith('/admin');
        const isProtectedDeliveryRoute = pathname.startsWith('/delivery') && pathname !== '/delivery/login';
        const isAppProtectedRoute = !['/login', '/signup', '/delivery/login', '/'].includes(pathname) && !pathname.startsWith('/restaurants/');

        if(isProtectedAdminRoute) router.replace('/login');
        else if(isProtectedDeliveryRoute) router.replace('/delivery/login');
        else if(isAppProtectedRoute) router.replace('/login');
        
        setIsLoading(false);
        return;
      }

      setUser(currentUser);
      try {
        const idTokenResult = await getIdTokenResult(currentUser, true);
        const isAdminClaim = !!idTokenResult.claims.admin;
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

  const login = async (email?: string, password?: string) => {
    if (!email || !password) {
      toast({ title: 'Login Error', description: 'Email and password are required.', variant: 'destructive' });
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });
      
      // Manually check role and redirect here for immediate feedback, onAuthStateChanged will confirm
      if (email === 'delivery@example.com') {
          router.push('/delivery/dashboard');
      } else {
          router.push('/');
      }

    } catch (error: any) {
      // Special handling for the delivery user: if login fails because the account doesn't exist, create it automatically.
      if (email === 'delivery@example.com' && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName: 'Delivery Partner' });
            await userCredential.user.getIdToken(true); // Force refresh claims to be safe
          }
          toast({ title: 'Delivery Account Created!', description: 'Welcome! Logging you in now.', variant: 'default' });
          router.push('/delivery/dashboard');
          return; // Exit after successful creation
        } catch (signupError: any) {
          console.error("Firebase auto-signup error for delivery user:", signupError);
          // Fall through to generic error toast if auto-signup also fails (e.g., weak password)
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

  const signup = async (email?: string, password?: string, fullName?: string) => {
     if (!email || !password || !fullName) {
      toast({ title: 'Signup Error', description: 'Full name, email and password are required.', variant: 'destructive' });
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: fullName });
        await userCredential.user.getIdToken(true);
      }
      toast({ title: 'Signup Successful!', description: 'Welcome to Rasoi Xpress!', variant: 'default' });
      router.push('/');
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: 'Signup Failed',
          description: 'This email address is already in use. Please try a different email or log in.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup Failed',
          description: error.message || 'Could not create account. Please try again.',
          variant: 'destructive',
        });
      }
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
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, isDelivery, login, signup, logout, isLoading }}>
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
