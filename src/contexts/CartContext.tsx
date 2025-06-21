
"use client";

import type { MenuItem, CartItem } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyCoupon: (couponCode: string) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

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
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes (client-side only)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rasoiExpressCart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = (item: MenuItem, quantityToAdd: number = 1) => {
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
      }}
    >
      {children}
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
