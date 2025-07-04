
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { MenuItem, HeroData } from '@/lib/types';
import { listenToMenuItems, getHeroData } from '@/lib/data';
import MenuItemCard from '@/components/MenuItemCard';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Utensils, Leaf, Filter, TrendingUp, Clock } from 'lucide-react';
import AnimatedDeliveryScooter from '@/components/icons/AnimatedDeliveryScooter';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';

export default function HomePage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<string>('popular'); // 'popular', 'priceLowHigh', 'priceHighLow'
  const [showVegetarian, setShowVegetarian] = useState<boolean>(false);
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    // Only run the timer if there are images to cycle through
    if (!heroData || !heroData.bannerImages || heroData.bannerImages.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentBanner((prevBanner) => (prevBanner + 1) % heroData.bannerImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(timer); // Cleanup on unmount
  }, [heroData]); // Re-run when heroData changes

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    let heroDataLoaded = false;
    let menuItemsLoaded = false;

    const checkLoadingDone = () => {
        if (heroDataLoaded && menuItemsLoaded) {
            setIsLoading(false);
        }
    }

    setIsLoading(true);
    
    const unsubscribe = listenToMenuItems((items) => {
      setMenuItems(items);
      menuItemsLoaded = true;
      checkLoadingDone();
    });

    getHeroData().then(hero => {
        setHeroData(hero);
        heroDataLoaded = true;
        checkLoadingDone();
    });

    return () => unsubscribe();
  }, [isAuthenticated, isAuthLoading, router]);

  const uniqueCategories = useMemo(() => {
    const allCategories = new Set(menuItems.map(item => item.category));
    return ['All', ...Array.from(allCategories)];
  }, [menuItems]);

  const filteredAndSortedMenu = useMemo(() => {
    let items = menuItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
      if (sortOption === 'popular') {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
      }
      return 0; // Default sort if no other condition met
    });

    return items;
  }, [menuItems, searchTerm, filterCategory, sortOption, showVegetarian]);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">Verifying access...</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
       <section className="relative h-auto md:h-80 w-full rounded-lg overflow-hidden shadow-xl flex items-center">
        {heroData?.bannerImages?.map((banner, index) => (
            <Image
                key={index}
                src={banner.src}
                alt={`Promotional banner ${index + 1}`}
                layout="fill"
                objectFit="cover"
                priority={index === 0}
                className={cn(
                    "transition-opacity duration-1000 ease-in-out",
                    currentBanner === index ? "opacity-100" : "opacity-0"
                )}
                data-ai-hint={banner.hint}
            />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 p-4 sm:p-6 lg:p-8">
          <div className="text-center md:text-left md:w-1/2 space-y-4">
              <div
                role="heading"
                aria-level="1"
                className="text-4xl md:text-5xl font-headline font-bold mb-3 animate-fade-in-up"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  color: heroData?.headlineColor || '#FFFFFF',
                }}
              >
                {heroData ? heroData.headline : <Skeleton className="h-14 w-full max-w-lg bg-white/20" />}
              </div>
              <div
                className="text-lg md:text-xl max-w-2xl mx-auto md:mx-0 animate-fade-in-up"
                style={{
                  animationDelay: '0.2s',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  color: heroData?.subheadlineColor || '#E5E7EB',
                }}
              >
                {heroData ? heroData.subheadline : <Skeleton className="h-7 w-full max-w-md bg-white/20" />}
              </div>
              <div className="text-lg text-gray-200 max-w-2xl mx-auto md:mx-0 animate-fade-in-up" style={{ animationDelay: '0.4s', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                {heroData?.orderingTime ? (
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2 font-semibold bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 w-fit mx-auto md:mx-0">
                        <Clock className="h-5 w-5" />
                        <span>Open: {heroData.orderingTime}</span>
                    </div>
                ) : (heroData && <Skeleton className="h-10 w-64 bg-white/20 rounded-full" />)}
              </div>
          </div>
          <div className="md:w-1/2 flex justify-center text-primary-foreground">
              <AnimatedDeliveryScooter className="w-full max-w-xs h-auto" />
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-card rounded-lg shadow sticky top-16 z-10 -mx-4 px-4 border-b">
        <div className="w-full md:flex-1">
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Search for food..." />
        </div>
        <TooltipProvider>
          <div className="flex w-full md:w-auto flex-wrap justify-end items-center gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-auto" aria-label="Filter by category">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground"/>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-auto" aria-label="Sort by">
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

      {isLoading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-48 w-full" /></CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
         </div>
      ) : filteredAndSortedMenu.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedMenu.map(item => (
            <MenuItemCard key={item.id} menuItem={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No food items found.</p>
          <Button variant="link" onClick={() => { setSearchTerm(''); setFilterCategory('All'); setShowVegetarian(false); }} className="mt-2 text-primary">
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
