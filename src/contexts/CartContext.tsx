
"use client";

import type { MenuItem, CartItem, Coupon, Order, Address } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getHeroData, checkCoupon, listenToUserCart, updateUserCartItem, removeUserCartItem, clearUserCart as clearUserCartInDb, placeOrder, getAddresses, getPaymentSettings, getUserProfile } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, quantity?: number) => boolean;
  buyNow: (item: MenuItem) => Promise<void>;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyCoupon: (couponCode: string) => void;
  removeCoupon: () => void;
  getCartSubtotal: () => number;
  getCartTotal: () => number;
  getDiscountAmount: () => number;
  getCartItemCount: () => number;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOrderingAllowed: boolean;
  setIsTimeGateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  appliedCoupon: Coupon | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

declare global { interface Window { Razorpay: any; } }

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();
  const { user, isAuthLoading } = useAuth();
  const router = useRouter();

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isOrderingAllowed, setIsOrderingAllowed] = useState(true);
  const [orderingTimeMessage, setOrderingTimeMessage] = useState('');
  const [isTimeGateDialogOpen, setIsTimeGateDialogOpen] = useState(false);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isCartOpen) {
        event.preventDefault();
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      window.history.pushState({ cartOpen: true }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isCartOpen, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCoupon = localStorage.getItem('rasoiExpressCoupon');
      if (storedCoupon) {
        try {
          setAppliedCoupon(JSON.parse(storedCoupon));
        } catch (error) {
          console.error("Error parsing coupon from localStorage:", error);
          localStorage.removeItem('rasoiExpressCoupon');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (appliedCoupon) {
            localStorage.setItem('rasoiExpressCoupon', JSON.stringify(appliedCoupon));
        } else {
            localStorage.removeItem('rasoiExpressCoupon');
        }
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (user && !isAuthLoading) {
      const unsubscribe = listenToUserCart(user.uid, (items) => {
        setCartItems(items);
      });
      return () => unsubscribe();
    } else if (!isAuthLoading) {
      setCartItems([]);
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    getHeroData().then(heroData => {
        if (!heroData?.orderingTime) return;
        const checkTime = () => {
            try {
                const [startTimeStr, endTimeStr] = heroData.orderingTime.split(' - ');
                if (!startTimeStr || !endTimeStr) {
                    setIsOrderingAllowed(true);
                    return;
                }
                
                const parseTime = (timeStr: string): Date | null => {
                    const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (!match) return null;
                    const date = new Date();
                    let [, hoursStr, minutesStr, modifier] = match;
                    let hours = parseInt(hoursStr, 10);
                    const minutes = parseInt(minutesStr, 10);
                    if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
                    date.setHours(hours, minutes, 0, 0);
                    return date;
                };

                const startTime = parseTime(startTimeStr);
                const endTime = parseTime(endTimeStr);
                const currentTime = new Date();

                if (startTime && endTime) {
                    const isAllowed = currentTime >= startTime && currentTime <= endTime;
                    setIsOrderingAllowed(isAllowed);
                    if (!isAllowed) {
                         setOrderingTimeMessage(`Our ordering hours are from ${heroData.orderingTime}.`);
                    }
                } else {
                    setIsOrderingAllowed(true);
                }
            } catch (e) {
                console.error("Error parsing ordering time:", e);
                setIsOrderingAllowed(true);
            }
        };
        checkTime();
        const interval = setInterval(checkTime, 60000);
        return () => clearInterval(interval);
    });
  }, []);

  const addToCart = (item: MenuItem, quantityToAdd: number = 1): boolean => {
    if (!user) {
        toast({ title: "Please log in", description: "You need to be logged in to add items to the cart.", variant: "destructive" });
        return false;
    }
    
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
    const newQuantity = existingItem ? Math.min(existingItem.quantity + quantityToAdd, 10) : quantityToAdd;
    
    updateUserCartItem(user.uid, { ...item, quantity: newQuantity });

    toast({
      title: `${item.name} added to cart!`,
      variant: "default",
      duration: 3000,
    });
    return true;
  };

  const buyNow = async (item: MenuItem): Promise<void> => {
    if (!user) {
        toast({ title: "Please log in", description: "You need to be logged in to buy items.", variant: "destructive" });
        return;
    }
    if (!isOrderingAllowed) {
        setIsTimeGateDialogOpen(true);
        return;
    }
    await clearUserCartInDb(user.uid);
    await updateUserCartItem(user.uid, { ...item, quantity: 1 });
    router.push('/checkout');
  };

  const removeFromCart = (itemId: string) => {
    if (!user) return;
    const itemToRemove = cartItems.find(item => item.id === itemId);
    removeUserCartItem(user.uid, itemId);
    if (itemToRemove) {
      toast({
        title: `${itemToRemove.name} removed from cart.`,
        variant: "default",
        duration: 3000,
      });
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else if (quantity > 10) {
        toast({
            title: "Maximum quantity is 10.",
            variant: "destructive",
            duration: 3000,
        });
        const itemToUpdate = cartItems.find(item => item.id === itemId);
        if (itemToUpdate) {
            updateUserCartItem(user.uid, { ...itemToUpdate, quantity: 10 });
        }
    } else {
        const itemToUpdate = cartItems.find(item => item.id === itemId);
        if (itemToUpdate) {
            updateUserCartItem(user.uid, { ...itemToUpdate, quantity });
        }
    }
  };

  const applyCoupon = async (couponCode: string) => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to apply a coupon.", variant: "destructive" });
      return;
    }
    if (appliedCoupon) {
        toast({
            title: "Coupon Already Applied",
            description: `Coupon "${appliedCoupon.code}" is already active.`,
            variant: "destructive",
            duration: 3000,
        });
        return;
    }

    const { isValid, coupon, error } = await checkCoupon(couponCode.toUpperCase(), user.uid);
    
    if (isValid && coupon) {
      setAppliedCoupon(coupon);
      toast({
        title: "Coupon Applied!",
        description: `Congratulations! You've received a ${coupon.discountPercent}% discount.`,
        variant: "default",
        duration: 4000,
      });
    } else {
      toast({
        title: "Invalid Coupon",
        description: error || 'This coupon is not valid or has expired.',
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  const removeCoupon = () => {
    if (appliedCoupon) {
      toast({
        title: `Coupon "${appliedCoupon.code}" removed.`,
        variant: 'default',
        duration: 3000,
      });
      setAppliedCoupon(null);
    }
  };

  const getCartSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  
  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getCartSubtotal();
    return subtotal * (appliedCoupon.discountPercent / 100);
  };

  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    const discountAmount = getDiscountAmount();
    return subtotal - discountAmount;
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const clearCart = () => {
    if (!user) return;
    clearUserCartInDb(user.uid);
    setAppliedCoupon(null);
    toast({
      title: "Cart cleared.",
      variant: "default",
      duration: 3000,
    });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        buyNow,
        removeFromCart,
        updateQuantity,
        applyCoupon,
        removeCoupon,
        getCartSubtotal,
        getCartTotal,
        getDiscountAmount,
        getCartItemCount,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isOrderingAllowed,
        setIsTimeGateDialogOpen,
        appliedCoupon,
      }}
    >
      {children}
      <AlertDialog open={isTimeGateDialogOpen} onOpenChange={setIsTimeGateDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Restaurants Are Closed</AlertDialogTitle>
                  <AlertDialogDescription>
                      We are not accepting orders at this time.
                      {orderingTimeMessage && ` ${orderingTimeMessage}`}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setIsTimeGateDialogOpen(false)}>OK</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
