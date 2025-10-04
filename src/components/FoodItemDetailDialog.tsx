
"use client";

import { FC, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { MenuItem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, ShoppingCart, Tag, Weight, UtensilsCrossed } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Separator } from './ui/separator';

interface FoodItemDetailDialogProps {
  menuItem: MenuItem;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const FoodItemDetailDialog: FC<FoodItemDetailDialogProps> = ({ menuItem, isOpen, onOpenChange }) => {
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isOpen) {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    if (isOpen) {
      window.history.pushState({ dialogOpen: true }, '');
      window.addEventListener('popstate', handlePopState);
    } else {
      if (window.history.state?.dialogOpen) {
        window.history.back();
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onOpenChange]);


  if (!menuItem) return null;

  const handleAddToCart = () => {
    addToCart(menuItem);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 grid grid-rows-[auto_1fr_auto] max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
           <div className="relative h-60 w-full overflow-hidden rounded-md mb-4">
            <Image
              src={menuItem.imageUrl}
              alt={menuItem.name}
              layout="fill"
              objectFit="cover"
              data-ai-hint={`${menuItem.name.split(" ")[0].toLowerCase()} ${menuItem.category.toLowerCase()}`}
            />
            {menuItem.isPopular && (
              <Badge variant="destructive" className="absolute top-3 right-3 text-sm px-3 py-1 bg-accent text-accent-foreground border-accent-foreground shadow-md">
                <Tag className="mr-1.5 h-4 w-4" /> Popular
              </Badge>
            )}
            {menuItem.isVegetarian && (
               <Badge variant="secondary" className="absolute top-3 left-3 text-sm px-3 py-1 bg-green-600 text-white border-green-700 shadow-md">
                  <Leaf className="mr-1.5 h-4 w-4" /> Vegetarian
               </Badge>
            )}
          </div>
          <DialogTitle className="text-3xl font-headline text-primary">{menuItem.name}</DialogTitle>
          <DialogDescription className="text-md text-muted-foreground pt-1">
            {menuItem.description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4 overflow-y-auto">
          <div className="flex justify-between items-center">
            <p className="text-2xl font-semibold text-accent">Rs.{menuItem.price.toFixed(2)}</p>
            <Badge variant="outline" className="text-base">{menuItem.category}</Badge>
          </div>

          <Separator />

          {menuItem.weight && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Weight className="mr-2 h-4 w-4 text-primary" />
              <strong>Weight:</strong> <span className="ml-1">{menuItem.weight}</span>
            </div>
          )}

          {menuItem.ingredients && (
            <div>
              <h4 className="font-semibold text-sm mb-1 flex items-center">
                <UtensilsCrossed className="mr-2 h-4 w-4 text-primary" />
                Ingredients:
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {menuItem.ingredients.split(',').map(ing => ing.trim()).join(', ')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t gap-2 sm:justify-start">
          <Button onClick={handleAddToCart} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FoodItemDetailDialog;
