
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import type { Category } from '@/lib/types';
import { listenToCategories } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';

export default function CategoriesPage() {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    const unsubscribe = listenToCategories((cats) => {
      setCategories(cats);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [isAuthenticated, isAuthLoading, router]);
  
  if (isLoading || isAuthLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-32 w-32 rounded-lg" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <CardHeader className="px-0">
        <CardTitle className="text-3xl font-headline flex items-center">
          <LayoutGrid className="mr-3 h-8 w-8 text-primary" /> Browse by Category
        </CardTitle>
        <CardDescription>
          Find your favorite dishes by selecting a category below.
        </CardDescription>
      </CardHeader>
      
      {categories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <Link 
              href={`/categories/${encodeURIComponent(category.name)}`} 
              key={category.id}
              className="group block"
            >
              <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary">
                <CardContent className="p-0 flex flex-col items-center text-center gap-4">
                  <div className="relative w-full aspect-square bg-muted/50">
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      layout="fill"
                      objectFit="contain"
                      className="p-4 transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={category.name.toLowerCase()}
                    />
                  </div>
                  <h3 className="text-lg font-semibold font-headline pb-4 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No categories have been created yet.</p>
        </div>
      )}
    </div>
  );
}
