
"use client";

import type { MenuItem, CartItem } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getHeroData } from '@/lib/data';
import { couponCodes } from '@/lib/coupons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AnimatedDeliveryScooter from '@/components/icons/AnimatedDeliveryScooter';
import { Button } from '@/components/ui/button';

interface AppliedCoupon {
  code: string;
  discountPercent: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, quantity?: number) => boolean;
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
  isFreeDeliveryDialogOpen: boolean;
  setIsFreeDeliveryDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setProceedAction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
  appliedCoupon: AppliedCoupon | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isOrderingAllowed, setIsOrderingAllowed] = useState(true);
  const [orderingTimeMessage, setOrderingTimeMessage] = useState('');
  const [isTimeGateDialogOpen, setIsTimeGateDialogOpen] = useState(false);

  const [isFreeDeliveryDialogOpen, setIsFreeDeliveryDialogOpen] = useState(false);
  const [proceedAction, setProceedAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('rasoiExpressCart');
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (error) {
          console.error("Error parsing cart from localStorage:", error);
          localStorage.removeItem('rasoiExpressCart');
        }
      }
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rasoiExpressCart', JSON.stringify(cartItems));
      if (appliedCoupon) {
        localStorage.setItem('rasoiExpressCoupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('rasoiExpressCoupon');
      }
    }
  }, [cartItems, appliedCoupon]);

  const addToCart = (item: MenuItem, quantityToAdd: number = 1): boolean => {
    if (!isOrderingAllowed) {
      setIsTimeGateDialogOpen(true);
      return false;
    }
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: Math.min(cartItem.quantity + quantityToAdd, 10) }
            : cartItem
        );
      }
      return [...prevItems, { ...item, quantity: quantityToAdd }];
    });
    toast({
      title: `${item.name} added to cart!`,
      variant: "default",
      duration: 3000,
    });
    return true;
  };

  const removeFromCart = (itemId: string) => {
    const itemToRemove = cartItems.find(item => item.id === itemId);
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    if (itemToRemove) {
      toast({
        title: `${itemToRemove.name} removed from cart.`,
        variant: "default",
        duration: 3000,
      });
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else if (quantity > 10) {
        toast({
            title: "Maximum quantity is 10.",
            variant: "destructive",
            duration: 3000,
        });
        setCartItems(prevItems =>
            prevItems.map(item =>
              item.id === itemId ? { ...item, quantity: 10 } : item
            )
          );
    }
    else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const applyCoupon = (couponCode: string) => {
    if (appliedCoupon) {
        toast({
            title: "Coupon Already Applied",
            description: `Coupon "${appliedCoupon.code}" is already active.`,
            variant: "destructive",
            duration: 3000,
        });
        return;
    }
    if (couponCodes.has(couponCode.toUpperCase())) {
      const randomDiscount = Math.floor(Math.random() * (20 - 5 + 1)) + 5; // Random integer between 5 and 20
      setAppliedCoupon({ code: couponCode.toUpperCase(), discountPercent: randomDiscount });
      toast({
        title: "Coupon Applied!",
        description: `Congratulations! You've received a ${randomDiscount}% discount.`,
        variant: "default",
        duration: 4000,
      });
    } else {
      toast({
        title: "Invalid coupon code.",
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
    setCartItems([]);
    setAppliedCoupon(null);
    toast({
      title: "Cart cleared.",
      variant: "default",
      duration: 3000,
    });
  };

  const handleProceed = () => {
    if (proceedAction) {
      proceedAction();
    }
    setIsFreeDeliveryDialogOpen(false);
    setProceedAction(null);
  };

  const handleContinueShopping = () => {
    setIsFreeDeliveryDialogOpen(false);
    setProceedAction(null);
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
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
        isFreeDeliveryDialogOpen,
        setIsFreeDeliveryDialogOpen,
        setProceedAction,
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
      <AlertDialog open={isFreeDeliveryDialogOpen} onOpenChange={setIsFreeDeliveryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-24 h-24 mx-auto text-primary mb-2">
                <AnimatedDeliveryScooter />
            </div>
            <AlertDialogTitle className="text-center">Get Free Delivery!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your order is under ₹300. Add more items to your cart to unlock free delivery, or proceed with a small delivery fee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={handleContinueShopping}>
              Continue Shopping
            </Button>
            <Button onClick={handleProceed}>
              Proceed Anyway
            </Button>
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
