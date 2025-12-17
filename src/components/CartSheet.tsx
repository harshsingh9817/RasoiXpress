
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import CartItemCard from './CartItemCard';
import { useState, type FormEvent } from 'react';
import { ShoppingBag, Trash2, Tag, ArrowRight, ShoppingCart, XCircle, Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { placeOrder } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/lib/types';

const CartSheet = () => {
  const {
    cartItems,
    getCartSubtotal,
    getCartTotal,
    getDiscountAmount,
    getCartItemCount,
    clearCart,
    applyCoupon,
    removeCoupon,
    appliedCoupon,
    isCartOpen,
    setIsCartOpen,
    isOrderingAllowed,
    setIsTimeGateDialogOpen,
  } = useCart();
  const { isAuthenticated, isAuthLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const handleApplyCoupon = (e: FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      applyCoupon(couponCode);
      setCouponCode('');
    }
  };

  const handleProceedToCheckout = async () => {
    if (!isOrderingAllowed) {
        setIsTimeGateDialogOpen(true);
        return;
    }
    if (!user) {
        toast({ title: "Please log in", description: "You need to be logged in to checkout.", variant: "destructive" });
        return;
    }

    setIsCreatingOrder(true);
    try {
        const temporaryOrderData: Omit<Order, 'id'> = {
            userId: user.uid,
            userEmail: user.email || 'N/A',
            customerName: user.displayName || 'Guest', // Placeholder name
            date: new Date().toISOString(),
            status: 'Payment Pending',
            total: getCartTotal(),
            items: cartItems.map(item => ({ ...item })),
            shippingAddress: '', // Will be updated at checkout
            paymentMethod: 'Razorpay', // Default, can be changed
            deliveryFee: 0, // Will be calculated at checkout
            totalTax: 0, // Will be calculated at checkout
            couponCode: appliedCoupon?.code || null,
            discountAmount: getDiscountAmount() || null,
        };

        const pendingOrder = await placeOrder(temporaryOrderData);
        setIsCartOpen(false); // Close the cart sheet
        router.push(`/checkout/${pendingOrder.id}`);

    } catch (error) {
        console.error("Failed to create pending order:", error);
        toast({ title: "Checkout Error", description: "Could not initialize checkout. Please try again.", variant: "destructive" });
    } finally {
        setIsCreatingOrder(false);
    }
  };


  const subtotal = getCartSubtotal();
  const discountAmount = getDiscountAmount();
  const total = getCartTotal();
  const itemCount = getCartItemCount();
  const showFAB = !pathname.startsWith('/checkout');
  
  if (isAuthLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {showFAB && (
        <div className="fixed bottom-20 left-6 z-50">
          <Button
            variant="default"
            size="icon"
            className="relative h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open cart with ${itemCount} items`}
          >
            <ShoppingCart className="h-7 w-7" />
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full p-0 text-sm border-2 border-background"
                aria-label={`${itemCount} items in cart`}
              >
                {itemCount > 9 ? '9+' : itemCount}
              </Badge>
            )}
          </Button>
        </div>
      )}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="text-2xl font-headline">Your Cart ({itemCount})</SheetTitle>
            <SheetDescription>
              Review items in your cart and proceed to checkout.
            </SheetDescription>
          </SheetHeader>
          <Separator className="my-4" />
          {cartItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <ShoppingBag className="h-20 w-20 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold">Your cart is empty</p>
              <p className="text-muted-foreground">Add some delicious food to get started!</p>
              <SheetClose asChild>
                  <Button variant="outline" className="mt-6">Continue Shopping</Button>
              </SheetClose>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <CartItemCard key={item.id} item={item} />
                  ))}
                </div>
              </ScrollArea>
              <Separator className="my-4" />
              <div className="px-6 space-y-4">
                {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="text-sm">
                            <p className="font-semibold text-green-700">Coupon Applied!</p>
                            <p className="text-green-600">{appliedCoupon.code} ({appliedCoupon.discountPercent}% off)</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={removeCoupon}>
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                        <Input
                            type="text"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1"
                            aria-label="Coupon code"
                        />
                        <Button type="submit" variant="outline" className="text-accent border-accent hover:bg-accent/10">
                            <Tag className="mr-2 h-4 w-4" /> Apply
                        </Button>
                    </form>
                )}

                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>Rs.{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                    <div className="flex justify-between text-lg text-green-600">
                        <span>Discount:</span>
                        <span>- Rs.{discountAmount.toFixed(2)}</span>
                    </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>Total:</span>
                  <span>Rs.{total.toFixed(2)}</span>
                </div>
              </div>
              <SheetFooter className="px-6 py-4 mt-auto border-t">
                <div className="flex w-full flex-col sm:flex-row sm:justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="w-full sm:w-auto text-destructive border-destructive hover:bg-destructive/10"
                    aria-label="Clear cart"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
                  </Button>
                  <Button
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                    aria-label="Proceed to checkout"
                    onClick={handleProceedToCheckout}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                    {isCreatingOrder ? 'Initializing...' : 'Proceed to Checkout'}
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CartSheet;
