
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
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
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDelivery: boolean;
  login: (identifier?: string, password?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signup: (email?: string, password?: string, fullName?: string, mobileNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const manageUserInFirestore = async (user: User, extraData: { mobileNumber?: string } = {}) => {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            mobileNumber: extraData.mobileNumber || null,
        });
    } else {
        const dataToUpdate: any = {
            displayName: user.displayName,
            photoURL: user.photoURL,
        };
        if (extraData.mobileNumber) {
            dataToUpdate.mobileNumber = extraData.mobileNumber;
        }
        await setDoc(userRef, dataToUpdate, { merge: true });
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
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
        
        const publicPaths = ['/login', '/signup', '/delivery/login'];
        const isPublicPath = publicPaths.includes(pathname);
        
        if (!isPublicPath) {
            if (pathname.startsWith('/delivery')) {
                router.replace('/delivery/login');
            } else if (pathname !== '/') {
                router.replace('/login');
            }
        }
        
        setIsLoading(false);
        return;
      }

      setUser(currentUser);
      
      try {
        const idTokenResult = await getIdTokenResult(currentUser, true);
        const isAdminClaim = !!idTokenResult.claims.admin || currentUser.email === 'harshsingh9817@gmail.com';
        const isDeliveryClaim = !!idTokenResult.claims.delivery || currentUser.email === 'harshsunil9817@gmail.com';
        
        setIsAdmin(isAdminClaim);
        setIsDelivery(isDeliveryClaim);

        const isLoginPage = pathname === '/login' || pathname === '/signup';
        const isDeliveryLoginPage = pathname === '/delivery/login';

        if (isDeliveryClaim) {
          if (!pathname.startsWith('/delivery')) router.replace('/delivery/dashboard');
        } else if (isAdminClaim) {
          if (isLoginPage || isDeliveryLoginPage) router.replace('/admin');
        } else {
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

  const login = async (identifier?: string, password?: string) => {
    if (!identifier || !password) {
      toast({ title: 'Login Error', description: 'Email/phone and password are required.', variant: 'destructive' });
      return;
    }

    let emailToLogin = identifier;
    const isPhoneNumber = /^\d{10,}$/.test(identifier);

    try {
      if (isPhoneNumber) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("mobileNumber", "==", identifier));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error("Invalid credentials");
        }
        
        const userDoc = querySnapshot.docs[0].data();
        emailToLogin = userDoc.email;
        if (!emailToLogin) {
            throw new Error("Invalid credentials");
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
      
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        toast({
          title: "Email Not Verified",
          description: "A verification link was sent to your email upon signup. Please check your inbox (and spam folder) to activate your account before logging in.",
          variant: "destructive",
          duration: 10000,
        });
        return;
      }
      
      toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });

    } catch (error: any) {
      console.error("Firebase login error:", error);
      let description = 'An unexpected error occurred during login. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.message.includes('Invalid credentials')) {
        description = 'The email or password you entered is incorrect. Please check your credentials and try again.';
      } else if (error.message) {
        description = error.message;
      }
      toast({ title: 'Login Failed', description, variant: 'destructive' });
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await manageUserInFirestore(userCredential.user);
      toast({ title: 'Logged In!', description: 'Welcome to Rasoi Xpress!', variant: 'default' });
      router.push('/');
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
        await manageUserInFirestore(userCredential.user, { mobileNumber });
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
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, isDelivery, login, signInWithGoogle, signup, logout, isLoading, sendPasswordReset }}>
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
