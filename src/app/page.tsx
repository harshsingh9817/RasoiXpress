
"use client";

import { useState, useMemo, useEffect } from 'react';
// import Image from 'next/image'; // Removed Image import
import type { Restaurant } from '@/lib/types';
import { mockRestaurants } from '@/lib/data';
import RestaurantCard from '@/components/RestaurantCard';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CartSheet from '@/components/CartSheet'; 
import { Utensils } from 'lucide-react'; 
import AnimatedDeliveryScooter from '@/components/icons/AnimatedDeliveryScooter';
import PlateCutleryBackground from '@/components/icons/PlateCutleryBackground'; // Added import for new SVG component

const cuisines = Array.from(new Set(mockRestaurants.flatMap(r => r.cuisine.split(',').map(c => c.trim()))));

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'deliveryTime'
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const filteredAndSortedRestaurants = useMemo(() => {
    let restaurants = mockRestaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedCuisine !== 'All') {
      restaurants = restaurants.filter(restaurant =>
        restaurant.cuisine.split(',').map(c => c.trim()).includes(selectedCuisine)
      );
    }

    return [...restaurants].sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'deliveryTime') {
        // Assuming deliveryTime is "X-Y min", sort by the lower bound
        const timeA = parseInt(a.deliveryTime.split('-')[0]);
        const timeB = parseInt(b.deliveryTime.split('-')[0]);
        return timeA - timeB;
      }
      return 0;
    });
  }, [searchTerm, selectedCuisine, sortBy]);

  if (!isClient) {
    // Render a loading state or null during server-side rendering and initial client-side hydration
    // to prevent hydration mismatch for components relying on client-side state (like CartSheet)
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Utensils className="h-16 w-16 text-primary animate-bounce" />
        <p className="mt-4 text-xl text-muted-foreground">Loading restaurants...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative text-center rounded-lg shadow-xl overflow-hidden">
        <PlateCutleryBackground className="absolute inset-0 w-full h-full z-0" />
        <div className="absolute inset-0 bg-black/60 z-0" /> {/* Overlay for text contrast */}
        <div className="relative z-10 py-10 md:py-14 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary-foreground mb-3">
            Home Delivery In Nagra With <span className="text-accent">NibbleNow</span>
          </h1>
          <div className="mt-6 mb-4 flex justify-center">
            <AnimatedDeliveryScooter className="h-24 w-48 text-accent" /> 
          </div>
          <p className="text-lg md:text-xl text-primary-foreground max-w-2xl mx-auto">
            Explore a world of flavors. Order from your favorite local restaurants, delivered fast.
          </p>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-card rounded-lg shadow">
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
            <SelectTrigger className="w-full md:w-[180px] bg-muted focus:bg-background" aria-label="Filter by cuisine">
              <SelectValue placeholder="Filter by Cuisine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Cuisines</SelectItem>
              {cuisines.map(cuisine => (
                <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px] bg-muted focus:bg-background" aria-label="Sort by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Sort by Rating</SelectItem>
              <SelectItem value="deliveryTime">Sort by Delivery Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSortedRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedRestaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No restaurants found matching your criteria.</p>
          <Button variant="link" onClick={() => { setSearchTerm(''); setSelectedCuisine('All');}} className="mt-2 text-primary">
            Clear filters
          </Button>
        </div>
      )}
      <CartSheet />
    </div>
  );
}
