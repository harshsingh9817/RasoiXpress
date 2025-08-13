
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuItem } from '@/lib/types';
import { listenToMenuItems } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Leaf, TrendingUp } from 'lucide-react';
import MenuItemCard from '@/components/MenuItemCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryPage() {
  const params = useParams();
  const categoryName = decodeURIComponent(params.categoryName as string);
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();

  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState<string>('popular');
  const [showVegetarian, setShowVegetarian] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    const unsubscribe = listenToMenuItems((items) => {
      setAllItems(items);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [isAuthenticated, isAuthLoading, router]);
  
  const filteredAndSortedMenu = useMemo(() => {
    let items = allItems.filter(item => item.category === categoryName);

    if (showVegetarian) {
      items = items.filter(item => item.isVegetarian);
    }
    
    items.sort((a, b) => {
      if (sortOption === 'priceLowHigh') return a.price - b.price;
      if (sortOption === 'priceHighLow') return b.price - a.price;
      if (sortOption === 'popular') {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
      }
      return 0;
    });

    return items;
  }, [allItems, categoryName, sortOption, showVegetarian]);

  if (isLoading || isAuthLoading) {
    return (
        <div className="space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
             <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  if (filteredAndSortedMenu.length === 0 && !isLoading) {
    // This could mean the category exists but has no items, or the category name is wrong.
    // For simplicity, we show a "no items" message. A more robust solution might check if the category itself exists.
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => router.push('/categories')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Categories
          </Button>
          <h1 className="text-4xl font-headline font-bold text-primary">{categoryName}</h1>
          <p className="text-muted-foreground mt-1">Browse all available dishes in the {categoryName} category.</p>
        </div>
        
        <TooltipProvider>
          <div className="flex w-full md:w-auto flex-wrap justify-end items-center gap-2">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px]" aria-label="Sort by">
                <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground"/>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popularity</SelectItem>
                <SelectItem value="priceLowHigh">Price: Low to High</SelectItem>
                <SelectItem value="priceHighLow">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={showVegetarian ? "default" : "outline"} 
                  onClick={() => setShowVegetarian(!showVegetarian)}
                  size="icon"
                  className={`shrink-0 ${showVegetarian ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                >
                  <Leaf className="h-4 w-4" />
                  <span className="sr-only">Veg Only</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showVegetarian ? 'Show all items' : 'Show vegetarian items only'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {filteredAndSortedMenu.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedMenu.map(item => (
            <MenuItemCard key={item.id} menuItem={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">No dishes found in the "{categoryName}" category.</p>
          <p className="text-sm text-muted-foreground mt-2">Try checking another category or clearing your filters.</p>
        </div>
      )}
    </div>
  );
}
