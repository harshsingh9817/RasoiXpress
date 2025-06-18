
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
  const pathname = usePathname(); 
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true); 
      setUser(currentUser);
      if (currentUser) {
        try {
          // Force refresh the token to get the latest custom claims
          const idTokenResult = await getIdTokenResult(currentUser, true); 
          console.log('Firebase ID Token Claims:', idTokenResult.claims); 
          
          // Check for the 'admin' custom claim
          const isAdminClaim = !!idTokenResult.claims.admin; 
          setIsAdmin(isAdminClaim);
          console.log('User is admin:', isAdminClaim);

          if ((pathname === '/login' || pathname === '/signup')) {
            router.replace('/profile');
          }
        } catch (error) {
          console.error("Error getting user claims:", error);
          setIsAdmin(false); // Default to not admin on error
        }
      } else {
        setIsAdmin(false);
        if ((pathname === '/profile' || pathname === '/admin' || pathname === '/checkout') && 
            pathname !== '/login' && pathname !== '/signup') {
          router.replace('/login');
        }
      }
      setIsLoading(false); 
    });

    return () => unsubscribe();
  }, [router, pathname]); // router and pathname are dependencies for navigation logic

  const login = async (email?: string, password?: string) => {
    setIsLoading(true);
    if (!email || !password) {
      toast({ title: 'Login Error', description: 'Email and password are required.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user, claims, and redirecting.
      toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });
    } catch (error: any) {
      console.error("Firebase login error:", error);
      toast({ title: 'Login Failed', description: error.message || 'Invalid credentials.', variant: 'destructive' });
      setIsLoading(false); // Explicitly set loading to false on error here since onAuthStateChanged might not re-trigger immediately for a failed login
    }
    // No finally setIsLoading(false) here, as onAuthStateChanged handles success cases.
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
      setIsLoading(false); // Explicitly set loading to false on error here
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // User state will be cleared by onAuthStateChanged
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.', variant: 'default' });
      // setUser(null); // Let onAuthStateChanged handle this
      // setIsAdmin(false); // Let onAuthStateChanged handle this
      router.push('/'); 
    } catch (error: any) {
      console.error("Firebase logout error:", error);
      toast({ title: 'Logout Failed', description: error.message || 'Could not log out.', variant: 'destructive' });
    } finally {
      setIsLoading(false); // Ensure loading is false after logout attempt
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
