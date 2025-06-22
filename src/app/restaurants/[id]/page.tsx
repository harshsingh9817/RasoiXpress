
"use client";

import React, { useState, useMemo, useEffect } from 'react'; // Ensured React is imported
import Image from 'next/image';
import { useParams, notFound, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { getRestaurantById } from '@/lib/data';
import type { Restaurant, MenuItem } from '@/lib/types';
import MenuItemCard from '@/components/MenuItemCard';
import { Star, Clock, Leaf, Filter, Award, TrendingUp } from 'lucide-react'; // Using TrendingUp for price sorting
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function RestaurantDetailPage() {
  const params = useParams(); 
  const searchParams = useSearchParams(); 
  const id = params.id as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<string>('popular'); // 'popular', 'priceLowHigh', 'priceHighLow'
  const [showVegetarian, setShowVegetarian] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchedRestaurant = getRestaurantById(id);
    if (fetchedRestaurant) {
      setRestaurant(fetchedRestaurant);
      setMenuItems(fetchedRestaurant.menu);
    } else {
       // Handled by returning notFound() if restaurant still null after client-side check
    }
  }, [id]);

  const uniqueCategories = useMemo(() => {
    if (!restaurant) return ['All'];
    const categories = new Set(restaurant.menu.map(item => item.category));
    return ['All', ...Array.from(categories)];
  }, [restaurant]);

  const filteredAndSortedMenu = useMemo(() => {
    let items = [...menuItems];

    if (showVegetarian) {
      items = items.filter(item => item.isVegetarian);
    }

    if (filterCategory !== 'All') {
      items = items.filter(item => item.category === filterCategory);
    }

    items.sort((a, b) => {
      if (sortOption === 'priceLowHigh') {
        return a.price - b.price;
      }
      if (sortOption === 'priceHighLow') {
        return b.price - a.price;
      }
      // Default to 'popular' or if item.isPopular is undefined
      if (sortOption === 'popular') {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
      }
      return 0; // Default sort if no other condition met
    });

    return items;
  }, [menuItems, filterCategory, sortOption, showVegetarian]);

  if (!isClient) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
          <Star className="h-16 w-16 text-primary animate-ping" />
          <p className="mt-4 text-xl text-muted-foreground">Loading restaurant details...</p>
        </div>
      );
  }

  if (!restaurant) {
    notFound(); // This will render the not-found.js file or a default Next.js 404 page
  }
  
  return (
    <div className="space-y-8">
      <section className="relative h-64 md:h-80 w-full rounded-lg overflow-hidden shadow-lg">
        <Image
          src={restaurant.imageUrl}
          alt={restaurant.name}
          layout="fill"
          objectFit="cover"
          priority
          data-ai-hint={`${restaurant.name.split(" ")[0].toLowerCase()} restaurant interior`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-white mb-2 animate-fade-in-up">{restaurant.name}</h1>
          <p className="text-lg text-gray-200 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{restaurant.cuisine}</p>
          <div className="flex items-center justify-center md:justify-start space-x-4 mt-2">
            <Badge variant="secondary" className="bg-white/90 text-primary font-semibold">
              <Star className="mr-1 h-4 w-4 text-accent fill-accent" /> {restaurant.rating.toFixed(1)}
            </Badge>
            <Badge variant="secondary" className="bg-white/90 text-primary font-semibold">
              <Clock className="mr-1 h-4 w-4" /> {restaurant.deliveryTime}
            </Badge>
          </div>
        </div>
      </section>

      {restaurant.promotions && restaurant.promotions.length > 0 && (
        <section className="p-4 bg-accent/10 rounded-lg border border-accent/30">
            <p className="text-accent-foreground font-semibold"><Award className="inline mr-2 h-5 w-5 text-accent"/>{restaurant.promotions[0]}</p>
        </section>
      )}

      <p className="text-md text-muted-foreground">{restaurant.address}</p>
      
      <Separator />

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-16 bg-background py-4 z-10 -mx-4 px-4 border-b">
          <h2 className="text-3xl font-headline font-semibold">Menu</h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Filter by category">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground"/>
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Sort by">
                 <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground"/>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popularity</SelectItem>
                <SelectItem value="priceLowHigh">Price: Low to High</SelectItem>
                <SelectItem value="priceHighLow">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant={showVegetarian ? "default" : "outline"} 
              onClick={() => setShowVegetarian(!showVegetarian)}
              className={showVegetarian ? "bg-green-600 hover:bg-green-700 text-white w-full md:w-auto" : "w-full md:w-auto"}
            >
              <Leaf className="mr-2 h-4 w-4" /> Vegetarian Only
            </Button>
          </div>
        </div>

        {filteredAndSortedMenu.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedMenu.map(item => (
              <MenuItemCard key={item.id} menuItem={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">No menu items match your current filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}
