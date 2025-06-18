
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
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
  isAdmin: boolean; // Added isAdmin
  login: (email?: string, password?: string) => Promise<void>;
  signup: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Added isAdmin state
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idTokenResult = await getIdTokenResult(currentUser);
          setIsAdmin(!!idTokenResult.claims.admin); // Check for admin custom claim
        } catch (error) {
          console.error("Error getting user claims:", error);
          setIsAdmin(false);
        }
        if (router.pathname === '/login' || router.pathname === '/signup') {
          router.replace('/profile');
        }
      } else {
        setIsAdmin(false); // Reset admin status on logout
        if (router.pathname === '/profile' || router.pathname === '/admin') { // Also redirect from /admin if not logged in
          router.replace('/login');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  const login = async (email?: string, password?: string) => {
    setIsLoading(true);
    if (!email || !password) {
      toast({ title: 'Login Error', description: 'Email and password are required.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user, claims, and redirecting
      toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });
    } catch (error: any) {
      console.error("Firebase login error:", error);
      toast({ title: 'Login Failed', description: error.message || 'Invalid credentials.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
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
      // onAuthStateChanged will handle setting user and redirecting
      // Note: New users won't have admin claims by default.
      toast({ title: 'Signup Successful!', description: 'Welcome to NibbleNow!', variant: 'default' });
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      toast({ title: 'Signup Failed', description: error.message || 'Could not create account.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting user to null and isAdmin to false
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.', variant: 'default' });
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
