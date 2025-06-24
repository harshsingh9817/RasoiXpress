
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
import { ShoppingBag, Trash2, Tag, ArrowRight, ShoppingCart } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

const CartSheet = () => {
  const {
    cartItems,
    getCartTotal,
    getCartItemCount,
    clearCart,
    applyCoupon,
    isCartOpen,
    setIsCartOpen,
  } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleApplyCoupon = (e: FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      applyCoupon(couponCode);
      setCouponCode('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  const total = getCartTotal();
  const itemCount = getCartItemCount();
  const showFAB = pathname !== '/checkout';

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
                <div className="flex justify-between text-lg font-semibold">
                  <span>Subtotal:</span>
                  <span>Rs.{total.toFixed(2)}</span>
                </div>
                {/* Add more details like tax, delivery fee if needed */}
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
                  >
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
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
