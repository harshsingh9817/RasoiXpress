
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import {
  type User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { getAddresses, getUserProfile } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (identifier?: string, password?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signup: (email?: string, password?: string, fullName?: string, mobileNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const manageUserInSupabase = async (user: User, extraData: { mobileNumber?: string } = {}) => {
    if (!supabase) return;
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.uid)
        .single();

    const userData = {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        mobileNumber: extraData.mobileNumber || null,
    };

    if (!data) { // User does not exist, insert
        const { error: insertError } = await supabase.from('users').insert([
           { ...userData, hasCompletedFirstOrder: false }
        ]);
        if (insertError) console.error("Error creating user in Supabase:", insertError);
    } else { // User exists, update
        const { error: updateError } = await supabase.from('users').update(userData).eq('id', user.uid);
        if (updateError) console.error("Error updating user in Supabase:", updateError);
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
            const isAdminClaim = currentUser.email === 'harshsingh9817@gmail.com';
            setIsAdmin(isAdminClaim);
        } catch(error) {
            console.error("Error fetching user roles:", error);
            await firebaseSignOut(auth);
            setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Effect to handle routing based on auth state
  useEffect(() => {
    if (isLoading) {
      return; // Wait until auth state is confirmed
    }

    const isAuthenticated = !!user;
    const isPublicPath = ['/login', '/signup', '/complete-profile'].includes(pathname);
    const isAdminPath = pathname.startsWith('/admin');

    if (!isAuthenticated) {
      if (!isPublicPath) {
        router.replace('/login');
      }
    } else {
      if (isAdmin) {
        if (isPublicPath) {
          router.replace('/admin');
        }
      } else {
        if (isPublicPath && pathname !== '/complete-profile') {
            router.replace('/');
        }
        if (isAdminPath) {
            router.replace('/');
        }
      }
    }
  }, [user, isAdmin, isLoading, pathname, router]);

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

  const login = async (identifier?: string, password?: string) => {
    if (!identifier || !password) {
      toast({ title: 'Login Error', description: 'Email/phone and password are required.', variant: 'destructive' });
      return;
    }

    let emailToLogin = identifier;
    const isPhoneNumber = /^\d{10,}$/.test(identifier);

    try {
      if (isPhoneNumber) {
        const response = await fetch('/api/getUserByPhone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: identifier }),
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "auth/invalid-credential");
        }
        const data = await response.json();
        emailToLogin = data.email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
      
      const handleResendVerification = async () => {
        try {
          await sendEmailVerification(userCredential.user);
          toast({
            title: "Verification Email Sent",
            description: "A new link has been sent to your email. Please check your inbox and spam folder.",
            variant: "default",
          });
        } catch (error) {
          console.error("Error resending verification email:", error);
          toast({
            title: "Error",
            description: "Failed to resend verification email. Please try again later.",
            variant: "destructive",
          });
        }
      };
      
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        toast({
          title: "Email Not Verified",
          description: "You must verify your email address before logging in.",
          variant: "destructive",
          duration: 10000,
          action: (
            <ToastAction altText="Resend Email" onClick={handleResendVerification}>
              Resend Email
            </ToastAction>
          ),
        });
        return;
      }
      
      toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });

    } catch (error: any) {
      console.error("Firebase login error:", error);
      let description = 'The email, phone number, or password you entered is incorrect. Please check your credentials and try again.';
      
      if(error.message === "Firebase: Error (auth/invalid-credential).") {
        description = "This phone number or email is associated with a Google account. Please use the 'Sign in with Google' option.";
      }

      toast({ title: 'Login Failed', description, variant: 'destructive' });
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await manageUserInSupabase(userCredential.user);

      const userProfile = await getUserProfile(userCredential.user.uid);
      if (!userProfile?.mobileNumber) {
        router.push('/complete-profile');
        toast({
            title: 'Complete Your Profile',
            description: 'Please provide a few more details to continue.',
            duration: 5000,
        });
        return;
      }

      const userAddresses = await getAddresses(userCredential.user.uid);
      if (userAddresses.length === 0) {
        router.push('/profile?setup=true');
        toast({
          title: 'Almost there!',
          description: 'Please add an address to complete your profile.',
          duration: 5000
        });
      } else {
        toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });
        router.push('/');
      }

    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
          title: 'Google Sign-In Failed',
          description: error.message || 'Could not sign in with Google. Please try again.',
          variant: 'destructive',
      });
    }
  };

  const signup = async (email?: string, password?: string, fullName?: string, mobileNumber?: string): Promise<void> => {
    if (!email || !password || !fullName || !mobileNumber) {
      toast({
        title: 'Signup Error',
        description: 'Full name, email, mobile number and password are required.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: fullName });
        await sendEmailVerification(userCredential.user);
        await manageUserInSupabase(userCredential.user, { mobileNumber });
      }
      
      await firebaseSignOut(auth);
      
      toast({ 
        title: 'Account Created! Please Verify Your Email.', 
        description: "We've sent a verification link to your email. Please check your inbox (and spam folder) to activate your account before logging in.", 
        variant: 'default',
        duration: 10000
      });
      
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
    try {
      await firebaseSignOut(auth);
      if (supabase) {
        await supabase.auth.signOut();
      }
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.', variant: 'default' });
    } catch (error: any) {
      console.error("Firebase logout error:", error);
      toast({ title: 'Logout Failed', description: error.message || 'Could not log out.', variant: 'destructive' });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, login, signInWithGoogle, signup, logout, isLoading, sendPasswordReset }}>
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
