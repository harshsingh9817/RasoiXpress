
"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import type { HeroData, HeroMedia } from "@/lib/types"
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
    heroData: HeroData | null;
}

const getPositionClasses = (position: HeroMedia['textPosition']) => {
    switch (position) {
        case 'bottom-left': return 'bottom-0 left-0 text-left';
        case 'bottom-center': return 'bottom-0 left-1/2 -translate-x-1/2 text-center';
        case 'bottom-right': return 'bottom-0 right-0 text-right';
        case 'center-left': return 'top-1/2 -translate-y-1/2 left-0 text-left';
        case 'center-center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center';
        case 'center-right': return 'top-1/2 -translate-y-1/2 right-0 text-right';
        case 'top-left': return 'top-0 left-0 text-left';
        case 'top-center': return 'top-0 left-1/2 -translate-x-1/2 text-center';
        case 'top-right': return 'top-0 right-0 text-right';
        default: return 'bottom-0 left-0 text-left';
    }
}

const getFontSizeClasses = (size: HeroMedia['fontSize']) => {
    switch(size) {
        case 'sm': return { headline: 'text-2xl md:text-3xl', subheadline: 'text-base md:text-lg' };
        case 'lg': return { headline: 'text-4xl md:text-6xl', subheadline: 'text-lg md:text-2xl' };
        case 'xl': return { headline: 'text-5xl md:text-7xl', subheadline: 'text-xl md:text-3xl' };
        case 'md':
        default: return { headline: 'text-3xl md:text-5xl', subheadline: 'text-lg md:text-xl' };
    }
}

const getFontFamilyClass = (family: HeroMedia['fontFamily']) => {
    switch(family) {
        case 'serif': return 'font-serif';
        case 'headline': return 'font-headline';
        case 'sans':
        default: return 'font-sans';
    }
}

export default function HeroCarousel({ heroData }: HeroCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [key, setKey] = React.useState(0);
  const router = useRouter();

  const media = heroData?.media;
  const slideInterval = heroData?.slideInterval || 5;

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      setKey(prevKey => prevKey + 1);
    };

    api.on("select", onSelect);
    onSelect();

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);
  
  const plugin = React.useRef(
    Autoplay({ delay: slideInterval * 1000, stopOnInteraction: true, stopOnMouseEnter: true })
  )
  
  const handleSlideClick = (item: HeroMedia) => {
    if (item.linkType === 'item' && item.linkValue) {
      // Logic to open item detail dialog - this part is tricky as dialog state is outside
      // For now, we'll just log it. A better implementation would use a global state (like Zustand or Redux)
      // or pass a function down to open the dialog. A simpler approach for now is to navigate.
      console.log(`Navigate to item ID: ${item.linkValue}`);
    } else if (item.linkType === 'category' && item.linkValue) {
      router.push(`/categories/${encodeURIComponent(item.linkValue)}`);
    }
  }

  if (!media || media.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">No slides to display.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full h-full"
        opts={{ loop: true }}
      >
        <CarouselContent className="h-full">
          {media.map((item, index) => {
            const headline = item.headline;
            const subheadline = item.subheadline;
            const hasLink = item.linkType && item.linkType !== 'none' && item.linkValue;

            const positionClasses = getPositionClasses(item.textPosition);
            const fontSizeClasses = getFontSizeClasses(item.fontSize);
            const fontFamilyClass = getFontFamilyClass(item.fontFamily);

            const content = (
                <div className={cn("relative w-full h-full", hasLink && "cursor-pointer")} onClick={() => hasLink && handleSlideClick(item)}>
                    {item.type === 'video' ? (
                    <video
                        src={item.src}
                        className="h-full w-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                    ) : (
                    <img
                        src={item.src}
                        alt={`Hero slide ${index + 1}`}
                        className="h-full w-full object-cover"
                    />
                    )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                     {(headline || subheadline) && (
                        <div 
                          key={`${index}-${key}`}
                          className={cn("absolute p-6 md:p-12 text-white max-w-2xl w-full", positionClasses, fontFamilyClass)}
                        >
                            {headline && <h1 className={cn("font-bold drop-shadow-lg animate-fade-in-up", fontSizeClasses.headline)}>{headline}</h1>}
                            {subheadline && <p className={cn("mt-2 drop-shadow-md animate-fade-in-up", fontSizeClasses.subheadline)} style={{ animationDelay: '0.2s' }}>{subheadline}</p>}
                        </div>
                     )}
                </div>
            );

            return (
                <CarouselItem key={index}>
                  {content}
                </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
      </Carousel>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
        {media.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              current === index ? 'w-4 bg-primary' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
