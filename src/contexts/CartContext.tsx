
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
import AnimatedDeliveryScooter from '@/components/icons/AnimatedDeliveryScooter';
import { Button } from '@/components/ui/button';
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
  handleInstantCheckout: () => void;
  isProcessingPayment: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const RESTAURANT_COORDS = { lat: 25.970960, lng: 83.873773 };

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (lat1 === 0 && lon1 === 0) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};


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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
    await clearUserCart(user.uid);
    await updateUserCartItem(user.uid, { ...item, quantity: 1 });
    handleInstantCheckout();
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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-checkout-js')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInstantCheckout = async () => {
    if (!user) {
        toast({ title: "Login Required", description: "Please log in to place an order.", variant: "destructive" });
        return;
    }
    if (cartItems.length === 0) {
        toast({ title: "Cart is Empty", description: "Add items to your cart before checking out.", variant: "destructive" });
        return;
    }

    setIsProcessingPayment(true);

    try {
        const [addresses, paymentSettings, userProfile] = await Promise.all([
            getAddresses(user.uid),
            getPaymentSettings(),
            getUserProfile(user.uid)
        ]);

        if (addresses.length === 0) {
            toast({ title: "Address Required", description: "Please add a delivery address in your profile.", variant: "destructive" });
            router.push('/profile?setup=true');
            setIsProcessingPayment(false);
            return;
        }

        const selectedAddress = addresses.find(a => a.isDefault) || addresses[0];
        if (!selectedAddress) {
          throw new Error("No address could be selected.");
        }

        // Calculate delivery fee
        const dist = getDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, selectedAddress.lat, selectedAddress.lng);
        let deliveryFee = 0;
        const isFirstOrder = userProfile?.hasCompletedFirstOrder === false;
        
        if (paymentSettings.isDeliveryFeeEnabled && !isFirstOrder) {
          if (dist <= paymentSettings.deliveryRadiusKm) {
              if(getCartSubtotal() < 300) {
                  deliveryFee = Math.round(dist * 25);
              }
          } else {
              toast({ title: "Out of Delivery Area", description: "The selected address is outside our delivery radius.", variant: "destructive" });
              setIsProcessingPayment(false);
              return;
          }
        }
        
        const totalTax = cartItems.reduce((acc, item) => acc + (item.price * (item.taxRate || 0) * item.quantity), 0);
        const grandTotal = getCartTotal() + deliveryFee + totalTax;

        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!keyId || keyId.startsWith('REPLACE_WITH_')) {
          throw new Error("Razorpay client key is not configured.");
        }
    
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Could not load payment gateway.");
        }

        const orderResponse = await fetch('/api/razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: grandTotal }),
        });
    
        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.error || 'Failed to create Razorpay order');
        }
        const razorpayOrder = await orderResponse.json();

        const villagePart = selectedAddress.village ? `${selectedAddress.village}, ` : '';

        const newOrderData: Omit<Order, 'id'> = {
          userId: user.uid,
          userEmail: user.email || 'N/A',
          customerName: selectedAddress.fullName,
          date: new Date().toISOString(),
          status: 'Confirmed',
          total: grandTotal,
          items: cartItems.map(item => ({ ...item })),
          shippingAddress: `${selectedAddress.street}, ${villagePart}${selectedAddress.city}, ${selectedAddress.pinCode}`,
          shippingLat: selectedAddress.lat,
          shippingLng: selectedAddress.lng,
          paymentMethod: 'Razorpay',
          customerPhone: selectedAddress.phone,
          deliveryFee: deliveryFee,
          totalTax: totalTax,
          couponCode: appliedCoupon?.code,
          discountAmount: getDiscountAmount(),
          razorpayOrderId: razorpayOrder.id,
        };

        const paymentObject = new window.Razorpay({
          key: keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: paymentSettings.merchantName || "Rasoi Xpress",
          description: "Order Payment",
          order_id: razorpayOrder.id,
          handler: async (response: any) => {
            const finalOrderData = {
              ...newOrderData,
              razorpayPaymentId: response.razorpay_payment_id,
            };
            try {
              const placedOrder = await placeOrder(finalOrderData);
              clearCart();
              toast({ title: "Order Confirmed!", description: "Your payment was successful." });
              router.push(`/my-orders?track=${placedOrder.id}`);
            } catch (dbError) {
              console.error("Failed to save order after payment:", dbError);
              toast({ title: "Order Placement Failed", description: "Your payment was successful, but we failed to save your order. Please contact support immediately.", variant: "destructive", duration: 10000 });
            } finally {
              setIsProcessingPayment(false);
            }
          },
          prefill: { name: selectedAddress.fullName, email: user.email, contact: selectedAddress.phone },
          theme: { color: "#E64A19" },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
              toast({ title: "Payment Cancelled", variant: "destructive" });
            }
          }
        });
        paymentObject.open();

    } catch (error: any) {
        console.error("Checkout process failed:", error);
        toast({ title: "Checkout Error", description: error.message, variant: "destructive" });
        setIsProcessingPayment(false);
    }
  }

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
        handleInstantCheckout,
        isProcessingPayment,
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
