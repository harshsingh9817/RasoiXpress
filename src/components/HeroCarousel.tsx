
"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import type { HeroMedia } from "@/lib/types"

interface HeroCarouselProps {
    media: HeroMedia[];
    slideInterval: number;
}

export default function HeroCarousel({ media, slideInterval }: HeroCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])
  
  const plugin = React.useRef(
    Autoplay({ delay: (slideInterval || 5) * 1000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  // Gracefully handle cases where media is not yet available or is empty.
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
          {media.map((item, index) => (
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
              </div>
            </CarouselItem>
          ))}
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
