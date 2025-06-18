
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } // Added usePathname
from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import Firebase auth instance
import { 
  type User,
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  getIdTokenResult
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  signup: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true); // Start loading when auth state changes
      setUser(currentUser);
      if (currentUser) {
        try {
          const idTokenResult = await getIdTokenResult(currentUser, true); // Force refresh token to get latest claims
          console.log('Firebase ID Token Claims:', idTokenResult.claims); // Log all claims
          const isAdminClaim = !!idTokenResult.claims.admin;
          setIsAdmin(isAdminClaim);
          console.log('User is admin:', isAdminClaim);

          if ((pathname === '/login' || pathname === '/signup')) {
            router.replace('/profile');
          }
        } catch (error) {
          console.error("Error getting user claims:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        // Only redirect if on a protected route and not already on login/signup
        if ((pathname === '/profile' || pathname === '/admin' || pathname === '/checkout') && 
            pathname !== '/login' && pathname !== '/signup') {
          router.replace('/login');
        }
      }
      setIsLoading(false); // Finish loading
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const login = async (email?: string, password?: string) => {
    setIsLoading(true);
    if (!email || !password) {
      toast({ title: 'Login Error', description: 'Email and password are required.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user, claims. Redirection is handled in the effect.
      toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });
    } catch (error: any) {
      console.error("Firebase login error:", error);
      toast({ title: 'Login Failed', description: error.message || 'Invalid credentials.', variant: 'destructive' });
    } finally {
      // setIsLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  const signup = async (email?: string, password?: string) => {
    setIsLoading(true);
     if (!email || !password) {
      toast({ title: 'Signup Error', description: 'Email and password are required.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: 'Signup Successful!', description: 'Welcome to NibbleNow!', variant: 'default' });
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      toast({ title: 'Signup Failed', description: error.message || 'Could not create account.', variant: 'destructive' });
    } finally {
      // setIsLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.', variant: 'default' });
      setUser(null); // Explicitly set user to null
      setIsAdmin(false); // Explicitly set admin to false
      router.push('/');
    } catch (error: any) {
      console.error("Firebase logout error:", error);
      toast({ title: 'Logout Failed', description: error.message || 'Could not log out.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, signup, logout, isLoading }}>
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
