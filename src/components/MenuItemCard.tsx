
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { MenuItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Leaf, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Badge } from './ui/badge';
import FoodItemDetailDialog from './FoodItemDetailDialog';

interface MenuItemCardProps {
  menuItem: MenuItem;
}

const MenuItemCard: FC<MenuItemCardProps> = ({ menuItem }) => {
  const { addToCart, getCartTotal, setIsFreeDeliveryDialogOpen, setProceedAction } = useCart();
  const router = useRouter();
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentTotal = getCartTotal();
    const wasAdded = addToCart(menuItem);

    if (wasAdded) {
      const newTotal = currentTotal + menuItem.price;
      if (newTotal < 300) {
        setProceedAction(() => () => router.push('/checkout'));
        setIsFreeDeliveryDialogOpen(true);
      } else {
        router.push('/checkout');
      }
    }
  };
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(menuItem);
  };

  return (
    <>
      <Card 
        className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary group flex flex-col cursor-pointer"
        onClick={() => setIsDetailViewOpen(true)}
      >
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={menuItem.imageUrl}
              alt={menuItem.name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={`${menuItem.name.split(" ")[0].toLowerCase()} ${menuItem.category?.toLowerCase() || 'food'}`}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col flex-grow">
          <div className="flex-grow">
            <CardTitle className="text-xl font-headline mb-1 group-hover:text-primary flex items-center justify-between">
              <span className="truncate">{menuItem.name}</span>
               {menuItem.isVegetarian && <Leaf className="h-5 w-5 text-green-600 shrink-0" title="Vegetarian" />}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mb-3 min-h-[40px] line-clamp-2">
              {menuItem.description}
            </CardDescription>
            <div className="flex items-center justify-between mb-3">
              <p className="text-lg font-semibold text-primary">Rs.{menuItem.price.toFixed(2)}</p>
              {menuItem.isPopular && <Badge variant="outline" className="text-accent border-accent">Popular</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto">
             <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleBuyNow}
            >
              <ShoppingBag className="mr-2 h-4 w-4"/>
              Buy Now
            </Button>
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              aria-label={`Add ${menuItem.name} to cart`}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
      <FoodItemDetailDialog 
        isOpen={isDetailViewOpen}
        onOpenChange={setIsDetailViewOpen}
        menuItem={menuItem}
      />
    </>
  );
};

export default MenuItemCard;
