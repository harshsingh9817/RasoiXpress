
"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import type { HeroData, HeroMedia } from "@/lib/types"

interface HeroCarouselProps {
    heroData: HeroData | null;
}

export default function HeroCarousel({ heroData }: HeroCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [key, setKey] = React.useState(0); // Key to force re-render for animation

  const media = heroData?.media;
  const slideInterval = heroData?.slideInterval || 5;

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      setKey(prevKey => prevKey + 1); // Trigger re-render to restart animation
    };

    api.on("select", onSelect);
    onSelect(); // Set initial state

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);
  
  const plugin = React.useRef(
    Autoplay({ delay: slideInterval * 1000, stopOnInteraction: true, stopOnMouseEnter: true })
  )

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
            const headline = item.headline || heroData?.globalHeadline;
            const subheadline = item.subheadline || heroData?.globalSubheadline;

            return (
                <CarouselItem key={index}>
                <div className="relative w-full h-full">
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
                          key={`${index}-${key}`} // Use key to force re-mount and re-trigger animation
                          className="absolute bottom-0 left-0 p-6 md:p-12 text-center md:text-left text-white max-w-2xl"
                        >
                            {headline && <h1 className="text-3xl md:text-5xl font-bold font-headline drop-shadow-lg animate-fade-in-up">{headline}</h1>}
                            {subheadline && <p className="text-lg mt-2 drop-shadow-md animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{subheadline}</p>}
                        </div>
                     )}
                </div>
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
