
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { MenuItem, HeroData } from '@/lib/types';
import { getMenuItems, getHeroData } from '@/lib/data';
import MenuItemCard from '@/components/MenuItemCard';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Utensils, Leaf, Filter, TrendingUp, Loader2 } from 'lucide-react';
import AnimatedDeliveryScooter from '@/components/icons/AnimatedDeliveryScooter';
import { Skeleton } from '@/components/ui/skeleton';


export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<string>('popular'); // 'popular', 'priceLowHigh', 'priceHighLow'
  const [showVegetarian, setShowVegetarian] = useState<boolean>(false);
  const [heroData, setHeroData] = useState<HeroData | null>(null);

  const loadItems = useCallback(() => {
    try {
        const items = getMenuItems();
        setMenuItems(items);
    } catch (error) {
        console.error("Failed to fetch menu items:", error);
    }
  }, []);

  const loadHero = useCallback(() => {
    setHeroData(getHeroData());
  }, []);

  useEffect(() => {
    loadItems();
    loadHero();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'rasoiExpressMenuItems') {
        loadItems();
      }
      if (event.key === 'rasoiExpressHeroData') {
        loadHero();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    }
  }, [loadItems, loadHero]);

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


  return (
    <div className="space-y-8">
      <section className="bg-primary text-primary-foreground py-10 md:py-16 px-4 sm:px-6 lg:px-8 rounded-lg shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left md:w-1/2 space-y-4">
              <div role="heading" aria-level="1" className="text-4xl md:text-5xl font-headline font-bold mb-3 animate-fade-in-up">
                {heroData ? heroData.headline : <Skeleton className="h-14 w-full max-w-lg bg-white/20" />}
              </div>
              <div className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto md:mx-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {heroData ? heroData.subheadline : <Skeleton className="h-7 w-full max-w-md bg-white/20" />}
              </div>
          </div>
          <div className="md:w-1/2 flex justify-center text-primary-foreground">
              <AnimatedDeliveryScooter className="w-full max-w-sm h-auto" />
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-card rounded-lg shadow sticky top-16 z-10 -mx-4 px-4 border-b">
        <div className="w-full md:flex-1">
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Search for food..." />
        </div>
        <div className="flex w-full md:w-auto flex-col sm:flex-row items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-auto" aria-label="Filter by category">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground"/>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full sm:w-auto" aria-label="Sort by">
                 <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground"/>
                <SelectValue placeholder="Sort" />
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
              className={`whitespace-nowrap w-full sm:w-auto ${showVegetarian ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
            >
              <Leaf className="mr-2 h-4 w-4" /> Veg Only
            </Button>
          </div>
      </div>

      {filteredAndSortedMenu.length > 0 ? (
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
