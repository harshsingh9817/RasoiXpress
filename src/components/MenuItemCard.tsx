
import type { FC } from 'react';
import Image from 'next/image';
import type { MenuItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Leaf } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Badge } from './ui/badge';

interface MenuItemCardProps {
  menuItem: MenuItem;
}

const MenuItemCard: FC<MenuItemCardProps> = ({ menuItem }) => {
  const { addToCart } = useCart();

  return (
    <Card className="flex flex-col md:flex-row overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-40 w-full md:w-1/3 md:h-auto shrink-0">
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
          <CardTitle className="text-lg font-headline mb-1 flex items-center justify-between">
            <span>{menuItem.name}</span>
            {menuItem.isVegetarian && <Leaf className="h-5 w-5 text-green-600" title="Vegetarian" />}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mb-2 min-h-[40px]">{menuItem.description}</CardDescription>
          <div className="flex items-center justify-between mb-2">
            <p className="text-lg font-semibold text-primary">Rs.{menuItem.price.toFixed(2)}</p>
            {menuItem.isPopular && <Badge variant="outline" className="text-accent border-accent">Popular</Badge>}
          </div>
        </div>
        <Button 
          onClick={() => addToCart(menuItem)} 
          className="w-full mt-2 bg-accent hover:bg-accent/90 text-accent-foreground"
          aria-label={`Add ${menuItem.name} to cart`}
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
