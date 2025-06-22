
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
      setUser(currentUser);
      if (currentUser) {
        try {
          const idTokenResult = await getIdTokenResult(currentUser, true);
          const isAdminClaim = !!idTokenResult.claims.admin;
          const isDeliveryClaim = !!idTokenResult.claims.delivery;
          setIsAdmin(isAdminClaim);
          setIsDelivery(isDeliveryClaim);

          const isLoginPage = pathname === '/login' || pathname === '/signup';
          const isDeliveryLoginPage = pathname === '/delivery/login';

          // Redirect based on role
          if (isDeliveryClaim) {
            if (!pathname.startsWith('/delivery')) {
              router.replace('/delivery/dashboard');
            }
          } else if (isAdminClaim) {
            if (pathname === '/admin' && !isAdminClaim) {
                router.replace('/');
            } else if (isLoginPage || isDeliveryLoginPage) {
                router.replace('/admin');
            }
          } else { // Regular user
            if (pathname.startsWith('/admin') || pathname.startsWith('/delivery')) {
              router.replace('/');
            } else if (isLoginPage) {
              router.replace('/');
            }
          }

        } catch (error) {
          console.error("Error getting user claims:", error);
          setIsAdmin(false);
          setIsDelivery(false);
          // Fallback redirect if claims fail
          if (pathname.startsWith('/admin') || pathname.startsWith('/delivery')) {
            router.replace('/');
          }
        }
      } else {
        // No user logged in
        setIsAdmin(false);
        setIsDelivery(false);
        const isProtectedUserRoute = !['/login', '/signup', '/delivery/login'].includes(pathname) && !pathname.startsWith('/admin') && !pathname.startsWith('/delivery');
        const isProtectedAdminRoute = pathname.startsWith('/admin');
        const isProtectedDeliveryRoute = pathname.startsWith('/delivery') && pathname !== '/delivery/login';
        
        if (isProtectedAdminRoute) router.replace('/login'); // Or a dedicated admin login
        else if (isProtectedDeliveryRoute) router.replace('/delivery/login');
        else if (isProtectedUserRoute) router.replace('/login');

      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []); // Removed router and pathname to prevent re-renders on navigation. Logic inside handles it now.

  const login = async (email?: string, password?: string) => {
    // Note: We don't set isLoading here because onAuthStateChanged handles it, preventing flashes
    if (!email || !password) {
      toast({ title: 'Login Error', description: 'Email and password are required.', variant: 'destructive' });
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle routing and setting roles.
      toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });
    } catch (error: any) {
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
      // onAuthStateChanged will handle routing
      toast({ title: 'Signup Successful!', description: 'Welcome to Rasoi Express!', variant: 'default' });
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
      // Redirect to the appropriate login page based on previous role
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

    