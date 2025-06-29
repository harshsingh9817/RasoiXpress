
"use client";

import type { MenuItem, CartItem, HeroData } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getHeroData } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, quantity?: number) => boolean;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyCoupon: (couponCode: string) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOrderingAllowed: boolean;
  setIsTimeGateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const [isOrderingAllowed, setIsOrderingAllowed] = useState(true);
  const [orderingTimeMessage, setOrderingTimeMessage] = useState('');
  const [isTimeGateDialogOpen, setIsTimeGateDialogOpen] = useState(false);

  useEffect(() => {
    // Load cart from localStorage on initial render (client-side only)
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('rasoiExpressCart');
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (error) {
          console.error("Error parsing cart from localStorage:", error);
          localStorage.removeItem('rasoiExpressCart'); // Clear corrupted cart data
        }
      }
    }

    // Fetch hero data to get ordering times
    getHeroData().then(heroData => {
        if (!heroData?.orderingTime) return;

        const checkTime = () => {
            try {
                const [startTimeStr, endTimeStr] = heroData.orderingTime.split(' - ');
                if (!startTimeStr || !endTimeStr) {
                    setIsOrderingAllowed(true); // Default to allowed if format is wrong
                    return;
                }
                
                const parseTime = (timeStr: string): Date | null => {
                    const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (!match) return null; // Invalid format
                    const date = new Date();
                    let [, hoursStr, minutesStr, modifier] = match;
                    let hours = parseInt(hoursStr, 10);
                    const minutes = parseInt(minutesStr, 10);
                    if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0; // Midnight case
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
                    setIsOrderingAllowed(true); // Fail open if parsing fails
                }
            } catch (e) {
                console.error("Error parsing ordering time:", e);
                setIsOrderingAllowed(true); // Fail open in case of error
            }
        };

        checkTime();
        const interval = setInterval(checkTime, 60000); // Re-check every minute
        return () => clearInterval(interval);
    });

  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes (client-side only)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rasoiExpressCart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

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
            ? { ...cartItem, quantity: Math.min(cartItem.quantity + quantityToAdd, 10) } // Max 10 items
            : cartItem
        );
      }
      return [...prevItems, { ...item, quantity: quantityToAdd }];
    });
    toast({
      title: `${item.name} added to cart!`,
      variant: "default", // Use default for success messages, not "destructive"
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
    // Placeholder for coupon logic
    if (couponCode.toUpperCase() === "NIBBLE10") {
      toast({
        title: "Coupon NIBBLE10 applied!",
        description: "You get 10% off your order.",
        variant: "default",
        duration: 3000,
      });
      // Actual discount logic would go here
    } else {
      toast({
        title: "Invalid coupon code.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const clearCart = () => {
    setCartItems([]);
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
        removeFromCart,
        updateQuantity,
        applyCoupon,
        getCartTotal,
        getCartItemCount,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isOrderingAllowed,
        setIsTimeGateDialogOpen,
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
