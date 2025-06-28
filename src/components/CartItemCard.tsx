
"use client";

import type { FC } from 'react';
import Image from 'next/image';
import type { CartItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Minus, Leaf } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface CartItemCardProps {
  item: CartItem;
}

const CartItemCard: FC<CartItemCardProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item.id, newQuantity);
  };

  return (
    <div className="flex items-start space-x-4 p-4 border-b last:border-b-0">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md">
        <Image
          src={item.imageUrl}
          alt={item.name}
          layout="fill"
          objectFit="cover"
          data-ai-hint={`${item.name.split(" ")[0].toLowerCase()} ${item.category.toLowerCase()}`}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
            <h4 className="font-semibold text-base">{item.name}</h4>
            {item.isVegetarian && <Leaf className="h-4 w-4 text-green-600 shrink-0" />}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        <p className="text-sm text-muted-foreground mt-2">Rs.{item.price.toFixed(2)} each</p>
        <div className="flex items-center mt-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            aria-label={`Decrease quantity of ${item.name}`}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
            className="mx-2 h-8 w-14 rounded-md border text-center px-1"
            aria-label={`Quantity of ${item.name}`}
            min="1"
            max="10"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            aria-label={`Increase quantity of ${item.name}`}
            disabled={item.quantity >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-base">Rs.{(item.price * item.quantity).toFixed(2)}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive mt-1"
          onClick={() => removeFromCart(item.id)}
          aria-label={`Remove ${item.name} from cart`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CartItemCard;
