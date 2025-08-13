

"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
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
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getAddresses } from '@/lib/data';

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

const manageUserInFirestore = async (user: User, extraData: { fullName?: string, mobileNumber?: string } = {}) => {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: extraData.fullName || user.displayName,
        photoURL: user.photoURL,
        ...(extraData.mobileNumber && { mobileNumber: extraData.mobileNumber }),
    };

    if (!userDoc.exists()) {
        await setDoc(userRef, { ...userData, createdAt: new Date(), hasCompletedFirstOrder: false });
    } else {
        await setDoc(userRef, userData, { merge: true });
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
        try {
            await setPersistence(auth, browserLocalPersistence);
        } catch (error) {
            console.error("Failed to set auth persistence:", error);
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsAdmin(currentUser.email === 'harshsingh9817@gmail.com');
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setIsLoading(false);
        });
        return unsubscribe;
    };

    const unsubscribePromise = initializeAuth();

    return () => {
        unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
}, []);

  const sendPasswordReset = async (email: string) => {
    if (!email) {
      toast({ title: 'Email Required', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for a link to reset your password.', variant: 'default' });
    } catch (error: any) {
      toast({ title: 'Error Sending Email', description: error.message, variant: 'destructive' });
    }
  };

  const login = async (identifier?: string, password?: string) => {
    if (!identifier || !password) {
      toast({ title: 'Login Error', description: 'Email/phone and password are required.', variant: 'destructive' });
      return;
    }
    let emailToLogin = identifier;
    try {
      if (/^\d{10,}$/.test(identifier)) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("mobileNumber", "==", identifier));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) throw new Error("auth/user-not-found");
        emailToLogin = querySnapshot.docs[0].data().email;
      }
      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        toast({
          title: "Email Not Verified",
          description: "You must verify your email address before logging in.",
          variant: "destructive",
          action: <ToastAction altText="Resend" onClick={() => sendEmailVerification(userCredential.user)}>Resend Email</ToastAction>,
        });
        return;
      }
      toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });
      router.push('/');
    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.message === "auth/user-not-found") {
          description = 'Incorrect email, phone number, or password.';
      } else if (error.code === 'auth/invalid-credential') {
          description = "This account might be a Google account. Try signing in with Google.";
      }
      toast({ title: 'Login Failed', description, variant: 'destructive' });
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await manageUserInFirestore(userCredential.user);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      // Key Fix: Check for profile completion first.
      if (!userDoc.exists() || !userDoc.data()?.mobileNumber) {
        toast({ title: 'Welcome!', description: 'Please complete your profile to continue.' });
        router.push('/complete-profile');
        return;
      }
  
      // Then check for address setup.
      const addresses = await getAddresses(userCredential.user.uid);
      if (addresses.length === 0) {
          toast({ title: 'Almost there!', description: 'Please add a delivery address.' });
          router.push('/profile?setup=true');
      } else {
          toast({ title: 'Logged In!', description: 'Welcome back!', variant: 'default' });
          router.push('/');
      }
    } catch (error: any) {
      toast({ title: 'Google Sign-In Failed', description: error.message, variant: 'destructive' });
    }
  };

  const signup = async (email?: string, password?: string, fullName?: string, mobileNumber?: string): Promise<void> => {
    if (!email || !password || !fullName || !mobileNumber) {
      toast({ title: 'Signup Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
        toast({ title: "Invalid Mobile Number", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      await sendEmailVerification(userCredential.user);
      await manageUserInFirestore(userCredential.user, { fullName, mobileNumber });
      await firebaseSignOut(auth);
      toast({ 
        title: 'Account Created! Please Verify Your Email.', 
        description: "We've sent a verification link to your email.",
        variant: 'default',
        duration: 10000
      });
      router.push('/login');
    } catch (error: any) {
      toast({ title: 'Signup Failed', description: error.message, variant: 'destructive' });
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.', variant: 'default' });
      router.push('/login');
    } catch (error: any) {
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, login, signInWithGoogle, signup, logout, isLoading, sendPasswordReset }}>
      {!isLoading && children}
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
