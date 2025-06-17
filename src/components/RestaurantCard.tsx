import type { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Restaurant } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: FC<RestaurantCardProps> = ({ restaurant }) => {
  return (
    <Link href={`/restaurants/${restaurant.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={restaurant.imageUrl}
              alt={restaurant.name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={`${restaurant.name.split(" ")[0].toLowerCase()} ${restaurant.cuisine.split(",")[0].trim().toLowerCase()}`}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-xl font-headline mb-1 truncate group-hover:text-primary">{restaurant.name}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mb-2 truncate">{restaurant.cuisine}</CardDescription>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Star className="mr-1 h-4 w-4 text-accent fill-accent" />
              <span>{restaurant.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              <span>{restaurant.deliveryTime}</span>
            </div>
          </div>
          {restaurant.promotions && restaurant.promotions.length > 0 && (
               <Badge variant="secondary" className="mt-2 text-xs text-primary bg-primary/10 border-primary/20">
                  {restaurant.promotions[0]}
               </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default RestaurantCard;
