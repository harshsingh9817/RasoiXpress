
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import Image from 'next/image';
import type { MenuItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Leaf, Info } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Badge } from './ui/badge';
import FoodItemDetailDialog from './FoodItemDetailDialog'; // Import the new dialog

interface MenuItemCardProps {
  menuItem: MenuItem;
}

const MenuItemCard: FC<MenuItemCardProps> = ({ menuItem }) => {
  const { addToCart } = useCart();
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const handleOpenDetails = () => {
    setIsDetailDialogOpen(true);
  };

  return (
    <>
      <Card className="flex flex-col md:flex-row overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full">
        <div
          className="relative h-40 w-full md:w-1/3 md:h-auto shrink-0 cursor-pointer"
          onClick={handleOpenDetails}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleOpenDetails()}
          aria-label={`View details for ${menuItem.name}`}
        >
          <Image
            src={menuItem.imageUrl}
            alt={menuItem.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={`${menuItem.name.split(" ")[0].toLowerCase()} ${menuItem.category.toLowerCase()}`}
          />
        </div>
        <CardContent className="p-4 flex flex-col justify-between flex-grow">
          <div>
            <div
              className="cursor-pointer"
              onClick={handleOpenDetails}
              role="button"
              tabIndex={-1} // Not focusable itself, wrapper is
              onKeyDown={(e) => e.key === 'Enter' && handleOpenDetails()}
            >
              <CardTitle className="text-lg font-headline mb-1 flex items-center justify-between">
                <span>{menuItem.name}</span>
                {menuItem.isVegetarian && <Leaf className="h-5 w-5 text-green-600" title="Vegetarian" />}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mb-2 min-h-[40px] line-clamp-2">
                {menuItem.description}
              </CardDescription>
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-lg font-semibold text-primary">Rs.{menuItem.price.toFixed(2)}</p>
              {menuItem.isPopular && <Badge variant="outline" className="text-accent border-accent">Popular</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button
              onClick={() => addToCart(menuItem)}
              className="flex-grow bg-accent hover:bg-accent/90 text-accent-foreground"
              aria-label={`Add ${menuItem.name} to cart`}
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenDetails}
              aria-label={`View more details for ${menuItem.name}`}
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <FoodItemDetailDialog
        menuItem={menuItem}
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </>
  );
};

export default MenuItemCard;
